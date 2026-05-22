import type { AnyNode, CheerioAPI } from 'cheerio'
import type { VideoBlock } from '../types'
import { getStyleDimension } from './utils'

const SYNTHETIC_DIMENSION = 640

/**
 * Extract video blocks (regular + round video) from a Telegram message.
 */
export function extractVideoBlocks(
  $: CheerioAPI,
  message: AnyNode,
  staticProxy: string,
): VideoBlock[] {
  const msg = $(message).find('.tgme_widget_message')
  const blocks: VideoBlock[] = []

  // Regular video
  const video = msg.find('.tgme_widget_message_video_wrap video')
  const videoSrc = video.attr('src')
  if (videoSrc) {
    const style = video.parent().attr('style') ?? video.attr('style')
    const width = getStyleDimension(style, 'width') ?? SYNTHETIC_DIMENSION
    const height = getStyleDimension(style, 'height') ?? SYNTHETIC_DIMENSION

    blocks.push({
      id: `block-video-${blocks.length}`,
      type: 'video',
      src: videoSrc,
      proxy: `${staticProxy}${videoSrc}`,
      width,
      height,
      isRound: false,
    })
  }

  // Round video
  const roundVideo = msg.find('.tgme_widget_message_roundvideo_wrap video')
  const roundVideoSrc = roundVideo.attr('src')
  if (roundVideoSrc) {
    const style = roundVideo.parent().attr('style') ?? roundVideo.attr('style')
    const width = getStyleDimension(style, 'width') ?? SYNTHETIC_DIMENSION
    const height = getStyleDimension(style, 'height') ?? SYNTHETIC_DIMENSION

    blocks.push({
      id: `block-video-${blocks.length}`,
      type: 'video',
      src: roundVideoSrc,
      proxy: `${staticProxy}${roundVideoSrc}`,
      width,
      height,
      isRound: true,
    })
  }

  return blocks
}
