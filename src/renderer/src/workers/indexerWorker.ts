export interface MarkdownMetadata {
  icon?: string
  banner?: string
  showIcon?: boolean
  showCover?: boolean
  showFileName?: boolean
}

export interface WorkerTaskPayload {
  id: string
  type:
    | 'CALCULATE_STATS'
    | 'EXTRACT_GRAPH_LINKS'
    | 'PARSE_HEADINGS'
    | 'FUZZY_SEARCH'
    | 'PARSE_METADATA'
    | 'SERIALIZE_METADATA'
  content?: string
  files?: Record<string, string>
  query?: string
  filePaths?: string[]
  metadata?: MarkdownMetadata
}

export interface WorkerResultPayload {
  id: string
  type:
    | 'CALCULATE_STATS'
    | 'EXTRACT_GRAPH_LINKS'
    | 'PARSE_HEADINGS'
    | 'FUZZY_SEARCH'
    | 'PARSE_METADATA'
    | 'SERIALIZE_METADATA'
  result: unknown
}

export interface DocumentStatsResult {
  lines: number
  words: number
  chars: number
  readingTimeMinutes: number
}

export interface HeadingItem {
  level: number
  text: string
  line: number
}

function stripFrontmatterWorker(text: string): string {
  if (!text) return ''
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '').trimStart()
}

function parseMetadataWorker(fileContent: string): {
  cleanContent: string
  metadata: MarkdownMetadata
} {
  const metadata: MarkdownMetadata = {}
  let cleanContent = fileContent

  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (match) {
    cleanContent = fileContent.slice(match[0].length).trimStart()
    const frontmatter = match[1]
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

  return { cleanContent, metadata }
}

function serializeMetadataWorker(content: string, metadata: MarkdownMetadata): string {
  const body = stripFrontmatterWorker(content)
  const hasIcon = Boolean(metadata.icon)
  const hasBanner = Boolean(metadata.banner)
  const hasShowIcon = metadata.showIcon !== undefined
  const hasShowCover = metadata.showCover !== undefined
  const hasShowFileName = metadata.showFileName !== undefined

  if (!hasIcon && !hasBanner && !hasShowIcon && !hasShowCover && !hasShowFileName) {
    return body
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

  return frontmatter + body
}

self.onmessage = (event: MessageEvent<WorkerTaskPayload>): void => {
  const { id, type, content, files, query, filePaths, metadata } = event.data

  if (type === 'CALCULATE_STATS') {
    const text = content || ''
    const lines = text ? text.split('\n').length : 1
    const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 0
    const chars = text.length
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200))

    const stats: DocumentStatsResult = {
      lines,
      words,
      chars,
      readingTimeMinutes
    }

    const response: WorkerResultPayload = {
      id,
      type: 'CALCULATE_STATS',
      result: stats
    }
    self.postMessage(response)
  } else if (type === 'PARSE_HEADINGS') {
    const text = content || ''
    const headings: HeadingItem[] = []
    const lines = text.split('\n')

    lines.forEach((line, idx) => {
      const match = line.match(/^(#{1,6})\s+(.+)/)
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
          line: idx + 1
        })
      }
    })

    const response: WorkerResultPayload = {
      id,
      type: 'PARSE_HEADINGS',
      result: headings
    }
    self.postMessage(response)
  } else if (type === 'EXTRACT_GRAPH_LINKS') {
    const allFiles = files || {}
    const links: { source: string; target: string }[] = []

    Object.entries(allFiles).forEach(([filePath, fileText]) => {
      const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
      let match: RegExpExecArray | null
      while ((match = regex.exec(fileText)) !== null) {
        const target = match[1].trim()
        links.push({
          source: filePath,
          target
        })
      }
    })

    const response: WorkerResultPayload = {
      id,
      type: 'EXTRACT_GRAPH_LINKS',
      result: links
    }
    self.postMessage(response)
  } else if (type === 'FUZZY_SEARCH') {
    const q = (query || '').toLowerCase().trim()
    const paths = filePaths || []

    if (!q) {
      self.postMessage({ id, type: 'FUZZY_SEARCH', result: paths })
      return
    }

    const matches = paths.filter((filePath) => {
      const fileName = filePath.split(/[\\/]/).pop()?.toLowerCase() || ''
      return fileName.includes(q) || filePath.toLowerCase().includes(q)
    })

    const response: WorkerResultPayload = {
      id,
      type: 'FUZZY_SEARCH',
      result: matches
    }
    self.postMessage(response)
  } else if (type === 'PARSE_METADATA') {
    const result = parseMetadataWorker(content || '')
    const response: WorkerResultPayload = {
      id,
      type: 'PARSE_METADATA',
      result
    }
    self.postMessage(response)
  } else if (type === 'SERIALIZE_METADATA') {
    const result = serializeMetadataWorker(content || '', metadata || {})
    const response: WorkerResultPayload = {
      id,
      type: 'SERIALIZE_METADATA',
      result
    }
    self.postMessage(response)
  }
}
