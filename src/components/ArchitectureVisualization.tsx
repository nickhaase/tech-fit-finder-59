import { TechStackData } from "@/pages/Index";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Cpu, 
  Settings, 
  Factory, 
  Workflow,
  ArrowRight,
  Shield,
  BarChart3,
  Users
} from "lucide-react";

interface ArchitectureVisualizationProps {
  data: TechStackData;
}

export const ArchitectureVisualization = ({ data }: ArchitectureVisualizationProps) => {
  const techCategories = [
    {
      title: "ERP Systems",
      icon: Database,
      items: data.erp,
      color: "bg-blue-500",
      description: "Enterprise resource planning and business data"
    },
    {
      title: "Sensors & Monitoring",
      icon: Cpu,
      items: data.sensors,
      color: "bg-green-500",
      description: "Real-time equipment and environmental data"
    },
    {
      title: "Automation & SCADA",
      icon: Settings,
      items: data.automation,
      color: "bg-purple-500",
      description: "Process control and automation systems"
    },
    {
      title: "Other Systems",
      icon: Factory,
      items: data.other,
      color: "bg-orange-500",
      description: "Legacy and specialized maintenance tools"
    }
  ];

  const maintainXFeatures = [
    { icon: Workflow, title: "Work Order Management", desc: "Automated workflow orchestration" },
    { icon: Shield, title: "Compliance Tracking", desc: "Regulatory compliance automation" },
    { icon: BarChart3, title: "Analytics & Reporting", desc: "Data-driven insights" },
    { icon: Users, title: "Team Collaboration", desc: "Cross-functional coordination" }
  ];

  return (
    <div className="space-y-8">
      {/* Architecture Diagram */}
      <div className="relative">
        {/* Top Row - External Systems */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {techCategories.map((category, index) => {
            const Icon = category.icon;
            if (category.items.length === 0) return null;
            
            return (
              <Card key={category.title} className="p-6 text-center hover:shadow-soft transition-all duration-200">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${category.color} text-white mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">{category.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                <div className="space-y-2">
                  {category.items.slice(0, 3).map((item) => (
                    <Badge key={item} variant="outline" className="text-xs block w-fit mx-auto">
                      {item.replace('_', ' ').toUpperCase()}
                    </Badge>
                  ))}
                  {category.items.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{category.items.length - 3} more
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Connection Arrows */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <ArrowRight className="w-6 h-6 text-primary" />
            <div className="text-sm font-medium text-muted-foreground">API Integrations</div>
            <ArrowRight className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* MaintainX Central Hub */}
        <div className="flex justify-center mb-8">
          <Card className="p-8 bg-gradient-primary text-primary-foreground shadow-card max-w-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <Factory className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">MaintainX</h2>
            <p className="opacity-90 mb-4">
              Centralized Maintenance Management Platform
            </p>
            <div className="text-sm opacity-75">
              Integrates with {data.erp.length + data.sensors.length + data.automation.length + data.other.length} systems
            </div>
          </Card>
        </div>

        {/* Connection Arrows Down */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <ArrowRight className="w-6 h-6 text-primary rotate-90" />
            <div className="text-sm font-medium text-muted-foreground">Data Flow</div>
            <ArrowRight className="w-6 h-6 text-primary rotate-90" />
          </div>
        </div>

        {/* MaintainX Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {maintainXFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="p-6 text-center hover:shadow-soft transition-all duration-200 bg-accent/5">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-foreground mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Integration Benefits */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <h3 className="text-lg font-semibold mb-4 text-center">Integration Benefits</h3>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-primary mb-1">Real-time</div>
            <div className="text-sm text-muted-foreground">Data synchronization across all systems</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary mb-1">Automated</div>
            <div className="text-sm text-muted-foreground">Workflow triggers and notifications</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary mb-1">Unified</div>
            <div className="text-sm text-muted-foreground">Single source of truth for maintenance</div>
          </div>
        </div>
      </Card>
    </div>
  );
};