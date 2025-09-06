import { useEffect, useState, useMemo } from "react";
import { AssessmentData } from "@/types/assessment";
import { ArrowRight, Database, Factory, Zap, BarChart3, Settings, FileText, Wifi, Download } from "lucide-react";
import maintainxLogo from "@/assets/logos/maintainx-logo.png";
import { mapConfigToNodes, Node } from "@/utils/mapConfigToNodes";
import { Flow } from "@/utils/generateFlows";
import { generateEnhancedFlows } from "@/utils/enhancedFlowGeneration";
import { ConfigService } from "@/services/configService";
import { Button } from "@/components/ui/button";
import { ExportDialog } from "@/components/ExportDialog";

interface DataFlowVisualizationProps {
  data: AssessmentData;
}

// Re-export Flow type from utils for backward compatibility
export type { Flow as DataFlow } from "@/utils/generateFlows";

interface MaintainXModule {
  id: string;
  name: string;
  icon: any;
  position: { x: number; y: number };
  activeConnections: string[];
}

export const DataFlowVisualization = ({ data }: DataFlowVisualizationProps) => {
  const [animationIndex, setAnimationIndex] = useState(0);
  const [activeFlows, setActiveFlows] = useState<Flow[]>([]);
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // Define MaintainX modules with positions
  const maintainXModules: MaintainXModule[] = [
    { id: 'work-orders', name: 'Work Orders', icon: FileText, position: { x: 0, y: -30 }, activeConnections: [] },
    { id: 'assets', name: 'Asset Mgmt', icon: Database, position: { x: 40, y: 0 }, activeConnections: [] },
    { id: 'maintenance', name: 'Preventive', icon: Settings, position: { x: 0, y: 30 }, activeConnections: [] },
    { id: 'analytics', name: 'Analytics', icon: BarChart3, position: { x: -40, y: 0 }, activeConnections: [] },
  ];

  // Get dynamic systems from backend config
  const systems = useMemo(() => {
    try {
      console.log('🔄 DataFlowVisualization loading data');
      const config = ConfigService.getLive();
      console.log('📦 Config loaded:', {
        sectionsCount: config.sections.length,
        hasERPSection: config.sections.some(s => s.id === 'erp'),
        totalBrands: config.sections.reduce((acc, s) => 
          acc + (s.options?.length || 0) + 
          (s.subcategories?.reduce((sub, cat) => sub + (cat.options?.length || 0), 0) || 0), 0)
      });
      
      const mappedSystems = mapConfigToNodes(config, data);
      console.log('🎯 Systems mapped:', mappedSystems.length, mappedSystems);
      return mappedSystems;
    } catch (error) {
      console.warn('Failed to load config, using fallback data:', error);
      return [];
    }
  }, [data]);

  // Generate enhanced data flows for the active system
  const generateDataFlows = (systemIndex: number): Flow[] => {
    try {
      const system = systems[systemIndex];
      if (!system) return [];
      
      // Use sync version for immediate rendering - async version would require state management
      const { generateEnhancedFlowsSync } = require('../utils/enhancedFlowGeneration');
      const allFlows = generateEnhancedFlowsSync(systems);
      const systemFlows = allFlows.filter(flow => 
        flow.from === system.id || flow.to === system.id ||
        flow.from.includes(system.id) || flow.to.includes(system.id)
      );
      
      console.log(`Generated ${systemFlows.length} enhanced flows for system:`, system.name);
      return systemFlows;
    } catch (error) {
      console.warn('[dataFlows]', 'Error generating flows:', error);
      return [];
    }
  };

  useEffect(() => {
    if (systems.length === 0) return;
    
    const interval = setInterval(() => {
      const newIndex = (animationIndex + 1) % systems.length;
      setAnimationIndex(newIndex);
      setActiveFlows(generateDataFlows(newIndex));
    }, 3000);

    // Initialize with first system
    if (activeFlows.length === 0) {
      setActiveFlows(generateDataFlows(0));
    }

    return () => clearInterval(interval);
  }, [systems.length, animationIndex]);

  if (systems.length === 0) return null;

  const getDataParticleDelay = (index: number) => `${index * 0.5}s`;
  const getConnectionOpacity = (flowId: string) => 
    activeFlows.some(f => f.id === flowId) ? 1 : 0.2;

  return (
    <div className="relative bg-gradient-to-br from-background via-primary/5 to-accent/10 rounded-lg border border-border/50 overflow-hidden">
      <div className="relative text-center p-6 pb-4">
        <h3 className="text-xl font-semibold mb-2 text-foreground">Live Data Integration with MaintainX</h3>
        <p className="text-sm text-muted-foreground">Real-time bidirectional data flows between your systems</p>
        
        {/* Export Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExportDialog(true)}
          className="absolute top-6 right-6"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
      
      {/* Responsive Grid Layout */}
      <div className="min-h-[600px] lg:min-h-[500px] relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-6 h-full">
          
          {/* Source Systems - Mobile: Full width, Desktop: Left column */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="space-y-4 max-h-[400px] lg:max-h-none overflow-y-auto lg:overflow-visible">
              {systems.map((system, index) => (
                <div
                  key={`${system.id}-${index}`}
                  className={`relative flex items-center gap-3 p-4 rounded-lg border transition-all duration-500 cursor-pointer group ${
                    index === animationIndex 
                      ? "bg-primary/10 border-primary shadow-card animate-pulse-glow" 
                      : "bg-card border-border/50 hover:border-primary/30"
                  }`}
                  onMouseEnter={() => setHoveredSystem(system.name)}
                  onMouseLeave={() => setHoveredSystem(null)}
                >
                  {/* System logo or initials */}
                  <div className="w-10 h-10 rounded-lg bg-card border border-border/50 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                    {system.logo ? (
                      <img 
                        src={system.logo} 
                        alt={`${system.name} logo`}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          // Fallback to initials on image load error
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`absolute inset-0 flex items-center justify-center text-xs font-bold text-muted-foreground ${
                        system.logo ? 'hidden' : 'flex'
                      }`}
                    >
                      {system.name.substring(0, 2).toUpperCase()}
                    </div>
                    
                    {/* SAP special ERP label */}
                    {system.name === 'SAP' && (
                      <div className="absolute bottom-0 right-0 bg-primary text-white text-[8px] px-1 rounded-tl-sm font-bold">
                        ERP
                      </div>
                    )}
                  </div>
                  
                  {/* System status indicator */}
                  <div className={`w-3 h-3 rounded-full animate-pulse flex-shrink-0 ${
                    system.frequency === 'real-time' ? 'bg-accent' :
                    system.frequency === 'near-real-time' ? 'bg-warning' : 'bg-primary'
                  }`}></div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground flex items-center gap-2 flex-wrap">
                      <span className="truncate">{system.name}</span>
                      {system.subLabel && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                          {system.subLabel}
                        </span>
                      )}
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground whitespace-nowrap">
                        {system.category}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span>{system.tier}</span>
                      {system.protocol.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{system.protocol[0]}</span>
                        </>
                      )}
                      {system.capabilities && system.capabilities.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-primary">{system.capabilities.length} capabilities</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-accent font-medium capitalize">
                      {system.frequency.replace('-', ' ')}
                    </div>
                  </div>

                  {/* Connection strength indicator */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {[1,2,3].map(bar => (
                      <div 
                        key={bar}
                        className={`w-1 h-2 rounded-sm transition-colors ${
                          index === animationIndex ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connection Visualization - Mobile: Hidden, Desktop: Center column */}
          <div className="hidden lg:block lg:col-span-4 order-3 lg:order-2 relative">
            <div className="h-full flex items-center justify-center">
              <svg 
                className="w-full h-full max-h-[500px]" 
                viewBox="0 0 320 500" 
                style={{ zIndex: 1 }}
              >
                {/* Connection lines */}
                {activeFlows.map((flow, index) => {
                  const isInbound = flow.direction === 'inbound';
                  const startX = isInbound ? 20 : 300;
                  const endX = isInbound ? 300 : 20;
                  const y = 120 + (index * 60); // Increased spacing between flows
                  
                  return (
                    <g key={flow.id}>
                      {/* Connection line */}
                      <line
                        x1={startX}
                        y1={y}
                        x2={endX}
                        y2={y}
                        stroke={`hsl(var(--${flow.color}))`}
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        className="animate-pulse-connection"
                        opacity={getConnectionOpacity(flow.id)}
                      />
                      
                      {/* Data type label */}
                      <text
                        x={160}
                        y={y - 12}
                        textAnchor="middle"
                        className="fill-foreground font-semibold"
                        opacity={getConnectionOpacity(flow.id)}
                        style={{ fontSize: '14px' }}
                      >
                        {flow.dataType}
                      </text>
                      
                      {/* Protocol label */}
                      <text
                        x={160}
                        y={y + 20}
                        textAnchor="middle"
                        className="fill-accent font-medium"
                        opacity={getConnectionOpacity(flow.id)}
                        style={{ fontSize: '12px' }}
                      >
                        {flow.protocol}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Animated data particles */}
              {activeFlows.map((flow, index) => {
                const isInbound = flow.direction === 'inbound';
                const particleClass = isInbound ? 'animate-data-particle' : 'animate-flow-reverse';
                const particleColor = flow.frequency === 'real-time' ? 'bg-accent' : 
                                   flow.frequency === 'near-real-time' ? 'bg-warning' : 'bg-primary';
                
                return (
                  <div
                    key={`particle-${flow.id}`}
                    className={`absolute w-2 h-2 rounded-full ${particleColor} ${particleClass}`}
                    style={{
                      left: isInbound ? '20px' : '300px',
                      top: `${120 + (index * 60) - 4}px`,
                      animationDelay: getDataParticleDelay(index),
                      animationDirection: isInbound ? 'normal' : 'reverse'
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* MaintainX Platform Hub - Mobile: Top, Desktop: Right column */}
          <div className="lg:col-span-4 order-1 lg:order-3">
            <div className="relative h-full flex items-start lg:items-center">
              {/* Main MaintainX Container */}
              <div className="bg-gradient-hero text-white p-6 rounded-xl shadow-card w-full max-w-sm mx-auto lg:max-w-none">
                <div className="flex items-center gap-3 mb-4">
                  <img src={maintainxLogo} alt="MaintainX" className="w-10 h-10 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-lg">MaintainX</div>
                    <div className="text-sm opacity-90">Unified Platform</div>
                  </div>
                  <Wifi className="w-5 h-5 animate-pulse flex-shrink-0" />
                </div>

                {/* Module Grid */}
                <div className="grid grid-cols-2 gap-3 relative">
                  {maintainXModules.map((module) => {
                    const Icon = module.icon;
                    const isActive = activeFlows.some(f => f.to === module.id || f.from === module.id);
                    
                    return (
                      <div
                        key={module.id}
                        className={`p-3 rounded-lg border border-white/20 backdrop-blur transition-all relative ${
                          isActive 
                            ? 'bg-white/20 shadow-lg animate-module-pulse' 
                            : 'bg-white/10 hover:bg-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs font-medium truncate">{module.name}</span>
                        </div>
                        
                        {/* Active connection indicator */}
                        {isActive && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse shadow-lg" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Data throughput indicator */}
                <div className="mt-4 pt-3 border-t border-white/20">
                  <div className="flex justify-between items-center text-xs">
                    <span className="opacity-80">{activeFlows.length} Active Data Flows</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                      <span className="font-medium">Live</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Outer glow effect */}
              <div className="absolute inset-0 bg-gradient-hero rounded-xl blur-xl opacity-30 -z-10 animate-pulse-glow" />
            </div>
          </div>
        </div>

        {/* Flow Direction Indicators - Responsive positioning */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 lg:gap-4 bg-card/80 backdrop-blur rounded-lg p-2 lg:p-3 border border-border/50">
            <div className="flex items-center gap-1 lg:gap-2 text-xs">
              <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 text-primary" />
              <span className="text-muted-foreground hidden sm:inline">To MaintainX</span>
              <span className="text-muted-foreground sm:hidden">To</span>
            </div>
            <div className="w-px h-3 lg:h-4 bg-border" />
            <div className="flex items-center gap-1 lg:gap-2 text-xs">
              <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 text-accent rotate-180" />
              <span className="text-muted-foreground hidden sm:inline">From MaintainX</span>
              <span className="text-muted-foreground sm:hidden">From</span>
            </div>
          </div>
        </div>

        {/* System Info Panel - Responsive positioning */}
        {hoveredSystem && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10 px-4">
            <div className="bg-card/95 backdrop-blur rounded-lg p-3 lg:p-4 border border-border/50 shadow-card animate-fade-in max-w-xs">
              <div className="text-sm font-medium text-foreground mb-1 truncate">
                {hoveredSystem} Integration
              </div>
              <div className="text-xs text-muted-foreground">
                Active data flows: {activeFlows.filter(f => {
                  const system = systems.find(s => s.name === hoveredSystem);
                  return system && (f.from === system.id || f.to === system.id);
                }).length}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Background ambient elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full animate-data-particle"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: '6s'
            }}
          />
        ))}
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        systems={systems}
      />
    </div>
  );
};