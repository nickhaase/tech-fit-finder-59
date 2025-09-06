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
import { useToast } from "@/hooks/use-toast";
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
  Shield,
  RefreshCw,
  Bug,
  X
} from "lucide-react";

import { BrandPicker } from "@/components/BrandPicker";
import { FollowUpQuestions } from "@/components/FollowUpQuestions";
import { AssessmentData, IntegrationDetail, SensorIntegration, AutomationIntegration, OtherSystemIntegration, DataAnalyticsIntegration } from "@/types/assessment";
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
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const { toast } = useToast();

  // Helper to resolve section aliases
  const resolveSection = (sectionId: string, subcategoryId?: string) => {
    if (!config) return null;
    const section = config.sections.find(s => s.id === sectionId);
    if (!section) return null;
    
    if (subcategoryId) {
      const subcategory = section.subcategories?.find(sub => sub.id === subcategoryId);
      // Check if subcategory has an alias
      if (subcategory && (subcategory as any).aliasOf) {
        const [targetSectionId, targetSubcategoryId] = (subcategory as any).aliasOf.split('.');
        return resolveSection(targetSectionId, targetSubcategoryId);
      }
      return subcategory;
    }
    
    return section;
  };

  // Debug function (console only)
  const debugConfig = () => {
    if (!config) {
      console.log('🔍 Config Debug: Config is null');
      return;
    }
    console.log('🔍 Config Debug:', {
      sections: config.sections.length,
      status: config.status,
      hasLogos: config.sections.some(s => 
        s.options.some(o => o.logo) || 
        s.subcategories?.some(sub => sub.options.some(o => o.logo))
      )
    });
  };

  // Debug localStorage function
  const debugLocalStorage = () => {
    console.log('🔍 === localStorage Debug Info ===');
    try {
      const liveConfig = localStorage.getItem('mx_config_live');
      const draftConfig = localStorage.getItem('mx_config_draft');
      const versions = localStorage.getItem('mx_config_versions');
      
      console.log('📦 Raw localStorage contents:');
      console.log('  mx_config_live:', liveConfig ? `${Math.round(liveConfig.length / 1024)}KB` : 'MISSING');
      console.log('  mx_config_draft:', draftConfig ? `${Math.round(draftConfig.length / 1024)}KB` : 'MISSING');
      console.log('  mx_config_versions:', versions ? `${Math.round(versions.length / 1024)}KB` : 'MISSING');
      
      if (liveConfig) {
        try {
          const parsed = JSON.parse(liveConfig);
          console.log('📋 Parsed live config:');
          console.log('  Sections:', parsed.sections?.length || 0);
          console.log('  Status:', parsed.status);
          console.log('  Updated:', parsed.updatedAt);
          console.log('  Total brands:', parsed.sections?.reduce((acc: number, s: any) => 
            acc + (s.options?.length || 0) + 
            (s.subcategories?.reduce((sub: number, cat: any) => sub + (cat.options?.length || 0), 0) || 0), 0));
          console.log('  Total logos:', parsed.sections?.reduce((acc: number, s: any) => 
            acc + (s.options?.filter((o: any) => o.logo)?.length || 0) + 
            (s.subcategories?.reduce((sub: number, cat: any) => 
              sub + (cat.options?.filter((o: any) => o.logo)?.length || 0), 0) || 0), 0));
        } catch (e) {
          console.error('❌ Failed to parse live config:', e);
        }
      }
    } catch (error) {
      console.error('❌ localStorage debug failed:', error);
    }
    console.log('🔍 === End Debug Info ===');
  };

  // Load config on component mount
  useEffect(() => {
    const loadConfig = () => {
      try {
        setIsLoading(true);
        console.log('🔄 Loading config in NewTechStackAssessment...');
        const liveConfig = ConfigService.getLive();
        setConfig(liveConfig);
        console.log('✅ Config loaded successfully in NewTechStackAssessment');
      } catch (error) {
        console.error('Failed to load config:', error);
        toast({
          title: "Configuration Error",
          description: "Failed to load configuration. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [toast]);

  // Manual refresh function
  const refreshConfig = () => {
    setIsRefreshing(true);
    try {
      const newConfig = ConfigService.getLive();
      setConfig(newConfig);
      setLastRefresh(Date.now());
      debugConfig();
      toast({
        title: "Configuration refreshed",
        description: `Updated at ${new Date(newConfig.updatedAt).toLocaleTimeString()}`,
      });
    } catch (error) {
      console.error('Failed to refresh config:', error);
      toast({
        title: "Refresh failed",
        description: "Could not load latest configuration",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Listen for config changes from admin
  useEffect(() => {
    // Debug initial state
    debugConfig();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mx_config_live') {
        console.log('📡 Storage change detected for config');
        const newConfig = ConfigService.getLive();
        setConfig(newConfig);
        toast({
          title: "Configuration updated",
          description: "New logos and settings loaded",
        });
      }
    };

    const handleConfigUpdate = (event?: CustomEvent) => {
      console.log('🔄 Config update event received:', event?.detail || 'unknown');
      try {
        const newConfig = ConfigService.getLive();
        setConfig(newConfig);
        toast({
          title: "Configuration updated",
          description: "New logos and settings loaded",
        });
      } catch (error) {
        console.error('Failed to load config on update:', error);
      }
    };

    const handleForceRefresh = (event?: CustomEvent) => {
      console.log('⚡ Force refresh event received:', event?.detail || 'unknown');
      // Force complete refresh with delay
      setTimeout(() => {
        refreshConfig();
      }, 200);
    };

    const handleFeatureFlagsReady = () => {
      console.log('🏁 Feature flags ready, refreshing config...');
      refreshConfig();
    };

    const handleConfigInvalidated = () => {
      console.log('🗑️ Config invalidated, forcing fresh load...');
      refreshConfig();
    };

    const handleFocus = () => {
      console.log('👁️ Window focus detected, checking for config updates');
      refreshConfig();
    };

    // Enhanced event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('configUpdated', handleConfigUpdate as EventListener);
    window.addEventListener('forceConfigRefresh', handleForceRefresh as EventListener);
    window.addEventListener('featureFlagsReady', handleFeatureFlagsReady);
    window.addEventListener('configInvalidated', handleConfigInvalidated);
    window.addEventListener('focus', handleFocus);

    // Check for updates every 5 seconds when page is visible
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        const currentTimestamp = config.updatedAt;
        const storedConfig = localStorage.getItem('mx_config_live');
        if (storedConfig && config) {
          try {
            const parsed = JSON.parse(storedConfig);
            if (parsed.updatedAt !== config.updatedAt) {
              console.log('🔄 Periodic update detected');
              setConfig(parsed);
              toast({
                title: "Configuration updated",
                description: "Latest changes loaded automatically",
              });
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('configUpdated', handleConfigUpdate as EventListener);
      window.removeEventListener('forceConfigRefresh', handleForceRefresh as EventListener);
      window.removeEventListener('featureFlagsReady', handleFeatureFlagsReady);
      window.removeEventListener('configInvalidated', handleConfigInvalidated);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [config?.updatedAt]);
  
  // Assessment state
  const [erp, setErp] = useState<IntegrationDetail | null>(null);
  const [sensorsMonitoring, setSensorsMonitoring] = useState<SensorIntegration[]>([]);
  const [automationScada, setAutomationScada] = useState<AutomationIntegration[]>([]);
  const [otherSystems, setOtherSystems] = useState<OtherSystemIntegration[]>([]);
  const [dataAnalytics, setDataAnalytics] = useState<DataAnalyticsIntegration[]>([]);
  const [companySize, setCompanySize] = useState('');
  const [industry, setIndustry] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [kpis, setKpis] = useState<string[]>([]);
  const [timeline, setTimeline] = useState('');
  const [stakeholder, setStakeholder] = useState('');
  
  // Section skip state
  const [skippedSections, setSkippedSections] = useState<Set<string>>(new Set());
  
  // Modal state
  const [showBrandPicker, setShowBrandPicker] = useState<{
    category: any;
    type: 'erp' | 'sensors' | 'automation' | 'other' | 'data_analytics';
    subcategory?: string;
  } | null>(null);
  const [showFollowUp, setShowFollowUp] = useState<{
    brandName: string;
    category: 'erp' | 'sensors' | 'automation' | 'other' | 'data_analytics';
    subcategory?: string;
    currentDetails?: Partial<IntegrationDetail>;
  } | null>(null);

  const totalSteps = mode === 'quick' ? 8 : 10;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Mode selection
      case 1: return erp !== null || sensorsMonitoring.length > 0 || automationScada.length > 0 || otherSystems.length > 0 || skippedSections.has('erp');
      case 2: return sensorsMonitoring.length > 0 || hasNoneOrNotSure(sensorsMonitoring) || skippedSections.has('sensors');
      case 3: return automationScada.length > 0 || hasNoneOrNotSure(automationScada) || skippedSections.has('automation');
      case 4: return otherSystems.length > 0 || hasNoneOrNotSure(otherSystems) || skippedSections.has('other');
      case 5: return dataAnalytics.length > 0 || hasNoneOrNotSure(dataAnalytics) || skippedSections.has('data_analytics');
      case 6: return companySize !== '';
      case 7: return industry !== '';
      case 8: return goals.length > 0;
      case 9: return mode === 'quick' || kpis.length > 0;
      default: return false;
    }
  };

  const hasNoneOrNotSure = (systems: any[]) => {
    return systems.some(s => s.brand === 'None' || s.brand === 'Not sure');
  };

  const handleSkipSection = (sectionId: string) => {
    setSkippedSections(prev => new Set(prev).add(sectionId));
    
    // Clear any existing selections for the skipped section
    switch (sectionId) {
      case 'erp':
        setErp(null);
        break;
      case 'sensors':
        setSensorsMonitoring([]);
        break;
      case 'automation':
        setAutomationScada([]);
        break;
      case 'other':
        setOtherSystems([]);
        break;
      case 'data_analytics':
        setDataAnalytics([]);
        break;
    }
  };

  const handleUnskipSection = (sectionId: string) => {
    setSkippedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
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
        otherSystems,
        dataAnalytics
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
      otherSystems.filter(o => o.brand !== 'None' && o.brand !== 'Not sure').length +
      dataAnalytics.filter(d => d.brand !== 'None' && d.brand !== 'Not sure').length;

    return {
      compatibilityPercent: totalIntegrations > 0 ? 95 : 0,
      integrationsFound: totalIntegrations,
      goalsMatched: goals.length,
      complexity: totalIntegrations > 5 ? 'High' : totalIntegrations > 2 ? 'Medium' : 'Low'
    } as const;
  };

  const handleBrandSelection = (category: any, type: 'erp' | 'sensors' | 'automation' | 'other' | 'data_analytics', subcategory?: string) => {
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
    } else if (type === 'data_analytics') {
      const newDataAnalytics: DataAnalyticsIntegration = {
        brand: brandName,
        type: subcategory as any
      };
      setDataAnalytics(prev => {
        const existing = prev.find(d => d.brand === brandName && d.type === subcategory);
        if (existing) {
          return prev.filter(d => !(d.brand === brandName && d.type === subcategory));
        }
        return [...prev, newDataAnalytics];
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
    } else if (category === 'data_analytics') {
      setDataAnalytics(prev => 
        prev.map(d => 
          d.brand === brandName && d.type === subcategory 
            ? { ...d, ...details } 
            : d
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
              {skippedSections.has('erp') ? (
                <Card className="p-4 border-dashed bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold mb-1 text-muted-foreground">ERP Section Skipped</h4>
                      <p className="text-sm text-muted-foreground">
                        You've indicated this section is not applicable
                      </p>
                      <Badge variant="outline" className="mt-2">N/A</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnskipSection('erp')}
                    >
                      Undo Skip
                    </Button>
                  </div>
                </Card>
              ) : (
                <>
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
                  
                  <Card
                    className="p-4 cursor-pointer transition-all duration-200 hover:shadow-soft border-dashed border-muted-foreground/30 bg-muted/10"
                    onClick={() => handleSkipSection('erp')}
                  >
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <X className="w-4 h-4" />
                      <span className="text-sm font-medium">Skip - We don't use ERP systems</span>
                    </div>
                  </Card>
                </>
              )}
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
            
            {skippedSections.has('sensors') ? (
              <Card className="p-6 border-dashed bg-muted/30 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <X className="w-5 h-5 text-muted-foreground" />
                    <h4 className="font-semibold text-muted-foreground">Sensors & Monitoring Section Skipped</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You've indicated this section is not applicable to your operations
                  </p>
                  <Badge variant="outline">N/A</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnskipSection('sensors')}
                  >
                    Undo Skip
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {config.sections.find(s => s.id === 'sensors_monitoring')?.subcategories?.filter((category) => {
                    // Filter out aliased sections like platforms_historians
                    return !(category as any).aliasOf;
                  }).map((category) => (
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
                
                <Card
                  className="p-4 cursor-pointer transition-all duration-200 hover:shadow-soft border-dashed border-muted-foreground/30 bg-muted/10"
                  onClick={() => handleSkipSection('sensors')}
                >
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <X className="w-4 h-4" />
                    <span className="text-sm font-medium">Skip - We don't use sensors or monitoring equipment</span>
                  </div>
                </Card>
              </div>
            )}
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
            
            {skippedSections.has('automation') ? (
              <Card className="p-6 border-dashed bg-muted/30 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <X className="w-5 h-5 text-muted-foreground" />
                    <h4 className="font-semibold text-muted-foreground">Automation & SCADA Section Skipped</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You've indicated this section is not applicable to your operations
                  </p>
                  <Badge variant="outline">N/A</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnskipSection('automation')}
                  >
                    Undo Skip
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
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
                
                <Card
                  className="p-4 cursor-pointer transition-all duration-200 hover:shadow-soft border-dashed border-muted-foreground/30 bg-muted/10"
                  onClick={() => handleSkipSection('automation')}
                >
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <X className="w-4 h-4" />
                    <span className="text-sm font-medium">Skip - We don't use automation or SCADA systems</span>
                  </div>
                </Card>
              </div>
            )}
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
            
            {skippedSections.has('other') ? (
              <Card className="p-6 border-dashed bg-muted/30 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <X className="w-5 h-5 text-muted-foreground" />
                    <h4 className="font-semibold text-muted-foreground">Other Systems Section Skipped</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You've indicated this section is not applicable to your operations
                  </p>
                  <Badge variant="outline">N/A</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnskipSection('other')}
                  >
                    Undo Skip
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
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
                
                <Card
                  className="p-4 cursor-pointer transition-all duration-200 hover:shadow-soft border-dashed border-muted-foreground/30 bg-muted/10"
                  onClick={() => handleSkipSection('other')}
                >
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <X className="w-4 h-4" />
                    <span className="text-sm font-medium">Skip - We don't use these other systems</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
                <Database className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Data & Analytics</h3>
              <p className="text-muted-foreground">Data platforms and analytics tools in your organization</p>
            </div>
            
            {skippedSections.has('data_analytics') ? (
              <Card className="p-6 border-dashed bg-muted/30 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <X className="w-5 h-5 text-muted-foreground" />
                    <h4 className="font-semibold text-muted-foreground">Data & Analytics Section Skipped</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You've indicated this section is not applicable to your operations
                  </p>
                  <Badge variant="outline">N/A</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnskipSection('data_analytics')}
                  >
                    Undo Skip
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {config.sections.find(s => s.id === 'data_analytics')?.subcategories?.map((category) => (
                    <Card
                      key={category.id}
                      className="p-4 cursor-pointer transition-all duration-200 hover:shadow-soft"
                      onClick={() => handleBrandSelection(category, 'data_analytics', category.label)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold mb-1">{category.label}</h4>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                          {dataAnalytics.filter(d => d.type === category.label).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {dataAnalytics
                                .filter(d => d.type === category.label)
                                .slice(0, 3)
                                .map((data, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {data.brand}
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
                
                <Card
                  className="p-4 cursor-pointer transition-all duration-200 hover:shadow-soft border-dashed border-muted-foreground/30 bg-muted/10"
                  onClick={() => handleSkipSection('data_analytics')}
                >
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <X className="w-4 h-4" />
                    <span className="text-sm font-medium">Skip - We don't use data & analytics platforms</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        );

      case 6:
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

      case 7:
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

      case 8:
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
      case 9:
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
      "Data & Analytics",
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              
            </div>

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