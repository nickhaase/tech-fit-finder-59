import { CategoryOption } from '@/types/assessment';

// Import existing logos
import sapLogo from "@/assets/logos/sap-logo.png";
import oracleLogo from "@/assets/logos/oracle-logo.png";
import microsoftLogo from "@/assets/logos/microsoft-logo.png";
import workdayLogo from "@/assets/logos/workday-logo.png";
import netsuiteLogo from "@/assets/logos/netsuite-logo.png";
import siemensLogo from "@/assets/logos/siemens-logo.png";
import schneiderLogo from "@/assets/logos/schneider-logo.png";
import assetwatchLogo from "@/assets/logos/assetwatch-logo.png";
import procoreLogo from "@/assets/logos/procore-logo.png";
import tulipLogo from "@/assets/logos/tulip-logo.png";
import machinemetricsLogo from "@/assets/logos/machinemetrics-logo.png";
import { getFoundryBrands } from './foundryBrands';

export const ERP_SYSTEMS: CategoryOption[] = [
  {
    id: 'erp',
    name: 'Enterprise Resource Planning (ERP)',
    description: 'Select your current ERP system',
    brands: [
      { 
        id: 'sap', 
        name: 'SAP', 
        commonNames: ['SAP ERP', 'SAP ECC', 'SAP S/4HANA'], 
        logo: sapLogo 
      },
      { 
        id: 'oracle_ebs', 
        name: 'Oracle E-Business Suite', 
        commonNames: ['Oracle EBS', 'E-Business Suite'], 
        logo: oracleLogo 
      },
      { 
        id: 'oracle_fusion', 
        name: 'Oracle Fusion Cloud', 
        commonNames: ['Oracle Cloud ERP', 'Fusion'], 
        logo: oracleLogo 
      },
      { 
        id: 'microsoft_dynamics', 
        name: 'Microsoft Dynamics 365', 
        commonNames: ['Dynamics 365', 'D365'], 
        logo: microsoftLogo 
      },
      { 
        id: 'netsuite', 
        name: 'NetSuite', 
        commonNames: ['Oracle NetSuite'], 
        logo: netsuiteLogo 
      },
      { id: 'infor_ln', name: 'Infor LN', commonNames: ['LN'] },
      { id: 'infor_m3', name: 'Infor M3', commonNames: ['M3'] },
      { id: 'infor_eam', name: 'Infor EAM', commonNames: ['EAM'] },
      { id: 'epicor', name: 'Epicor', commonNames: ['Epicor ERP'] },
      { id: 'ifs', name: 'IFS', commonNames: ['IFS Applications'] },
      { id: 'sage', name: 'Sage', commonNames: ['Sage ERP'] },
      { id: 'syspro', name: 'SYSPRO', commonNames: [] },
      { id: 'jd_edwards', name: 'JD Edwards', commonNames: ['JDE', 'EnterpriseOne'], logo: oracleLogo },
      { id: 'workday', name: 'Workday', commonNames: [], logo: workdayLogo },
    ]
  }
];

