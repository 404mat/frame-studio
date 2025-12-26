import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload } from 'lucide-react'
import { FrameSettings, Preset } from '@/routes/index'

interface FrameControlsProps {
  imageFile: File | null
  onImageUpload: (file: File) => void
  frameSettings: FrameSettings
  onFrameSettingsChange: (settings: FrameSettings) => void
  presets: Preset[]
  onPresetSelect: (preset: Preset) => void
  selectedPreset: string
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function FrameControls({
  imageFile,
  onImageUpload,
  frameSettings,
  onFrameSettingsChange,
  presets,
  onPresetSelect,
  selectedPreset,
  canvasRef,
}: FrameControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const updateSetting = <K extends keyof FrameSettings>(
    key: K,
    value: FrameSettings[K]
  ) => {
    onFrameSettingsChange({
      ...frameSettings,
      [key]: value,
    })
  }

  const handlePresetChange = (presetName: string) => {
    const preset = presets.find((p) => p.name === presetName)
    if (preset) {
      onPresetSelect(preset)
    }
  }

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

  return (
    <div className="space-y-6">
      {/* Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Image</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            onClick={handleUploadClick}
            variant="outline"
            className="w-full"
          >
            <Upload className="size-4" />
            {imageFile ? 'Change Image' : 'Upload Image'}
          </Button>
          {imageFile && (
            <p className="text-xs text-muted-foreground mt-2">
              {imageFile.name}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Presets</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedPreset}
            onValueChange={handlePresetChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a preset" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.name} value={preset.name}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Frame Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Frame Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {/* Frame Width */}
            <Field>
              <FieldLabel>
                <FieldTitle>Frame Width (px)</FieldTitle>
              </FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  min="0"
                  max="200"
                  value={frameSettings.frameWidth}
                  onChange={(e) =>
                    updateSetting('frameWidth', parseInt(e.target.value) || 0)
                  }
                />
              </FieldContent>
            </Field>

            {/* Frame Color */}
            <Field>
              <FieldLabel>
                <FieldTitle>Frame Color</FieldTitle>
              </FieldLabel>
              <FieldContent>
                <div className="flex gap-2 items-center">
                  <Input
                    type="color"
                    value={frameSettings.frameColor}
                    onChange={(e) => updateSetting('frameColor', e.target.value)}
                    className="w-20 h-8 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={frameSettings.frameColor}
                    onChange={(e) => updateSetting('frameColor', e.target.value)}
                    className="flex-1"
                    placeholder="#ffffff"
                  />
                </div>
              </FieldContent>
            </Field>

            {/* Bottom Text */}
            <Field>
              <FieldLabel>
                <FieldTitle>Bottom Text</FieldTitle>
              </FieldLabel>
              <FieldContent>
                <Input
                  type="text"
                  value={frameSettings.bottomText}
                  onChange={(e) => updateSetting('bottomText', e.target.value)}
                  placeholder="Enter text for bottom border"
                />
              </FieldContent>
            </Field>

            {/* Text Color */}
            <Field>
              <FieldLabel>
                <FieldTitle>Text Color</FieldTitle>
              </FieldLabel>
              <FieldContent>
                <div className="flex gap-2 items-center">
                  <Input
                    type="color"
                    value={frameSettings.textColor}
                    onChange={(e) => updateSetting('textColor', e.target.value)}
                    className="w-20 h-8 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={frameSettings.textColor}
                    onChange={(e) => updateSetting('textColor', e.target.value)}
                    className="flex-1"
                    placeholder="#000000"
                  />
                </div>
              </FieldContent>
            </Field>

            {/* Text Size */}
            <Field>
              <FieldLabel>
                <FieldTitle>Text Size (px)</FieldTitle>
              </FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  min="8"
                  max="72"
                  value={frameSettings.textSize}
                  onChange={(e) =>
                    updateSetting('textSize', parseInt(e.target.value) || 24)
                  }
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleExport}
            disabled={!imageFile}
            className="w-full"
          >
            Export Image
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

