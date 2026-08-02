import { MarkdownMetadata } from '../types'
import { parseMarkdownMetadata, serializeMarkdownMetadata, stripFrontmatter } from './metadataUtils'
import { WorkerResultPayload } from '../workers/indexerWorker'

export interface WorkspaceMetadataStore {
  icons: Record<string, string>
  banners: Record<string, string>
  customProps: Record<string, Record<string, unknown>>
}

class AsyncNotieMetadataEngine {
  private worker: Worker | null = null
  private pendingCallbacks = new Map<string, (result: unknown) => void>()
  private store: WorkspaceMetadataStore = {
    icons: {},
    banners: {},
    customProps: {}
  }

  constructor() {
    this.initWorker()
  }

  private initWorker(): void {
    if (typeof window !== 'undefined' && window.Worker) {
      try {
        this.worker = new Worker(new URL('../workers/indexerWorker.ts', import.meta.url), {
          type: 'module'
        })
        this.worker.onmessage = (event: MessageEvent<WorkerResultPayload>): void => {
          const { id, result } = event.data
          const callback = this.pendingCallbacks.get(id)
          if (callback) {
            callback(result)
            this.pendingCallbacks.delete(id)
          }
        }
      } catch (err) {
        console.warn('Web Worker initialization fallback to sync:', err)
      }
    }
  }

  /**
   * Multithreaded Async Parse Document Metadata
   */
  public async parseDocumentAsync(
    rawContent: string,
    relPath: string
  ): Promise<{ cleanContent: string; metadata: MarkdownMetadata }> {
    const key = relPath.toLowerCase()

    if (!this.worker) {
      const parsed = parseMarkdownMetadata(rawContent)
      if (parsed.metadata.icon) this.store.icons[key] = parsed.metadata.icon
      if (parsed.metadata.banner) this.store.banners[key] = parsed.metadata.banner
      return { cleanContent: parsed.content, metadata: parsed.metadata }
    }

    return new Promise((resolve) => {
      const taskId = `meta_parse_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      this.pendingCallbacks.set(taskId, (result: unknown) => {
        const res = result as { cleanContent: string; metadata: MarkdownMetadata }
        if (res.metadata.icon) this.store.icons[key] = res.metadata.icon
        if (res.metadata.banner) this.store.banners[key] = res.metadata.banner
        resolve(res)
      })

      this.worker!.postMessage({
        id: taskId,
        type: 'PARSE_METADATA',
        content: rawContent
      })
    })
  }

  /**
   * Multithreaded Async Serialize Document Metadata for Disk Save
   */
  public async prepareForSaveAsync(bodyContent: string, relPath: string): Promise<string> {
    const key = relPath.toLowerCase()
    const metadata: MarkdownMetadata = {
      icon: this.store.icons[key],
      banner: this.store.banners[key]
    }

    if (!this.worker) {
      return serializeMarkdownMetadata(bodyContent, metadata)
    }

    return new Promise((resolve) => {
      const taskId = `meta_serialize_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      this.pendingCallbacks.set(taskId, (result: unknown) => {
        resolve(result as string)
      })

      this.worker!.postMessage({
        id: taskId,
        type: 'SERIALIZE_METADATA',
        content: bodyContent,
        metadata
      })
    })
  }

  /**
   * Sync document parse fallback
   */
  public parseDocument(
    rawContent: string,
    relPath: string
  ): { cleanContent: string; metadata: MarkdownMetadata } {
    const key = relPath.toLowerCase()
    const parsed = parseMarkdownMetadata(rawContent)
    if (parsed.metadata.icon) this.store.icons[key] = parsed.metadata.icon
    if (parsed.metadata.banner) this.store.banners[key] = parsed.metadata.banner
    return { cleanContent: parsed.content, metadata: parsed.metadata }
  }

  /**
   * Sync prepare for save fallback
   */
  public prepareForSave(bodyContent: string, relPath: string): string {
    const key = relPath.toLowerCase()
    const metadata: MarkdownMetadata = {
      icon: this.store.icons[key],
      banner: this.store.banners[key]
    }
    return serializeMarkdownMetadata(bodyContent, metadata)
  }

  public getIcon(relPath: string): string | undefined {
    return this.store.icons[relPath.toLowerCase()]
  }

  public setIcon(relPath: string, icon: string | undefined): void {
    const key = relPath.toLowerCase()
    if (icon) {
      this.store.icons[key] = icon
    } else {
      delete this.store.icons[key]
    }
  }

  public getBanner(relPath: string): string | undefined {
    return this.store.banners[relPath.toLowerCase()]
  }

  public setBanner(relPath: string, banner: string | undefined): void {
    const key = relPath.toLowerCase()
    if (banner) {
      this.store.banners[key] = banner
    } else {
      delete this.store.banners[key]
    }
  }

  public cleanContent(text: string): string {
    return stripFrontmatter(text)
  }

  public getStore(): WorkspaceMetadataStore {
    return this.store
  }
}

export const metadataEngine = new AsyncNotieMetadataEngine()
