import { MarkdownMetadata } from '../types'
import { parseMarkdownMetadata, serializeMarkdownMetadata, stripFrontmatter } from './metadataUtils'
import { WorkerResultPayload } from '../workers/indexerWorker'

export interface WorkspaceMetadataStore {
  icons: Record<string, string>
  banners: Record<string, string>
  showCover: Record<string, boolean | undefined>
  showIcon: Record<string, boolean | undefined>
  showFileName: Record<string, boolean | undefined>
  customProps: Record<string, Record<string, unknown>>
}

class AsyncMinkMetadataEngine {
  private worker: Worker | null = null
  private pendingCallbacks = new Map<string, (result: unknown) => void>()
  private store: WorkspaceMetadataStore = {
    icons: {},
    banners: {},
    showCover: {},
    showIcon: {},
    showFileName: {},
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
      if (parsed.metadata.showCover !== undefined)
        this.store.showCover[key] = parsed.metadata.showCover
      if (parsed.metadata.showIcon !== undefined)
        this.store.showIcon[key] = parsed.metadata.showIcon
      if (parsed.metadata.showFileName !== undefined)
        this.store.showFileName[key] = parsed.metadata.showFileName
      return { cleanContent: parsed.content, metadata: parsed.metadata }
    }

    return new Promise((resolve) => {
      const taskId = `meta_parse_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      this.pendingCallbacks.set(taskId, (result: unknown) => {
        const res = result as { cleanContent: string; metadata: MarkdownMetadata }
        if (res.metadata.icon) this.store.icons[key] = res.metadata.icon
        if (res.metadata.banner) this.store.banners[key] = res.metadata.banner
        if (res.metadata.showCover !== undefined) this.store.showCover[key] = res.metadata.showCover
        if (res.metadata.showIcon !== undefined) this.store.showIcon[key] = res.metadata.showIcon
        if (res.metadata.showFileName !== undefined)
          this.store.showFileName[key] = res.metadata.showFileName
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
  public async prepareForSaveAsync(
    bodyContent: string,
    relPath: string,
    overrideMeta?: MarkdownMetadata
  ): Promise<string> {
    const key = relPath.toLowerCase()
    const metadata: MarkdownMetadata = {
      icon: overrideMeta?.icon !== undefined ? overrideMeta.icon : this.store.icons[key],
      banner: overrideMeta?.banner !== undefined ? overrideMeta.banner : this.store.banners[key],
      showCover:
        overrideMeta?.showCover !== undefined ? overrideMeta.showCover : this.store.showCover[key],
      showIcon:
        overrideMeta?.showIcon !== undefined ? overrideMeta.showIcon : this.store.showIcon[key],
      showFileName:
        overrideMeta?.showFileName !== undefined
          ? overrideMeta.showFileName
          : this.store.showFileName[key]
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
    if (parsed.metadata.showCover !== undefined)
      this.store.showCover[key] = parsed.metadata.showCover
    if (parsed.metadata.showIcon !== undefined) this.store.showIcon[key] = parsed.metadata.showIcon
    if (parsed.metadata.showFileName !== undefined)
      this.store.showFileName[key] = parsed.metadata.showFileName
    return { cleanContent: parsed.content, metadata: parsed.metadata }
  }

  /**
   * Sync prepare for save fallback
   */
  public prepareForSave(
    bodyContent: string,
    relPath: string,
    overrideMeta?: MarkdownMetadata
  ): string {
    const key = relPath.toLowerCase()
    const metadata: MarkdownMetadata = {
      icon: overrideMeta?.icon !== undefined ? overrideMeta.icon : this.store.icons[key],
      banner: overrideMeta?.banner !== undefined ? overrideMeta.banner : this.store.banners[key],
      showCover:
        overrideMeta?.showCover !== undefined ? overrideMeta.showCover : this.store.showCover[key],
      showIcon:
        overrideMeta?.showIcon !== undefined ? overrideMeta.showIcon : this.store.showIcon[key],
      showFileName:
        overrideMeta?.showFileName !== undefined
          ? overrideMeta.showFileName
          : this.store.showFileName[key]
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

  public setShowCover(relPath: string, val: boolean | undefined): void {
    const key = relPath.toLowerCase()
    if (val === undefined) {
      delete this.store.showCover[key]
    } else {
      this.store.showCover[key] = val
    }
  }

  public setShowIcon(relPath: string, val: boolean | undefined): void {
    const key = relPath.toLowerCase()
    if (val === undefined) {
      delete this.store.showIcon[key]
    } else {
      this.store.showIcon[key] = val
    }
  }

  public setShowFileName(relPath: string, val: boolean | undefined): void {
    const key = relPath.toLowerCase()
    if (val === undefined) {
      delete this.store.showFileName[key]
    } else {
      this.store.showFileName[key] = val
    }
  }

  public clearFileOverrides(relPath: string): void {
    const key = relPath.toLowerCase()
    delete this.store.showCover[key]
    delete this.store.showIcon[key]
    delete this.store.showFileName[key]
  }

  public getFileMetadata(relPath: string): MarkdownMetadata {
    const key = relPath.toLowerCase()
    return {
      icon: this.store.icons[key],
      banner: this.store.banners[key],
      showCover: this.store.showCover[key],
      showIcon: this.store.showIcon[key],
      showFileName: this.store.showFileName[key]
    }
  }

  public cleanContent(text: string): string {
    return stripFrontmatter(text)
  }

  public getStore(): WorkspaceMetadataStore {
    return this.store
  }
}

export const metadataEngine = new AsyncMinkMetadataEngine()
