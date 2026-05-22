import type { AnyNode, CheerioAPI } from 'cheerio'
import type { StickerBlock } from '../types'

const STICKER_SIZE = 256

/**
 * Extract static sticker blocks from a Telegram message.
 */
export function extractStickerBlocks(
  $: CheerioAPI,
  message: AnyNode,
  staticProxy: string,
): StickerBlock[] {
  const msg = $(message).find('.tgme_widget_message')
  const blocks: StickerBlock[] = []

  for (const stickerNode of msg.find('.tgme_widget_message_sticker').toArray()) {
    const imageSrc = $(stickerNode).attr('data-webp')
    if (!imageSrc) continue

    blocks.push({
      id: `block-sticker-${blocks.length}`,
      type: 'sticker',
      src: imageSrc,
      proxy: `${staticProxy}${imageSrc}`,
      width: STICKER_SIZE,
      height: STICKER_SIZE,
    })
  }

  return blocks
}
