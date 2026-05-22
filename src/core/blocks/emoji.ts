/**
 * Normalize certain emoji that Telegram sends as non-VS16 variants.
 */
export function normalizeEmoji(emoji: string): string {
  const emojiMap: Record<string, string> = {
    '\u2764': '\u2764\uFE0F', // ❤ → ❤️
    '\u263A': '\u263A\uFE0F', // ☺ → ☺️
    '\u2639': '\u2639\uFE0F', // ☹ → ☹️
    '\u2665': '\u2764\uFE0F', // ♥ → ❤️
  }
  return emojiMap[emoji] ?? emoji
}

/**
 * Build a custom emoji image URL from its Telegram emoji ID.
 */
export function getCustomEmojiImage(emojiId: string | undefined, staticProxy = ''): string | null {
  if (!emojiId) return null
  return `${staticProxy}https://t.me/i/emoji/${emojiId}.webp`
}