export const SENSOR_CATEGORIES: CategoryOption[] = [
  {
    id: 'iot_sensors',
    name: 'IoT Sensors',
    description: 'General purpose IoT sensors for temperature, pressure, vibration',
    brands: [
      { id: 'ifm', name: 'IFM', commonNames: ['IFM Electronic'] },
      { id: 'banner', name: 'Banner Engineering', commonNames: ['Banner'] },
      { id: 'fluke', name: 'Fluke', commonNames: ['Fluke Corporation'] },
      { id: 'flir', name: 'FLIR', commonNames: ['Teledyne FLIR'] },
      { id: 'phoenix_contact', name: 'Phoenix Contact', commonNames: [] },
      { id: 'honeywell_sensors', name: 'Honeywell', commonNames: [] },
      { id: 'siemens_sensors', name: 'Siemens', commonNames: [], logo: siemensLogo },
      { id: 'schneider_sensors', name: 'Schneider Electric', commonNames: [], logo: schneiderLogo },
      { id: 'rockwell_sensors', name: 'Rockwell/Allen-Bradley', commonNames: ['Allen-Bradley', 'AB'] },
      { id: 'ni_sensors', name: 'National Instruments', commonNames: ['NI'] },
      { id: 'zebra_sensors', name: 'Zebra Technologies', commonNames: ['Zebra'] },
    ]
  },
  {
    id: 'smart_meters',
    name: 'Smart Meters',
    description: 'Energy and utility monitoring equipment',
    brands: [
      { id: 'schneider_meters', name: 'Schneider Electric', commonNames: ['Schneider PowerLogic'], logo: schneiderLogo },
      { id: 'siemens_meters', name: 'Siemens', commonNames: ['Siemens Energy'], logo: siemensLogo },
      { id: 'ge_grid', name: 'GE Grid Solutions', commonNames: ['GE Digital Energy'] },
      { id: 'honeywell_meters', name: 'Honeywell', commonNames: [] },
    ]
  },
    {
      id: 'condition_monitoring',
      name: 'Condition Monitoring',
      description: 'Predictive maintenance and asset health sensors',
      brands: [
        { id: 'emerson_ams', name: 'Emerson AMS', commonNames: ['AMS Suite'] },
        { id: 'skf', name: 'SKF', commonNames: ['SKF Condition Monitoring'] },
        { id: 'pruftechnik', name: 'Pruftechnik', commonNames: [] },
        { id: 'ue_systems', name: 'UE Systems', commonNames: [] },
        { id: 'bentley_nevada', name: 'Bentley Nevada', commonNames: [] },
        { id: 'assetwatch', name: 'AssetWatch®', commonNames: ['AssetWatch'], logo: assetwatchLogo },
        { id: 'augury', name: 'Augury', commonNames: [] },
        { id: 'guidewheel', name: 'Guidewheel', commonNames: [] },
        { id: 'machinemetrics', name: 'MachineMetrics', commonNames: [], logo: machinemetricsLogo },
        { id: 'shoreline_ai', name: 'Shoreline AI, Inc.', commonNames: ['Shoreline AI'] },
        { id: 'urban_io', name: 'Urban.io', commonNames: ['Urban IO'] },
        { id: 'waites', name: 'WAITES', commonNames: [] },
        { id: 'ugowork', name: 'UgoWork', commonNames: [] },
      ]
    },
  {
    id: 'environmental_sensors',
    name: 'Environmental Sensors',
    description: 'Air quality, humidity, and environmental monitoring',
    brands: [
      { id: 'honeywell_env', name: 'Honeywell', commonNames: [] },
      { id: 'vaisala', name: 'Vaisala', commonNames: [] },
      { id: 'bosch_env', name: 'Bosch', commonNames: ['Bosch Sensortec'] },
    ]
  },
  {
    id: 'safety_sensors',
    name: 'Safety Sensors',
    description: 'Gas detection, motion sensors, safety monitoring',
    brands: [
      { id: 'honeywell_safety', name: 'Honeywell', commonNames: ['Honeywell Analytics'] },
      { id: 'msa', name: 'MSA Safety', commonNames: ['MSA'] },
      { id: 'drager', name: 'Dräger', commonNames: ['Draeger'] },
      { id: 'sick', name: 'SICK', commonNames: ['SICK AG'] },
    ]
  }
];

