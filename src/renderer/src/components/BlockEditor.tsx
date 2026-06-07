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

interface BlockEditorProps {
  value: string
  onChange: (value: string) => void
  activeFilePath: string
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
  if (!text || !text.trim()) {
    return {
      blocks: [
        {
          type: 'paragraph',
          data: { text: '' }
        }
      ]
    }
  }

  const paragraphs = text.split(/\r?\n\r?\n/)
  const blocks: EditorJSBlock[] = []

  paragraphs.forEach((p) => {
    const trimmed = p.trim()
    if (!trimmed) return

    // Parse image first to avoid conflict with paragraphs/headings
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/)
    if (imgMatch) {
      blocks.push({
        type: 'image',
        data: {
          file: {
            url: imgMatch[2]
          },
          caption: imgMatch[1]
        }
      })
      return
    }

    if (trimmed.startsWith('### ')) {
      blocks.push({
        type: 'heading3',
        data: {
          text: trimmed.replace(/^### /, '').trim(),
          level: 3
        }
      })
    } else if (trimmed.startsWith('## ')) {
      blocks.push({
        type: 'heading2',
        data: {
          text: trimmed.replace(/^## /, '').trim(),
          level: 2
        }
      })
    } else if (trimmed.startsWith('# ')) {
      blocks.push({
        type: 'heading1',
        data: {
          text: trimmed.replace(/^# /, '').trim(),
          level: 1
        }
      })
    } else if (trimmed === '---' || trimmed === '***') {
      blocks.push({
        type: 'delimiter',
        data: {}
      })
    } else if (trimmed.startsWith('>')) {
      const lines = trimmed.split(/\r?\n/)
      const quoteLines = lines.map((line) => line.trim().replace(/^>\s*/, ''))
      blocks.push({
        type: 'quote',
        data: {
          text: quoteLines.join('<br>'),
          alignment: 'left'
        }
      })
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const lines = trimmed.split(/\r?\n/)
      const items: string[] = []
      lines.forEach((line) => {
        const lineTrimmed = line.trim()
        if (lineTrimmed.startsWith('- ')) {
          items.push(lineTrimmed.replace(/^- /, '').trim())
        } else if (lineTrimmed.startsWith('* ')) {
          items.push(lineTrimmed.replace(/^\* /, '').trim())
        } else if (lineTrimmed) {
          items.push(lineTrimmed)
        }
      })
      blocks.push({
        type: 'list',
        data: {
          style: 'unordered',
          items: items
        }
      })
    } else if (/^\d+\.\s/.test(trimmed)) {
      const lines = trimmed.split(/\r?\n/)
      const items: string[] = []
      lines.forEach((line) => {
        const lineTrimmed = line.trim()
        if (/^\d+\.\s/.test(lineTrimmed)) {
          items.push(lineTrimmed.replace(/^\d+\.\s/, '').trim())
        } else if (lineTrimmed) {
          items.push(lineTrimmed)
        }
      })
      blocks.push({
        type: 'list',
        data: {
          style: 'ordered',
          items: items
        }
      })
    } else {
      // Convert newlines in paragraph blocks to <br> so they stay in one block
      const htmlText = trimmed.replace(/\r?\n/g, '<br>')
      blocks.push({
        type: 'paragraph',
        data: {
          text: htmlText
        }
      })
    }
  })

  if (blocks.length === 0) {
    blocks.push({
      type: 'paragraph',
      data: { text: '' }
    })
  }

  return { blocks }
}

// Convert Editor.js JSON data back to Markdown
function serializeEditorJSToMarkdown(data: EditorJSData): string {
  if (!data || !data.blocks) return ''

  return data.blocks
    .map((b: EditorJSBlock) => {
      switch (b.type) {
        case 'heading1': {
          return `# ${b.data.text || ''}`
        }
        case 'heading2': {
          return `## ${b.data.text || ''}`
        }
        case 'heading3': {
          return `### ${b.data.text || ''}`
        }
        case 'header': {
          const level = b.data.level || 2
          const hashes = '#'.repeat(level)
          return `${hashes} ${b.data.text || ''}`
        }
        case 'list': {
          const items = b.data.items || []
          const prefix = b.data.style === 'ordered' ? '1. ' : '- '
          return items.map((item: string) => `${prefix}${item}`).join('\n')
        }
        case 'quote': {
          const text = b.data.text || ''
          const lines = text.replace(/<br\s*\/?>/gi, '\n').split('\n')
          return lines.map((line) => `> ${line}`).join('\n')
        }
        case 'image': {
          const url = b.data.file?.url || ''
          const caption = b.data.caption || ''
          return `![${caption}](${url})`
        }
        case 'delimiter': {
          return '---'
        }
        case 'paragraph':
        default: {
          const cleanText = b.data.text ? b.data.text.replace(/<br\s*\/?>/gi, '\n') : ''
          return cleanText
        }
      }
    })
    .join('\n\n')
}

export default function BlockEditor({
  value,
  onChange,
  activeFilePath
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
          underline: Underline as unknown as InlineToolConstructable,
          inlineCode: InlineCode as unknown as InlineToolConstructable,
          marker: Marker as unknown as InlineToolConstructable,
          quote: {
            class: Quote as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              placeholder: 'Enter a quote'
            }
          },
          delimiter: Delimiter as unknown as BlockToolConstructable,
          image: {
            class: ImageTool as unknown as BlockToolConstructable,
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
                }
              }
            }
          }
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

  return (
    <div className="block-editor-container">
      <div id="editorjs-container" ref={containerRef} />
    </div>
  )
}
