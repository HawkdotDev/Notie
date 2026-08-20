import React, { useEffect, useRef } from 'react'
import EditorJS, { BlockToolConstructable, InlineToolConstructable } from '@editorjs/editorjs'
// @ts-ignore: Header does not provide official TypeScript typings
import Header from '@editorjs/header'
// @ts-ignore: List does not provide official TypeScript typings
import List from '@editorjs/list'
// @ts-ignore: Underline does not provide official TypeScript typings
import Underline from '@editorjs/underline'
// @ts-ignore: InlineCode does not provide official TypeScript typings
import InlineCode from '@editorjs/inline-code'
// @ts-ignore: Marker does not provide official TypeScript typings
import Marker from '@editorjs/marker'
// @ts-ignore: Quote does not provide official TypeScript typings
import Quote from '@editorjs/quote'
// @ts-ignore: Delimiter does not provide official TypeScript typings
import Delimiter from '@editorjs/delimiter'
// @ts-ignore: ImageTool does not provide official TypeScript typings
import ImageTool from '@editorjs/image'
// @ts-ignore: DragDrop does not provide official TypeScript typings
import DragDrop from 'editorjs-drag-drop'
import { parseMarkdownToBlocks, htmlToMarkdown } from '../utils/markdownConverter'

// Custom Image Tool with modern Lucide icon
class CustomImageTool extends ImageTool {
  static get toolbox(): { icon: string; title: string } {
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/><path d="m14 14 3-3 4 4"/></svg>',
      title: 'Image'
    }
  }
}

// Inline Strikethrough Tool
class StrikethroughInlineTool {
  static get isInline(): boolean {
    return true
  }

  static get title(): string {
    return 'Strikethrough'
  }

  static get sanitize(): Record<string, unknown> {
    return {
      s: {},
      strike: {},
      del: {}
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private api: any
  private button: HTMLButtonElement | null = null
  private tag = 'S'
  private icon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" x2="20" y1="12" y2="12"/></svg>'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ api }: { api: any }) {
    this.api = api
  }

  render(): HTMLElement {
    this.button = document.createElement('button')
    this.button.type = 'button'
    this.button.innerHTML = this.icon
    this.button.classList.add(this.api.styles.inlineToolButton)
    this.button.title = 'Strikethrough'
    return this.button
  }

  surround(range: Range): void {
    if (!range) return
    const termWrapper = this.api.selection.findParentTag(this.tag)
    if (termWrapper) {
      this.unwrap(termWrapper)
    } else {
      this.wrap(range)
    }
  }

  wrap(range: Range): void {
    const selectedText = range.extractContents()
    const elem = document.createElement(this.tag)
    elem.appendChild(selectedText)
    range.insertNode(elem)
    this.api.selection.expandToTag(elem)
  }

  unwrap(termWrapper: HTMLElement): void {
    this.api.selection.expandToTag(termWrapper)
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    const unwrappedContent = range.extractContents()
    termWrapper.parentNode?.removeChild(termWrapper)
    range.insertNode(unwrappedContent)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  checkState(): boolean {
    const termWrapper = this.api.selection.findParentTag(this.tag)
    if (this.button) {
      this.button.classList.toggle(this.api.styles.inlineToolButtonActive, !!termWrapper)
    }
    return !!termWrapper
  }
}

interface VideoBlockData {
  url?: string
  caption?: string
}

class VideoTool {
  static get toolbox(): { icon: string; title: string } {
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>',
      title: 'Video'
    }
  }

  static get isReadOnlySupported(): boolean {
    return true
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected api: any
  private data: VideoBlockData
  private wrapper: HTMLElement | null = null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ data, api }: { data: VideoBlockData; api?: any }) {
    this.api = api
    this.data = data || {}
  }

  render(): HTMLElement {
    this.wrapper = document.createElement('div')
    this.wrapper.classList.add('notie-video-block')

    if (this.data && this.data.url) {
      this.renderVideo(this.data.url, this.data.caption || '')
    } else {
      this.renderInput()
    }

    return this.wrapper
  }

