/**
 * Camera logo mapping - maps EXIF make/model to webp image paths
 */

type CameraBrand = {
  // The folder name in /logos/
  folder: string;
  // Map of normalized model names to file prefixes (without _black/_white.webp)
  models: Record<string, string>;
  // Fallback brand logo file prefix
  brandLogo: string;
};

// Mapping of camera makes to their logos
// Keys are lowercase, normalized versions of EXIF Make values
const CAMERA_BRANDS: Record<string, CameraBrand> = {
  fujifilm: {
    folder: 'fujifilm',
    models: {
      // X Series - Compact
      'x100vi': 'x100vi',
      'x100v': 'x100vi', // Map older model to closest available
      // X Series - Rangefinder Style
      'x-e5': 'x-e5',
      'x-e4': 'x-e5',
      // X Series - SLR Style
      'x-h2': 'x-h2',
      'x-h2s': 'x-h2s',
      'x-t50': 'x-t50',
      'x-t5': 'x-t50',
      'x-t30 ii': 'x-t30iii',
      'x-t30iii': 'x-t30iii',
      // X Series - Compact Interchangeable
      'x-m5': 'x-m5',
      // X Series - Half Frame (concept/special)
      'x-half': 'x-half',
    },
    brandLogo: 'fujifilm_logo',
  },
  apple: {
    folder: 'apple',
    models: {
      // All iPhones map to the generic iPhone logo
      iphone: 'iphone',
    },
    brandLogo: 'apple_logo',
  },
};

/**
 * Normalize a string for matching (lowercase, trim, remove extra spaces)
 */
const normalize = (str: string): string => {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Get the camera logo path based on EXIF make/model
 * @param make - Camera make from EXIF (e.g., "FUJIFILM", "Apple")
 * @param model - Camera model from EXIF (e.g., "X100VI", "iPhone 15 Pro")
 * @param isDarkBackground - Whether the background is dark (determines white/black logo)
 * @returns Path to the logo image, or null if no matching brand found
 */
export const getCameraLogoPath = (
  make: string | undefined,
  model: string | undefined,
  isDarkBackground: boolean
): string | null => {
  if (!make) return null;

  const normalizedMake = normalize(make);
  const normalizedModel = model ? normalize(model) : '';

  // Find matching brand
  const brand = CAMERA_BRANDS[normalizedMake];
  if (!brand) return null;

  const variant = isDarkBackground ? 'white' : 'black';
  const basePath = `/logos/${brand.folder}`;

  // Try to find a matching model
  if (normalizedModel) {
    // First, try exact match
    if (brand.models[normalizedModel]) {
      return `${basePath}/${brand.models[normalizedModel]}_${variant}.webp`;
    }

    // For Apple devices, check if it contains "iphone"
    if (normalizedMake === 'apple' && normalizedModel.includes('iphone')) {
      return `${basePath}/iphone_${variant}.webp`;
    }

    // For other brands, try to find a partial match
    for (const [modelKey, fileName] of Object.entries(brand.models)) {
      if (
        normalizedModel.includes(modelKey) ||
        modelKey.includes(normalizedModel)
      ) {
        return `${basePath}/${fileName}_${variant}.webp`;
      }
    }
  }

  // Fall back to brand logo
  return `${basePath}/${brand.brandLogo}_${variant}.webp`;
};

/**
 * Calculate relative luminance of a hex color
 */
const getLuminance = (hexColor: string): number => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

/**
 * Check if a background color is dark (for choosing white vs black logo)
 */
export const isDarkBackground = (backgroundColor: string): boolean => {
  return getLuminance(backgroundColor) <= 0.179;
};
