import type { AnyNode, CheerioAPI } from 'cheerio'
import type { Reaction } from '../types'
import { normalizeEmoji, getCustomEmojiImage } from './emoji'
import { STYLE_URL_REGEX } from './utils'

/**
 * Extract reactions from a Telegram message.
 */
export function extractReactions(
  $: CheerioAPI,
  message: AnyNode,
  staticProxy: string,
): Reaction[] {
  const msg = $(message).find('.tgme_widget_message')
  const reactions: Reaction[] = []

  for (const reactionNode of msg.find('.tgme_widget_message_reactions .tgme_reaction').toArray()) {
    const reaction = $(reactionNode)
    const isPaid = reaction.hasClass('tgme_reaction_paid')
    let emoji = ''
    let emojiId: string | undefined
    let emojiImage: string | undefined

    const standardEmoji = reaction.find('.emoji b')
    if (standardEmoji.length) {
      emoji = normalizeEmoji(standardEmoji.text().trim())
    }

    const tgEmoji = reaction.find('tg-emoji')
    if (tgEmoji.length && !emoji) {
      emojiId = tgEmoji.attr('emoji-id')
      const customEmojiImage = getCustomEmojiImage(emojiId, staticProxy)
      if (customEmojiImage) {
        emojiImage = customEmojiImage
      }
    }

    if (isPaid && !emoji && !emojiImage) {
      emoji = '\u2B50'
    }

    const clone = reaction.clone()
    clone.find('.emoji, tg-emoji, i').remove()
    const count = clone.text().trim()

    if (count) {
      reactions.push({
        emoji,
        emojiId,
        emojiImage,
        count,
        isPaid,
      })
    }
  }

  return reactions
}
