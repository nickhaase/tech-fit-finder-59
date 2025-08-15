import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TechStackData } from "@/pages/Index";
import { ArchitectureVisualization } from "@/components/ArchitectureVisualization";
import { IntegrationExplanations } from "@/components/IntegrationExplanations";
import { CheckCircle, RefreshCw, Download, Share2 } from "lucide-react";

interface AssessmentResultsProps {
  data: TechStackData;
  onRestart: () => void;
}

export const AssessmentResults = ({ data, onRestart }: AssessmentResultsProps) => {
  const totalIntegrations = data.erp.length + data.sensors.length + data.automation.length + data.other.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-hero text-white px-6 py-3 rounded-full mb-6">
            <CheckCircle className="w-6 h-6" />
            Assessment Complete
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Your Custom MaintainX Integration Architecture
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            Based on your tech stack, here's how MaintainX seamlessly integrates with your existing systems to support your maintenance goals.
          </p>
          
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalIntegrations}</div>
              <div className="text-sm text-muted-foreground">Integrations Found</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">100%</div>
              <div className="text-sm text-muted-foreground">Compatibility</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{data.goals.length}</div>
              <div className="text-sm text-muted-foreground">Goals Supported</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button onClick={onRestart} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Retake Assessment
            </Button>
            <Button variant="gradient" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Report
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share Results
            </Button>
          </div>
        </div>

        {/* Your Tech Stack Summary */}
        <Card className="p-8 mb-8 bg-gradient-card shadow-card border-0">
          <h2 className="text-2xl font-bold mb-6">Your Technology Ecosystem</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.erp.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-primary">ERP Systems</h3>
                <div className="space-y-2">
                  {data.erp.map((tech) => (
                    <Badge key={tech} variant="secondary" className="block w-fit">
                      {tech.replace('_', ' ').toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {data.sensors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-primary">Sensors & Monitoring</h3>
                <div className="space-y-2">
                  {data.sensors.map((tech) => (
                    <Badge key={tech} variant="secondary" className="block w-fit">
                      {tech.replace('_', ' ').toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {data.automation.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-primary">Automation & SCADA</h3>
                <div className="space-y-2">
                  {data.automation.map((tech) => (
                    <Badge key={tech} variant="secondary" className="block w-fit">
                      {tech.replace('_', ' ').toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {data.other.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-primary">Other Systems</h3>
                <div className="space-y-2">
                  {data.other.map((tech) => (
                    <Badge key={tech} variant="secondary" className="block w-fit">
                      {tech.replace('_', ' ').toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Architecture Diagram */}
        <Card className="p-8 mb-8 bg-gradient-card shadow-card border-0">
          <h2 className="text-2xl font-bold mb-6">Your MaintainX Integration Architecture</h2>
          <ArchitectureVisualization data={data} />
        </Card>

        {/* Integration Explanations */}
        <IntegrationExplanations data={data} />

        {/* CTA Section */}
        <Card className="p-8 text-center bg-gradient-hero text-white border-0">
          <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Maintenance Operations?</h2>
          <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
            MaintainX integrates seamlessly with your existing infrastructure while providing powerful maintenance management capabilities that support all your goals.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button variant="secondary" size="lg" className="font-semibold">
              Schedule Demo
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              Contact Sales
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};