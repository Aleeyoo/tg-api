import type { CheerioAPI } from 'cheerio'
import type { ChannelInfo } from './types'

/**
 * Extract channel metadata from the parsed Telegram page.
 */
export function extractChannelInfo($: CheerioAPI): ChannelInfo {
  const descriptionEl = $('.tgme_channel_info_description')
  const descriptionHTML = descriptionEl.length ? descriptionEl.html() : null

  return {
    title: $('.tgme_channel_info_header_title').text() || $('.tgme_page_title').text() || '',
    description: descriptionEl.text() || '',
    descriptionHTML,
    avatar: $('.tgme_page_photo_image img').attr('src') || undefined,
  }
}
