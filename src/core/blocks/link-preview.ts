import type { AnyNode, CheerioAPI } from 'cheerio'
import type { LinkPreviewBlock } from '../types'
import { STYLE_URL_REGEX } from './utils'

/**
 * Extract link preview blocks from a Telegram message.
 */
export function extractLinkPreviewBlocks(
  $: CheerioAPI,
  message: AnyNode,
  staticProxy: string,
): LinkPreviewBlock[] {
  const msg = $(message).find('.tgme_widget_message')
  const link = msg.find('.tgme_widget_message_link_preview')

  if (!link.length) return []

  const url = link.attr('href') ?? ''
  const title = msg.find('.link_preview_title').text() || undefined
  const description = msg.find('.link_preview_description').text() || undefined
  const siteName = msg.find('.link_preview_site_name').text() || undefined

  const imageEl = msg.find('.link_preview_image')
  const previewUrl = imageEl.attr('style')?.match(STYLE_URL_REGEX)?.[1]
  const image = previewUrl ? `${staticProxy}${previewUrl}` : undefined

  if (!url) return []

  return [{
    id: 'block-link-preview-0',
    type: 'link_preview',
    url,
    title,
    description,
    image,
    siteName,
  }]
}
