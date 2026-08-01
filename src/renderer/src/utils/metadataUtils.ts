import { MarkdownMetadata, ParsedDocument } from '../types'

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
      const value = parts.slice(1).join(':').trim()
      if (key === 'icon') {
        metadata.icon = value.replace(/^['"]|['"]$/g, '')
      } else if (key === 'banner') {
        metadata.banner = value.replace(/^['"]|['"]$/g, '')
      }
    }
  }
  return metadata
}

export function parseMarkdownMetadata(fileContent: string): ParsedDocument {
  const metadata: MarkdownMetadata = {}
  let content = fileContent

  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (match) {
    const frontmatter = match[1]
    content = fileContent.slice(match[0].length)

    const lines = frontmatter.split(/\r?\n/)
    for (const line of lines) {
      const parts = line.split(':')
      if (parts.length >= 2) {
        const key = parts[0].trim()
        const value = parts.slice(1).join(':').trim()
        if (key === 'icon') {
          metadata.icon = value.replace(/^['"]|['"]$/g, '')
        } else if (key === 'banner') {
          metadata.banner = value.replace(/^['"]|['"]$/g, '')
        }
      }
    }
  }

  return { metadata, content, title: '' }
}

export function serializeMarkdownMetadata(content: string, metadata: MarkdownMetadata): string {
  // Strip any existing frontmatter first to avoid duplication
  const strippedContent = content.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '')

  if (!metadata.icon && !metadata.banner) {
    return strippedContent
  }

  let frontmatter = '---\n'
  if (metadata.icon) {
    frontmatter += `icon: "${metadata.icon}"\n`
  }
  if (metadata.banner) {
    frontmatter += `banner: "${metadata.banner}"\n`
  }
  frontmatter += '---\n'

  return frontmatter + strippedContent
}
