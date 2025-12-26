import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { FrameCanvas } from '@/components/FrameCanvas'
import { FrameControls } from '@/components/FrameControls'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Upload, Settings } from 'lucide-react'

export const Route = createFileRoute('/')({ component: App })

export type FrameSettings = {
  frameWidth: number // percentage of image size (0-100)
  frameColor: string
  bottomText: string
  textColor: string
}

export type Preset = {
  name: string
  frameWidth: number // percentage
  frameColor: string
  bottomText: string
  textColor: string
}

const DEFAULT_SETTINGS: FrameSettings = {
  frameWidth: 8, // 8% of image size
  frameColor: '#ffffff',
  bottomText: '',
  textColor: '#000000',
}

const PRESETS: Preset[] = [
  {
    name: 'Classic White',
    frameWidth: 8,
    frameColor: '#ffffff',
    bottomText: '',
    textColor: '#000000',
  },
  {
    name: 'Vintage Brown',
    frameWidth: 10,
    frameColor: '#8B6F47',
    bottomText: '',
    textColor: '#ffffff',
  },
  {
    name: 'Black & White',
    frameWidth: 9,
    frameColor: '#000000',
    bottomText: '',
    textColor: '#ffffff',
  },
  {
    name: 'Colorful',
    frameWidth: 7,
    frameColor: '#FF6B9D',
    bottomText: '',
    textColor: '#ffffff',
  },
]

type CanvasBackground = 'white' | 'grey' | 'black'

function App() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [frameSettings, setFrameSettings] =
    useState<FrameSettings>(DEFAULT_SETTINGS)
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [canvasBackground, setCanvasBackground] =
    useState<CanvasBackground>('grey')
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
    setFrameSettings(preset)
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

  const handleExport = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (!blob) return

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `polaroid-frame-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-medium">Frame Studio</h1>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="sm">
                <Settings className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setCanvasBackground('white')}
                data-selected={canvasBackground === 'white'}
              >
                White
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCanvasBackground('grey')}
                data-selected={canvasBackground === 'grey'}
              >
                Grey
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCanvasBackground('black')}
                data-selected={canvasBackground === 'black'}
              >
                Black
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleUploadClick} variant="outline" size="sm">
            <Upload className="size-4" />
            {imageFile ? 'Change Image' : 'Upload Image'}
          </Button>
          <Button onClick={handleExport} disabled={!imageFile} size="sm">
            Export
          </Button>
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Controls */}
        <div className="w-80 border-r overflow-y-auto p-6">
          <FrameControls
            frameSettings={frameSettings}
            onFrameSettingsChange={handleFrameSettingsChange}
            presets={PRESETS}
            onPresetSelect={handlePresetSelect}
            selectedPreset={selectedPreset}
          />
        </div>
        {/* Right Column: Canvas Preview */}
        <div
          className={`flex-1 flex items-center justify-center p-6 overflow-auto ${
            canvasBackground === 'white'
              ? 'bg-white'
              : canvasBackground === 'black'
                ? 'bg-black'
                : 'bg-muted/30'
          }`}
        >
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
