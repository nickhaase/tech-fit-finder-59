import { AssessmentData } from "@/types/assessment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Cpu, 
  Settings, 
  Factory,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  TrendingUp
} from "lucide-react";

interface IntegrationExplanationsProps {
  data: AssessmentData;
}

const INTEGRATION_DETAILS = {
  // ERP Systems
  sap: {
    title: "SAP Integration",
    description: "Bidirectional data flow between MaintainX and SAP for seamless asset and work order management.",
    benefits: ["Real-time asset data sync", "Automated purchase requisitions", "Cost center integration"],
    howItWorks: "MaintainX connects via SAP APIs to sync asset hierarchies, work orders, and financial data in real-time."
  },
  oracle: {
    title: "Oracle ERP Integration", 
    description: "Native integration with Oracle Cloud ERP for comprehensive maintenance-to-finance workflows.",
    benefits: ["Asset lifecycle tracking", "Automated invoicing", "Budget management"],
    howItWorks: "Direct API integration ensures maintenance activities automatically update financial records and procurement workflows."
  },
  microsoft: {
    title: "Microsoft Dynamics Integration",
    description: "Seamless integration with Dynamics 365 for unified business operations.",
    benefits: ["Customer relationship sync", "Inventory management", "Service scheduling"],
    howItWorks: "Power Platform connectors enable real-time data exchange between MaintainX and Dynamics applications."
  },
  workday: {
    title: "Workday Integration",
    description: "Connect maintenance operations with HR and financial management.",
    benefits: ["Employee scheduling", "Cost tracking", "Compliance reporting"],
    howItWorks: "RESTful APIs synchronize employee data, time tracking, and financial allocations across systems."
  },

  // Sensors & Monitoring
  iot_sensors: {
    title: "IoT Sensors Integration",
    description: "Real-time monitoring data automatically triggers maintenance workflows in MaintainX.",
    benefits: ["Predictive maintenance alerts", "Automated work order creation", "Equipment health monitoring"],
    howItWorks: "MQTT and REST APIs collect sensor data to automatically generate work orders when thresholds are exceeded."
  },
  smart_meters: {
    title: "Smart Meters Integration",
    description: "Energy consumption data drives maintenance scheduling and efficiency optimization.",
    benefits: ["Energy usage tracking", "Performance-based maintenance", "Cost optimization"],
    howItWorks: "Meter data feeds into MaintainX analytics to optimize maintenance timing based on usage patterns."
  },
  condition_monitoring: {
    title: "Condition Monitoring Integration",
    description: "Vibration, temperature, and pressure data enables predictive maintenance strategies.",
    benefits: ["Early failure detection", "Maintenance optimization", "Reduced downtime"],
    howItWorks: "Machine learning algorithms analyze sensor data to predict failures and automatically schedule preventive maintenance."
  },

  // Automation & SCADA
  scada: {
    title: "SCADA Integration",
    description: "Direct integration with SCADA systems for automated maintenance workflows.",
    benefits: ["Real-time process monitoring", "Automated shutdowns for maintenance", "Operational data integration"],
    howItWorks: "OPC-UA and Modbus protocols enable MaintainX to receive alarms and operational data from SCADA systems."
  },
  plc: {
    title: "PLC Systems Integration",
    description: "Connect programmable logic controllers for equipment status and maintenance triggers.",
    benefits: ["Equipment state monitoring", "Automated maintenance requests", "Production impact tracking"],
    howItWorks: "Industrial communication protocols connect PLCs to MaintainX for real-time equipment status updates."
  },
  mes: {
    title: "MES Integration",
    description: "Manufacturing execution system integration for production-aware maintenance scheduling.",
    benefits: ["Production-aligned maintenance", "Quality impact tracking", "Resource optimization"],
    howItWorks: "MES APIs provide production schedules and quality data to optimize maintenance timing and resource allocation."
  },

  // Other Systems  
  cmms: {
    title: "Legacy CMMS Migration",
    description: "Seamless migration and integration with existing CMMS data and workflows.",
    benefits: ["Data preservation", "Workflow continuity", "Enhanced capabilities"],
    howItWorks: "Migration tools and APIs ensure historical data integrity while adding modern mobile and analytics capabilities."
  },
  asset_tracking: {
    title: "Asset Tracking Integration",
    description: "RFID and barcode systems integrate for comprehensive asset management.",
    benefits: ["Real-time asset location", "Automated inventory", "Service history tracking"],
    howItWorks: "Mobile scanning and API integrations sync asset movements and maintenance activities across systems."
  }
};

