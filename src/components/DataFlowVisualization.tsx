import { useEffect, useState } from "react";
import { AssessmentData } from "@/types/assessment";
import { ArrowRight, Database, Factory } from "lucide-react";

interface DataFlowVisualizationProps {
  data: AssessmentData;
}

export const DataFlowVisualization = ({ data }: DataFlowVisualizationProps) => {
  const [animationIndex, setAnimationIndex] = useState(0);
  
  // Get unique systems for animation
  const systems = [
    ...(data.integrations.erp ? [{ name: data.integrations.erp.brand, type: 'ERP' }] : []),
    ...data.integrations.sensorsMonitoring.filter(s => s.brand !== 'None' && s.brand !== 'Not sure').map(s => ({ name: s.brand, type: 'Sensor' })),
    ...data.integrations.automationScada.filter(a => a.brand !== 'None' && a.brand !== 'Not sure').map(a => ({ name: a.brand, type: 'Automation' })),
    ...data.integrations.otherSystems.filter(o => o.brand !== 'None' && o.brand !== 'Not sure').map(o => ({ name: o.brand, type: 'System' }))
  ];

  useEffect(() => {
    if (systems.length === 0) return;
    
    const interval = setInterval(() => {
      setAnimationIndex(prev => (prev + 1) % systems.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [systems.length]);

  if (systems.length === 0) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-8 overflow-hidden">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Live Data Flow Into MaintainX</h3>
        <p className="text-sm text-muted-foreground">Watch how your systems integrate seamlessly</p>
      </div>
      
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Source Systems */}
        <div className="flex flex-col gap-4">
          {systems.map((system, index) => (
            <div
              key={`${system.name}-${index}`}
              className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${
                index === animationIndex 
                  ? "bg-primary/10 border-primary shadow-lg animate-pulse-glow" 
                  : "bg-card border-border/50"
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              <div>
                <div className="font-medium text-sm">{system.name}</div>
                <div className="text-xs text-muted-foreground">{system.type}</div>
              </div>
              
              {/* Flowing data particles */}
              {index === animationIndex && (
                <div className="absolute left-full top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-flow-data"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Flow Arrows */}
        <div className="flex flex-col items-center gap-2 px-8">
          <ArrowRight className="w-8 h-8 text-primary animate-pulse" />
          <div className="text-xs text-muted-foreground font-medium">Real-time</div>
          <div className="text-xs text-muted-foreground">Data Sync</div>
        </div>

        {/* MaintainX Platform */}
        <div className="relative">
          <div className="bg-gradient-hero text-white p-6 rounded-lg shadow-card animate-scale-in">
            <div className="flex items-center gap-3 mb-2">
              <Factory className="w-8 h-8" />
              <div>
                <div className="font-bold text-lg">MaintainX</div>
                <div className="text-sm opacity-90">Unified Platform</div>
              </div>
            </div>
            <div className="text-xs opacity-80">
              • Work Orders<br />
              • Asset Management<br />
              • Preventive Maintenance<br />
              • Analytics & Reporting
            </div>
          </div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-hero rounded-lg blur-xl opacity-30 -z-10 animate-pulse-glow"></div>
        </div>
      </div>

      {/* Background animation elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-primary/30 rounded-full animate-flow-data"></div>
        <div className="absolute top-1/3 left-1/2 w-1 h-1 bg-accent/30 rounded-full animate-flow-data" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-2/3 left-3/4 w-1 h-1 bg-primary/30 rounded-full animate-flow-data" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  );
};