  renderInput(): void {
    if (!this.wrapper) return
    this.wrapper.innerHTML = `
      <div class="notie-media-input-box">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2 text-xs text-zinc-300 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>
            <span>Embed or Upload Video</span>
          </div>
          <label class="notie-media-upload-label">
            <span>Upload file</span>
            <input type="file" accept="video/*" class="notie-media-file-input" style="display: none;" />
          </label>
        </div>
        <div class="flex gap-2">
          <input type="text" class="notie-media-url-input" placeholder="Paste video URL (.mp4, .webm, direct link)..." />
          <button type="button" class="notie-media-submit-btn">Embed</button>
        </div>
      </div>
    `
    const input = this.wrapper.querySelector('.notie-media-url-input') as HTMLInputElement
    const fileInput = this.wrapper.querySelector('.notie-media-file-input') as HTMLInputElement
    const btn = this.wrapper.querySelector('.notie-media-submit-btn') as HTMLButtonElement

    const handleSubmit = (): void => {
      const url = input?.value?.trim()
      if (url) {
        this.data.url = url
        this.renderVideo(url, '')
      }
    }

    btn?.addEventListener('click', handleSubmit)
    input?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit()
    })

    fileInput?.addEventListener('change', () => {
      const file = fileInput.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          if (result) {
            this.data.url = result
            this.renderVideo(result, file.name)
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  renderVideo(url: string, caption: string): void {
    if (!this.wrapper) return
    this.wrapper.innerHTML = `
      <div class="notie-video-container group">
        <video controls src="${url}" class="notie-video-player"></video>
        <input type="text" class="notie-media-caption-input" placeholder="Add a caption..." value="${caption || ''}" />
      </div>
    `
    const captionInput = this.wrapper.querySelector(
      '.notie-media-caption-input'
    ) as HTMLInputElement
    captionInput?.addEventListener('input', () => {
      this.data.caption = captionInput.value
    })
  }

  save(blockContent?: HTMLElement): VideoBlockData {
    if (blockContent) {
      const input = blockContent.querySelector('.notie-media-url-input') as HTMLInputElement
      const captionInput = blockContent.querySelector(
        '.notie-media-caption-input'
      ) as HTMLInputElement
      if (input && input.value) {
        this.data.url = input.value.trim()
      }
      if (captionInput) {
        this.data.caption = captionInput.value.trim()
      }
    }
    return {
      url: this.data.url || '',
      caption: this.data.caption || ''
    }
  }
}

interface EmbedBlockData {
  service?: string
  source?: string
  embed?: string
  caption?: string
}

function parseEmbedUrl(url: string): { embedUrl: string; service: string } {
  const clean = url.trim()
  const ytMatch = clean.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  )
  if (ytMatch) {
    return { embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`, service: 'youtube' }
  }
  const vimeoMatch = clean.match(
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/
  )
  if (vimeoMatch) {
    return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}`, service: 'vimeo' }
  }
  const codepenMatch = clean.match(/codepen\.io\/([^/\s]+)\/pen\/([^/\s]+)/)
  if (codepenMatch) {
    return {
      embedUrl: `https://codepen.io/${codepenMatch[1]}/embed/${codepenMatch[2]}`,
      service: 'codepen'
    }
  }
  return { embedUrl: clean, service: 'generic' }
}

class EmbedTool {
  static get toolbox(): { icon: string; title: string } {
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
      title: 'Embed'
    }
  }

  static get isReadOnlySupported(): boolean {
    return true
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected api: any
  private data: EmbedBlockData
  private wrapper: HTMLElement | null = null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor({ data, api }: { data: EmbedBlockData; api?: any }) {
    this.api = api
    this.data = data || {}
  }

  render(): HTMLElement {
    this.wrapper = document.createElement('div')
    this.wrapper.classList.add('notie-embed-block')

    if (this.data && (this.data.embed || this.data.source)) {
      const url = this.data.embed || this.data.source || ''
      this.renderEmbed(url, this.data.caption || '')
    } else {
      this.renderInput()
    }

    return this.wrapper
  }

  renderInput(): void {
    if (!this.wrapper) return
    this.wrapper.innerHTML = `
      <div class="notie-media-input-box">
        <div class="flex items-center gap-2 mb-2 text-xs text-zinc-300 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          <span>Embed Web Link (YouTube, Vimeo, CodePen, etc.)</span>
        </div>
        <div class="flex gap-2">
          <input type="text" class="notie-media-url-input" placeholder="Paste link to embed..." />
          <button type="button" class="notie-media-submit-btn">Embed</button>
        </div>
      </div>
    `
    const input = this.wrapper.querySelector('.notie-media-url-input') as HTMLInputElement
    const btn = this.wrapper.querySelector('.notie-media-submit-btn') as HTMLButtonElement

    const handleSubmit = (): void => {
      const raw = input?.value?.trim()
      if (raw) {
        const { embedUrl, service } = parseEmbedUrl(raw)
        this.data.source = raw
        this.data.embed = embedUrl
        this.data.service = service
        this.renderEmbed(embedUrl, '')
      }
    }

    btn?.addEventListener('click', handleSubmit)
    input?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit()
    })
  }

  renderEmbed(url: string, caption: string): void {
    if (!this.wrapper) return
    this.wrapper.innerHTML = `
      <div class="notie-embed-container group">
        <iframe src="${url}" class="notie-embed-iframe" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
        <input type="text" class="notie-media-caption-input" placeholder="Add a caption..." value="${caption || ''}" />
      </div>
    `
    const captionInput = this.wrapper.querySelector(
      '.notie-media-caption-input'
    ) as HTMLInputElement
    captionInput?.addEventListener('input', () => {
      this.data.caption = captionInput.value
    })
  }

  save(blockContent?: HTMLElement): EmbedBlockData {
    if (blockContent) {
      const input = blockContent.querySelector('.notie-media-url-input') as HTMLInputElement
      const captionInput = blockContent.querySelector(
        '.notie-media-caption-input'
      ) as HTMLInputElement
      if (input && input.value) {
        const raw = input.value.trim()
        const { embedUrl, service } = parseEmbedUrl(raw)
        this.data.source = raw
        this.data.embed = embedUrl
        this.data.service = service
      }
      if (captionInput) {
        this.data.caption = captionInput.value.trim()
      }
    }
    return {
      service: this.data.service || 'generic',
      source: this.data.source || '',
      embed: this.data.embed || '',
      caption: this.data.caption || ''
    }
  }
}

