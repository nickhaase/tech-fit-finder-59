import { useEffect, useState } from "react";
import { AssessmentData } from "@/types/assessment";
import { ArrowRight, Database, Factory, Zap, BarChart3, Settings, FileText, Wifi } from "lucide-react";
import maintainxLogo from "@/assets/logos/maintainx-logo.png";

interface DataFlowVisualizationProps {
  data: AssessmentData;
}

interface DataFlow {
  id: string;
  from: string;
  to: string;
  dataType: string;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  frequency: 'real-time' | 'near-real-time' | 'scheduled';
  protocol: string;
  color: string;
}

interface MaintainXModule {
  id: string;
  name: string;
  icon: any;
  position: { x: number; y: number };
  activeConnections: string[];
}

export const DataFlowVisualization = ({ data }: DataFlowVisualizationProps) => {
  const [animationIndex, setAnimationIndex] = useState(0);
  const [activeFlows, setActiveFlows] = useState<DataFlow[]>([]);
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);
  
  // Define MaintainX modules with positions
  const maintainXModules: MaintainXModule[] = [
    { id: 'work-orders', name: 'Work Orders', icon: FileText, position: { x: 0, y: -30 }, activeConnections: [] },
    { id: 'assets', name: 'Asset Mgmt', icon: Database, position: { x: 40, y: 0 }, activeConnections: [] },
    { id: 'maintenance', name: 'Preventive', icon: Settings, position: { x: 0, y: 30 }, activeConnections: [] },
    { id: 'analytics', name: 'Analytics', icon: BarChart3, position: { x: -40, y: 0 }, activeConnections: [] },
  ];

  // Get unique systems for animation
  const systems = [
    ...(data.integrations.erp ? [{ 
      name: data.integrations.erp.brand, 
      type: 'ERP',
      config: data.integrations.erp,
      category: 'business'
    }] : []),
    ...data.integrations.sensorsMonitoring
      .filter(s => s.brand !== 'None' && s.brand !== 'Not sure')
      .map(s => ({ 
        name: s.brand, 
        type: 'Sensor',
        config: s,
        category: 'operational'
      })),
    ...data.integrations.automationScada
      .filter(a => a.brand !== 'None' && a.brand !== 'Not sure')
      .map(a => ({ 
        name: a.brand, 
        type: 'Automation',
        config: a,
        category: 'operational'
      })),
    ...data.integrations.otherSystems
      .filter(o => o.brand !== 'None' && o.brand !== 'Not sure')
      .map(o => ({ 
        name: o.brand, 
        type: 'System',
        config: o,
        category: 'business'
      }))
  ];

  // Generate data flows based on system configurations
  const generateDataFlows = (systemIndex: number): DataFlow[] => {
    const system = systems[systemIndex];
    if (!system) return [];

    const flows: DataFlow[] = [];
    const config = system.config;

    // Inbound flows (to MaintainX)
    if (system.type === 'ERP') {
      flows.push({
        id: `${system.name}-orders`,
        from: system.name,
        to: 'work-orders',
        dataType: 'Purchase Orders',
        direction: 'inbound',
        frequency: config.frequency || 'scheduled',
        protocol: config.protocol?.[0] || 'REST API',
        color: 'flow-primary'
      });
      flows.push({
        id: `${system.name}-inventory`,
        from: system.name,
        to: 'assets',
        dataType: 'Inventory Levels',
        direction: 'inbound',
        frequency: config.frequency || 'scheduled',
        protocol: config.protocol?.[0] || 'REST API',
        color: 'flow-secondary'
      });
    }

    if (system.type === 'Sensor') {
      flows.push({
        id: `${system.name}-readings`,
        from: system.name,
        to: 'assets',
        dataType: 'Sensor Data',
        direction: 'inbound',
        frequency: config.frequency || 'real-time',
        protocol: config.protocol?.[0] || 'MQTT',
        color: 'flow-warning'
      });
      flows.push({
        id: `${system.name}-analytics`,
        from: system.name,
        to: 'analytics',
        dataType: 'Performance Metrics',
        direction: 'inbound',
        frequency: config.frequency || 'real-time',
        protocol: config.protocol?.[0] || 'MQTT',
        color: 'flow-secondary'
      });
    }

    if (system.type === 'Automation') {
      flows.push({
        id: `${system.name}-status`,
        from: system.name,
        to: 'assets',
        dataType: 'Machine Status',
        direction: 'inbound',
        frequency: config.frequency || 'real-time',
        protocol: config.protocol?.[0] || 'OPC UA',
        color: 'flow-primary'
      });
    }

    // Outbound flows (from MaintainX) - bidirectional systems
    if (config.directionality === 'bidirectional' || config.directionality === 'one-way-from') {
      if (system.type === 'ERP') {
        flows.push({
          id: `work-orders-${system.name}`,
          from: 'work-orders',
          to: system.name,
          dataType: 'Work Order Updates',
          direction: 'outbound',
          frequency: config.frequency || 'scheduled',
          protocol: config.protocol?.[0] || 'REST API',
          color: 'flow-secondary'
        });
      }
      
      if (system.type === 'Automation') {
        flows.push({
          id: `maintenance-${system.name}`,
          from: 'maintenance',
          to: system.name,
          dataType: 'Maintenance Schedules',
          direction: 'outbound',
          frequency: config.frequency || 'scheduled',
          protocol: config.protocol?.[0] || 'OPC UA',
          color: 'flow-warning'
        });
      }
    }

    return flows;
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
                key={`${system.name}-${index}`}
                className={`relative flex items-center gap-3 p-4 rounded-lg border transition-all duration-500 cursor-pointer group ${
                  index === animationIndex 
                    ? "bg-primary/10 border-primary shadow-card animate-pulse-glow" 
                    : "bg-card border-border/50 hover:border-primary/30"
                }`}
                onMouseEnter={() => setHoveredSystem(system.name)}
                onMouseLeave={() => setHoveredSystem(null)}
              >
                {/* System status indicator */}
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  system.config.frequency === 'real-time' ? 'bg-accent' :
                  system.config.frequency === 'near-real-time' ? 'bg-warning' : 'bg-primary'
                }`}></div>
                
                <div className="flex-1">
                  <div className="font-medium text-sm text-foreground">{system.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{system.type}</span>
                    {system.config.protocol && (
                      <>
                        <span>•</span>
                        <span>{system.config.protocol[0]}</span>
                      </>
                    )}
                  </div>
                  {system.config.frequency && (
                    <div className="text-xs text-accent font-medium capitalize">
                      {system.config.frequency.replace('-', ' ')}
                    </div>
                  )}
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