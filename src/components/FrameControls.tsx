import { useState, useEffect } from 'react'
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
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { FrameSettings, Preset } from '@/routes/index'
import { Maximize2 } from 'lucide-react'

interface FrameControlsProps {
  frameSettings: FrameSettings
  onFrameSettingsChange: (settings: FrameSettings) => void
  presets: Preset[]
  onPresetSelect: (preset: Preset) => void
  selectedPreset: string
}

export function FrameControls({
  frameSettings,
  onFrameSettingsChange,
  presets,
  onPresetSelect,
  selectedPreset,
}: FrameControlsProps) {
  const [sliderValue, setSliderValue] = useState<number[]>([frameSettings.frameWidth])
  const [useIndividualSides, setUseIndividualSides] = useState<boolean>(
    !!frameSettings.frameWidths
  )
  const [individualValues, setIndividualValues] = useState<{
    top: number
    right: number
    bottom: number
    left: number
  }>(() => {
    if (frameSettings.frameWidths) {
      return frameSettings.frameWidths
    }
    const currentWidth = frameSettings.frameWidth
    return {
      top: currentWidth,
      right: currentWidth,
      bottom: currentWidth,
      left: currentWidth,
    }
  })

  // Sync slider value when frameSettings changes (e.g., from preset)
  useEffect(() => {
    if (frameSettings.frameWidths) {
      setIndividualValues(frameSettings.frameWidths)
      setUseIndividualSides(true)
    } else {
      setSliderValue([frameSettings.frameWidth])
      setUseIndividualSides(false)
      const currentWidth = frameSettings.frameWidth
      setIndividualValues({
        top: currentWidth,
        right: currentWidth,
        bottom: currentWidth,
        left: currentWidth,
      })
    }
  }, [frameSettings.frameWidth, frameSettings.frameWidths])

  const updateSetting = <K extends keyof FrameSettings>(
    key: K,
    value: FrameSettings[K]
  ) => {
    onFrameSettingsChange({
      ...frameSettings,
      [key]: value,
    })
  }

  const handlePresetChange = (presetName: string | null) => {
    if (!presetName) return
    const preset = presets.find((p) => p.name === presetName)
    if (preset) {
      onPresetSelect(preset)
    }
  }

  return (
    <div className="space-y-6">
      {/* Presets */}
      <Field orientation="horizontal" className="items-center">
        <FieldLabel className="min-w-fit">
          <FieldTitle>Presets</FieldTitle>
        </FieldLabel>
        <FieldContent className="flex-1">
          <Select
            value={selectedPreset || null}
            onValueChange={handlePresetChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {selectedPreset || 'No preset selected'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.name} value={preset.name}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldContent>
      </Field>

      {/* Frame Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Frame Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {/* Frame Width */}
            <Field>
              <FieldLabel className="flex items-center justify-between">
                <FieldTitle>
                  Frame Width{' '}
                  {!useIndividualSides &&
                    `(${Math.round(sliderValue[0] ?? frameSettings.frameWidth)}%)`}
                </FieldTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    const newUseIndividual = !useIndividualSides
                    setUseIndividualSides(newUseIndividual)
                    if (newUseIndividual) {
                      // Switch to individual mode - use current frameWidth for all sides
                      const currentWidth = frameSettings.frameWidth
                      const newValues = {
                        top: currentWidth,
                        right: currentWidth,
                        bottom: currentWidth,
                        left: currentWidth,
                      }
                      setIndividualValues(newValues)
                      updateSetting('frameWidths', newValues)
                    } else {
                      // Switch to uniform mode - use average of individual values
                      const avgWidth = Math.round(
                        (individualValues.top +
                          individualValues.right +
                          individualValues.bottom +
                          individualValues.left) /
                          4
                      )
                      setSliderValue([avgWidth])
                      // Remove frameWidths property when switching to uniform mode
                      const { frameWidths: _, ...rest } = frameSettings
                      onFrameSettingsChange({
                        ...rest,
                        frameWidth: avgWidth,
                      })
                    }
                  }}
                  title={
                    useIndividualSides
                      ? 'Switch to uniform width'
                      : 'Switch to individual side widths'
                  }
                >
                  <Maximize2 className="size-3" />
                </Button>
              </FieldLabel>
              <FieldContent className="w-full">
                {!useIndividualSides ? (
                  <div className="space-y-2 w-full">
                    <div className="w-full">
                      <Slider
                        value={sliderValue}
                        onValueChange={(value) => {
                          // base-ui passes array directly when value is array
                          const newValues = Array.isArray(value) ? value : [value]
                          const roundedValue = Math.round(newValues[0] ?? 0)
                          setSliderValue([roundedValue])
                          // Remove frameWidths property when updating uniform width
                          const { frameWidths: _, ...rest } = frameSettings
                          onFrameSettingsChange({
                            ...rest,
                            frameWidth: roundedValue,
                          })
                        }}
                        min={0}
                        max={50}
                        step={1}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground px-1">
                      <span>0%</span>
                      <span>50%</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 w-full">
                    {/* Top */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Top</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(individualValues.top)}%
                        </span>
                      </div>
                      <Slider
                        value={[individualValues.top]}
                        onValueChange={(value) => {
                          const newValue = Math.round(
                            Array.isArray(value) ? value[0] ?? 0 : value
                          )
                          const newValues = { ...individualValues, top: newValue }
                          setIndividualValues(newValues)
                          updateSetting('frameWidths', newValues)
                        }}
                        min={0}
                        max={50}
                        step={1}
                      />
                    </div>
                    {/* Right */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Right</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(individualValues.right)}%
                        </span>
                      </div>
                      <Slider
                        value={[individualValues.right]}
                        onValueChange={(value) => {
                          const newValue = Math.round(
                            Array.isArray(value) ? value[0] ?? 0 : value
                          )
                          const newValues = { ...individualValues, right: newValue }
                          setIndividualValues(newValues)
                          updateSetting('frameWidths', newValues)
                        }}
                        min={0}
                        max={50}
                        step={1}
                      />
                    </div>
                    {/* Bottom */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Bottom</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(individualValues.bottom)}%
                        </span>
                      </div>
                      <Slider
                        value={[individualValues.bottom]}
                        onValueChange={(value) => {
                          const newValue = Math.round(
                            Array.isArray(value) ? value[0] ?? 0 : value
                          )
                          const newValues = { ...individualValues, bottom: newValue }
                          setIndividualValues(newValues)
                          updateSetting('frameWidths', newValues)
                        }}
                        min={0}
                        max={50}
                        step={1}
                      />
                    </div>
                    {/* Left */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Left</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(individualValues.left)}%
                        </span>
                      </div>
                      <Slider
                        value={[individualValues.left]}
                        onValueChange={(value) => {
                          const newValue = Math.round(
                            Array.isArray(value) ? value[0] ?? 0 : value
                          )
                          const newValues = { ...individualValues, left: newValue }
                          setIndividualValues(newValues)
                          updateSetting('frameWidths', newValues)
                        }}
                        min={0}
                        max={50}
                        step={1}
                      />
                    </div>
                  </div>
                )}
              </FieldContent>
            </Field>

            {/* Frame Color */}
            <Field>
              <FieldLabel>
                <FieldTitle>Frame Color</FieldTitle>
              </FieldLabel>
              <FieldContent>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={frameSettings.frameColor === '#000000' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('frameColor', '#000000')}
                      className="flex-1"
                    >
                      Black
                    </Button>
                    <Button
                      type="button"
                      variant={frameSettings.frameColor === '#ffffff' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('frameColor', '#ffffff')}
                      className="flex-1"
                    >
                      White
                    </Button>
                    <Button
                      type="button"
                      variant={frameSettings.frameColor === '#808080' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('frameColor', '#808080')}
                      className="flex-1"
                    >
                      Gray
                    </Button>
                  </div>
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
                </div>
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Text Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Text Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
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
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}

