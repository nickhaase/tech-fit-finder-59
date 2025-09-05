import { Node } from "@/utils/mapConfigToNodes";
import { Flow, generateFlowsForNode } from "@/utils/generateFlows";

// @ts-ignore - gif.js doesn't have proper TypeScript definitions
import GIF from 'gif.js';

// Brand colors based on MaintainX guidelines
const BRAND_COLORS = {
  primary: '#246CFF',           // MaintainX Blue
  primaryDark: '#001E40',       // Hydraulic Blue
  accent: '#2ED888',            // Safety Green
  warning: '#FFA945',           // Safety Orange
  background: '#000000',
  foreground: '#ffffff',
  muted: '#64748b',
  card: '#1e293b',
  border: '#334155'
};

export interface ExportOptions {
  format: 'gif' | 'mp4';
  duration: number; // in seconds
  quality: 'low' | 'medium' | 'high';
  width: number;
  height: number;
  fps: number;
}

export interface ExportProgress {
  stage: 'preparing' | 'rendering' | 'encoding' | 'complete';
  progress: number; // 0-100
  currentFrame?: number;
  totalFrames?: number;
}

export class AnimationExporter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private systems: Node[];
  private onProgress: (progress: ExportProgress) => void;

  constructor(systems: Node[], onProgress: (progress: ExportProgress) => void) {
    this.systems = systems;
    this.onProgress = onProgress;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async exportAnimation(options: ExportOptions): Promise<Blob> {
    this.onProgress({ stage: 'preparing', progress: 0 });
    
    // Setup canvas
    this.canvas.width = options.width;
    this.canvas.height = options.height;
    
    if (options.format === 'gif') {
      return this.exportGIF(options);
    } else {
      return this.exportVideo(options);
    }
  }

  private async exportGIF(options: ExportOptions): Promise<Blob> {
    try {
      const gif = new GIF({
        workers: 2,
        quality: options.quality === 'high' ? 1 : options.quality === 'medium' ? 5 : 10,
        width: options.width,
        height: options.height,
        workerScript: '/gif.worker.local.js'
      });

    const totalFrames = options.duration * options.fps;
    const animationCycles = Math.ceil(options.duration / 3); // 3 seconds per cycle
    
    this.onProgress({ stage: 'rendering', progress: 0, currentFrame: 0, totalFrames });

    for (let frame = 0; frame < totalFrames; frame++) {
      const time = (frame / options.fps) * 1000; // Convert to milliseconds
      const systemIndex = Math.floor((time / 3000) % this.systems.length);
      
      await this.renderFrame(systemIndex, frame / totalFrames);
      
      gif.addFrame(this.canvas, { copy: true, delay: 1000 / options.fps });
      
      this.onProgress({ 
        stage: 'rendering', 
        progress: (frame / totalFrames) * 50, 
        currentFrame: frame, 
        totalFrames 
      });
    }

    this.onProgress({ stage: 'encoding', progress: 50 });

      return new Promise((resolve, reject) => {
        gif.on('finished', (blob: Blob) => {
          this.onProgress({ stage: 'complete', progress: 100 });
          resolve(blob);
        });
        
        gif.on('progress', (progress: number) => {
          this.onProgress({ 
            stage: 'encoding', 
            progress: 50 + (progress * 50) 
          });
        });

        gif.on('abort', () => {
          reject(new Error('GIF rendering was aborted'));
        });

        gif.render();
      });
    } catch (error) {
      console.error('GIF export error:', error);
      throw new Error(`Failed to export GIF: ${error.message}`);
    }
  }

  private async exportVideo(options: ExportOptions): Promise<Blob> {
    // For video export, we'll use MediaRecorder with a hidden video element
    const stream = this.canvas.captureStream(options.fps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    const chunks: Blob[] = [];
    const totalFrames = options.duration * options.fps;

    return new Promise((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        this.onProgress({ stage: 'complete', progress: 100 });
        resolve(blob);
      };

      mediaRecorder.onerror = reject;

      this.onProgress({ stage: 'rendering', progress: 0, currentFrame: 0, totalFrames });
      mediaRecorder.start();

      // Render frames
      this.renderVideoFrames(options, totalFrames).then(() => {
        mediaRecorder.stop();
      });
    });
  }

  private async renderVideoFrames(options: ExportOptions, totalFrames: number): Promise<void> {
    for (let frame = 0; frame < totalFrames; frame++) {
      const time = (frame / options.fps) * 1000;
      const systemIndex = Math.floor((time / 3000) % this.systems.length);
      
      await this.renderFrame(systemIndex, frame / totalFrames);
      
      this.onProgress({ 
        stage: 'rendering', 
        progress: (frame / totalFrames) * 90, 
        currentFrame: frame, 
        totalFrames 
      });

      // Wait for next frame
      await new Promise(resolve => setTimeout(resolve, 1000 / options.fps));
    }
  }

  private async renderFrame(systemIndex: number, progress: number): Promise<void> {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    
    // Clear canvas with brand background
    ctx.fillStyle = BRAND_COLORS.background;
    ctx.fillRect(0, 0, width, height);
    
    // Apply gradient background using brand colors
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, BRAND_COLORS.background);
    gradient.addColorStop(0.5, BRAND_COLORS.primary + '20'); // 20% opacity
    gradient.addColorStop(1, BRAND_COLORS.accent + '10'); // 10% opacity
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    const currentSystem = this.systems[systemIndex];
    if (!currentSystem) return;
    
    const activeFlows = generateFlowsForNode(currentSystem);
    
    // Render systems column (left side)
    await this.renderSystemsColumn(ctx, systemIndex, width * 0.33, height);
    
    // Render connections (center)
    this.renderConnections(ctx, activeFlows, width * 0.33, width * 0.67, height);
    
    // Render MaintainX hub (right side)
    this.renderMaintainXHub(ctx, activeFlows, width * 0.67, width, height);
  }

  private async renderSystemsColumn(ctx: CanvasRenderingContext2D, activeIndex: number, maxWidth: number, height: number): Promise<void> {
    const padding = 20;
    const systemHeight = 80;
    const spacing = 10;
    const startY = 100;
    
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'left';
    
    this.systems.forEach((system, index) => {
      const y = startY + (index * (systemHeight + spacing));
      const isActive = index === activeIndex;
      
      // System container
      ctx.fillStyle = isActive ? BRAND_COLORS.primary + '20' : BRAND_COLORS.card;
      ctx.strokeStyle = isActive ? BRAND_COLORS.primary : BRAND_COLORS.border;
      ctx.lineWidth = isActive ? 2 : 1;
      
      this.roundedRect(ctx, padding, y, maxWidth - (padding * 2), systemHeight, 8);
      ctx.fill();
      ctx.stroke();
      
      // System name
      ctx.fillStyle = BRAND_COLORS.foreground;
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText(system.name, padding + 15, y + 25);
      
      // System category
      ctx.fillStyle = BRAND_COLORS.muted;
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(system.category, padding + 15, y + 45);
      
      // Status indicator
      ctx.fillStyle = system.frequency === 'real-time' ? BRAND_COLORS.accent : BRAND_COLORS.primary;
      ctx.beginPath();
      ctx.arc(padding + maxWidth - 40, y + 25, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private renderConnections(ctx: CanvasRenderingContext2D, flows: Flow[], startX: number, endX: number, height: number): void {
    const centerX = (startX + endX) / 2;
    const startY = 150;
    const flowSpacing = 60;
    
    flows.forEach((flow, index) => {
      const y = startY + (index * flowSpacing);
      const isInbound = flow.direction === 'inbound';
      
      // Connection line with brand colors
      const flowColor = flow.color === 'flow-primary' ? BRAND_COLORS.primary : 
                       flow.color === 'flow-secondary' ? BRAND_COLORS.accent : 
                       flow.color === 'flow-warning' ? BRAND_COLORS.warning :
                       BRAND_COLORS.accent; // Default to accent color
      ctx.strokeStyle = flowColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      
      ctx.beginPath();
      ctx.moveTo(isInbound ? startX + 20 : endX - 20, y);
      ctx.lineTo(isInbound ? endX - 20 : startX + 20, y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Data type label
      ctx.fillStyle = BRAND_COLORS.foreground;
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(flow.dataType, centerX, y - 10);
      
      // Protocol label
      ctx.fillStyle = BRAND_COLORS.accent;
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(flow.protocol, centerX, y + 20);
    });
  }

  private renderMaintainXHub(ctx: CanvasRenderingContext2D, flows: Flow[], startX: number, maxWidth: number, height: number): void {
    const hubWidth = maxWidth - startX - 40;
    const hubHeight = 300;
    const hubX = startX + 20;
    const hubY = (height - hubHeight) / 2;
    
    // Main hub container with brand gradient
    const gradient = ctx.createLinearGradient(hubX, hubY, hubX + hubWidth, hubY + hubHeight);
    gradient.addColorStop(0, BRAND_COLORS.primary);
    gradient.addColorStop(1, BRAND_COLORS.primaryDark);
    ctx.fillStyle = gradient;
    
    this.roundedRect(ctx, hubX, hubY, hubWidth, hubHeight, 12);
    ctx.fill();
    
    // MaintainX title
    ctx.fillStyle = BRAND_COLORS.foreground;
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MaintainX', hubX + hubWidth / 2, hubY + 40);
    
    // Modules grid
    const modules = [
      { name: 'Work Orders', active: flows.some(f => f.to === 'work-orders') },
      { name: 'Asset Mgmt', active: flows.some(f => f.to === 'assets') },
      { name: 'Preventive', active: flows.some(f => f.to === 'maintenance') },
      { name: 'Analytics', active: flows.some(f => f.to === 'analytics') }
    ];
    
    const moduleWidth = (hubWidth - 60) / 2;
    const moduleHeight = 60;
    const moduleSpacing = 20;
    
    modules.forEach((module, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = hubX + 20 + (col * (moduleWidth + moduleSpacing));
      const y = hubY + 80 + (row * (moduleHeight + moduleSpacing));
      
      // Module container with brand colors
      ctx.fillStyle = module.active ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)';
      this.roundedRect(ctx, x, y, moduleWidth, moduleHeight, 8);
      ctx.fill();
      
      // Module name
      ctx.fillStyle = BRAND_COLORS.foreground;
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(module.name, x + moduleWidth / 2, y + moduleHeight / 2 + 4);
      
      // Active indicator
      if (module.active) {
        ctx.fillStyle = BRAND_COLORS.accent;
        ctx.beginPath();
        ctx.arc(x + moduleWidth - 10, y + 10, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Active flows count
    ctx.fillStyle = BRAND_COLORS.foreground;
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${flows.length} Active Data Flows`, hubX + hubWidth / 2, hubY + hubHeight - 20);
  }

  private roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}