import { Node } from "@/utils/mapConfigToNodes";
import { Flow, generateFlowsForNode } from "@/utils/generateFlows";

// Brand colors based on MaintainX guidelines
const BRAND_COLORS = {
  primary: '#246CFF',           // MaintainX Blue
  primaryDark: '#001E40',       // Hydraulic Blue
  accent: '#2ED888',            // Safety Green
  warning: '#FFA945',           // Safety Orange
  background: '#ffffff',        // White background for PDF
  foreground: '#1e293b',        // Dark text
  muted: '#64748b',
  card: '#f8fafc',
  border: '#e2e8f0'
};

export class StaticFlowRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async generateStaticFlowDiagram(systems: Node[], width: number = 1200, height: number = 800): Promise<string> {
    this.canvas.width = width;
    this.canvas.height = height;
    
    const ctx = this.ctx;
    
    // Clear canvas with white background for PDF
    ctx.fillStyle = BRAND_COLORS.background;
    ctx.fillRect(0, 0, width, height);
    
    // Generate flows for all systems
    const allFlows: Flow[] = [];
    systems.forEach(system => {
      const flows = generateFlowsForNode(system);
      allFlows.push(...flows);
    });
    
    // Render components with proper spacing
    await this.renderSystemsColumn(ctx, systems, width * 0.35, height);
    this.renderConnections(ctx, allFlows, width * 0.35, width * 0.65, height);
    this.renderMaintainXHub(ctx, allFlows, width * 0.65, width, height);
    
    // Add title with brand color
    ctx.fillStyle = BRAND_COLORS.primary;
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Integration Architecture Overview', width / 2, 40);
    
    // Convert canvas to base64 image
    return this.canvas.toDataURL('image/png', 1.0);
  }

  private async renderSystemsColumn(ctx: CanvasRenderingContext2D, systems: Node[], maxWidth: number, height: number): Promise<void> {
    const padding = 20;
    const systemHeight = 70;
    const spacing = 10;
    const startY = 80;
    
    ctx.textAlign = 'left';
    
    // Section title
    ctx.fillStyle = '#001E40'; // Hydraulic Blue
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText('Connected Systems', padding, startY - 20);
    
    systems.slice(0, 8).forEach((system, index) => { // Limit to 8 systems for space
      const y = startY + (index * (systemHeight + spacing));
      
      // System container with MaintainX Blue border
      ctx.fillStyle = '#F8FAFF'; // Light blue background
      ctx.strokeStyle = '#246CFF'; // MaintainX Blue border
      ctx.lineWidth = 2;
      
      this.roundedRect(ctx, padding, y, maxWidth - (padding * 2), systemHeight, 8);
      ctx.fill();
      ctx.stroke();
      
      // System name
      ctx.fillStyle = '#001E40'; // Hydraulic Blue
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText(system.name, padding + 15, y + 25);
      
      // System category
      ctx.fillStyle = '#6B7280'; // Gray
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(system.category, padding + 15, y + 45);
      
      // Status indicator
      ctx.fillStyle = system.frequency === 'real-time' ? '#2ED888' : '#246CFF'; // Safety Green or MaintainX Blue
      ctx.beginPath();
      ctx.arc(padding + maxWidth - 40, y + 25, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Show count if more systems exist
    if (systems.length > 8) {
      const y = startY + (8 * (systemHeight + spacing));
      ctx.fillStyle = '#6B7280';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(`+ ${systems.length - 8} more systems`, padding + 15, y);
    }
  }

  private renderConnections(ctx: CanvasRenderingContext2D, flows: Flow[], startX: number, endX: number, height: number): void {
    const centerX = (startX + endX) / 2;
    const startY = 150;
    const flowSpacing = 50;
    
    // Section title
    ctx.fillStyle = '#001E40'; // Hydraulic Blue
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Data Flows', centerX, 100);
    
    flows.slice(0, 10).forEach((flow, index) => { // Limit flows for clarity
      const y = startY + (index * flowSpacing);
      
      // Connection line with Safety Green
      ctx.strokeStyle = '#2ED888'; // Safety Green
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      
      ctx.beginPath();
      ctx.moveTo(startX + 20, y);
      ctx.lineTo(endX - 20, y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Arrow head
      ctx.fillStyle = '#2ED888';
      ctx.beginPath();
      ctx.moveTo(endX - 20, y);
      ctx.lineTo(endX - 30, y - 5);
      ctx.lineTo(endX - 30, y + 5);
      ctx.closePath();
      ctx.fill();
      
      // Data type label
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(flow.dataType, centerX, y - 8);
      
      // Protocol label
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(flow.protocol, centerX, y + 15);
    });
  }

  private renderMaintainXHub(ctx: CanvasRenderingContext2D, flows: Flow[], startX: number, maxWidth: number, height: number): void {
    const hubWidth = maxWidth - startX - 40;
    const hubHeight = 400;
    const hubX = startX + 20;
    const hubY = (height - hubHeight) / 2;
    
    // Main hub container with MaintainX gradient
    const gradient = ctx.createLinearGradient(hubX, hubY, hubX + hubWidth, hubY + hubHeight);
    gradient.addColorStop(0, '#246CFF'); // MaintainX Blue
    gradient.addColorStop(1, '#001E40'); // Hydraulic Blue
    ctx.fillStyle = gradient;
    
    this.roundedRect(ctx, hubX, hubY, hubWidth, hubHeight, 16);
    ctx.fill();
    
    // MaintainX title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MaintainX', hubX + hubWidth / 2, hubY + 50);
    
    // Subtitle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('Central CMMS Platform', hubX + hubWidth / 2, hubY + 75);
    
    // Modules grid
    const modules = [
      { name: 'Work Orders', icon: '📋', active: flows.some(f => f.to === 'work-orders') },
      { name: 'Asset Management', icon: '🏭', active: flows.some(f => f.to === 'assets') },
      { name: 'Preventive Maintenance', icon: '🔧', active: flows.some(f => f.to === 'maintenance') },
      { name: 'Analytics & Reporting', icon: '📊', active: flows.some(f => f.to === 'analytics') },
      { name: 'Inventory Management', icon: '📦', active: flows.some(f => f.to === 'inventory') },
      { name: 'Mobile Workforce', icon: '📱', active: true }
    ];
    
    const moduleWidth = (hubWidth - 60) / 2;
    const moduleHeight = 50;
    const moduleSpacing = 15;
    
    modules.forEach((module, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = hubX + 20 + (col * (moduleWidth + moduleSpacing));
      const y = hubY + 110 + (row * (moduleHeight + moduleSpacing));
      
      // Module container
      ctx.fillStyle = module.active ? 'rgba(46, 216, 136, 0.2)' : 'rgba(255, 255, 255, 0.1)'; // Safety Green tint if active
      ctx.strokeStyle = module.active ? '#2ED888' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      
      this.roundedRect(ctx, x, y, moduleWidth, moduleHeight, 8);
      ctx.fill();
      ctx.stroke();
      
      // Module name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(module.name, x + moduleWidth / 2, y + moduleHeight / 2 + 4);
      
      // Active indicator
      if (module.active) {
        ctx.fillStyle = '#2ED888'; // Safety Green
        ctx.beginPath();
        ctx.arc(x + moduleWidth - 8, y + 8, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Stats footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${flows.length} Active Integrations • Real-time Data Sync`, hubX + hubWidth / 2, hubY + hubHeight - 20);
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