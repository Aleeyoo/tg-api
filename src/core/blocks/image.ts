import type { AnyNode, CheerioAPI } from 'cheerio'
import type { ImageBlock } from '../types'

const STYLE_URL_REGEX = /url\(["'](.*?)["']/i
const STYLE_DIMENSION_REGEX = {
  width: /width:\s*(\d+(?:\.\d+)?)px/i,
  height: /height:\s*(\d+(?:\.\d+)?)px/i,
} as const
const STYLE_PADDING_TOP_REGEX = /padding-top:\s*(\d+(?:\.\d+)?)%/i
const SYNTHETIC_IMAGE_DIMENSION = 1000

function getStyleDimension(style: string | undefined, property: 'width' | 'height'): number | null {
  const value = style?.match(STYLE_DIMENSION_REGEX[property])?.[1]
  return value ? Math.round(Number(value)) : null
}

function getStylePaddingTop(style: string | undefined): number | null {
  const value = style?.match(STYLE_PADDING_TOP_REGEX)?.[1]
  return value ? Number(value) : null
}

/**
 * Telegram widgets encode image ratios in styles rather than returning real
 * pixel dimensions. This function infers dimensions from inline styles.
 */
function inferImageDimensions(
  $: CheerioAPI,
  node: AnyNode,
  fallback = { width: SYNTHETIC_IMAGE_DIMENSION, height: SYNTHETIC_IMAGE_DIMENSION },
): { width: number; height: number } {
  const element = $(node)
  const styles = [
    element.attr('style'),
    element.find('.tgme_widget_message_photo').first().attr('style'),
    element.find('i').attr('style'),
    element.parent().attr('style'),
  ]

  let width: number | null = null
  let height: number | null = null
  let paddingTop: number | null = null

  for (const style of styles) {
    if (width === null) width = getStyleDimension(style, 'width')
    if (height === null) height = getStyleDimension(style, 'height')
    if (paddingTop === null) paddingTop = getStylePaddingTop(style)
    if (width && height) return { width, height }
  }

  // Telegram uses width + padding-top percentage to express aspect ratio
  if (paddingTop !== null) {
    const syntheticWidth = width ?? fallback.width
    return {
      width: syntheticWidth,
      height: Math.max(1, Math.round((syntheticWidth * paddingTop) / 100)),
    }
  }

  return fallback
}

/**
 * Extract image blocks from a Telegram message.
 * Each `.tgme_widget_message_photo_wrap` becomes one ImageBlock.
 */
export function extractImageBlocks(
  $: CheerioAPI,
  message: AnyNode,
  staticProxy: string,
): ImageBlock[] {
  const msg = $(message).find('.tgme_widget_message')
  const blocks: ImageBlock[] = []

  for (const [photoIndex, photoNode] of msg.find('.tgme_widget_message_photo_wrap').toArray().entries()) {
    const style = $(photoNode).attr('style')
    const imageUrl = style?.match(STYLE_URL_REGEX)?.[1]

    if (!imageUrl) continue

    const { width, height } = inferImageDimensions($, photoNode)

    blocks.push({
      id: `block-image-${photoIndex}`,
      type: 'image',
      src: imageUrl,
      proxy: `${staticProxy}${imageUrl}`,
      width,
      height,
    })
  }

  return blocks
}