interface BlockEditorProps {
  value: string
  onChange: (value: string) => void
  activeFilePath: string
  onWikilinkClick?: (path: string) => void
}

interface EditorJSBlock {
  type: string
  data: {
    text?: string
    level?: number
    style?: string
    items?: string[]
    alignment?: string
    file?: {
      url?: string
    }
    url?: string
    source?: string
    embed?: string
    service?: string
    caption?: string
    withBorder?: boolean
    withBackground?: boolean
    stretched?: boolean
  }
}

interface EditorJSData {
  blocks: EditorJSBlock[]
}

// Simple Markdown parser to Editor.js JSON data
function parseMarkdownToEditorJS(text: string): EditorJSData {
  const blocks = parseMarkdownToBlocks(text) as EditorJSBlock[]
  return { blocks }
}

// Convert Editor.js JSON data back to Markdown
function serializeEditorJSToMarkdown(data: EditorJSData): string {
  if (!data || !data.blocks) return ''

  return data.blocks
    .map((b: EditorJSBlock) => {
      switch (b.type) {
        case 'heading1': {
          return `# ${htmlToMarkdown(b.data.text || '')}`
        }
        case 'heading2': {
          return `## ${htmlToMarkdown(b.data.text || '')}`
        }
        case 'heading3': {
          return `### ${htmlToMarkdown(b.data.text || '')}`
        }
        case 'header': {
          const level = b.data.level || 2
          const hashes = '#'.repeat(level)
          return `${hashes} ${htmlToMarkdown(b.data.text || '')}`
        }
        case 'list': {
          const items = b.data.items || []
          const isOrdered = b.data.style === 'ordered'
          return items
            .map((item: string, idx: number) => {
              const prefix = isOrdered ? `${idx + 1}. ` : '- '
              return `${prefix}${htmlToMarkdown(item)}`
            })
            .join('\n')
        }
        case 'quote': {
          const text = b.data.text || ''
          const lines = text.replace(/<br\s*\/?>/gi, '\n').split('\n')
          return lines.map((line) => `> ${htmlToMarkdown(line)}`).join('\n')
        }
        case 'image': {
          const url = b.data.file?.url || ''
          const caption = b.data.caption || ''
          return `![${caption}](${url})`
        }
        case 'video': {
          const url = b.data.url || ''
          return `<video src="${url}" controls></video>`
        }
        case 'embed': {
          const url = b.data.embed || b.data.source || ''
          return `<iframe src="${url}" allowfullscreen></iframe>`
        }
        case 'delimiter': {
          return '---'
        }
        case 'paragraph':
        default: {
          const cleanText = b.data.text ? b.data.text.replace(/<br\s*\/?>/gi, '\n') : ''
          return htmlToMarkdown(cleanText)
        }
      }
    })
    .join('\n\n')
}

// Helper to extend sanitization rules of a tool to allow wikilink elements
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function allowWikilinksInSanitizer(toolClass: any): void {
  if (!toolClass) return
  const originalSanitize = toolClass.sanitize
  Object.defineProperty(toolClass, 'sanitize', {
    get() {
      const rules =
        typeof originalSanitize === 'function' ? originalSanitize() : originalSanitize || {}
      return {
        ...rules,
        a: {
          ...(rules.a === true ? { href: true } : rules.a || {}),
          class: 'wikilink',
          'data-path': true
        }
      }
    },
    configurable: true
  })
}

