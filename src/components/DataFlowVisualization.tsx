import { useEffect, useState, useMemo } from "react";
import { AssessmentData } from "@/types/assessment";
import { ArrowRight, Database, Factory, Zap, BarChart3, Settings, FileText, Wifi } from "lucide-react";
import maintainxLogo from "@/assets/logos/maintainx-logo.png";
import { mapConfigToNodes, Node } from "@/utils/mapConfigToNodes";
import { generateFlowsForNode, Flow } from "@/utils/generateFlows";
import { ConfigService } from "@/services/configService";

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
      const config = ConfigService.getLive();
      return mapConfigToNodes(config, data);
    } catch (error) {
      console.warn('Failed to load config, using fallback data:', error);
      return [];
    }
  }, [data]);

  // Generate data flows based on system configurations
  const generateDataFlows = (systemIndex: number): Flow[] => {
    const system = systems[systemIndex];
    if (!system) return [];
    
    return generateFlowsForNode(system);
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
    <div className="relative bg-gradient-to-br from-background via-primary/5 to-accent/10 rounded-lg p-8 overflow-hidden border border-border/50">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold mb-2 text-foreground">Live Data Integration with MaintainX</h3>
        <p className="text-sm text-muted-foreground">Real-time bidirectional data flows between your systems</p>
      </div>
      
      <div className="relative max-w-6xl mx-auto">
        {/* Source Systems */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
          <div className="flex flex-col gap-4">
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
                <div className="w-10 h-10 rounded-lg bg-card border border-border/50 flex items-center justify-center relative overflow-hidden">
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
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  system.frequency === 'real-time' ? 'bg-accent' :
                  system.frequency === 'near-real-time' ? 'bg-warning' : 'bg-primary'
                }`}></div>
                
                <div className="flex-1">
                  <div className="font-medium text-sm text-foreground flex items-center gap-2">
                    {system.name}
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                      {system.category}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{system.tier}</span>
                    {system.protocol.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{system.protocol[0]}</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-accent font-medium capitalize">
                    {system.frequency.replace('-', ' ')}
                  </div>
                </div>

                {/* Connection strength indicator */}
                <div className="flex flex-col gap-1">
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

        {/* Connection Lines and Data Particles */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" style={{ zIndex: 1 }}>
            {/* Connection lines */}
            {activeFlows.map((flow, index) => {
              const isInbound = flow.direction === 'inbound';
              const startX = isInbound ? 280 : 520;
              const endX = isInbound ? 520 : 280;
              const y = 200 + (index - activeFlows.length / 2) * 40;
              
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
                    x={(startX + endX) / 2}
                    y={y - 8}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground font-medium"
                    opacity={getConnectionOpacity(flow.id)}
                  >
                    {flow.dataType}
                  </text>
                  
                  {/* Protocol label */}
                  <text
                    x={(startX + endX) / 2}
                    y={y + 15}
                    textAnchor="middle"
                    className="text-xs fill-accent font-medium"
                    opacity={getConnectionOpacity(flow.id)}
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
                  left: isInbound ? '280px' : '520px',
                  top: `${200 + (index - activeFlows.length / 2) * 40 - 4}px`,
                  animationDelay: getDataParticleDelay(index),
                  animationDirection: isInbound ? 'normal' : 'reverse'
                }}
              />
            );
          })}
        </div>

        {/* MaintainX Platform Hub */}
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
          <div className="relative">
            {/* Main MaintainX Container */}
            <div className="bg-gradient-hero text-white p-6 rounded-xl shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <img src={maintainxLogo} alt="MaintainX" className="w-10 h-10" />
                <div>
                  <div className="font-bold text-lg">MaintainX</div>
                  <div className="text-sm opacity-90">Unified Platform</div>
                </div>
                <Wifi className="w-5 h-5 ml-2 animate-pulse" />
              </div>

              {/* Module Grid */}
              <div className="grid grid-cols-2 gap-3 relative">
                {maintainXModules.map((module) => {
                  const Icon = module.icon;
                  const isActive = activeFlows.some(f => f.to === module.id || f.from === module.id);
                  
                  return (
                    <div
                      key={module.id}
                      className={`p-3 rounded-lg border border-white/20 backdrop-blur transition-all ${
                        isActive 
                          ? 'bg-white/20 shadow-lg animate-module-pulse' 
                          : 'bg-white/10 hover:bg-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-medium">{module.name}</span>
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
                  <span className="opacity-80">Data Throughput</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                    <span className="font-medium">Live</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Outer glow effect */}
            <div className="absolute inset-0 bg-gradient-hero rounded-xl blur-xl opacity-30 -z-10 animate-pulse-glow" />
            
            {/* Connection points */}
            {maintainXModules.map((module) => {
              const isActive = activeFlows.some(f => f.to === module.id || f.from === module.id);
              return (
                <div
                  key={`connection-${module.id}`}
                  className={`absolute w-2 h-2 rounded-full transition-all ${
                    isActive ? 'bg-accent animate-pulse scale-150' : 'bg-white/50'
                  }`}
                  style={{
                    left: `${module.position.x + 50}%`,
                    top: `${module.position.y + 50}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Flow Direction Indicators */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-4 bg-card/80 backdrop-blur rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 text-xs">
              <ArrowRight className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">To MaintainX</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2 text-xs">
              <ArrowRight className="w-4 h-4 text-accent rotate-180" />
              <span className="text-muted-foreground">From MaintainX</span>
            </div>
          </div>
        </div>

        {/* System Info Panel */}
        {hoveredSystem && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-card/95 backdrop-blur rounded-lg p-4 border border-border/50 shadow-card animate-fade-in">
              <div className="text-sm font-medium text-foreground mb-1">
                {hoveredSystem} Integration
              </div>
              <div className="text-xs text-muted-foreground">
                Active data flows: {activeFlows.filter(f => f.from === hoveredSystem || f.to === hoveredSystem).length}
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
    </div>
  );
};