export const AUTOMATION_CATEGORIES: CategoryOption[] = [
  {
    id: 'scada',
    name: 'SCADA Systems',
    description: 'Supervisory Control and Data Acquisition systems',
    brands: [
      { id: 'aveva_wonderware', name: 'AVEVA/Wonderware', commonNames: ['Wonderware', 'System Platform'] },
      { 
        id: 'ignition', 
        name: 'Ignition', 
        commonNames: ['Inductive Automation'],
        categories: ['automation.scada', 'data_analytics.historians'] // Cross-listing
      },
      { id: 'ge_ifix', name: 'GE iFIX', commonNames: ['iFIX'] },
      { id: 'ge_cimplicity', name: 'GE CIMPLICITY', commonNames: ['CIMPLICITY'] },
      { id: 'siemens_wincc', name: 'Siemens WinCC', commonNames: ['WinCC'], logo: siemensLogo },
      { id: 'rockwell_factorytalk', name: 'Rockwell FactoryTalk', commonNames: ['FactoryTalk View'] },
      { id: 'schneider_ecostruxure', name: 'Schneider EcoStruxure', commonNames: ['EcoStruxure'], logo: schneiderLogo },
      { id: 'honeywell_scada', name: 'Honeywell', commonNames: [] },
      { id: 'abb_scada', name: 'ABB', commonNames: ['ABB Ability'] },
    ]
  },
  {
    id: 'plc',
    name: 'PLC Systems',
    description: 'Programmable Logic Controllers',
    brands: [
      { id: 'siemens_s7', name: 'Siemens S7', commonNames: ['TIA Portal', 'STEP 7'], logo: siemensLogo },
      { id: 'allen_bradley_controllogix', name: 'Allen-Bradley ControlLogix', commonNames: ['ControlLogix', 'RSLogix'] },
      { id: 'allen_bradley_compactlogix', name: 'Allen-Bradley CompactLogix', commonNames: ['CompactLogix'] },
      { id: 'schneider_modicon', name: 'Schneider Modicon', commonNames: ['Modicon', 'Unity Pro'], logo: schneiderLogo },
      { id: 'omron_plc', name: 'Omron', commonNames: ['Omron PLC'] },
      { id: 'mitsubishi_plc', name: 'Mitsubishi', commonNames: ['MELSEC'] },
      { id: 'beckhoff', name: 'Beckhoff', commonNames: ['TwinCAT'] },
      { id: 'abb_plc', name: 'ABB', commonNames: ['ABB AC500'] },
    ]
  },
  {
    id: 'dcs',
    name: 'DCS (Distributed Control Systems)',
    description: 'Process control and automation systems',
    brands: [
      { id: 'emerson_deltav', name: 'Emerson DeltaV', commonNames: ['DeltaV'] },
      { id: 'honeywell_experion', name: 'Honeywell Experion', commonNames: ['Experion PKS'] },
      { id: 'yokogawa_centum', name: 'Yokogawa CENTUM', commonNames: ['CENTUM VP'] },
      { id: 'abb_800xa', name: 'ABB System 800xA', commonNames: ['800xA'] },
    ]
  },
    {
      id: 'mes',
      name: 'MES (Manufacturing Execution Systems)',
      description: 'Production and manufacturing execution',
      brands: [
        { id: 'siemens_opcenter', name: 'Siemens Opcenter', commonNames: ['Opcenter'], logo: siemensLogo },
        { id: 'rockwell_plex', name: 'Rockwell Plex', commonNames: ['Plex Systems'] },
        { id: 'tulip_mes', name: 'Tulip', commonNames: ['Tulip Interfaces'], logo: tulipLogo },
        { id: 'aveva_mes', name: 'AVEVA MES', commonNames: [] },
        { id: 'dassault_apriso', name: 'Dassault Apriso', commonNames: ['Apriso'] },
        { id: 'honeywell_mes', name: 'Honeywell', commonNames: [] },
        { id: 'majik_systems', name: 'MAJiK Systems', commonNames: [] },
      ]
    },
  {
    id: 'hmi',
    name: 'HMI (Human Machine Interface)',
    description: 'Operator interfaces and visualization',
    brands: [
      { id: 'panelview', name: 'PanelView', commonNames: ['Allen-Bradley PanelView'] },
      { id: 'wincc_hmi', name: 'WinCC HMI', commonNames: [], logo: siemensLogo },
      { id: 'maple_hmi', name: 'Maple Systems', commonNames: ['Maple'] },
      { id: 'red_lion', name: 'Red Lion', commonNames: ['Red Lion Controls'] },
      { id: 'pro_face', name: 'Pro-face', commonNames: ['Schneider Pro-face'], logo: schneiderLogo },
    ]
  }
];

