import React from 'react'
import {
  FileCode,
  FileCode2,
  FileJson,
  FileText,
  FileImage,
  Database,
  Terminal,
  Globe,
  Boxes,
  Flame,
  FileCheck,
  Atom,
  Palette,
  Sliders,
  Cpu,
  Zap,
  Binary,
  Coffee,
  Server,
  Gem,
  GitBranch
} from 'lucide-react'

export function ProfessionalFileIcon({
  fileName,
  className = ''
}: {
  fileName: string
  className?: string
}): React.JSX.Element {
  const name = fileName.toLowerCase()
  const ext = name.split('.').pop() || ''

  // Special exact filename matches
  if (name === 'package.json') {
    return <Boxes size={13} fill="currentColor" className={`text-rose-500 shrink-0 ${className}`} />
  }
  if (name.startsWith('tsconfig') && name.endsWith('.json')) {
    return (
      <FileCheck size={13} fill="currentColor" className={`text-blue-400 shrink-0 ${className}`} />
    )
  }
  if (name === 'dockerfile' || name.startsWith('dockerfile.')) {
    return <Flame size={13} fill="currentColor" className={`text-sky-400 shrink-0 ${className}`} />
  }
  if (name.startsWith('.git') || name === '.gitignore') {
    return (
      <GitBranch
        size={13}
        fill="currentColor"
        className={`text-orange-500 shrink-0 ${className}`}
      />
    )
  }
  if (name.startsWith('.env')) {
    return (
      <Sliders size={13} fill="currentColor" className={`text-pink-400 shrink-0 ${className}`} />
    )
  }

  // Extension based mapping using detailed solid Lucide icons
  switch (ext) {
    // TypeScript & React
    case 'ts':
    case 'cts':
    case 'mts':
      return (
        <FileCode2
          size={13}
          fill="currentColor"
          className={`text-blue-400 shrink-0 ${className}`}
        />
      )
    case 'tsx':
      return <Atom size={13} fill="currentColor" className={`text-sky-400 shrink-0 ${className}`} />

    // JavaScript & React
    case 'js':
    case 'mjs':
    case 'cjs':
      return (
        <FileCode
          size={13}
          fill="currentColor"
          className={`text-amber-400 shrink-0 ${className}`}
        />
      )
    case 'jsx':
      return (
        <Atom size={13} fill="currentColor" className={`text-amber-500 shrink-0 ${className}`} />
      )

    // Web Markup & Styling
    case 'html':
    case 'htm':
    case 'xhtml':
      return (
        <Globe size={13} fill="currentColor" className={`text-orange-400 shrink-0 ${className}`} />
      )
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return (
        <Palette size={13} fill="currentColor" className={`text-cyan-400 shrink-0 ${className}`} />
      )
    case 'vue':
      return (
        <Boxes size={13} fill="currentColor" className={`text-emerald-400 shrink-0 ${className}`} />
      )
    case 'svelte':
      return (
        <Flame size={13} fill="currentColor" className={`text-orange-600 shrink-0 ${className}`} />
      )

    // Python & Data Science
    case 'py':
    case 'pyw':
    case 'ipynb':
      return (
        <FileCode2
          size={13}
          fill="currentColor"
          className={`text-emerald-400 shrink-0 ${className}`}
        />
      )

    // Config & Data Formats
    case 'json':
    case 'jsonc':
    case 'json5':
      return (
        <FileJson
          size={13}
          fill="currentColor"
          className={`text-amber-400 shrink-0 ${className}`}
        />
      )
    case 'yaml':
    case 'yml':
    case 'toml':
    case 'ini':
    case 'conf':
    case 'cfg':
    case 'xml':
      return (
        <Sliders size={13} fill="currentColor" className={`text-zinc-400 shrink-0 ${className}`} />
      )

    // Documentation & Plain Text
    case 'md':
    case 'mdx':
    case 'markdown':
      return (
        <FileText size={14} strokeWidth={1.5} className={`text-zinc-400 shrink-0 ${className}`} />
      )
    case 'txt':
    case 'log':
    case 'rst':
    case 'doc':
    case 'docx':
      return (
        <FileText size={14} strokeWidth={1.5} className={`text-zinc-400 shrink-0 ${className}`} />
      )

    // Systems Languages
    case 'rs':
      return (
        <Cpu size={13} fill="currentColor" className={`text-orange-500 shrink-0 ${className}`} />
      )
    case 'go':
      return <Zap size={13} fill="currentColor" className={`text-cyan-400 shrink-0 ${className}`} />
    case 'c':
    case 'h':
      return (
        <Binary size={13} fill="currentColor" className={`text-blue-500 shrink-0 ${className}`} />
      )
    case 'cpp':
    case 'hpp':
    case 'cc':
    case 'cxx':
      return (
        <Binary size={13} fill="currentColor" className={`text-blue-600 shrink-0 ${className}`} />
      )
    case 'cs':
      return (
        <Binary size={13} fill="currentColor" className={`text-zinc-400 shrink-0 ${className}`} />
      )
    case 'java':
    case 'jar':
      return (
        <Coffee size={13} fill="currentColor" className={`text-rose-500 shrink-0 ${className}`} />
      )
    case 'kt':
    case 'kts':
      return (
        <Coffee size={13} fill="currentColor" className={`text-violet-500 shrink-0 ${className}`} />
      )
    case 'php':
      return (
        <Server size={13} fill="currentColor" className={`text-indigo-400 shrink-0 ${className}`} />
      )
    case 'rb':
      return <Gem size={13} fill="currentColor" className={`text-rose-600 shrink-0 ${className}`} />
    case 'swift':
      return (
        <Zap size={13} fill="currentColor" className={`text-orange-400 shrink-0 ${className}`} />
      )

    // Shell Scripts & Executables
    case 'sh':
    case 'bash':
    case 'zsh':
    case 'fish':
    case 'ps1':
    case 'bat':
    case 'cmd':
    case 'exe':
      return (
        <Terminal
          size={13}
          fill="currentColor"
          className={`text-emerald-400 shrink-0 ${className}`}
        />
      )

    // Database & Queries
    case 'sql':
    case 'db':
    case 'sqlite':
    case 'graphql':
    case 'gql':
    case 'prisma':
      return (
        <Database
          size={13}
          fill="currentColor"
          className={`text-emerald-400 shrink-0 ${className}`}
        />
      )

    // Media & Binary Files
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'ico':
    case 'svg':
      return (
        <FileImage
          size={13}
          fill="currentColor"
          className={`text-indigo-400 shrink-0 ${className}`}
        />
      )

    // Default Minimal Solid Document Icon Fallback
    default:
      return (
        <FileText size={14} strokeWidth={1.5} className={`text-zinc-400 shrink-0 ${className}`} />
      )
  }
}

export function WorkspaceIcon({
  name,
  icon,
  size = 18,
  className = ''
}: {
  name: string
  icon?: string
  size?: number
  className?: string
}): React.JSX.Element {
  if (icon && icon.trim()) {
    return (
      <div
        className={`workspace-unique-badge flex items-center justify-center select-none ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          fontSize: `${Math.max(11, Math.round(size * 0.7))}px`
        }}
        title={`Workspace: ${name || 'Workspace'}`}
      >
        <span>{icon}</span>
      </div>
    )
  }

  const initial = (name && name.trim() ? name.trim()[0] : 'W').toUpperCase()
  return (
    <div
      className={`workspace-unique-badge flex items-center justify-center font-bold select-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        fontSize: `${Math.max(9, Math.round(size * 0.52))}px`
      }}
      title={`Workspace: ${name || 'Workspace'}`}
    >
      <span>{initial}</span>
    </div>
  )
}
