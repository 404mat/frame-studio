import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { FrameCanvas } from '@/components/FrameCanvas'
import { FrameControls } from '@/components/FrameControls'

export const Route = createFileRoute('/')({ component: App })

export type FrameSettings = {
  frameWidth: number
  frameColor: string
  bottomText: string
  textColor: string
  textSize: number
}

export type Preset = {
  name: string
  frameWidth: number
  frameColor: string
  bottomText: string
  textColor: string
}

const DEFAULT_SETTINGS: FrameSettings = {
  frameWidth: 40,
  frameColor: '#ffffff',
  bottomText: '',
  textColor: '#000000',
  textSize: 24,
}

const PRESETS: Preset[] = [
  {
    name: 'Classic White',
    frameWidth: 40,
    frameColor: '#ffffff',
    bottomText: '',
    textColor: '#000000',
  },
  {
    name: 'Vintage Brown',
    frameWidth: 50,
    frameColor: '#8B6F47',
    bottomText: '',
    textColor: '#ffffff',
  },
  {
    name: 'Black & White',
    frameWidth: 45,
    frameColor: '#000000',
    bottomText: '',
    textColor: '#ffffff',
  },
  {
    name: 'Colorful',
    frameWidth: 35,
    frameColor: '#FF6B9D',
    bottomText: '',
    textColor: '#ffffff',
  },
]

function App() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [frameSettings, setFrameSettings] = useState<FrameSettings>(DEFAULT_SETTINGS)
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Handle image upload
  const handleImageUpload = (file: File) => {
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImageUrl(url)
  }

  // Handle preset selection
  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset.name)
    setFrameSettings({
      ...preset,
      textSize: DEFAULT_SETTINGS.textSize,
    })
  }

  // Handle manual settings change - clear preset selection
  const handleFrameSettingsChange = (settings: FrameSettings) => {
    setFrameSettings(settings)
    setSelectedPreset('')
  }

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-medium">Polaroid Frame Studio</h1>
      </header>
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Controls */}
        <div className="w-80 border-r overflow-y-auto p-6">
          <FrameControls
            imageFile={imageFile}
            onImageUpload={handleImageUpload}
            frameSettings={frameSettings}
            onFrameSettingsChange={handleFrameSettingsChange}
            presets={PRESETS}
            onPresetSelect={handlePresetSelect}
            selectedPreset={selectedPreset}
            canvasRef={canvasRef}
          />
        </div>
        {/* Right Column: Canvas Preview */}
        <div className="flex-1 flex items-center justify-center p-6 bg-muted/30 overflow-auto">
          <FrameCanvas
            ref={canvasRef}
            imageUrl={imageUrl}
            frameSettings={frameSettings}
          />
        </div>
      </div>
    </div>
  )
}