// Apply to all text tools
allowWikilinksInSanitizer(Header)
allowWikilinksInSanitizer(List)
allowWikilinksInSanitizer(Quote)

export default function BlockEditor({
  value,
  onChange,
  activeFilePath,
  onWikilinkClick
}: BlockEditorProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<EditorJS | null>(null)
  const lastSerializedRef = useRef<string>('')
  const isLocalChangeRef = useRef<boolean>(false)
  const destroyingPromiseRef = useRef<Promise<void> | null>(null)

  // Track the value in a ref to satisfy React hook dependencies rules
  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])

  // Track the change wrapper so that we always use the latest onChange callback
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Track onWikilinkClick callback in a ref to satisfy React hook rules
  const onWikilinkClickRef = useRef(onWikilinkClick)
  useEffect(() => {
    onWikilinkClickRef.current = onWikilinkClick
  }, [onWikilinkClick])

  // Initialize/reinitialize editor when file changes
  // Safe helper to destroy an EditorJS instance
  const destroyInstance = async (instance: EditorJS): Promise<void> => {
    try {
      await instance.isReady
      if (typeof instance.destroy === 'function') {
        await instance.destroy()
      }
    } catch (err) {
      console.error('Error destroying EditorJS instance:', err)
    }
  }

  // Initialize/reinitialize editor when file changes
  useEffect(() => {
    if (!containerRef.current) return

    let isDestroyed = false
    let editor: EditorJS | null = null

    const init = async (): Promise<void> => {
      // 1. Wait for any active cleanup/destruction to finish first
      if (destroyingPromiseRef.current) {
        try {
          await destroyingPromiseRef.current
        } catch (err) {
          console.error('Previous destruction error:', err)
        }
        destroyingPromiseRef.current = null
      }

      // 2. If there's still a previous instance in the ref, destroy it and wait
      if (editorInstanceRef.current) {
        const previousInstance = editorInstanceRef.current
        editorInstanceRef.current = null
        destroyingPromiseRef.current = destroyInstance(previousInstance)
        try {
          await destroyingPromiseRef.current
        } catch (err) {
          console.error('Instance destruction error:', err)
        }
        destroyingPromiseRef.current = null
      }

      if (isDestroyed) return

      const parsedData = parseMarkdownToEditorJS(valueRef.current)

      editor = new EditorJS({
        holder: containerRef.current || 'editorjs-container',
        data: parsedData,
        sanitizer: {
          a: {
            class: 'wikilink',
            'data-path': true,
            href: true
          }
        },
        tools: {
          heading1: {
            class: Header as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Heading 1',
              levels: [1],
              defaultLevel: 1
            },
            toolbox: {
              title: 'Heading 1'
            }
          },
          heading2: {
            class: Header as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Heading 2',
              levels: [2],
              defaultLevel: 2
            },
            toolbox: {
              title: 'Heading 2'
            }
          },
          heading3: {
            class: Header as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Heading 3',
              levels: [3],
              defaultLevel: 3
            },
            toolbox: {
              title: 'Heading 3'
            }
          },
          list: {
            class: List as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered'
            }
          },
          quote: {
            class: Quote as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Enter a quote'
            }
          },
          delimiter: Delimiter as unknown as BlockToolConstructable,
          image: {
            class: CustomImageTool as unknown as BlockToolConstructable,
            config: {
              uploader: {
                uploadByFile(file: File) {
                  return new Promise((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = (e) => {
                      resolve({
                        success: 1,
                        file: {
                          url: e.target?.result
                        }
                      })
                    }
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                  })
                },
                uploadByUrl(url: string) {
                  return new Promise((resolve) => {
                    resolve({
                      success: 1,
                      file: {
                        url: url
                      }
                    })
                  })
                }
              }
            }
          },
          video: {
            class: VideoTool as unknown as BlockToolConstructable,
            toolbox: {
              title: 'Video',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>'
            }
          },
          embed: {
            class: EmbedTool as unknown as BlockToolConstructable,
            toolbox: {
              title: 'Embed',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
            }
          },
          underline: Underline as unknown as InlineToolConstructable,
          strikethrough: StrikethroughInlineTool as unknown as InlineToolConstructable,
          inlineCode: InlineCode as unknown as InlineToolConstructable,
          marker: Marker as unknown as InlineToolConstructable
        },
        placeholder: "Press 'Tab' or click '+' to write...",
        onReady: () => {
          const inst = editorInstanceRef.current || editor
          if (inst) {
            new DragDrop(inst)
          }
        },
        onChange: async (api) => {
          try {
            const savedData = await api.saver.save()
            const markdown = serializeEditorJSToMarkdown(savedData as EditorJSData)

            isLocalChangeRef.current = true
            lastSerializedRef.current = markdown
            onChangeRef.current(markdown)
          } catch (err) {
            console.error('Error saving EditorJS data on change:', err)
          }
        }
      })

      editorInstanceRef.current = editor
      lastSerializedRef.current = valueRef.current
    }

    init()

    return () => {
      isDestroyed = true
      if (editor) {
        const instanceToDestroy = editor
        editorInstanceRef.current = null
        destroyingPromiseRef.current = destroyInstance(instanceToDestroy)
      }
    }
  }, [activeFilePath])

  // Handle value updates from parent (e.g. external edits, reload, etc.)
  useEffect(() => {
    if (isLocalChangeRef.current) {
      isLocalChangeRef.current = false
      return
    }

    if (value !== lastSerializedRef.current && editorInstanceRef.current) {
      const parsedData = parseMarkdownToEditorJS(value)
      editorInstanceRef.current.isReady
        .then(() => {
          editorInstanceRef.current?.blocks.render(parsedData)
          lastSerializedRef.current = value
        })
        .catch((err) => {
          console.error('EditorJS was not ready for external update:', err)
        })
    }
  }, [value])

  // Key Event Remap Listener (Enter -> Shift+Enter, Ctrl+Enter -> Enter)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Enter') {
        if (!e.ctrlKey && !e.shiftKey) {
          // Normal Enter -> insert line break inside the current block
          e.preventDefault()
          e.stopPropagation()
          document.execCommand('insertLineBreak')
        } else if (e.ctrlKey) {
          // Ctrl + Enter -> create and focus a new paragraph block below
          e.preventDefault()
          e.stopPropagation()

          const editorInstance = editorInstanceRef.current
          if (editorInstance) {
            try {
              const index = editorInstance.blocks.getCurrentBlockIndex()
              editorInstance.blocks.insert('paragraph', { text: '' }, {}, index + 1, true)
              // Transfer focus asynchronously
              setTimeout(() => {
                try {
                  editorInstance.caret.setToBlock(index + 1, 'start')
                } catch (err) {
                  console.error('Failed to set caret to new block:', err)
                }
              }, 20)
            } catch (err) {
              console.error('Failed to programmatically insert block:', err)
            }
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown, true)
    return () => {
      container.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [activeFilePath])

  // Delegated click listener to catch wikilink clicks (both HTML anchors and raw [[Link]] text)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseClick = (e: MouseEvent): void => {
      const target = e.target as HTMLElement
      const wikilinkEl = target.closest('.wikilink')
      if (wikilinkEl) {
        e.preventDefault()
        e.stopPropagation()
        const path = wikilinkEl.getAttribute('data-path')
        if (path && onWikilinkClickRef.current) {
          onWikilinkClickRef.current(path)
        }
        return
      }

      let range: Range | null = null
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(e.clientX, e.clientY)
      } else {
        const firefoxEvent = e as MouseEvent & { rangeParent?: Node; rangeOffset?: number }
        if (firefoxEvent.rangeParent !== undefined && firefoxEvent.rangeOffset !== undefined) {
          range = document.createRange()
          range.setStart(firefoxEvent.rangeParent, firefoxEvent.rangeOffset)
        }
      }

      if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
        const textNode = range.startContainer as Text
        const offset = range.startOffset
        const text = textNode.textContent || ''

        let startIdx = -1
        for (let i = offset; i >= 0; i--) {
          if (text[i] === '[' && text[i - 1] === '[') {
            startIdx = i - 1
            break
          }
          if (text[i] === '\n' || text[i] === '\r') break
        }

        if (startIdx !== -1) {
          let endIdx = -1
          for (let i = offset; i < text.length; i++) {
            if (text[i] === ']' && text[i + 1] === ']') {
              endIdx = i + 1
              break
            }
            if (text[i] === '\n' || text[i] === '\r') break
          }

          if (endIdx !== -1) {
            const wikilinkContent = text.substring(startIdx + 2, endIdx - 1)
            const parts = wikilinkContent.split('|')
            const path = parts[0].trim()
            if (path && onWikilinkClickRef.current) {
              e.preventDefault()
              e.stopPropagation()
              onWikilinkClickRef.current(path)
            }
          }
        }
      }
    }

    container.addEventListener('click', handleMouseClick, true)
    return () => {
      container.removeEventListener('click', handleMouseClick, true)
    }
  }, [])

  return (
    <div className="block-editor-container">
      <div id="editorjs-container" ref={containerRef} />
    </div>
  )
}
