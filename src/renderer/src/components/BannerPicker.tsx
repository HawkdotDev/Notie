import React, { useEffect, useRef, useState } from 'react'

interface BannerPickerProps {
  onSelect: (banner: string) => void
  onClose: () => void
}

const presets = [
  { name: 'Deep Ocean', style: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' },
  { name: 'Forest Dark', style: 'linear-gradient(135deg, #1e3e31, #0f0f0f)' },
  { name: 'Sunset Gold', style: 'linear-gradient(135deg, #f12711, #f5af19)' },
  { name: 'Vibrant Neon', style: 'linear-gradient(135deg, #8a2387, #e94057, #f27121)' },
  { name: 'Pastel Pink', style: 'linear-gradient(135deg, #3a1c71, #d76d77, #ffaf7b)' },
  { name: 'Midnight Purple', style: 'linear-gradient(135deg, #1f1c2c, #928dab)' }
]

export default function BannerPicker({ onSelect, onClose }: BannerPickerProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [customUrl, setCustomUrl] = useState('')

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (): void => {
      if (typeof reader.result === 'string') {
        onSelect(reader.result)
        onClose()
      }
    }
    reader.readAsDataURL(file)
  }

  const handleUrlSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (customUrl.trim()) {
      onSelect(customUrl.trim())
      onClose()
    }
  }

  return (
    <div ref={containerRef} className="banner-picker-popover">
      <div className="banner-picker-header">
        <span>Select Cover Banner</span>
        <button className="banner-picker-close-btn" onClick={onClose}>
          &times;
        </button>
      </div>

      <div className="banner-picker-section-title">Gradients</div>
      <div className="banner-picker-grid">
        {presets.map((preset) => (
          <button
            key={preset.name}
            className="banner-picker-preset-btn"
            style={{ background: preset.style }}
            title={preset.name}
            onClick={(): void => {
              onSelect(preset.style)
              onClose()
            }}
          />
        ))}
      </div>

      <div className="banner-picker-divider" />

      <div className="banner-picker-section-title">Upload Image</div>
      <label className="banner-picker-upload-label">
        <span>Choose file...</span>
        <input
          type="file"
          accept="image/*"
          className="banner-picker-file-input"
          onChange={handleFileUpload}
        />
      </label>

      <div className="banner-picker-divider" />

      <div className="banner-picker-section-title">Link URL</div>
      <form onSubmit={handleUrlSubmit} className="banner-picker-url-form">
        <input
          type="text"
          className="banner-picker-url-input"
          placeholder="Paste image URL here..."
          value={customUrl}
          onChange={(e): void => setCustomUrl(e.target.value)}
        />
        <button type="submit" className="banner-picker-url-submit-btn">
          Add
        </button>
      </form>
    </div>
  )
}
