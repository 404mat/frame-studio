import { forwardRef, useEffect } from 'react';
import { FrameSettings, ExifData } from '@/routes/index';
import { getCameraLogoPath, isDarkBackground } from '@/lib/cameraLogos';
import { formatDecimal } from '@/lib/utils';

interface FrameCanvasProps {
  imageUrl: string | null;
  frameSettings: FrameSettings;
  exifData: ExifData | null;
}

// Helper functions to format EXIF data
const formatFocalLength = (focalLength?: number) => {
  if (!focalLength) return null;
  return `${formatDecimal(focalLength)}mm`;
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
  return `f/${formatDecimal(aperture)}`;
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

// Calculate relative luminance of a hex color (for contrast calculation)
const getLuminance = (hexColor: string): number => {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Apply sRGB gamma correction
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

// Get contrast-aware text color (white or black) based on background
const getContrastTextColor = (backgroundColor: string): string => {
  const luminance = getLuminance(backgroundColor);
  // Use white text on dark backgrounds, black text on light backgrounds
  return luminance > 0.179 ? '#000000' : '#ffffff';
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
          contrastAwareText,
          frameWidths,
          textEnabled,
          showShotOnText,
          showExifData,
        } = frameSettings;

        // Determine the actual text color to use
        const effectiveTextColor = contrastAwareText
          ? getContrastTextColor(frameColor)
          : textColor;

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

        // Draw camera logo image on bottom border if text is enabled
        if (textEnabled ?? false) {
          // Get the appropriate logo path based on EXIF data
          const darkBg = isDarkBackground(frameColor);
          const logoPath = getCameraLogoPath(
            exifData?.make,
            exifData?.model,
            darkBg
          );

          // Only proceed if we have a logo to show
          if (logoPath) {
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

              // Calculate logo size - use ~22% of bottom border height for main row
              const logoHeight = bottomPx * 0.22;
              const logoAspectRatio = logoImg.width / logoImg.height;
              const logoWidth = logoHeight * logoAspectRatio;

              // Set up text styling for "Shot on" text
              // Use ~1.3x multiplier to make text cap-height match logo height
              const shotOnTextSize = logoHeight * 1.3;
              ctx.font = `300 ${shotOnTextSize}px sans-serif`;
              ctx.fillStyle = effectiveTextColor;
              ctx.textBaseline = 'alphabetic';
              ctx.textAlign = 'left';

              // Calculate spacing between elements
              const spacing = logoHeight * 0.4;

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

              // Position near the top of the bottom border with padding
              // Use 15% from top as the starting point for the main row
              const bottomBorderTop = canvasHeight - bottomPx;
              const mainRowTopY = bottomBorderTop + bottomPx * 0.15;

              // Calculate baseline for text to align with logo bottom
              const mainRowBottomY = mainRowTopY + logoHeight;

              // Draw "Shot on" text if enabled
              if (showShotOnText ?? false) {
                ctx.fillStyle = effectiveTextColor;
                ctx.fillText('Shot on', groupStartX, mainRowBottomY);
              }

              // Calculate logo position
              const logoX = showShotOnText
                ? groupStartX + textWidth + spacing
                : (canvasWidth - logoWidth) / 2;
              const logoY = mainRowTopY;

              // Draw the logo
              ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

              // Draw EXIF data if enabled (as second row below main content)
              if (showExifData ?? false) {
                const exifString = formatExifString(exifData);
                if (exifString) {
                  // EXIF text is about 80% of logo height
                  const exifTextSize = logoHeight * 0.8;
                  ctx.font = `300 ${exifTextSize}px sans-serif`;
                  ctx.fillStyle = effectiveTextColor;
                  ctx.textBaseline = 'top';
                  ctx.textAlign = 'center';

                  // Position EXIF text below the main row with some spacing
                  const exifRowSpacing = logoHeight * 0.3;
                  const exifY = mainRowBottomY + exifRowSpacing;
                  const exifX = canvasWidth / 2;

                  ctx.fillText(exifString, exifX, exifY);
                }
              }
            };
            logoImg.src = logoPath;
          }
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
