import { forwardRef, useEffect } from 'react'
import { FrameSettings } from '@/routes/index'

interface FrameCanvasProps {
  imageUrl: string | null
  frameSettings: FrameSettings
}

export const FrameCanvas = forwardRef<HTMLCanvasElement, FrameCanvasProps>(
  ({ imageUrl, frameSettings }, ref) => {
    useEffect(() => {
      const canvas = (ref as React.RefObject<HTMLCanvasElement>)?.current
      if (!canvas || !imageUrl) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        const { frameWidth, frameColor, bottomText, textColor, textSize } = frameSettings

        // Calculate dimensions
        const imageWidth = img.width
        const imageHeight = img.height
        // Add extra space at bottom for text if text is provided
        const textAreaHeight = bottomText ? frameWidth : 0

        // Canvas dimensions: image + frame on all sides + extra text area at bottom
        const canvasWidth = imageWidth + frameWidth * 2
        const canvasHeight = imageHeight + frameWidth * 2 + textAreaHeight

        // Set canvas size
        canvas.width = canvasWidth
        canvas.height = canvasHeight

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight)

        // Draw frame background (all sides)
        ctx.fillStyle = frameColor
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)

        // Draw image in center
        const imageX = frameWidth
        const imageY = frameWidth
        ctx.drawImage(img, imageX, imageY, imageWidth, imageHeight)

        // Draw bottom text if provided
        if (bottomText) {
          // Center text vertically in the bottom text area
          const textY = canvasHeight - textAreaHeight / 2
          ctx.fillStyle = textColor
          ctx.font = `${textSize}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(bottomText, canvasWidth / 2, textY)
        }
      }

      img.src = imageUrl

      return () => {
        // Cleanup if needed
      }
    }, [imageUrl, frameSettings, ref])

    return (
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={ref}
          className="max-w-full h-auto shadow-lg"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        />
        {!imageUrl && (
          <p className="text-muted-foreground text-sm">
            Upload an image to get started
          </p>
        )}
      </div>
    )
  }
)

FrameCanvas.displayName = 'FrameCanvas'

