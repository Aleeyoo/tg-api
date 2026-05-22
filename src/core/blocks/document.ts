import type { AnyNode, CheerioAPI } from 'cheerio'
import type { DocumentBlock } from '../types'

/**
 * Extract document/file blocks from a Telegram message.
 */
export function extractDocumentBlocks(
  $: CheerioAPI,
  message: AnyNode,
  staticProxy: string,
): DocumentBlock[] {
  const msg = $(message).find('.tgme_widget_message')
  const doc = msg.find('.tgme_widget_message_document_wrap')

  if (!doc.length) return []

  const blocks: DocumentBlock[] = []

  for (const docNode of doc.toArray()) {
    const link = $(docNode).find('a.tgme_widget_message_document')
    const href = link.attr('href')
    if (!href) continue

    const name = link.find('.tgme_widget_message_document_title').text() ||
                 link.find('.tgme_widget_message_document_file_name').text() ||
                 'file'

    const sizeText = link.find('.tgme_widget_message_document_extra').text()
    const sizeMatch = sizeText.match(/([\d.]+)\s*(KB|MB|GB)/i)
    let size: number | undefined
    if (sizeMatch) {
      const num = Number.parseFloat(sizeMatch[1])
      const unit = sizeMatch[2].toUpperCase()
      if (unit === 'KB') size = Math.round(num * 1024)
      else if (unit === 'MB') size = Math.round(num * 1024 * 1024)
      else if (unit === 'GB') size = Math.round(num * 1024 * 1024 * 1024)
      else size = Math.round(num)
    }

    const thumb = link.find('.tgme_widget_message_document_thumb img').attr('src')
    const mimeType = href.match(/\.(\w+)$/)?.[1]?.toLowerCase()
      ? `application/${href.match(/\.(\w+)$/)?.[1]?.toLowerCase()}`
      : undefined

    blocks.push({
      id: `block-document-${blocks.length}`,
      type: 'document',
      src: href,
      name,
      size,
      mimeType,
      thumb: thumb ? `${staticProxy}${thumb}` : undefined,
    })
  }

  return blocks
}
