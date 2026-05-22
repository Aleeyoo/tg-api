import type { AnyNode, CheerioAPI } from 'cheerio'
import type { ReplyBlock } from '../types'

/**
 * Extract reply blocks from a Telegram message.
 */
export function extractReplyBlocks(
  $: CheerioAPI,
  message: AnyNode,
  channel: string,
): ReplyBlock[] {
  const msg = $(message).find('.tgme_widget_message')
  const reply = msg.find('.tgme_widget_message_reply')

  if (!reply.length) return []

  const href = reply.attr('href')
  if (!href) return []

  // Extract the post ID from the reply link
  // URL format: https://t.me/channel/postId
  const replyUrl = new URL(href, 'https://t.me')
  const pathParts = replyUrl.pathname.split('/').filter(Boolean)
  const postId = pathParts[pathParts.length - 1] ?? ''

  const text = reply.find('.js-message_reply_text').text() || reply.text()

  if (!postId || !text) return []

  return [{
    id: 'block-reply-0',
    type: 'reply',
    postId,
    text: text.slice(0, 200), // Cap reply preview length
  }]
}
