import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { FrameCanvas } from '@/components/FrameCanvas';
import { FrameControls } from '@/components/FrameControls';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Upload, Settings, RotateCcw } from 'lucide-react';
import exifr from 'exifr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import {
  saveImageToStorage,
  loadImageFromStorage,
  clearImageFromStorage,
} from '@/lib/storage';
import { formatDecimal } from '@/lib/utils';

export type FrameSettings = {
  frameWidth: number; // percentage of image size (0-100)
  frameColor: string;
  textColor: string;
  contrastAwareText?: boolean; // auto-select white/black text based on background
  textEnabled?: boolean; // whether to show camera logo image on bottom border
  showShotOnText?: boolean; // whether to show "Shot on" text before logo
  showExifData?: boolean; // whether to show EXIF data under the logo
  // Individual side widths (optional, overrides frameWidth when set)
  frameWidths?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

export type Preset = {
  name: string;
  frameWidth?: number; // percentage (optional if frameWidths is provided)
  frameColor: string;
  textColor: string;
  contrastAwareText?: boolean;
  textEnabled?: boolean;
  showShotOnText?: boolean;
  showExifData?: boolean;
  frameWidths?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

const DEFAULT_SETTINGS: FrameSettings = {
  frameWidth: 8, // 8% of image size
  frameColor: '#ffffff',
  textColor: '#000000',
  contrastAwareText: true,
  textEnabled: false,
  showShotOnText: false,
  showExifData: false,
};

const PRESETS: Preset[] = [
  {
    name: 'Classic White',
    frameWidth: 4,
    frameColor: '#ffffff',
    textColor: '#000000',
  },
  {
    name: 'Black & White',
    frameWidth: 4,
    frameColor: '#000000',
    textColor: '#ffffff',
  },
  {
    name: 'Black Bottom Info',
    frameWidths: {
      top: 2,
      right: 2,
      bottom: 12,
      left: 2,
    },
    frameColor: '#000000',
    textColor: '#ffffff',
    contrastAwareText: true,
    textEnabled: true,
    showShotOnText: true,
    showExifData: true,
  },
];

type CanvasBackground = 'white' | 'grey' | 'black';

export type ExifData = {
  make?: string;
  model?: string;
  focalLength?: number;
  iso?: number;
  shutterSpeed?: number;
  aperture?: number;
};

// Quirky loading phrases for export dialog
const LOADING_PHRASES = [
  'Developing your masterpiece...',
  'Adding that vintage charm...',
  'Framing memories, one pixel at a time...',
  'Channeling your inner photographer...',
  'Making it look like it was shot on film...',
  'Polishing those polaroid vibes...',
  'Capturing the moment, literally...',
  'Adding that analog magic...',
  'Framing perfection...',
  'Making memories tangible...',
  'Preserving this moment forever...',
  'Adding the perfect border...',
  'Creating art from pixels...',
  'Making it Instagram-worthy...',
  'Framing your story...',
];

function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [frameSettings, setFrameSettings] = useLocalStorage<FrameSettings>(
    'frame-studio-settings',
    DEFAULT_SETTINGS
  );
  const [selectedPreset, setSelectedPreset] = useLocalStorage<string>(
    'frame-studio-preset',
    ''
  );
  const [canvasBackground, setCanvasBackground] =
    useLocalStorage<CanvasBackground>('frame-studio-background', 'grey');
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Rotate loading phrases at intervals
  useEffect(() => {
    if (!exportLoading) return;

    // Set initial phrase
    setLoadingPhrase(
      LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]
    );

    // Change phrase every 2 seconds
    const interval = setInterval(() => {
      setLoadingPhrase(
        LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [exportLoading]);

  // Handle image upload
  const handleImageUpload = useCallback(
    async (file: File) => {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      // Extract EXIF data
      extractExifData(file);
      // Save to IndexedDB for persistence
      try {
        await saveImageToStorage(file, file.name);
      } catch (error) {
        console.error('Failed to save image to storage:', error);
      }
    },
    [setImageFile, setImageUrl]
  );

  // Load stored image on mount
  useEffect(() => {
    const loadStoredImage = async () => {
      try {
        const storedImage = await loadImageFromStorage();
        if (storedImage) {
          // Create a File object from the blob
          const file = new File([storedImage.blob], storedImage.fileName, {
            type: storedImage.blob.type,
          });
          setImageFile(file);
          const url = URL.createObjectURL(storedImage.blob);
          setImageUrl(url);
          // Extract EXIF data from restored image
          extractExifData(file);
        }
      } catch (error) {
        console.error('Failed to load stored image:', error);
        // Clear invalid stored data
        await clearImageFromStorage();
      }
    };

    loadStoredImage();
  }, []);

  // Extract EXIF data from image file
  const extractExifData = async (file: File) => {
    try {
      const exif = await exifr.parse(file, [
        'Make',
        'Model',
        'FocalLength',
        'ISO',
        'ExposureTime',
        'FNumber',
      ]);

      if (exif) {
        setExifData({
          make: exif.Make,
          model: exif.Model,
          focalLength: exif.FocalLength,
          iso: exif.ISO,
          shutterSpeed: exif.ExposureTime,
          aperture: exif.FNumber,
        });
      } else {
        setExifData(null);
      }
    } catch (error) {
      console.error('Error extracting EXIF data:', error);
      setExifData(null);
    }
  };

  // Handle preset selection
  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset.name);
    // Merge preset with default settings to ensure all properties are set
    setFrameSettings({
      ...DEFAULT_SETTINGS,
      ...preset,
    });
  };

  // Handle manual settings change - clear preset selection
  const handleFrameSettingsChange = (settings: FrameSettings) => {
    setFrameSettings(settings);
    setSelectedPreset('');
  };

  // Handle reset to default settings
  const handleReset = async (clearImage: boolean = false) => {
    setFrameSettings(DEFAULT_SETTINGS);
    setCanvasBackground('grey');
    setSelectedPreset('');
    if (clearImage) {
      setImageFile(null);
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      setImageUrl(null);
      setExifData(null);
      await clearImageFromStorage();
    }
    setResetDialogOpen(false);
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageFile) return;

    // Extract original filename and add "framed" suffix
    const originalName = imageFile.name;
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const exportFilename = `${nameWithoutExt}-framed.jpg`;

    // Show loading dialog
    setExportLoading(true);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setExportLoading(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = exportFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Hide loading dialog after a short delay to ensure download starts
        setTimeout(() => {
          setExportLoading(false);
        }, 500);
      },
      'image/jpeg',
      0.92
    ); // Use JPEG with 92% quality for better file size
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await handleImageUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

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
            <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-none border border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-7 gap-1 px-2.5 text-xs font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-1 outline-none">
              <Settings className="size-3.5" />
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
        <div className="w-80 border-r overflow-y-auto p-6 space-y-6">
          {/* Reset Button */}
          <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
            <AlertDialogTrigger className="w-full h-7 gap-1 rounded-none px-2.5 border border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 text-xs font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-1 outline-none inline-flex items-center justify-center whitespace-nowrap">
              <RotateCcw className="size-3.5 mr-2" />
              Reset to Defaults
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to Default Settings?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all frame settings, text settings, and canvas
                  background to their default values. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleReset(false)}>
                  Settings Only
                </AlertDialogAction>
                <AlertDialogAction
                  onClick={() => handleReset(true)}
                  variant="destructive"
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {/* EXIF Data Card */}
          <ExifCard exifData={exifData} />
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
            exifData={exifData}
          />
        </div>
      </div>

      {/* Export Loading Dialog */}
      <Dialog open={exportLoading} onOpenChange={() => {}}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center gap-6 py-8">
            {/* Spinner */}
            <Spinner className="size-12 text-primary" />
            {/* Loading Phrase */}
            <p className="text-center text-sm text-muted-foreground min-h-6">
              {loadingPhrase}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// EXIF Data Display Component
function ExifCard({ exifData }: { exifData: ExifData | null }) {
  const formatFocalLength = (focalLength?: number) => {
    if (!focalLength) return '--';
    return `${formatDecimal(focalLength)}mm`;
  };

  const formatShutterSpeed = (shutterSpeed?: number) => {
    if (!shutterSpeed) return '--';
    if (shutterSpeed >= 1) {
      return `${shutterSpeed}s`;
    }
    return `1/${Math.round(1 / shutterSpeed)}s`;
  };

  const formatAperture = (aperture?: number) => {
    if (!aperture) return '--';
    return `f/${formatDecimal(aperture)}`;
  };

  const formatISO = (iso?: number) => {
    if (!iso) return '--';
    return `ISO ${iso}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Image Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Make:</span>{' '}
            <span className="font-medium">{exifData?.make || '--'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Model:</span>{' '}
            <span className="font-medium">{exifData?.model || '--'}</span>
          </div>
          <div className="pt-2 border-t space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Focal Length:</span>
              <span className="font-medium">
                {formatFocalLength(exifData?.focalLength)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ISO:</span>
              <span className="font-medium">{formatISO(exifData?.iso)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shutter Speed:</span>
              <span className="font-medium">
                {formatShutterSpeed(exifData?.shutterSpeed)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aperture:</span>
              <span className="font-medium">
                {formatAperture(exifData?.aperture)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute('/')({ component: App });
