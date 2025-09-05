import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssessmentData } from "@/types/assessment";
import { ArchitectureVisualization } from "@/components/ArchitectureVisualization";
import { IntegrationExplanations } from "@/components/IntegrationExplanations";
import { DataFlowVisualization } from "@/components/DataFlowVisualization";
import { generateAssessmentReport } from "@/utils/pdfGenerator";
import { useToast } from "@/hooks/use-toast";
import { ConfigService } from "@/services/configService";
import { CheckCircle, RefreshCw, Download, Share2 } from "lucide-react";

interface AssessmentResultsProps {
  data: AssessmentData;
  onRestart: () => void;
}

export const AssessmentResults = ({ data, onRestart }: AssessmentResultsProps) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [animatedCounts, setAnimatedCounts] = useState({ integrations: 0, compatibility: 0, goals: 0 });
  const { toast } = useToast();
  const totalIntegrations = data.scorecard.integrationsFound;

  // Animate counters on mount
  useState(() => {
    const timeout = setTimeout(() => {
      setAnimatedCounts({
        integrations: totalIntegrations,
        compatibility: 100,
        goals: data.goals.length
      });
    }, 500);
    return () => clearTimeout(timeout);
  });

  const handleDownloadReport = async () => {
    setIsGeneratingPdf(true);
    try {
      const appConfig = ConfigService.getLive();
      const pdfBlob = await generateAssessmentReport(data, appConfig);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MaintainX-Integration-Assessment-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Downloaded",
        description: "Your professional integration assessment report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareResults = () => {
    const shareData = {
      title: 'MaintainX Integration Assessment Results',
      text: `I just completed a MaintainX integration assessment and found ${totalIntegrations} compatible integrations with 100% compatibility!`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      toast({
        title: "Results Copied",
        description: "Assessment results have been copied to your clipboard.",
      });
    }
  };

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
            <div className="text-center animate-fade-in">
              <div className="text-3xl font-bold text-primary animate-counter-up">{animatedCounts.integrations}</div>
              <div className="text-sm text-muted-foreground">Integrations Found</div>
            </div>
            <div className="text-center animate-fade-in-delay">
              <div className="text-3xl font-bold text-accent animate-counter-up">{animatedCounts.compatibility}%</div>
              <div className="text-sm text-muted-foreground">Compatibility</div>
            </div>
            <div className="text-center animate-fade-in-delay-2">
              <div className="text-3xl font-bold text-primary animate-counter-up">{animatedCounts.goals}</div>
              <div className="text-sm text-muted-foreground">Goals Supported</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button onClick={onRestart} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Retake Assessment
            </Button>
            <Button 
              variant="gradient" 
              className="flex items-center gap-2" 
              onClick={handleDownloadReport}
              disabled={isGeneratingPdf}
            >
              <Download className={`w-4 h-4 ${isGeneratingPdf ? 'animate-spin' : ''}`} />
              {isGeneratingPdf ? 'Generating...' : 'Download Report'}
            </Button>
            <Button variant="outline" className="flex items-center gap-2" onClick={handleShareResults}>
              <Share2 className="w-4 h-4" />
              Share Results
            </Button>
          </div>
        </div>

        {/* Your Tech Stack Summary */}
        <Card className="p-8 mb-8 bg-gradient-card shadow-card border-0 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6">Your Technology Ecosystem</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.integrations.erp && (
              <div className="animate-slide-in">
                <h3 className="font-semibold mb-3 text-primary">ERP Systems</h3>
                <div className="space-y-2">
                  <Badge variant="secondary" className="block w-fit animate-scale-in">
                    {data.integrations.erp.brand}
                  </Badge>
                </div>
              </div>
            )}
            {data.integrations.sensorsMonitoring.length > 0 && (
              <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
                <h3 className="font-semibold mb-3 text-primary">Sensors & Monitoring</h3>
                <div className="space-y-2">
                  {data.integrations.sensorsMonitoring.map((sensor, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="block w-fit animate-scale-in"
                      style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
                    >
                      {sensor.brand}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {data.integrations.automationScada.length > 0 && (
              <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
                <h3 className="font-semibold mb-3 text-primary">Automation & SCADA</h3>
                <div className="space-y-2">
                  {data.integrations.automationScada.map((automation, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="block w-fit animate-scale-in"
                      style={{ animationDelay: `${0.2 + idx * 0.05}s` }}
                    >
                      {automation.brand}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {data.integrations.otherSystems.length > 0 && (
              <div className="animate-slide-in" style={{ animationDelay: '0.3s' }}>
                <h3 className="font-semibold mb-3 text-primary">Other Systems</h3>
                <div className="space-y-2">
                  {data.integrations.otherSystems.map((other, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="block w-fit animate-scale-in"
                      style={{ animationDelay: `${0.3 + idx * 0.05}s` }}
                    >
                      {other.brand}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Data Flow Visualization */}
        <Card className="p-8 mb-8 bg-gradient-card shadow-card border-0 animate-fade-in-delay">
          <DataFlowVisualization data={data} />
        </Card>

        {/* Architecture Diagram */}
        <Card className="p-8 mb-8 bg-gradient-card shadow-card border-0 animate-fade-in-delay-2">
          <h2 className="text-2xl font-bold mb-6">Your MaintainX Integration Architecture</h2>
          <ArchitectureVisualization data={data} />
        </Card>

        {/* Integration Explanations */}
        <IntegrationExplanations data={data} />

        {/* CTA Section */}
        <Card className="p-8 text-center bg-gradient-hero text-white border-0 animate-fade-in-delay-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-20 animate-pulse-glow"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Maintenance Operations?</h2>
            <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
              MaintainX integrates seamlessly with your existing infrastructure while providing powerful maintenance management capabilities that support all your goals.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="secondary" size="lg" className="font-semibold animate-scale-in">
                Schedule Demo
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 animate-scale-in" style={{ animationDelay: '0.1s' }}>
                Contact Sales
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};