const GOAL_EXPLANATIONS = {
  reduce_downtime: {
    icon: Zap,
    title: "Reduce Equipment Downtime",
    description: "Your integrations enable predictive maintenance and rapid response to equipment issues.",
    color: "text-yellow-600"
  },
  predictive: {
    icon: TrendingUp,
    title: "Implement Predictive Maintenance", 
    description: "Sensor data and analytics help predict failures before they occur.",
    color: "text-blue-600"
  },
  compliance: {
    icon: Shield,
    title: "Improve Compliance & Safety",
    description: "Automated documentation and reporting ensure regulatory compliance.",
    color: "text-green-600"
  },
  costs: {
    icon: Database,
    title: "Reduce Maintenance Costs",
    description: "Integrated data provides insights to optimize maintenance spending.",
    color: "text-purple-600"
  },
  efficiency: {
    icon: Settings,
    title: "Increase Operational Efficiency",
    description: "Streamlined workflows and automation improve overall efficiency.",
    color: "text-indigo-600"
  },
  visibility: {
    icon: Factory,
    title: "Better Asset Visibility",
    description: "Centralized data provides complete visibility into asset performance.",
    color: "text-orange-600"
  }
};

export const IntegrationExplanations = ({ data }: IntegrationExplanationsProps) => {
  const allTech = [
    ...(data.integrations.erp ? [data.integrations.erp.brand] : []),
    ...data.integrations.sensorsMonitoring.map(s => s.brand),
    ...data.integrations.automationScada.map(a => a.brand), 
    ...data.integrations.otherSystems.map(o => o.brand)
  ];
  const availableIntegrations = allTech.filter(tech => tech in INTEGRATION_DETAILS);

  return (
    <div className="space-y-8">
      {/* How MaintainX Supports Your Goals */}
      <Card className="p-8 bg-gradient-card shadow-card border-0">
        <h2 className="text-2xl font-bold mb-6">How MaintainX Supports Your Goals</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.goals.map((goal) => {
            const goalInfo = GOAL_EXPLANATIONS[goal as keyof typeof GOAL_EXPLANATIONS];
            if (!goalInfo) return null;
            
            const Icon = goalInfo.icon;
            return (
              <Card key={goal} className="p-6 hover:shadow-soft transition-all duration-200">
                <div className={`inline-flex items-center gap-3 mb-4`}>
                  <div className={`p-2 rounded-lg bg-gray-100 ${goalInfo.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">{goalInfo.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{goalInfo.description}</p>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Detailed Integration Explanations */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Integration Details</h2>
        
        {availableIntegrations.map((tech) => {
          const integration = INTEGRATION_DETAILS[tech as keyof typeof INTEGRATION_DETAILS];
          if (!integration) return null;

          return (
            <Card key={tech} className="p-8 hover:shadow-soft transition-all duration-200">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">{integration.title}</h3>
                  <p className="text-muted-foreground">{integration.description}</p>
                </div>
                <Badge className="bg-gradient-primary text-primary-foreground">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Supported
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-primary">Key Benefits</h4>
                  <ul className="space-y-2">
                    {integration.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-primary">How It Works</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {integration.howItWorks}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Implementation Timeline */}
      <Card className="p-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <h2 className="text-xl font-bold mb-6">Typical Implementation Timeline</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">1</div>
            <h3 className="font-semibold mb-2">Week 1-2</h3>
            <p className="text-sm text-muted-foreground">System assessment and API configuration</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">2</div>
            <h3 className="font-semibold mb-2">Week 3-4</h3>
            <p className="text-sm text-muted-foreground">Data migration and initial integration setup</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">3</div>
            <h3 className="font-semibold mb-2">Week 5-6</h3>
            <p className="text-sm text-muted-foreground">Testing, validation, and workflow optimization</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">✓</div>
            <h3 className="font-semibold mb-2">Week 7+</h3>
            <p className="text-sm text-muted-foreground">Full deployment and ongoing support</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
