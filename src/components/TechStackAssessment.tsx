import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AssessmentData } from "@/types/assessment";
import { CheckCircle, ArrowRight, ArrowLeft, Factory, Database, Cpu, Settings } from "lucide-react";

// Import logos
import sapLogo from "@/assets/logos/sap-logo.png";
import oracleLogo from "@/assets/logos/oracle-logo.png";
import microsoftLogo from "@/assets/logos/microsoft-logo.png";
import workdayLogo from "@/assets/logos/workday-logo.png";
import netsuiteLogo from "@/assets/logos/netsuite-logo.png";
import siemensLogo from "@/assets/logos/siemens-logo.png";
import schneiderLogo from "@/assets/logos/schneider-logo.png";

interface TechStackAssessmentProps {
  onComplete: (data: AssessmentData) => void;
}

interface TechOption {
  id: string;
  name: string;
  description: string;
  logo?: string;
  followUpQuestions?: {
    id: string;
    question: string;
    options: { id: string; name: string }[];
  }[];
}

const TECH_OPTIONS = {
  erp: [
    { 
      id: "sap", 
      name: "SAP", 
      description: "Enterprise Resource Planning",
      logo: sapLogo,
      followUpQuestions: [{
        id: "sap_version",
        question: "Which SAP system are you using?",
        options: [
          { id: "s4hana", name: "SAP S/4HANA" },
          { id: "ecc", name: "SAP ECC" },
          { id: "r3", name: "SAP R/3" },
          { id: "bydesign", name: "SAP Business ByDesign" },
          { id: "b1", name: "SAP Business One" },
          { id: "successfactors", name: "SAP SuccessFactors" }
        ]
      }]
    },
    { 
      id: "oracle", 
      name: "Oracle ERP", 
      description: "Cloud-based ERP solution",
      logo: oracleLogo,
      followUpQuestions: [{
        id: "oracle_version",
        question: "Which Oracle system are you using?",
        options: [
          { id: "cloud_erp", name: "Oracle Cloud ERP" },
          { id: "ebusiness", name: "Oracle E-Business Suite" },
          { id: "jdedwards", name: "JD Edwards" },
          { id: "peoplesoft", name: "PeopleSoft" },
          { id: "netsuite_oracle", name: "NetSuite (Oracle)" }
        ]
      }]
    },
    { 
      id: "microsoft", 
      name: "Microsoft Dynamics", 
      description: "Business applications platform",
      logo: microsoftLogo,
      followUpQuestions: [{
        id: "dynamics_version",
        question: "Which Microsoft Dynamics system?",
        options: [
          { id: "dynamics_365", name: "Dynamics 365" },
          { id: "dynamics_nav", name: "Dynamics NAV" },
          { id: "dynamics_ax", name: "Dynamics AX" },
          { id: "dynamics_gp", name: "Dynamics GP" },
          { id: "dynamics_sl", name: "Dynamics SL" }
        ]
      }]
    },
    { id: "workday", name: "Workday", description: "Financial & HR management", logo: workdayLogo },
    { id: "netsuite", name: "NetSuite", description: "Cloud business suite", logo: netsuiteLogo },
    { id: "other_erp", name: "Other ERP", description: "Custom or other ERP systems" },
  ],
  sensors: [
    { id: "iot_sensors", name: "IoT Sensors", description: "Temperature, pressure, vibration sensors" },
    { id: "smart_meters", name: "Smart Meters", description: "Energy and utility monitoring" },
    { id: "condition_monitoring", name: "Condition Monitoring", description: "Predictive maintenance sensors" },
    { id: "environmental", name: "Environmental Sensors", description: "Air quality, humidity monitoring" },
    { id: "safety_sensors", name: "Safety Sensors", description: "Gas detection, motion sensors" },
  ],
  automation: [
    { 
      id: "scada", 
      name: "SCADA Systems", 
      description: "Supervisory control and data acquisition",
      followUpQuestions: [{
        id: "scada_vendor",
        question: "Which SCADA system vendor?",
        options: [
          { id: "wonderware", name: "AVEVA (Wonderware)" },
          { id: "ge_ifix", name: "GE iFIX" },
          { id: "rockwell", name: "Rockwell FactoryTalk" },
          { id: "schneider_vijeo", name: "Schneider Electric Vijeo Citect" },
          { id: "siemens_wincc", name: "Siemens WinCC" },
          { id: "other_scada", name: "Other SCADA" }
        ]
      }]
    },
    { 
      id: "plc", 
      name: "PLC Systems", 
      description: "Programmable logic controllers",
      followUpQuestions: [{
        id: "plc_vendor",
        question: "Which PLC manufacturer?",
        options: [
          { id: "allen_bradley", name: "Allen-Bradley (Rockwell)" },
          { id: "siemens_plc", name: "Siemens" },
          { id: "schneider_plc", name: "Schneider Electric" },
          { id: "mitsubishi", name: "Mitsubishi" },
          { id: "omron", name: "Omron" },
          { id: "abb_plc", name: "ABB" }
        ]
      }]
    },
    { id: "dcs", name: "DCS", description: "Distributed control systems" },
    { id: "mes", name: "MES", description: "Manufacturing execution systems" },
    { id: "hmi", name: "HMI", description: "Human-machine interfaces" },
  ],
  other: [
    { id: "cmms", name: "Legacy CMMS", description: "Existing maintenance management" },
    { id: "asset_tracking", name: "Asset Tracking", description: "RFID, barcode systems" },
    { id: "inventory", name: "Inventory Management", description: "Parts and supplies tracking" },
    { id: "workflow", name: "Workflow Tools", description: "Business process management" },
  ]
};

