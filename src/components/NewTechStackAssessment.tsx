import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Factory, 
  Database, 
  Cpu, 
  Settings,
  Zap,
  Target,
  Building,
  Shield
} from "lucide-react";

import { BrandPicker } from "@/components/BrandPicker";
import { FollowUpQuestions } from "@/components/FollowUpQuestions";
import { AssessmentData, IntegrationDetail, SensorIntegration, AutomationIntegration, OtherSystemIntegration } from "@/types/assessment";
import { ConfigService } from "@/services/configService";
import { AppConfig } from "@/types/config";
import { 
  COMPANY_SIZES,
  INDUSTRIES,
  GOALS,
  KPIS
} from "@/data/brandCatalogs";

interface NewTechStackAssessmentProps {
  onComplete: (data: AssessmentData) => void;
}

export const NewTechStackAssessment = ({ onComplete }: NewTechStackAssessmentProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [mode, setMode] = useState<'quick' | 'advanced'>('quick');
  const [config, setConfig] = useState<AppConfig>(() => ConfigService.getLive());

  // Listen for config changes from admin
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mx_config_live') {
        setConfig(ConfigService.getLive());
      }
    };

    const handleConfigUpdate = () => {
      setConfig(ConfigService.getLive());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('configUpdated', handleConfigUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('configUpdated', handleConfigUpdate);
    };
  }, []);
  
  // Assessment state
  const [erp, setErp] = useState<IntegrationDetail | null>(null);
  const [sensorsMonitoring, setSensorsMonitoring] = useState<SensorIntegration[]>([]);
  const [automationScada, setAutomationScada] = useState<AutomationIntegration[]>([]);
  const [otherSystems, setOtherSystems] = useState<OtherSystemIntegration[]>([]);
  const [companySize, setCompanySize] = useState('');
  const [industry, setIndustry] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [kpis, setKpis] = useState<string[]>([]);
  const [timeline, setTimeline] = useState('');
  const [stakeholder, setStakeholder] = useState('');
  
  // Modal state
  const [showBrandPicker, setShowBrandPicker] = useState<{
    category: any;
    type: 'erp' | 'sensors' | 'automation' | 'other';
    subcategory?: string;
  } | null>(null);
  const [showFollowUp, setShowFollowUp] = useState<{
    brandName: string;
    category: 'erp' | 'sensors' | 'automation' | 'other';
    subcategory?: string;
    currentDetails?: Partial<IntegrationDetail>;
  } | null>(null);

  const totalSteps = mode === 'quick' ? 7 : 9;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Mode selection
      case 1: return erp !== null || sensorsMonitoring.length > 0 || automationScada.length > 0 || otherSystems.length > 0;
      case 2: return sensorsMonitoring.length > 0 || hasNoneOrNotSure(sensorsMonitoring);
      case 3: return automationScada.length > 0 || hasNoneOrNotSure(automationScada);
      case 4: return otherSystems.length > 0 || hasNoneOrNotSure(otherSystems);
      case 5: return companySize !== '';
      case 6: return industry !== '';
      case 7: return goals.length > 0;
      case 8: return mode === 'quick' || kpis.length > 0;
      default: return false;
    }
  };

  const hasNoneOrNotSure = (systems: any[]) => {
    return systems.some(s => s.brand === 'None' || s.brand === 'Not sure');
  };

  const handleComplete = () => {
    const assessmentData: AssessmentData = {
      mode,
      company: {
        size: companySize as any,
        industry
      },
      goals,
      kpis: mode === 'advanced' ? kpis : undefined,
      timeline: mode === 'advanced' ? timeline : undefined,
      stakeholder: mode === 'advanced' ? stakeholder : undefined,
      integrations: {
        erp: erp || undefined,
        sensorsMonitoring,
        automationScada,
        otherSystems
      },
      integrationPatterns: generateIntegrationPatterns(),
      scorecard: calculateScorecard()
    };

    onComplete(assessmentData);
  };

  const generateIntegrationPatterns = () => {
    const patterns = [];
    
    if (erp) {
      patterns.push({
        from: erp.brand,
        to: 'MaintainX',
        protocol: erp.protocol?.[0] || 'REST API',
        realtime: erp.frequency === 'real-time'
      });
    }

    sensorsMonitoring.forEach(sensor => {
      if (sensor.brand !== 'None' && sensor.brand !== 'Not sure') {
        patterns.push({
          from: sensor.brand,
          to: 'MaintainX',
          protocol: sensor.protocol?.[0] || 'MQTT',
          realtime: true
        });
      }
    });

    automationScada.forEach(automation => {
      if (automation.brand !== 'None' && automation.brand !== 'Not sure') {
        patterns.push({
          from: automation.brand,
          to: 'MaintainX',
          protocol: automation.protocol?.[0] || 'OPC UA',
          realtime: automation.type === 'SCADA'
        });
      }
    });

    return patterns;
  };

  const calculateScorecard = () => {
    const totalIntegrations = 
      (erp ? 1 : 0) + 
      sensorsMonitoring.filter(s => s.brand !== 'None' && s.brand !== 'Not sure').length +
      automationScada.filter(a => a.brand !== 'None' && a.brand !== 'Not sure').length +
      otherSystems.filter(o => o.brand !== 'None' && o.brand !== 'Not sure').length;

    return {
      compatibilityPercent: totalIntegrations > 0 ? 95 : 0,
      integrationsFound: totalIntegrations,
      goalsMatched: goals.length,
      complexity: totalIntegrations > 5 ? 'High' : totalIntegrations > 2 ? 'Medium' : 'Low'
    } as const;
  };

  const handleBrandSelection = (category: any, type: 'erp' | 'sensors' | 'automation' | 'other', subcategory?: string) => {
    setShowBrandPicker({ category, type, subcategory });
  };

  const handleBrandToggle = (brandId: string, brandName: string) => {
    const { type, subcategory } = showBrandPicker!;
    
    if (type === 'erp') {
      if (brandId === 'none' || brandId === 'not_sure') {
        setErp({ brand: brandName } as IntegrationDetail);
      } else {
        setErp({ brand: brandName } as IntegrationDetail);
        // Show follow-up questions for non-none/not-sure selections
        if (mode === 'advanced') {
          setShowFollowUp({ brandName, category: type });
        }
      }
    } else if (type === 'sensors') {
      const newSensor: SensorIntegration = {
        brand: brandName,
        category: subcategory as any
      };
      setSensorsMonitoring(prev => {
        const existing = prev.find(s => s.brand === brandName && s.category === subcategory);
        if (existing) {
          return prev.filter(s => !(s.brand === brandName && s.category === subcategory));
        }
        return [...prev, newSensor];
      });
      
      if (brandId !== 'none' && brandId !== 'not_sure' && mode === 'advanced') {
        setShowFollowUp({ brandName, category: type, subcategory });
      }
    } else if (type === 'automation') {
      const newAutomation: AutomationIntegration = {
        brand: brandName,
        type: subcategory as any
      };
      setAutomationScada(prev => {
        const existing = prev.find(a => a.brand === brandName && a.type === subcategory);
        if (existing) {
          return prev.filter(a => !(a.brand === brandName && a.type === subcategory));
        }
        return [...prev, newAutomation];
      });
      
      if (brandId !== 'none' && brandId !== 'not_sure' && mode === 'advanced') {
        setShowFollowUp({ brandName, category: type, subcategory });
      }
    } else if (type === 'other') {
      const newOther: OtherSystemIntegration = {
        brand: brandName,
        type: subcategory as any
      };
      setOtherSystems(prev => {
        const existing = prev.find(o => o.brand === brandName && o.type === subcategory);
        if (existing) {
          return prev.filter(o => !(o.brand === brandName && o.type === subcategory));
        }
        return [...prev, newOther];
      });

      if (brandId !== 'none' && brandId !== 'not_sure' && mode === 'advanced') {
        setShowFollowUp({ brandName, category: type, subcategory });
      }
    }
  };

  const handleFollowUpComplete = (details: IntegrationDetail) => {
    const { category, subcategory, brandName } = showFollowUp!;
    
    if (category === 'erp') {
      setErp(details);
    } else if (category === 'sensors') {
      setSensorsMonitoring(prev => 
        prev.map(s => 
          s.brand === brandName && s.category === subcategory 
            ? { ...s, ...details } 
            : s
        )
      );
    } else if (category === 'automation') {
      setAutomationScada(prev => 
        prev.map(a => 
          a.brand === brandName && a.type === subcategory 
            ? { ...a, ...details } 
            : a
        )
      );
    } else if (category === 'other') {
      setOtherSystems(prev => 
        prev.map(o => 
          o.brand === brandName && o.type === subcategory 
            ? { ...o, ...details } 
            : o
        )
      );
    }
  };

  const toggleGoal = (goal: string) => {
    setGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const toggleKPI = (kpi: string) => {
    setKpis(prev => 
      prev.includes(kpi) 
        ? prev.filter(k => k !== kpi)
        : [...prev, kpi]
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Choose Your Assessment Mode</h3>
              <p className="text-muted-foreground">Select how detailed you'd like your integration assessment to be</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card
                className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-soft ${
                  mode === 'quick'
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setMode('quick')}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Quick Mode</h4>
                  {mode === 'quick' && <CheckCircle className="w-6 h-6 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Fast assessment focusing on your main systems and goals. Perfect for getting started quickly.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">2-3 minutes</Badge>
                  <Badge variant="outline">Essential details</Badge>
                </div>
              </Card>

              <Card
                className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-soft ${
                  mode === 'advanced'
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setMode('advanced')}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Advanced Mode</h4>
                  {mode === 'advanced' && <CheckCircle className="w-6 h-6 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Comprehensive assessment with detailed technical specifications and integration patterns.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">5-7 minutes</Badge>
                  <Badge variant="outline">Technical depth</Badge>
                </div>
              </Card>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
                <Database className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Enterprise Resource Planning (ERP)</h3>
              <p className="text-muted-foreground">Select your current ERP system</p>
            </div>
            
            <div className="grid md:grid-cols-1 gap-4">
              <Card
                className="p-4 cursor-pointer transition-all duration-200 hover:shadow-soft border-dashed"
                onClick={() => handleBrandSelection(config.sections.find(s => s.id === 'erp'), 'erp')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold mb-1">Select ERP System</h4>
                    <p className="text-sm text-muted-foreground">
                      Choose your enterprise resource planning system
                    </p>
                    {erp && (
                      <Badge variant="secondary" className="mt-2">
                        {erp.brand}
                      </Badge>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
                <Cpu className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Machine Sensors & Monitoring</h3>
              <p className="text-muted-foreground">What sensors and monitoring equipment do you use?</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {config.sections.find(s => s.id === 'sensors_monitoring')?.subcategories?.map((category) => (
                <Card
                  key={category.id}
                  className="p-4 cursor-pointer transition-all duration-200 hover:shadow-soft"
                  onClick={() => handleBrandSelection(category, 'sensors', category.label)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold mb-1">{category.label}</h4>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                      {sensorsMonitoring.filter(s => s.category === category.label).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sensorsMonitoring
                            .filter(s => s.category === category.label)
                            .slice(0, 3)
                            .map((sensor, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {sensor.brand}
                              </Badge>
                            ))}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
                <Settings className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Industrial Automation & SCADA</h3>
              <p className="text-muted-foreground">Select your automation and control systems</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {config.sections.find(s => s.id === 'automation_scada')?.subcategories?.map((category) => (
                <Card
                  key={category.id}
                  className="p-4 cursor-pointer transition-all duration-200 hover:shadow-soft"
                  onClick={() => handleBrandSelection(category, 'automation', category.label)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold mb-1">{category.label}</h4>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                      {automationScada.filter(a => a.type === category.label).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {automationScada
                            .filter(a => a.type === category.label)
                            .slice(0, 3)
                            .map((automation, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {automation.brand}
                              </Badge>
                            ))}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
                <Factory className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Other Systems</h3>
              <p className="text-muted-foreground">Additional maintenance and asset management tools</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {config.sections.find(s => s.id === 'other_systems')?.subcategories?.map((category) => (
                <Card
                  key={category.id}
                  className="p-4 cursor-pointer transition-all duration-200 hover:shadow-soft"
                  onClick={() => handleBrandSelection(category, 'other', category.label)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold mb-1">{category.label}</h4>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                      {otherSystems.filter(o => o.type === category.label).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {otherSystems
                            .filter(o => o.type === category.label)
                            .slice(0, 3)
                            .map((other, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {other.brand}
                              </Badge>
                            ))}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
                <Building className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Company Size</h3>
              <p className="text-muted-foreground">What's your organization size?</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {COMPANY_SIZES.map((size) => (
                <Card
                  key={size.id}
                  className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-soft ${
                    companySize === size.id
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setCompanySize(size.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{size.name}</span>
                    {companySize === size.id && (
                      <CheckCircle className="w-6 h-6 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
                <Factory className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Industry</h3>
              <p className="text-muted-foreground">What industry are you in?</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {INDUSTRIES.map((ind) => (
                <Card
                  key={ind.id}
                  className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-soft ${
                    industry === ind.id
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setIndustry(ind.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{ind.name}</span>
                    {industry === ind.id && (
                      <CheckCircle className="w-6 h-6 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
                <Target className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Goals & Objectives</h3>
              <p className="text-muted-foreground">What are your main maintenance goals?</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {GOALS.map((goal) => (
                <Card
                  key={goal.id}
                  className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-soft ${
                    goals.includes(goal.id)
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => toggleGoal(goal.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{goal.name}</span>
                    {goals.includes(goal.id) && (
                      <CheckCircle className="w-6 h-6 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 8:
        return mode === 'advanced' ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">KPIs & Additional Details</h3>
              <p className="text-muted-foreground">Help us understand your priorities and timeline</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-3 block">Top 3 KPIs to Improve</Label>
                <div className="grid md:grid-cols-2 gap-3">
                  {KPIS.map((kpi) => (
                    <div key={kpi.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={kpi.id}
                        checked={kpis.includes(kpi.id)}
                        onCheckedChange={() => toggleKPI(kpi.id)}
                        disabled={kpis.length >= 3 && !kpis.includes(kpi.id)}
                      />
                      <Label htmlFor={kpi.id} className="text-sm">{kpi.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="timeline" className="text-base font-medium">Implementation Timeline</Label>
                  <RadioGroup value={timeline} onValueChange={setTimeline} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="immediate" id="immediate" />
                      <Label htmlFor="immediate">Immediate (0-3 months)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="short" id="short" />
                      <Label htmlFor="short">Short-term (3-6 months)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium">Medium-term (6-12 months)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="long" id="long" />
                      <Label htmlFor="long">Long-term (12+ months)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="stakeholder" className="text-base font-medium">Primary Stakeholder</Label>
                  <RadioGroup value={stakeholder} onValueChange={setStakeholder} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="operations" id="operations" />
                      <Label htmlFor="operations">Operations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="maintenance" id="maintenance" />
                      <Label htmlFor="maintenance">Maintenance</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="reliability" id="reliability" />
                      <Label htmlFor="reliability">Reliability</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="it_ot" id="it_ot" />
                      <Label htmlFor="it_ot">IT/OT</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    const titles = [
      "Assessment Mode",
      "ERP Systems", 
      "Sensors & Monitoring",
      "Automation & SCADA",
      "Other Systems",
      "Company Size",
      "Industry",
      "Goals & Objectives"
    ];
    
    if (mode === 'advanced') {
      titles.push("KPIs & Timeline");
    }
    
    return titles[currentStep] || "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-4 py-2 rounded-full mb-4">
            <Factory className="w-5 h-5" />
            MaintainX Integration Assessment
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Discover How MaintainX Integrates With Your Tech Stack
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Answer questions about your current systems and see how MaintainX can seamlessly integrate with your infrastructure.
          </p>
        </div>

        <Card className="p-8 bg-gradient-card shadow-card border-0">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-muted-foreground">
                Step {currentStep + 1} of {totalSteps} - {getStepTitle()}
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {mode === 'quick' ? 'Quick Mode' : 'Advanced Mode'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}% Complete
                </span>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {renderStepContent()}

          {/* Brand Picker Modal */}
          {showBrandPicker && (
            <BrandPicker
              category={showBrandPicker.category}
              selectedBrands={[]} // We'll handle selection state internally
              onBrandToggle={handleBrandToggle}
              onClose={() => setShowBrandPicker(null)}
              allowMultiple={showBrandPicker.type !== 'erp'}
            />
          )}

          {/* Follow-up Questions Modal */}
          {showFollowUp && (
            <FollowUpQuestions
              brandName={showFollowUp.brandName}
              category={showFollowUp.category}
              subcategory={showFollowUp.subcategory}
              currentDetails={showFollowUp.currentDetails}
              onComplete={handleFollowUpComplete}
              onClose={() => setShowFollowUp(null)}
              mode={mode}
            />
          )}

          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            {currentStep < totalSteps - 1 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                variant="gradient"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canProceed()}
                variant="hero"
              >
                View Results
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};