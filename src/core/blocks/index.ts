import type { AnyNode, CheerioAPI } from 'cheerio'
import type { Block } from '../types'
import { extractTextBlock } from './text'
import { extractImageBlocks } from './image'
import { extractVideoBlocks } from './video'
import { extractAudioBlocks } from './audio'
import { extractStickerBlocks } from './sticker'
import { extractVideoStickerBlocks } from './video-sticker'
import { extractLinkPreviewBlocks } from './link-preview'
import { extractReplyBlocks } from './reply'
import { extractPollBlocks } from './poll'
import { extractDocumentBlocks } from './document'
import { extractLocationBlocks } from './location'

/**
 * Extract all Block types from a single Telegram message node.
 */
export function extractBlocks(
  $: CheerioAPI,
  message: AnyNode,
  index: number,
  staticProxy: string,
  channel: string,
): Block[] {
  const blocks: Block[] = []

  // Reply (always before the content it references)
  const replies = extractReplyBlocks($, message, channel)
  blocks.push(...replies)

  // Image blocks
  const images = extractImageBlocks($, message, staticProxy)
  blocks.push(...images)

  // Video blocks
  const videos = extractVideoBlocks($, message, staticProxy)
  blocks.push(...videos)

  // Audio blocks
  const audios = extractAudioBlocks($, message, staticProxy)
  blocks.push(...audios)

  // Text block (main body, inserted after media attachments)
  const text = extractTextBlock($, message, index, staticProxy)
  if (text) blocks.push(text)

  // Stickers
  const stickers = extractStickerBlocks($, message, staticProxy)
  blocks.push(...stickers)

  // Video stickers
  const videoStickers = extractVideoStickerBlocks($, message, staticProxy)
  blocks.push(...videoStickers)

  // Poll
  const polls = extractPollBlocks($, message)
  blocks.push(...polls)

  // Document
  const docs = extractDocumentBlocks($, message, staticProxy)
  blocks.push(...docs)

  // Location
  const locations = extractLocationBlocks($, message, staticProxy)
  blocks.push(...locations)

  // Link preview (usually last)
  const linkPreviews = extractLinkPreviewBlocks($, message, staticProxy)
  blocks.push(...linkPreviews)

  return blocks
}
