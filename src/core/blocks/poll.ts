import type { AnyNode, CheerioAPI } from 'cheerio'
import type { PollBlock } from '../types'

/**
 * Extract poll blocks from a Telegram message.
 */
export function extractPollBlocks(
  $: CheerioAPI,
  message: AnyNode,
): PollBlock[] {
  const msg = $(message).find('.tgme_widget_message')
  const poll = msg.find('.tgme_widget_message_poll')

  if (!poll.length) return []

  const question = poll.find('.tgme_widget_message_poll_question').text() || ''

  const options: Array<{ label: string; percent: string }> = []
  for (const optNode of poll.find('.tgme_widget_message_poll_option').toArray()) {
    const label = $(optNode).find('.tgme_widget_message_poll_option_text').text()
    const percent = $(optNode).find('.tgme_widget_message_poll_option_percent').text()
    if (label && percent) {
      options.push({ label, percent })
    }
  }

  const totalVotes = poll.find('.tgme_widget_message_poll_total_votes').text() || undefined

  if (!question) return []

  return [{
    id: 'block-poll-0',
    type: 'poll',
    question,
    options,
    totalVotes,
  }]
}
