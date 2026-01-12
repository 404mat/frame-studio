import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
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

export type FrameSettings = {
  frameWidth: number; // percentage of image size (0-100)
  frameColor: string;
  textColor: string;
  textEnabled?: boolean; // whether to show x100vi image on bottom border
  showShotOnText?: boolean; // whether to show "Shot on" text before logo
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
  frameWidth: number; // percentage
  frameColor: string;
  textColor: string;
};

const DEFAULT_SETTINGS: FrameSettings = {
  frameWidth: 8, // 8% of image size
  frameColor: '#ffffff',
  textColor: '#000000',
  textEnabled: false,
  showShotOnText: false,
};

const PRESETS: Preset[] = [
  {
    name: 'Classic White',
    frameWidth: 8,
    frameColor: '#ffffff',
    textColor: '#000000',
  },
  {
    name: 'Vintage Brown',
    frameWidth: 10,
    frameColor: '#8B6F47',
    textColor: '#ffffff',
  },
  {
    name: 'Black & White',
    frameWidth: 9,
    frameColor: '#000000',
    textColor: '#ffffff',
  },
  {
    name: 'Colorful',
    frameWidth: 7,
    frameColor: '#FF6B9D',
    textColor: '#ffffff',
  },
];

type CanvasBackground = 'white' | 'grey' | 'black';

type ExifData = {
  make?: string;
  model?: string;
  focalLength?: number;
  iso?: number;
  shutterSpeed?: number;
  aperture?: number;
};

function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [frameSettings, setFrameSettings] =
    useState<FrameSettings>(DEFAULT_SETTINGS);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [canvasBackground, setCanvasBackground] =
    useState<CanvasBackground>('grey');
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle image upload
  const handleImageUpload = (file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    // Extract EXIF data
    extractExifData(file);
  };

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
    setFrameSettings(preset);
  };

  // Handle manual settings change - clear preset selection
  const handleFrameSettingsChange = (settings: FrameSettings) => {
    setFrameSettings(settings);
    setSelectedPreset('');
  };

  // Handle reset to default settings
  const handleReset = () => {
    setFrameSettings(DEFAULT_SETTINGS);
    setCanvasBackground('grey');
    setSelectedPreset('');
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
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `polaroid-frame-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
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
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>
                  Reset
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
          />
        </div>
      </div>
    </div>
  );
}

// EXIF Data Display Component
function ExifCard({ exifData }: { exifData: ExifData | null }) {
  const formatFocalLength = (focalLength?: number) => {
    if (!focalLength) return '--';
    return `${focalLength}mm`;
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
    return `f/${aperture}`;
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