export const OTHER_SYSTEM_CATEGORIES: CategoryOption[] = [
  {
    id: 'legacy_cmms',
    name: 'Legacy CMMS/EAM',
    description: 'Existing maintenance management systems',
    brands: [
      { id: 'ibm_maximo', name: 'IBM Maximo', commonNames: ['Maximo'] },
      { id: 'infor_eam_legacy', name: 'Infor EAM', commonNames: ['EAM'] },
      { id: 'emaint', name: 'eMaint', commonNames: ['Fluke eMaint'] },
      { id: 'fiix', name: 'Fiix', commonNames: ['Rockwell Fiix'] },
      { id: 'upkeep', name: 'UpKeep', commonNames: [] },
      { id: 'hippo', name: 'Hippo CMMS', commonNames: ['Hippo'] },
    ]
  },
  {
    id: 'asset_tracking',
    name: 'Asset Tracking',
    description: 'RFID, barcode, and asset identification systems',
    brands: [
      { id: 'zebra_tracking', name: 'Zebra Technologies', commonNames: ['Zebra'] },
      { id: 'impinj', name: 'Impinj', commonNames: [] },
      { id: 'gao_rfid', name: 'GAO RFID', commonNames: ['GAO'] },
      { id: 'soti', name: 'SOTI', commonNames: [] },
      { id: 'asset_panda', name: 'Asset Panda', commonNames: [] },
      { id: 'bartender', name: 'BarTender', commonNames: ['Seagull BarTender'] },
      { id: 'hapn', name: 'Hapn', commonNames: ['Hapn GPS'] },
    ]
  },
  {
    id: 'inventory_warehouse',
    name: 'Inventory/Warehouse',
    description: 'Parts management and warehouse systems',
    brands: [
      { id: 'netsuite_wms', name: 'NetSuite WMS', commonNames: ['NetSuite Warehouse'], logo: netsuiteLogo },
      { id: 'fishbowl', name: 'Fishbowl', commonNames: ['Fishbowl Inventory'] },
      { id: 'odoo_inventory', name: 'Odoo', commonNames: ['Odoo Inventory'] },
      { id: 'blue_yonder', name: 'Blue Yonder', commonNames: ['JDA'] },
      { id: 'manhattan', name: 'Manhattan Associates', commonNames: ['Manhattan WMS'] },
      { id: 'kojo', name: 'Kojo (Formerly Agora Systems)', commonNames: ['Agora Systems', 'Kojo Procurement'] },
    ]
  },
  {
    id: 'workflow_itsm',
    name: 'Workflow/ITSM/iPaaS',
    description: 'Business process and integration platforms',
    brands: [
      { id: 'servicenow', name: 'ServiceNow', commonNames: [] },
      { id: 'jira', name: 'Jira', commonNames: ['Atlassian Jira'] },
      { id: 'power_automate', name: 'Power Automate', commonNames: ['Microsoft Flow'] },
      { id: 'zapier', name: 'Zapier', commonNames: [] },
      { id: 'boomi', name: 'Boomi', commonNames: ['Dell Boomi'] },
      { id: 'mulesoft', name: 'MuleSoft', commonNames: [] },
      { id: 'workato', name: 'Workato', commonNames: [] },
    ]
  },
  {
    id: 'construction_platforms',
    name: 'Construction Platforms',
    description: 'Construction management and project platforms',
    brands: [
      { id: 'procore', name: 'Procore Technologies', commonNames: ['Procore'], logo: procoreLogo },
    ]
  },
  {
    id: 'consulting_sis',
    name: 'Consulting & System Integrators',
    description: 'Integration consulting and system implementation services',
    brands: [
      { id: 'zenza_consulting', name: 'Zenza Consulting', commonNames: [] },
    ]
  }
];

export const PROTOCOLS = [
  'REST API',
  'GraphQL',
  'SOAP',
  'OData',
  'OPC UA',
  'OPC DA',
  'MQTT',
  'Modbus/TCP',
  'JDBC',
  'SFTP/CSV',
  'Webhooks',
  'HTTP/HTTPS',
  'WebSocket'
];

export const COMPANY_SIZES = [
  { id: 'startup', name: 'Startup (1-50 employees)' },
  { id: 'small', name: 'Small Business (51-200 employees)' },
  { id: 'medium', name: 'Medium Enterprise (201-1000 employees)' },
  { id: 'enterprise', name: 'Large Enterprise (1000+ employees)' },
];

export const INDUSTRIES = [
  { id: 'manufacturing', name: 'Manufacturing' },
  { id: 'energy', name: 'Energy & Utilities' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'food', name: 'Food & Beverage' },
  { id: 'automotive', name: 'Automotive' },
  { id: 'aerospace', name: 'Aerospace & Defense' },
  { id: 'other', name: 'Other' },
];

export const GOALS = [
  { id: 'reduce_downtime', name: 'Reduce Equipment Downtime' },
  { id: 'predictive', name: 'Implement Predictive Maintenance' },
  { id: 'compliance', name: 'Improve Compliance & Safety' },
  { id: 'costs', name: 'Reduce Maintenance Costs' },
  { id: 'efficiency', name: 'Increase Operational Efficiency' },
  { id: 'visibility', name: 'Better Asset Visibility' },
];

export const KPIS = [
  { id: 'mtbf', name: 'Mean Time Between Failures (MTBF)' },
  { id: 'mttr', name: 'Mean Time To Repair (MTTR)' },
  { id: 'pm_compliance', name: 'Preventive Maintenance Compliance %' },
  { id: 'first_time_fix', name: 'First-Time Fix Rate' },
  { id: 'audit_findings', name: 'Audit Findings Reduction' },
  { id: 'oee', name: 'Overall Equipment Effectiveness (OEE)' },
];

// Data Analytics Categories with DataOps support
export const DATA_ANALYTICS_CATEGORIES: CategoryOption[] = [
  ...getFoundryBrands(), // Conditionally include Foundry brands
  // Add other data analytics categories here as needed
];