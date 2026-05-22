import type { AnyNode, CheerioAPI } from 'cheerio'
import type { LocationBlock } from '../types'
import { STYLE_URL_REGEX } from './utils'

/**
 * Extract location blocks from a Telegram message.
 */
export function extractLocationBlocks(
  $: CheerioAPI,
  message: AnyNode,
  staticProxy: string,
): LocationBlock[] {
  const msg = $(message).find('.tgme_widget_message')
  const location = msg.find('.tgme_widget_message_location_wrap')

  if (!location.length) return []

  // Telegram location link format: https://t.me/geo/... or google maps
  const link = location.find('a').attr('href')
  if (!link) return []

  // Try to parse coordinates from the link
  let latitude = 0
  let longitude = 0

  // Telegram format: https://www.google.com/maps?q=lat,long or t.me/geo/lat,long
  const geoMatch = link.match(/[?/](-?\d+\.\d+)[,/](-?\d+\.\d+)/)
  if (geoMatch) {
    latitude = Number.parseFloat(geoMatch[1])
    longitude = Number.parseFloat(geoMatch[2])
  }

  // Background image as map thumbnail
  const bgStyle = location.find('.tgme_widget_message_location').attr('style')
  const imageUrl = bgStyle?.match(STYLE_URL_REGEX)?.[1]
  const image = imageUrl ? `${staticProxy}${imageUrl}` : undefined

  return [{
    id: 'block-location-0',
    type: 'location',
    latitude,
    longitude,
    image,
  }]
}
