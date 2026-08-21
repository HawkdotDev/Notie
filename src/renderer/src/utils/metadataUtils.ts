import { MarkdownMetadata, ParsedDocument } from '../types'

const metadataCache = new Map<string, ParsedDocument>()

export function stripFrontmatter(content: string): string {
  if (!content) return ''
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '').trimStart()
}

export function parseLocalMetadata(fileContent: string): MarkdownMetadata | null {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return null

  const frontmatter = match[1]
  const metadata: MarkdownMetadata = {}
  const lines = frontmatter.split(/\r?\n/)
  for (const line of lines) {
    const parts = line.split(':')
    if (parts.length >= 2) {
      const key = parts[0].trim()
      const rawVal = parts.slice(1).join(':').trim()
      const cleanVal = rawVal.replace(/^['"]|['"]$/g, '')
      if (key === 'icon') {
        metadata.icon = cleanVal
      } else if (key === 'banner') {
        metadata.banner = cleanVal
      } else if (key === 'showIcon') {
        metadata.showIcon = cleanVal.toLowerCase() === 'true'
      } else if (key === 'showCover') {
        metadata.showCover = cleanVal.toLowerCase() === 'true'
      } else if (key === 'showFileName') {
        metadata.showFileName = cleanVal.toLowerCase() === 'true'
      }
    }
  }
  return metadata
}

export function parseMarkdownMetadata(fileContent: string): ParsedDocument {
  if (metadataCache.has(fileContent)) {
    return metadataCache.get(fileContent)!
  }

  const metadata: MarkdownMetadata = {}
  let content = fileContent

  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (match) {
    const frontmatter = match[1]
    content = fileContent.slice(match[0].length).trimStart()

    const lines = frontmatter.split(/\r?\n/)
    for (const line of lines) {
      const parts = line.split(':')
      if (parts.length >= 2) {
        const key = parts[0].trim()
        const rawVal = parts.slice(1).join(':').trim()
        const cleanVal = rawVal.replace(/^['"]|['"]$/g, '')
        if (key === 'icon') {
          metadata.icon = cleanVal
        } else if (key === 'banner') {
          metadata.banner = cleanVal
        } else if (key === 'showIcon') {
          metadata.showIcon = cleanVal.toLowerCase() === 'true'
        } else if (key === 'showCover') {
          metadata.showCover = cleanVal.toLowerCase() === 'true'
        } else if (key === 'showFileName') {
          metadata.showFileName = cleanVal.toLowerCase() === 'true'
        }
      }
    }
  }

  const result: ParsedDocument = { metadata, content, title: '' }
  // Limit cache size to 100 entries to prevent memory leaks
  if (metadataCache.size > 100) {
    const firstKey = metadataCache.keys().next().value
    if (firstKey) metadataCache.delete(firstKey)
  }
  metadataCache.set(fileContent, result)

  return result
}

export function serializeMarkdownMetadata(content: string, metadata: MarkdownMetadata): string {
  // Strip any existing frontmatter first to avoid duplication
  const strippedContent = stripFrontmatter(content)

  const hasIcon = Boolean(metadata.icon)
  const hasBanner = Boolean(metadata.banner)
  const hasShowIcon = metadata.showIcon !== undefined
  const hasShowCover = metadata.showCover !== undefined
  const hasShowFileName = metadata.showFileName !== undefined

  if (!hasIcon && !hasBanner && !hasShowIcon && !hasShowCover && !hasShowFileName) {
    return strippedContent
  }

  let frontmatter = '---\n'
  if (metadata.icon) {
    frontmatter += `icon: "${metadata.icon}"\n`
  }
  if (metadata.banner) {
    frontmatter += `banner: "${metadata.banner}"\n`
  }
  if (metadata.showCover !== undefined) {
    frontmatter += `showCover: ${metadata.showCover}\n`
  }
  if (metadata.showIcon !== undefined) {
    frontmatter += `showIcon: ${metadata.showIcon}\n`
  }
  if (metadata.showFileName !== undefined) {
    frontmatter += `showFileName: ${metadata.showFileName}\n`
  }
  frontmatter += '---\n'

  return frontmatter + strippedContent
}
