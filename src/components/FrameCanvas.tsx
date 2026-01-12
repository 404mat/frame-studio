import { forwardRef, useEffect } from 'react';
import { FrameSettings } from '@/routes/index';

interface FrameCanvasProps {
  imageUrl: string | null;
  frameSettings: FrameSettings;
}

export const FrameCanvas = forwardRef<HTMLCanvasElement, FrameCanvasProps>(
  ({ imageUrl, frameSettings }, ref) => {
    useEffect(() => {
      const canvas = (ref as React.RefObject<HTMLCanvasElement>)?.current;
      if (!canvas || !imageUrl) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const { frameWidth, frameColor, bottomText, textColor, frameWidths } =
          frameSettings;

        // Calculate dimensions
        const imageWidth = img.width;
        const imageHeight = img.height;

        // Calculate frame widths in pixels from percentage
        // Use average of width and height to maintain consistent frame size
        const avgImageSize = (imageWidth + imageHeight) / 2;

        let topPx: number;
        let rightPx: number;
        let bottomPx: number;
        let leftPx: number;

        if (frameWidths) {
          // Use individual side widths
          topPx = (avgImageSize * frameWidths.top) / 100;
          rightPx = (avgImageSize * frameWidths.right) / 100;
          bottomPx = (avgImageSize * frameWidths.bottom) / 100;
          leftPx = (avgImageSize * frameWidths.left) / 100;
        } else {
          // Use uniform frame width
          const frameWidthPx = (avgImageSize * frameWidth) / 100;
          topPx = rightPx = bottomPx = leftPx = frameWidthPx;
        }

        // Auto-calculate text size based on average frame width (scale proportionally)
        // Base text size is about 30% of frame width, with min/max bounds
        const avgFrameWidth = (topPx + rightPx + bottomPx + leftPx) / 4;
        const textSize = Math.max(12, Math.min(72, avgFrameWidth * 0.3));

        // Add extra space at bottom for text if text is provided
        const textAreaHeight = bottomText ? bottomPx : 0;

        // Canvas dimensions: image + frame on all sides + extra text area at bottom
        const canvasWidth = imageWidth + leftPx + rightPx;
        const canvasHeight = imageHeight + topPx + bottomPx + textAreaHeight;

        // Set canvas size
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw frame background (all sides)
        ctx.fillStyle = frameColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw image in center (accounting for individual frame widths)
        const imageX = leftPx;
        const imageY = topPx;
        ctx.drawImage(img, imageX, imageY, imageWidth, imageHeight);

        // Draw bottom text if provided
        if (bottomText) {
          // Center text vertically in the bottom text area
          const textY = canvasHeight - textAreaHeight / 2;
          ctx.fillStyle = textColor;
          ctx.font = `${textSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(bottomText, canvasWidth / 2, textY);
        }
      };

      img.src = imageUrl;

      return () => {
        // Cleanup if needed
      };
    }, [imageUrl, frameSettings, ref]);

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
    );
  }
);

FrameCanvas.displayName = 'FrameCanvas';