const COMPANY_SIZES = [
  { id: "startup", name: "Startup (1-50 employees)" },
  { id: "small", name: "Small Business (51-200 employees)" },
  { id: "medium", name: "Medium Enterprise (201-1000 employees)" },
  { id: "large", name: "Large Enterprise (1000+ employees)" },
];

const INDUSTRIES = [
  { id: "manufacturing", name: "Manufacturing" },
  { id: "energy", name: "Energy & Utilities" },
  { id: "healthcare", name: "Healthcare" },
  { id: "food", name: "Food & Beverage" },
  { id: "automotive", name: "Automotive" },
  { id: "aerospace", name: "Aerospace & Defense" },
  { id: "other", name: "Other" },
];

const GOALS = [
  { id: "reduce_downtime", name: "Reduce Equipment Downtime" },
  { id: "predictive", name: "Implement Predictive Maintenance" },
  { id: "compliance", name: "Improve Compliance & Safety" },
  { id: "costs", name: "Reduce Maintenance Costs" },
  { id: "efficiency", name: "Increase Operational Efficiency" },
  { id: "visibility", name: "Better Asset Visibility" },
];

export const TechStackAssessment = ({ onComplete }: TechStackAssessmentProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTech, setSelectedTech] = useState<{
    erp: string[];
    sensors: string[];
    automation: string[];
    other: string[];
  }>({
    erp: [],
    sensors: [],
    automation: [],
    other: [],
  });
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});
  const [showFollowUp, setShowFollowUp] = useState<string | null>(null);

  const totalSteps = 7;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const toggleTechSelection = (category: keyof typeof selectedTech, tech: string) => {
    setSelectedTech(prev => ({
      ...prev,
      [category]: prev[category].includes(tech)
        ? prev[category].filter(t => t !== tech)
        : [...prev[category], tech]
    }));
  };

  const toggleGoal = (goal: string) => {
    setGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedTech.erp.length > 0;
      case 1: return selectedTech.sensors.length > 0;
      case 2: return selectedTech.automation.length > 0;
      case 3: return selectedTech.other.length > 0;
      case 4: return companySize !== "";
      case 5: return industry !== "";
      case 6: return goals.length > 0;
      default: return false;
    }
  };

  const handleComplete = () => {
    const assessmentData: AssessmentData = {
      mode: 'quick',
      company: {
        size: companySize as 'startup' | 'small' | 'medium' | 'enterprise',
        industry: industry
      },
      goals: goals,
      integrations: {
        sensorsMonitoring: selectedTech.sensors.map(sensor => ({
          brand: sensor,
          category: 'IoT Sensors' as const
        })),
        automationScada: selectedTech.automation.map(automation => ({
          brand: automation,
          type: 'SCADA' as const
        })),
        otherSystems: selectedTech.other.map(other => ({
          brand: other,
          type: 'Legacy CMMS/EAM' as const
        }))
      },
      integrationPatterns: [],
      scorecard: {
        compatibilityPercent: 95,
        integrationsFound: selectedTech.erp.length + selectedTech.sensors.length + selectedTech.automation.length + selectedTech.other.length,
        goalsMatched: goals.length,
        complexity: 'Medium' as const
      }
    };

    // Add ERP integration if selected
    if (selectedTech.erp.length > 0) {
      assessmentData.integrations.erp = {
        brand: selectedTech.erp[0]
      };
    }

    onComplete(assessmentData);
  };

  const handleFollowUpAnswer = (questionId: string, answer: string) => {
    setFollowUpAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    setShowFollowUp(null);
  };

  const renderStepContent = () => {
    const stepIcons = [Database, Cpu, Settings, Factory];
    
    switch (currentStep) {
      case 0:
        return (
          <TechSelectionStep
            title="Enterprise Resource Planning (ERP)"
            description="Select your current ERP systems"
            icon={Database}
            options={TECH_OPTIONS.erp}
            selected={selectedTech.erp}
            onToggle={(tech) => toggleTechSelection("erp", tech)}
            onShowFollowUp={setShowFollowUp}
            followUpAnswers={followUpAnswers}
          />
        );
      case 1:
        return (
          <TechSelectionStep
            title="Machine Sensors & Monitoring"
            description="What sensors and monitoring equipment do you use?"
            icon={Cpu}
            options={TECH_OPTIONS.sensors}
            selected={selectedTech.sensors}
            onToggle={(tech) => toggleTechSelection("sensors", tech)}
          />
        );
      case 2:
        return (
          <TechSelectionStep
            title="Industrial Automation & SCADA"
            description="Select your automation and control systems"
            icon={Settings}
            options={TECH_OPTIONS.automation}
            selected={selectedTech.automation}
            onToggle={(tech) => toggleTechSelection("automation", tech)}
            onShowFollowUp={setShowFollowUp}
            followUpAnswers={followUpAnswers}
          />
        );
      case 3:
        return (
          <TechSelectionStep
            title="Other Systems"
            description="Additional maintenance and asset management tools"
            icon={Factory}
            options={TECH_OPTIONS.other}
            selected={selectedTech.other}
            onToggle={(tech) => toggleTechSelection("other", tech)}
          />
        );
      case 4:
        return (
          <SelectionStep
            title="Company Size"
            description="What's your organization size?"
            options={COMPANY_SIZES}
            selected={companySize}
            onSelect={setCompanySize}
          />
        );
      case 5:
        return (
          <SelectionStep
            title="Industry"
            description="What industry are you in?"
            options={INDUSTRIES}
            selected={industry}
            onSelect={setIndustry}
          />
        );
      case 6:
        return (
          <MultiSelectStep
            title="Goals & Objectives"
            description="What are your main maintenance goals?"
            options={GOALS}
            selected={goals}
            onToggle={toggleGoal}
          />
        );
      default:
        return null;
    }
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
            Answer a few questions about your current systems and see how MaintainX can seamlessly integrate with your infrastructure.
          </p>
        </div>

        <Card className="p-8 bg-gradient-card shadow-card border-0">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
              </h2>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {renderStepContent()}

          {/* Follow-up Question Modal */}
          {showFollowUp && (
            <FollowUpModal
              techId={showFollowUp}
              onClose={() => setShowFollowUp(null)}
              onAnswer={handleFollowUpAnswer}
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

interface TechSelectionStepProps {
  title: string;
  description: string;
  icon: React.ElementType;
  options: TechOption[];
  selected: string[];
  onToggle: (id: string) => void;
  onShowFollowUp?: (techId: string) => void;
  followUpAnswers?: Record<string, string>;
}

const TechSelectionStep = ({ 
  title, 
  description, 
  icon: Icon, 
  options, 
  selected, 
  onToggle, 
  onShowFollowUp,
  followUpAnswers 
}: TechSelectionStepProps) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
        <Icon className="w-8 h-8 text-primary-foreground" />
      </div>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
    
    <div className="grid md:grid-cols-2 gap-4">
      {options.map((option) => (
        <Card
          key={option.id}
          className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-soft ${
            selected.includes(option.id)
              ? "border-primary bg-primary/5 shadow-soft"
              : "hover:border-primary/50"
          }`}
          onClick={() => onToggle(option.id)}
        >
          <div className="flex items-start gap-3">
            {option.logo && (
              <img 
                src={option.logo} 
                alt={`${option.name} logo`}
                className="w-8 h-8 object-contain flex-shrink-0 mt-1"
              />
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold mb-1">{option.name}</h4>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                  {option.followUpQuestions && selected.includes(option.id) && followUpAnswers?.[option.followUpQuestions[0].id] && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {followUpAnswers[option.followUpQuestions[0].id]}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {option.followUpQuestions && selected.includes(option.id) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowFollowUp?.(option.id);
                      }}
                      className="text-xs px-2 py-1 h-auto"
                    >
                      Details
                    </Button>
                  )}
                  {selected.includes(option.id) && (
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

interface SelectionStepProps {
  title: string;
  description: string;
  options: { id: string; name: string }[];
  selected: string;
  onSelect: (id: string) => void;
}

const SelectionStep = ({ title, description, options, selected, onSelect }: SelectionStepProps) => (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
    
    <div className="grid md:grid-cols-2 gap-4">
      {options.map((option) => (
        <Card
          key={option.id}
          className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-soft ${
            selected === option.id
              ? "border-primary bg-primary/5 shadow-soft"
              : "hover:border-primary/50"
          }`}
          onClick={() => onSelect(option.id)}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{option.name}</span>
            {selected === option.id && (
              <CheckCircle className="w-6 h-6 text-primary" />
            )}
          </div>
        </Card>
      ))}
    </div>
  </div>
);

interface MultiSelectStepProps {
  title: string;
  description: string;
  options: { id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}

const MultiSelectStep = ({ title, description, options, selected, onToggle }: MultiSelectStepProps) => (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
    
    <div className="grid md:grid-cols-2 gap-4">
      {options.map((option) => (
        <Card
          key={option.id}
          className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-soft ${
            selected.includes(option.id)
              ? "border-primary bg-primary/5 shadow-soft"
              : "hover:border-primary/50"
          }`}
          onClick={() => onToggle(option.id)}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{option.name}</span>
            {selected.includes(option.id) && (
              <CheckCircle className="w-6 h-6 text-primary" />
            )}
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const FollowUpModal = ({ 
  techId, 
  onClose, 
  onAnswer 
}: { 
  techId: string; 
  onClose: () => void; 
  onAnswer: (questionId: string, answer: string) => void; 
}) => {
  // Find the tech option and its follow-up questions
  const allOptions = [...TECH_OPTIONS.erp, ...TECH_OPTIONS.automation];
  const techOption = allOptions.find(option => option.id === techId);
  const followUpQuestion = techOption?.followUpQuestions?.[0];

  if (!followUpQuestion) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6 bg-gradient-card">
        <h3 className="text-xl font-bold mb-4">{followUpQuestion.question}</h3>
        <div className="space-y-3">
          {followUpQuestion.options.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onAnswer(followUpQuestion.id, option.name)}
            >
              {option.name}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          onClick={onClose}
          className="w-full mt-4"
        >
          Skip
        </Button>
      </Card>
    </div>
  );
};