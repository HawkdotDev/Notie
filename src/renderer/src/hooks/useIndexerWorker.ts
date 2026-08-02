import { useEffect, useRef, useState, useCallback } from 'react'
import { DocumentStatsResult, HeadingItem, WorkerResultPayload } from '../workers/indexerWorker'

export function useIndexerWorker(activeFileContent?: string): {
  stats: DocumentStatsResult
  headings: HeadingItem[]
  extractGraphLinks: (
    files: Record<string, string>
  ) => Promise<{ source: string; target: string }[]>
  searchFiles: (filePaths: string[], query: string) => Promise<string[]>
} {
  const [stats, setStats] = useState<DocumentStatsResult>({
    lines: 1,
    words: 0,
    chars: 0,
    readingTimeMinutes: 1
  })

  const [headings, setHeadings] = useState<HeadingItem[]>([])
  const workerRef = useRef<Worker | null>(null)
  const pendingPromisesRef = useRef<Map<string, (result: unknown) => void>>(new Map())

  useEffect(() => {
    // Instantiate Web Worker on a separate CPU thread
    const worker = new Worker(new URL('../workers/indexerWorker.ts', import.meta.url), {
      type: 'module'
    })
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<WorkerResultPayload>): void => {
      const { id, type, result } = event.data

      if (type === 'CALCULATE_STATS') {
        setStats(result as DocumentStatsResult)
      } else if (type === 'PARSE_HEADINGS') {
        setHeadings(result as HeadingItem[])
      } else {
        const resolve = pendingPromisesRef.current.get(id)
        if (resolve) {
          resolve(result)
          pendingPromisesRef.current.delete(id)
        }
      }
    }

    return (): void => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  // Offload stats & heading parsing to worker thread whenever document content changes
  useEffect(() => {
    if (!workerRef.current) return
    const content = activeFileContent || ''

    const statsTaskId = `stats_${Date.now()}`
    workerRef.current.postMessage({
      id: statsTaskId,
      type: 'CALCULATE_STATS',
      content
    })

    const headingsTaskId = `headings_${Date.now()}`
    workerRef.current.postMessage({
      id: headingsTaskId,
      type: 'PARSE_HEADINGS',
      content
    })
  }, [activeFileContent])

  const extractGraphLinks = useCallback(
    (files: Record<string, string>): Promise<{ source: string; target: string }[]> => {
      return new Promise((resolve) => {
        if (!workerRef.current) {
          resolve([])
          return
        }

        const taskId = `graph_${Date.now()}_${Math.random()}`
        pendingPromisesRef.current.set(taskId, (res: unknown) =>
          resolve(res as { source: string; target: string }[])
        )

        workerRef.current.postMessage({
          id: taskId,
          type: 'EXTRACT_GRAPH_LINKS',
          files
        })
      })
    },
    []
  )

  const searchFiles = useCallback((filePaths: string[], query: string): Promise<string[]> => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
        resolve(filePaths)
        return
      }

      const taskId = `search_${Date.now()}_${Math.random()}`
      pendingPromisesRef.current.set(taskId, (res: unknown) => resolve(res as string[]))

      workerRef.current.postMessage({
        id: taskId,
        type: 'FUZZY_SEARCH',
        filePaths,
        query
      })
    })
  }, [])

  return {
    stats,
    headings,
    extractGraphLinks,
    searchFiles
  }
}
