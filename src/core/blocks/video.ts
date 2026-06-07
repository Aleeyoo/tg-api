import type { AnyNode, CheerioAPI } from 'cheerio'
import type { VideoBlock } from '../types'
import { getStyleDimension, STYLE_URL_REGEX } from './utils'

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
  const videoWrap = msg.find('.tgme_widget_message_video_wrap')
  const video = videoWrap.find('video')
  const videoSrc = video.attr('src')
  if (videoSrc) {
    const style = video.parent().attr('style') ?? video.attr('style')
    const width = getStyleDimension(style, 'width') ?? SYNTHETIC_DIMENSION
    const height = getStyleDimension(style, 'height') ?? SYNTHETIC_DIMENSION

    const posterAttr = video.attr('poster')
    const bgImage = videoWrap.attr('style')?.match(STYLE_URL_REGEX)?.[1]
    const thumbBg = msg.find('.tgme_widget_message_video_thumb').attr('style')?.match(STYLE_URL_REGEX)?.[1]
    const poster = posterAttr ?? bgImage ?? thumbBg

    blocks.push({
      id: `block-video-${blocks.length}`,
      type: 'video',
      src: videoSrc,
      proxy: `${staticProxy}${videoSrc}`,
      width,
      height,
      isRound: false,
      ...(poster ? { poster: `${staticProxy}${poster}` } : {}),
    })
  }

  // Round video
  const roundWrap = msg.find('.tgme_widget_message_roundvideo_wrap')
  const roundVideo = roundWrap.find('video')
  const roundVideoSrc = roundVideo.attr('src')
  if (roundVideoSrc) {
    const style = roundVideo.parent().attr('style') ?? roundVideo.attr('style')
    const width = getStyleDimension(style, 'width') ?? SYNTHETIC_DIMENSION
    const height = getStyleDimension(style, 'height') ?? SYNTHETIC_DIMENSION

    const posterAttr = roundVideo.attr('poster')
    const bgImage = roundWrap.attr('style')?.match(STYLE_URL_REGEX)?.[1]
    const poster = posterAttr ?? bgImage

    blocks.push({
      id: `block-video-${blocks.length}`,
      type: 'video',
      src: roundVideoSrc,
      proxy: `${staticProxy}${roundVideoSrc}`,
      width,
      height,
      isRound: true,
      ...(poster ? { poster: `${staticProxy}${poster}` } : {}),
    })
  }

  return blocks
}
