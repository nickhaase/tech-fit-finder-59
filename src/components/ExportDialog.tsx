import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Download, Film, Image, X } from "lucide-react";
import { ExportOptions, ExportProgress, AnimationExporter } from "@/utils/animationExporter";
import { Node } from "@/utils/mapConfigToNodes";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  systems: Node[];
}

const EXPORT_PRESETS = {
  gif: {
    low: { width: 800, height: 600, fps: 10, duration: 6 },
    medium: { width: 1000, height: 750, fps: 15, duration: 9 },
    high: { width: 1200, height: 900, fps: 20, duration: 12 }
  },
  mp4: {
    low: { width: 1280, height: 720, fps: 24, duration: 15 },
    medium: { width: 1920, height: 1080, fps: 30, duration: 20 },
    high: { width: 1920, height: 1080, fps: 60, duration: 30 }
  }
};

export const ExportDialog = ({ open, onOpenChange, systems }: ExportDialogProps) => {
  const [format, setFormat] = useState<'gif' | 'mp4'>('gif');
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);

  const handleExport = async () => {
    if (systems.length === 0) {
      toast.error("No systems available to export");
      return;
    }

    setIsExporting(true);
    
    try {
      const preset = EXPORT_PRESETS[format][quality];
      const options: ExportOptions = {
        format,
        quality,
        ...preset
      };

      const exporter = new AnimationExporter(systems, setProgress);
      const blob = await exporter.exportAnimation(options);
      
      // Download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maintainx-data-flow-${format}-${quality}-${Date.now()}.${format === 'gif' ? 'gif' : 'webm'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${format.toUpperCase()} exported successfully!`);
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
      setProgress(null);
    }
  };

  const preset = EXPORT_PRESETS[format][quality];
  const estimatedSize = format === 'gif' 
    ? Math.round((preset.width * preset.height * preset.duration * preset.fps) / 500000) // Rough GIF estimate
    : Math.round((preset.width * preset.height * preset.duration * preset.fps) / 100000); // Rough video estimate

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="w-5 h-5" />
            Export Animation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={format === 'gif' ? 'default' : 'outline'}
                onClick={() => setFormat('gif')}
                className="justify-start"
                disabled={isExporting}
              >
                <Image className="w-4 h-4 mr-2" />
                GIF
              </Button>
              <Button
                variant={format === 'mp4' ? 'default' : 'outline'}
                onClick={() => setFormat('mp4')}
                className="justify-start"
                disabled={isExporting}
              >
                <Film className="w-4 h-4 mr-2" />
                Video
              </Button>
            </div>
          </div>

          {/* Quality Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quality</label>
            <Select value={quality} onValueChange={(value: 'low' | 'medium' | 'high') => setQuality(value)} disabled={isExporting}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (Fast)</SelectItem>
                <SelectItem value="medium">Medium (Balanced)</SelectItem>
                <SelectItem value="high">High (Best Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">Export Details</h4>
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <div>Resolution: {preset.width}×{preset.height}</div>
                <div>Duration: {preset.duration}s</div>
              </div>
              <div>
                <div>Frame Rate: {preset.fps} FPS</div>
                <div>Est. Size: ~{estimatedSize}MB</div>
              </div>
            </div>
          </div>

          {/* Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="capitalize">{progress.stage}...</span>
                <span>{Math.round(progress.progress)}%</span>
              </div>
              <Progress value={progress.progress} className="h-2" />
              {progress.currentFrame && progress.totalFrames && (
                <div className="text-xs text-muted-foreground text-center">
                  Frame {progress.currentFrame} of {progress.totalFrames}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {format.toUpperCase()}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};