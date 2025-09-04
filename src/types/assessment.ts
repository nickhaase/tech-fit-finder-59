export interface CompanyInfo {
  size: 'startup' | 'small' | 'medium' | 'enterprise';
  industry: string;
}

export interface IntegrationDetail {
  brand: string;
  edition?: string;
  environment?: 'cloud' | 'on-prem' | 'hybrid';
  method?: string[];
  objects?: string[];
  directionality?: 'one-way-to' | 'one-way-from' | 'bidirectional';
  frequency?: 'real-time' | 'near-real-time' | 'scheduled';
  protocol?: string[];
  dataTypes?: string[];
  sampling?: string;
  gateway?: string;
}

export interface SensorIntegration extends IntegrationDetail {
  category: 'IoT Sensors' | 'Smart Meters' | 'Condition Monitoring' | 'Environmental Sensors' | 'Safety Sensors' | 'Platforms/Historians';
}

export interface AutomationIntegration extends IntegrationDetail {
  type: 'SCADA' | 'PLC' | 'DCS' | 'MES' | 'HMI';
}

export interface OtherSystemIntegration extends IntegrationDetail {
  type: 'Legacy CMMS/EAM' | 'Asset Tracking' | 'Inventory/Warehouse' | 'Workflow/ITSM/iPaaS';
}

export interface ITOTConstraints {
  network?: 'air-gapped' | 'outbound-only' | 'vpn' | 'open';
  dataResidency?: string;
  sso?: string;
  changeManagement?: boolean;
}

export interface AssessmentData {
  mode: 'quick' | 'advanced';
  company: CompanyInfo;
  goals: string[];
  kpis?: string[];
  timeline?: string;
  stakeholder?: string;
  itOtConstraints?: ITOTConstraints;
  integrations: {
    erp?: IntegrationDetail;
    sensorsMonitoring: SensorIntegration[];
    automationScada: AutomationIntegration[];
    otherSystems: OtherSystemIntegration[];
  };
  integrationPatterns: {
    from: string;
    to: string;
    protocol: string;
    realtime: boolean;
  }[];
  scorecard: {
    compatibilityPercent: number;
    integrationsFound: number;
    goalsMatched: number;
    complexity: 'Low' | 'Medium' | 'High';
  };
}

export interface BrandOption {
  id: string;
  name: string;
  commonNames?: string[];
  description?: string;
  logo?: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  description: string;
  brands: BrandOption[];
}