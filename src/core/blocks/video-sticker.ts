import type { AnyNode, CheerioAPI } from 'cheerio'
import type { VideoStickerBlock } from '../types'

const STICKER_SIZE = 256

/**
 * Extract animated video sticker blocks from a Telegram message.
 */
export function extractVideoStickerBlocks(
  $: CheerioAPI,
  message: AnyNode,
  staticProxy: string,
): VideoStickerBlock[] {
  const msg = $(message).find('.tgme_widget_message')
  const blocks: VideoStickerBlock[] = []

  for (const videoNode of msg.find('.js-videosticker_video').toArray()) {
    const videoSrc = $(videoNode).attr('src')
    if (!videoSrc) continue

    const poster = $(videoNode).find('img').attr('src') ?? ''

    blocks.push({
      id: `block-video-sticker-${blocks.length}`,
      type: 'video_sticker',
      src: videoSrc,
      proxy: `${staticProxy}${videoSrc}`,
      poster: poster ? `${staticProxy}${poster}` : '',
      width: STICKER_SIZE,
      height: STICKER_SIZE,
    })
  }

  return blocks
}
