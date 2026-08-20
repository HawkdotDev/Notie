// Helper to parse Wikilinks [[Target]] or [[Target|Label]] to HTML anchors
export function parseWikilinksToHTML(text: string): string {
  if (!text) return ''
  return text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, path, label) => {
    const targetPath = path.trim()
    const targetLabel = label ? label.trim() : targetPath
    return `<a class="wikilink" data-path="${targetPath}">${targetLabel}</a>`
  })
}

// Helper to convert HTML anchors back to Wikilinks
export function convertHTMLToWikilinks(html: string): string {
  if (!html) return ''
  let processed = html.replace(
    /<a\s+[^>]*class=["']wikilink["'][^>]*data-path=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi,
    (_, path, label) => {
      const cleanPath = path.trim()
      const cleanLabel = label.trim()
      return cleanPath === cleanLabel ? `[[${cleanPath}]]` : `[[${cleanPath}|${cleanLabel}]]`
    }
  )
  processed = processed.replace(
    /<a\s+[^>]*data-path=["']([^"']+)["'][^>]*class=["']wikilink["'][^>]*>(.*?)<\/a>/gi,
    (_, path, label) => {
      const cleanPath = path.trim()
      const cleanLabel = label.trim()
      return cleanPath === cleanLabel ? `[[${cleanPath}]]` : `[[${cleanPath}|${cleanLabel}]]`
    }
  )
  return processed
}

/**
 * Robust markdownToHtml converter for WYSIWYG rich text rendering
 */
export function markdownToHtml(text: string): string {
  if (!text) return ''

  let processed = text

  // 1. Convert bold **text** or __text__ -> <b>text</b>
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
  processed = processed.replace(/__(.*?)__/g, '<b>$1</b>')

  // 2. Convert italic *text* or _text_ -> <i>text</i>
  processed = processed.replace(/(^|[^*])\*(?!\*)(.*?)\*(?!\*)/g, '$1<i>$2</i>')
  processed = processed.replace(/(^|[^_])_(?!_)(.*?)_(?!_)/g, '$1<i>$2</i>')

  // 3. Convert strikethrough ~~text~~ -> <s>text</s>
  processed = processed.replace(/~~(.*?)~~/g, '<s>$1</s>')

  // 4. Convert underline <u>text</u> or <ins>text</ins>
  processed = processed.replace(/<ins[^>]*>(.*?)<\/ins>/gi, '<u>$1</u>')

  // 5. Convert inline code `text` -> <code class="inline-code">text</code>
  processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

  // 6. Convert Wikilinks [[Target|Label]] or [[Target]]
  processed = parseWikilinksToHTML(processed)

  return processed
}

/**
 * Robust htmlToMarkdown converter for saving document blocks
 */
export function htmlToMarkdown(htmlText: string): string {
  if (!htmlText) return ''

  let text = htmlText

  // 1. Convert wikilinks back to [[path|label]]
  text = convertHTMLToWikilinks(text)

  // 2. Convert <b> and <strong> -> **text**
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
  text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')

  // 3. Convert <i> and <em> -> *text*
  text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
  text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')

  // 4. Convert <s> and <strike> and <del> -> ~~text~~
  text = text.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
  text = text.replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~~$1~~')
  text = text.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~')

  // 5. Convert <u> and <ins> -> <u>text</u>
  text = text.replace(/<ins[^>]*>(.*?)<\/ins>/gi, '<u>$1</u>')

  // 6. Convert <code> -> `text`
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')

  // 7. Convert <br> -> \n
  text = text.replace(/<br\s*\/?>/gi, '\n')

  return text
}

export interface MarkdownBlockData {
  type:
    | 'heading1'
    | 'heading2'
    | 'heading3'
    | 'paragraph'
    | 'list'
    | 'quote'
    | 'delimiter'
    | 'image'
    | 'video'
    | 'embed'
  data: {
    text?: string
    level?: number
    style?: 'unordered' | 'ordered'
    items?: string[]
    file?: { url?: string }
    url?: string
    source?: string
    embed?: string
    service?: string
    caption?: string
  }
}

/**
 * Line-by-line Markdown Document Parser for Editor.js blocks
 */
export function parseMarkdownToBlocks(text: string): MarkdownBlockData[] {
  const textWithoutFrontmatter = text
    ? text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '').trimStart()
    : ''

  if (!textWithoutFrontmatter || !textWithoutFrontmatter.trim()) {
    return [{ type: 'paragraph', data: { text: '' } }]
  }

  const lines = textWithoutFrontmatter.split(/\r?\n/)
  const blocks: MarkdownBlockData[] = []

  let currentList: { style: 'unordered' | 'ordered'; items: string[] } | null = null
  let currentParagraphLines: string[] = []

  const flushParagraph = (): void => {
    if (currentParagraphLines.length > 0) {
      const fullText = currentParagraphLines.join('<br>')
      blocks.push({
        type: 'paragraph',
        data: { text: markdownToHtml(fullText) }
      })
      currentParagraphLines = []
    }
  }

  const flushList = (): void => {
    if (currentList) {
      blocks.push({
        type: 'list',
        data: {
          style: currentList.style,
          items: currentList.items.map((item) => markdownToHtml(item))
        }
      })
      currentList = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      flushList()
      continue
    }

    // 1. Image
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/)
    if (imgMatch) {
      flushParagraph()
      flushList()
      blocks.push({
        type: 'image',
        data: { file: { url: imgMatch[2] }, caption: imgMatch[1] }
      })
      continue
    }

    // 1b. Video
    const videoMatch = trimmed.match(/<video[^>]*src=["']([^"']+)["'][^>]*>/i)
    if (videoMatch) {
      flushParagraph()
      flushList()
      blocks.push({
        type: 'video',
        data: { url: videoMatch[1] }
      })
      continue
    }

    // 1c. Embed / Iframe
    const iframeMatch = trimmed.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*>/i)
    if (iframeMatch) {
      flushParagraph()
      flushList()
      blocks.push({
        type: 'embed',
        data: { embed: iframeMatch[1], source: iframeMatch[1] }
      })
      continue
    }

    // 2. Headings
    if (trimmed.startsWith('# ')) {
      flushParagraph()
      flushList()
      blocks.push({
        type: 'heading1',
        data: { text: markdownToHtml(trimmed.replace(/^#\s+/, '')), level: 1 }
      })
      continue
    }
    if (trimmed.startsWith('## ')) {
      flushParagraph()
      flushList()
      blocks.push({
        type: 'heading2',
        data: { text: markdownToHtml(trimmed.replace(/^##\s+/, '')), level: 2 }
      })
      continue
    }
    if (trimmed.startsWith('### ')) {
      flushParagraph()
      flushList()
      blocks.push({
        type: 'heading3',
        data: { text: markdownToHtml(trimmed.replace(/^###\s+/, '')), level: 3 }
      })
      continue
    }

    // 3. Delimiter
    if (trimmed === '---' || trimmed === '***') {
      flushParagraph()
      flushList()
      blocks.push({ type: 'delimiter', data: {} })
      continue
    }

    // 4. Quote
    if (trimmed.startsWith('>')) {
      flushParagraph()
      flushList()
      const quoteText = trimmed.replace(/^>\s*/, '')
      blocks.push({
        type: 'quote',
        data: { text: markdownToHtml(quoteText) }
      })
      continue
    }

    // 5. Unordered List item (- or *)
    const unorderedMatch = trimmed.match(/^[-*]\s+(.*)$/)
    if (unorderedMatch) {
      flushParagraph()
      if (!currentList || currentList.style !== 'unordered') {
        flushList()
        currentList = { style: 'unordered', items: [] }
      }
      currentList.items.push(unorderedMatch[1])
      continue
    }

    // 6. Ordered List item (1. 2. 3.)
    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/)
    if (orderedMatch) {
      flushParagraph()
      if (!currentList || currentList.style !== 'ordered') {
        flushList()
        currentList = { style: 'ordered', items: [] }
      }
      currentList.items.push(orderedMatch[1])
      continue
    }

    // 7. Regular paragraph line
    flushList()
    currentParagraphLines.push(line)
  }

  flushParagraph()
  flushList()

  if (blocks.length === 0) {
    blocks.push({ type: 'paragraph', data: { text: '' } })
  }

  return blocks
}
