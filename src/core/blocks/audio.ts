import type { AnyNode, CheerioAPI } from 'cheerio'
import type { AudioBlock } from '../types'

/**
 * Extract audio (voice message) blocks from a Telegram message.
 */
export function extractAudioBlocks(
  $: CheerioAPI,
  message: AnyNode,
  staticProxy: string,
): AudioBlock[] {
  const msg = $(message).find('.tgme_widget_message')
  const audio = msg.find('.tgme_widget_message_voice')
  const audioSrc = audio.attr('src')

  if (!audioSrc) return []

  return [{
    id: 'block-audio-0',
    type: 'audio',
    src: audioSrc,
    proxy: `${staticProxy}${audioSrc}`,
  }]
}
