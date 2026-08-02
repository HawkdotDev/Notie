export interface WorkerTaskPayload {
  id: string
  type: 'CALCULATE_STATS' | 'EXTRACT_GRAPH_LINKS' | 'PARSE_HEADINGS' | 'FUZZY_SEARCH'
  content?: string
  files?: Record<string, string>
  query?: string
  filePaths?: string[]
}

export interface WorkerResultPayload {
  id: string
  type: 'CALCULATE_STATS' | 'EXTRACT_GRAPH_LINKS' | 'PARSE_HEADINGS' | 'FUZZY_SEARCH'
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

self.onmessage = (event: MessageEvent<WorkerTaskPayload>): void => {
  const { id, type, content, files, query, filePaths } = event.data

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
  }
}
