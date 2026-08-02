import React, { useEffect, useRef, useState } from 'react'

interface BannerPickerProps {
  onSelect: (banner: string) => void
  onClose: () => void
}

type TabType = 'gallery' | 'upload' | 'link'

const gradientPresets = [
  { name: 'Deep Purple', style: 'linear-gradient(135deg, #2e1065 0%, #1e1b4b 50%, #0f172a 100%)' },
  { name: 'Midnight Ocean', style: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' },
  { name: 'Emerald Forest', style: 'linear-gradient(135deg, #064e3b, #022c22, #0f172a)' },
  { name: 'Sunset Glow', style: 'linear-gradient(135deg, #831843, #701a75, #312e81)' },
  { name: 'Cyber Neon', style: 'linear-gradient(135deg, #4c1d95, #c026d3, #2563eb)' },
  { name: 'Solar Flare', style: 'linear-gradient(135deg, #7c2d12, #9a3412, #451a03)' }
]

const imagePresets = [
  {
    name: 'Abstract Dark Mesh',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Minimal Mountains',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Gradient Waves',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Japanese Wave',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80'
  }
]

export default function BannerPicker({ onSelect, onClose }: BannerPickerProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<TabType>('gallery')
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
        <div className="banner-picker-tabs">
          <button
            className={`banner-tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
            onClick={(): void => setActiveTab('gallery')}
          >
            Gallery
          </button>
          <button
            className={`banner-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={(): void => setActiveTab('upload')}
          >
            Upload
          </button>
          <button
            className={`banner-tab-btn ${activeTab === 'link' ? 'active' : ''}`}
            onClick={(): void => setActiveTab('link')}
          >
            Link
          </button>
        </div>
        <button className="banner-picker-close-btn" onClick={onClose}>
          &times;
        </button>
      </div>

      <div className="banner-picker-body">
        {activeTab === 'gallery' && (
          <div className="banner-gallery-section flex flex-col gap-3">
            <div>
              <div className="banner-picker-section-title">Gradients</div>
              <div className="banner-picker-grid">
                {gradientPresets.map((preset) => (
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
            </div>

            <div>
              <div className="banner-picker-section-title">Unsplash Covers</div>
              <div className="banner-picker-grid">
                {imagePresets.map((img) => (
                  <button
                    key={img.name}
                    className="banner-picker-preset-btn"
                    style={{ background: `url(${img.url}) center/cover no-repeat` }}
                    title={img.name}
                    onClick={(): void => {
                      onSelect(img.url)
                      onClose()
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="banner-upload-section flex flex-col gap-2 py-2">
            <div className="banner-picker-section-title">Upload Image File</div>
            <label className="banner-picker-upload-label">
              <span>Choose Image...</span>
              <input
                type="file"
                accept="image/*"
                className="banner-picker-file-input"
                onChange={handleFileUpload}
              />
            </label>
            <span className="text-[10px] text-zinc-500 text-center">
              Recommended size: 1500 x 300 px
            </span>
          </div>
        )}

        {activeTab === 'link' && (
          <div className="banner-link-section py-2 flex flex-col gap-2">
            <div className="banner-picker-section-title">Image Web Address</div>
            <form onSubmit={handleUrlSubmit} className="banner-picker-url-form">
              <input
                type="text"
                className="banner-picker-url-input"
                placeholder="Paste image URL..."
                value={customUrl}
                onChange={(e): void => setCustomUrl(e.target.value)}
              />
              <button type="submit" className="banner-picker-url-submit-btn">
                Submit
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
