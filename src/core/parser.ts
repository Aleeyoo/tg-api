import * as cheerio from 'cheerio'
import type { AnyNode, CheerioAPI } from 'cheerio'

export interface ParsedDocument {
  $: CheerioAPI
  /** All message wrap nodes from the channel history */
  messageNodes: AnyNode[]
}

/**
 * Load raw HTML into a Cheerio API instance.
 */
export function parseHtml(html: string): ParsedDocument {
  const $ = cheerio.load(html, {}, false)

  const messageNodes = $('.tgme_channel_history .tgme_widget_message_wrap').toArray()

  return { $, messageNodes }
}

/**
 * Get a single message's `.tgme_widget_message` node.
 * Used when loading an individual post by ID (no channel history wrapper).
 */
export function parseSinglePostHtml(html: string): { $: CheerioAPI } {
  const $ = cheerio.load(html, {}, false)
  return { $ }
}
