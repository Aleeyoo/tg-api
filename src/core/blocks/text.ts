import type { AnyNode, CheerioAPI } from 'cheerio'
import type { TextBlock } from '../types'
import flourite from 'flourite'
import prism from 'prismjs'
import 'prismjs-components-importer'
import { getCustomEmojiImage } from './emoji'

/**
 * Transform the raw Telegram HTML text content into a TextBlock.
 *
 * Handles:
 * - Custom emoji (<tg-emoji>) → <img>
 * - Expandable blockquotes → interactive expand/collapse
 * - Spoilers (<tg-spoiler>) → click-to-reveal
 * - Code blocks with syntax highlighting (via Prism + flourite)
 * - Link cleanup (remove onclick, add title)
 */
export function extractTextBlock(
  $: CheerioAPI,
  message: AnyNode,
  index: number,
  staticProxy: string,
): TextBlock | null {
  const msg = $(message).find('.tgme_widget_message')
  const hasReplyText = msg.find('.js-message_reply_text').length > 0
  const content = msg.find(
    hasReplyText ? '.tgme_widget_message_text.js-message_text' : '.tgme_widget_message_text',
  )

  if (!content.length) return null

  // Work on a clone to avoid mutating the original
  const clone = content.clone()

  // Hydrate custom emoji
  for (const emojiNode of clone.find('tg-emoji').toArray()) {
    const emojiId = $(emojiNode).attr('emoji-id')
    const imageUrl = getCustomEmojiImage(emojiId, staticProxy)
    if (imageUrl) {
      $(emojiNode).replaceWith(
        `<img class="tg-emoji" src="${imageUrl}" alt="" loading="lazy" width="20" height="20" />`,
      )
    }
  }

  // Remove explicit emoji styles
  clone.find('.emoji').removeAttr('style')

  // Clean links
  for (const linkNode of clone.find('a').toArray()) {
    const link = $(linkNode)
    link.attr('title', link.text()).removeAttr('onclick')

    // Rewrite tag links (?q=#tag) to search paths
    const href = link.attr('href')
    if (href?.startsWith('?q=')) {
      const tagText = link.text()
      link.attr('href', `/search/result?q=${encodeURIComponent(tagText)}`)
    }
  }

  // Expandable blockquotes
  for (const [bqIndex, bqNode] of clone.find('blockquote[expandable]').toArray().entries()) {
    const innerHTML = $(bqNode).html() ?? ''
    const expandId = `expand-${index}-${bqIndex}`
    const expandContentId = `${expandId}-content`
    const expandable = `<div class="tg-expandable">
      <input type="checkbox" id="${expandId}" class="tg-expandable__checkbox" aria-label="Expand hidden content" aria-controls="${expandContentId}">
      <div id="${expandContentId}" class="tg-expandable__content">${innerHTML}</div>
      <label for="${expandId}" class="tg-expandable__toggle"><span class="sr-only">Expand hidden content</span></label>
    </div>`
    $(bqNode).replaceWith(expandable)
  }

  // Spoilers
  for (const [spIndex, spNode] of clone.find('tg-spoiler').toArray().entries()) {
    const spoilerId = `spoiler-${index}-${spIndex}`
    const input = `<input type="checkbox" aria-label="Reveal spoiler" aria-controls="${spoilerId}" />`
    $(spNode).attr('id', spoilerId).wrap('<label class="spoiler-button"></label>').before(input)
  }

  // Syntax highlighting
  for (const preNode of clone.find('pre').toArray()) {
    try {
      const pre = $(preNode)
      pre.find('br').replaceWith('\n')
      const code = pre.text()
      const language = flourite(code, { shiki: true, noUnknown: true }).language || 'text'
      const highlighted = prism.highlight(code, prism.languages[language], language)
      pre.html(`<code class="language-${language}">${highlighted}</code>`)
    }
    catch {
      // If highlighting fails, keep the original pre
    }
  }

  const html = clone.html() ?? ''
  const plain = clone.text()

  if (!html.trim()) return null

  return {
    id: `block-text-${index}`,
    type: 'text',
    html,
    plain,
  }
}
