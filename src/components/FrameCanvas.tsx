import { forwardRef, useEffect } from 'react';
import { FrameSettings, ExifData } from '@/routes/index';

interface FrameCanvasProps {
  imageUrl: string | null;
  frameSettings: FrameSettings;
  exifData: ExifData | null;
}

// Helper functions to format EXIF data
const formatFocalLength = (focalLength?: number) => {
  if (!focalLength) return null;
  return `${focalLength}mm`;
};

const formatShutterSpeed = (shutterSpeed?: number) => {
  if (!shutterSpeed) return null;
  if (shutterSpeed >= 1) {
    return `${shutterSpeed}s`;
  }
  return `1/${Math.round(1 / shutterSpeed)}`;
};

const formatAperture = (aperture?: number) => {
  if (!aperture) return null;
  return `f/${aperture}`;
};

const formatISO = (iso?: number) => {
  if (!iso) return null;
  return `ISO${iso}`;
};

const formatExifString = (exifData: ExifData | null): string | null => {
  if (!exifData) return null;

  const parts = [
    formatFocalLength(exifData.focalLength),
    formatAperture(exifData.aperture),
    formatShutterSpeed(exifData.shutterSpeed),
    formatISO(exifData.iso),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join('  ') : null;
};

export const FrameCanvas = forwardRef<HTMLCanvasElement, FrameCanvasProps>(
  ({ imageUrl, frameSettings, exifData }, ref) => {
    useEffect(() => {
      const canvas = (ref as React.RefObject<HTMLCanvasElement>)?.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas when no image
      if (!imageUrl) {
        canvas.width = 0;
        canvas.height = 0;
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const {
          frameWidth,
          frameColor,
          textColor,
          frameWidths,
          textEnabled,
          showShotOnText,
          showExifData,
        } = frameSettings;

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

        // Canvas dimensions: image + frame on all sides
        const canvasWidth = imageWidth + leftPx + rightPx;
        const canvasHeight = imageHeight + topPx + bottomPx;

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

        // Draw x100vi image on bottom border if text is enabled
        if (textEnabled ?? false) {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          logoImg.onload = () => {
            // Redraw everything to ensure the logo appears correctly
            // Clear canvas
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            // Draw frame background (all sides)
            ctx.fillStyle = frameColor;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Draw image in center (accounting for individual frame widths)
            ctx.drawImage(img, imageX, imageY, imageWidth, imageHeight);

            // Calculate logo size - make it proportional to the bottom border height
            // Use about 60% of the bottom border height for the logo
            const logoHeight = bottomPx * 0.6;
            const logoAspectRatio = logoImg.width / logoImg.height;
            const logoWidth = logoHeight * logoAspectRatio;

            // Set up text styling for "Shot on" text
            // Make text size proportional to logo height for better visibility
            const shotOnTextSize = Math.max(16, Math.min(60, logoHeight * 0.4));
            ctx.font = `${shotOnTextSize}px sans-serif`;
            ctx.fillStyle = textColor;
            ctx.textBaseline = 'bottom'; // Use 'bottom' to align with logo bottom
            ctx.textAlign = 'left';

            // Calculate spacing between text and logo
            const spacing = bottomPx * 0.1;

            let totalWidth = 0;
            let textWidth = 0;

            if (showShotOnText ?? false) {
              // Measure "Shot on" text width
              textWidth = ctx.measureText('Shot on').width;
              totalWidth = textWidth + spacing + logoWidth;
            } else {
              totalWidth = logoWidth;
            }

            // Calculate starting X position to center the group
            const groupStartX = (canvasWidth - totalWidth) / 2;

            // Calculate bottom alignment Y position - position in lower portion of bottom border
            // Position it at about 80% down from the top of the bottom border
            const bottomBorderTop = canvasHeight - bottomPx;
            const bottomAlignY = bottomBorderTop + bottomPx * 0.8;

            // Draw "Shot on" text if enabled
            if (showShotOnText ?? false) {
              // Ensure text is visible by setting fill style again
              ctx.fillStyle = textColor;
              ctx.fillText('Shot on', groupStartX, bottomAlignY);
            }

            // Calculate logo position
            const logoX = showShotOnText
              ? groupStartX + textWidth + spacing
              : (canvasWidth - logoWidth) / 2;
            // Position logo so its bottom edge aligns with text bottom
            const logoY = bottomAlignY - logoHeight;

            // Draw the logo
            ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

            // Draw EXIF data if enabled
            if (showExifData ?? false) {
              const exifString = formatExifString(exifData);
              if (exifString) {
                // Use a smaller font size for EXIF text
                const exifTextSize = Math.max(12, Math.min(40, logoHeight * 0.3));
                ctx.font = `${exifTextSize}px sans-serif`;
                ctx.fillStyle = textColor;
                ctx.textBaseline = 'top';
                ctx.textAlign = 'center';

                // Position EXIF text below the logo with some spacing
                const exifY = bottomAlignY + bottomPx * 0.05;
                const exifX = canvasWidth / 2;

                ctx.fillText(exifString, exifX, exifY);
              }
            }
          };
          logoImg.src = '/logos/fujifilm/x100vi.webp';
        }
      };

      img.src = imageUrl;

      return () => {
        // Cleanup if needed
      };
    }, [imageUrl, frameSettings, exifData, ref]);

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
