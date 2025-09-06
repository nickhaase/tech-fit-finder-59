import { AppConfig, BrandOption } from '@/types/config';
import { AssessmentData, IntegrationDetail } from '@/types/assessment';
import { enhanceNodesWithCapabilities } from './enhancedFlowGeneration';
import { resolveSystemId } from './synonymResolver';
import { tagNodesWithCapabilities } from './capabilityTagger';
import { getEnhancedBrands, getFoundrySynonyms } from '../data/foundryBrands';

export interface Node {
  id: string;
  name: string;
  logo?: string;
  category: 'ERP' | 'MES' | 'SCADA' | 'PLC' | 'Sensors' | 'Historian' |
           'Inventory/WMS' | 'Workflow/ITSM/iPaaS' | 'Legacy CMMS/EAM' |
           'Asset Tracking' | 'Construction' | 'DataOps' | 'Other';
  directionality: 'bidirectional' | 'inbound' | 'outbound';
  protocol: string[];
  frequency: 'real-time' | 'near-real-time' | 'scheduled';
  tier: 'business' | 'operational';
  priority: number;
  originalConfig?: IntegrationDetail;
  // NEW: Optional capabilities for enhanced effects
  capabilities?: string[];
  subLabel?: string; // NEW: For display labels like "DataOps/AI"
}

// Category mapping from section IDs to Node categories
const SECTION_TO_CATEGORY_MAP: Record<string, Node['category']> = {
  'erp': 'ERP',
  'mes': 'MES',
  'scada': 'SCADA',
  'plc': 'PLC',
  'sensors_monitoring': 'Sensors',
  'iot_sensors': 'Sensors',
  'condition_monitoring': 'Sensors',
  'environmental_sensors': 'Sensors',
  'safety_sensors': 'Sensors',
  'historians': 'Historian',
  'platforms_historians': 'Historian',
  'inventory_warehouse': 'Inventory/WMS',
  'workflow_itsm': 'Workflow/ITSM/iPaaS',
  'legacy_cmms': 'Legacy CMMS/EAM',
  'asset_tracking': 'Asset Tracking',
  'construction': 'Construction',
  'automation_scada': 'SCADA',
  'dataops_integration': 'DataOps', // NEW: DataOps category
  'other_systems': 'Other'
};

// ISA-95 Hierarchy ordering (lower = higher level)
const CATEGORY_PRIORITY: Record<Node['category'], number> = {
  // Level 4: Business (ERP)
  'ERP': 1,
  // Level 3: Operations Management  
  'MES': 2,
  'Inventory/WMS': 2,
  'Legacy CMMS/EAM': 2,
  'DataOps': 2, // NEW: DataOps at operations level
  // Level 2: Supervisory Control
  'SCADA': 3,
  'Workflow/ITSM/iPaaS': 3,
  // Level 1: Automated Control
  'PLC': 4,
  // Level 0: Physical Process
  'Sensors': 5,
  'Historian': 5,
  'Asset Tracking': 5,
  // Other systems
  'Construction': 6,
  'Other': 6
};

// Default protocols by category
const CATEGORY_PROTOCOLS: Record<Node['category'], string[]> = {
  'ERP': ['REST', 'SOAP', 'GraphQL', 'ODBC'],
  'MES': ['OPC UA', 'MQTT', 'REST'],
  'SCADA': ['OPC UA', 'MQTT', 'Modbus', 'PROFINET'],
  'PLC': ['EtherNet/IP', 'Modbus', 'PROFINET'],
  'Sensors': ['MQTT', 'OPC UA', 'HTTPS'],
  'Historian': ['PI AF/SDK', 'OData', 'REST', 'Kafka'],
  'Inventory/WMS': ['REST', 'SOAP', 'SFTP'],
  'Workflow/ITSM/iPaaS': ['REST', 'Webhooks', 'OAuth'],
  'Legacy CMMS/EAM': ['SOAP', 'SFTP', 'ODBC'],
  'Asset Tracking': ['REST', 'MQTT', 'Webhooks'],
  'Construction': ['REST', 'Webhooks'],
  'DataOps': ['REST API', 'Webhook', 'Kafka'], // NEW: DataOps protocols
  'Other': ['REST']
};

// Default directionality by category
const CATEGORY_DIRECTIONALITY: Record<Node['category'], Node['directionality']> = {
  'ERP': 'bidirectional',
  'MES': 'bidirectional',
  'SCADA': 'bidirectional',
  'PLC': 'bidirectional',
  'Sensors': 'inbound',
  'Historian': 'inbound',
  'Inventory/WMS': 'bidirectional',
  'Workflow/ITSM/iPaaS': 'bidirectional',
  'Legacy CMMS/EAM': 'outbound',
  'Asset Tracking': 'bidirectional',
  'Construction': 'bidirectional',
  'DataOps': 'bidirectional', // NEW: DataOps is bidirectional
  'Other': 'bidirectional'
};

// Default frequency by category
const CATEGORY_FREQUENCY: Record<Node['category'], Node['frequency']> = {
  'ERP': 'near-real-time',
  'MES': 'near-real-time',
  'SCADA': 'real-time',
  'PLC': 'real-time',
  'Sensors': 'real-time',
  'Historian': 'near-real-time',
  'Inventory/WMS': 'near-real-time',
  'Workflow/ITSM/iPaaS': 'real-time',
  'Legacy CMMS/EAM': 'scheduled',
  'Asset Tracking': 'near-real-time',
  'Construction': 'near-real-time',
  'DataOps': 'near-real-time', // NEW: DataOps frequency
  'Other': 'near-real-time'
};

// Tier classification by category
const CATEGORY_TIER: Record<Node['category'], Node['tier']> = {
  'ERP': 'business',
  'MES': 'operational',
  'SCADA': 'operational',
  'PLC': 'operational',
  'Sensors': 'operational',
  'Historian': 'operational',
  'Inventory/WMS': 'business',
  'Workflow/ITSM/iPaaS': 'business',
  'Legacy CMMS/EAM': 'business',
  'Asset Tracking': 'operational',
  'Construction': 'business',
  'DataOps': 'business', // NEW: DataOps is business tier
  'Other': 'business'
};

function inferCategoryFromSection(sectionId: string, subcategoryId?: string): Node['category'] {
  // Check subcategory first if available
  if (subcategoryId && SECTION_TO_CATEGORY_MAP[subcategoryId]) {
    return SECTION_TO_CATEGORY_MAP[subcategoryId];
  }
  
  // Fall back to section mapping
  return SECTION_TO_CATEGORY_MAP[sectionId] || 'Other';
}

function findBrandInConfig(config: AppConfig, brandName: string): BrandOption | null {
  console.log(`🔍 Searching for brand: "${brandName}"`);
  
  // Check Foundry synonyms first (always enabled)
  const foundrySynonyms = getFoundrySynonyms();
  const foundryMatch = foundrySynonyms[brandName.toLowerCase()];
  if (foundryMatch) {
    console.log(`  ✅ Found Foundry synonym match: ${brandName} → ${foundryMatch}`);
    return {
      id: 'palantir_foundry',
      name: 'Palantir Foundry',
      logo: '/assets/logos/brands/palantir.svg',
      synonyms: ['Foundry', 'Palantir'],
      state: 'active'
    };
  }
  
  // Search through all sections and subcategories for the brand
  for (const section of config.sections) {
    console.log(`  📁 Checking section: ${section.id}`);
    
    // Check section options
    const sectionBrand = section.options?.find(opt => 
      opt.name === brandName || opt.synonyms?.includes(brandName)
    );
    if (sectionBrand) {
      console.log(`  ✅ Found in section ${section.id}:`, sectionBrand);
      return sectionBrand;
    }
    
    // Check subcategory options
    if (section.subcategories) {
      for (const subcategory of section.subcategories) {
        const subcategoryBrand = subcategory.options?.find(opt => 
          opt.name === brandName || opt.synonyms?.includes(brandName)
        );
        if (subcategoryBrand) {
          console.log(`  ✅ Found in subcategory ${section.id}/${subcategory.id}:`, subcategoryBrand);
          return subcategoryBrand;
        }
      }
    }
  }
  
  // Check global brands
  if (config.globalBrands) {
    const globalBrand = config.globalBrands.find(brand => 
      brand.name === brandName || brand.synonyms?.includes(brandName)
    );
    if (globalBrand) {
      console.log(`  ✅ Found in global brands:`, globalBrand);
      return {
        id: globalBrand.id,
        name: globalBrand.name,
        logo: globalBrand.logo,
        synonyms: globalBrand.synonyms,
        state: globalBrand.state
      };
    }
  }
  
  console.log(`  ❌ Brand "${brandName}" not found in config`);
  
  // Return a minimal brand info as fallback for unknown brands
  return {
    id: brandName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    name: brandName,
    synonyms: [],
    state: 'active'
  };
}

export function mapConfigToNodes(config: AppConfig, assessmentData: AssessmentData): Node[] {
  console.log('🗺️ Starting mapConfigToNodes');
  console.log('📊 Assessment data:', {
    mode: assessmentData.mode,
    hasERP: !!assessmentData.integrations.erp,
    erpBrand: assessmentData.integrations.erp?.brand,
    sensorsCount: assessmentData.integrations.sensorsMonitoring?.length || 0,
    automationCount: assessmentData.integrations.automationScada?.length || 0,
    otherCount: assessmentData.integrations.otherSystems?.length || 0
  });
  
  const nodes: Node[] = [];
  const seenGlobalIds = new Set<string>();
  const enhancedCapabilities = getEnhancedBrands();
  
  // Map ERP system
  if (assessmentData.integrations.erp && 
      assessmentData.integrations.erp.brand !== 'None' && 
      assessmentData.integrations.erp.brand !== 'Not sure') {
    
    console.log('🏢 Processing ERP:', assessmentData.integrations.erp.brand);
    const erpConfig = assessmentData.integrations.erp;
    const brandInfo = findBrandInConfig(config, erpConfig.brand);
    console.log('🔍 ERP brand search result:', brandInfo ? `Found: ${brandInfo.name}` : 'Not found');
    
      const node: Node = {
        id: brandInfo?.globalId || brandInfo?.id || `erp-${erpConfig.brand}`,
        name: erpConfig.brand,
        logo: brandInfo?.logo,
        category: 'ERP',
        directionality: (erpConfig.directionality === 'one-way-to' ? 'outbound' : 
                        erpConfig.directionality === 'one-way-from' ? 'inbound' : 'bidirectional'),
        protocol: erpConfig.protocol || CATEGORY_PROTOCOLS['ERP'],
        frequency: erpConfig.frequency || CATEGORY_FREQUENCY['ERP'],
        tier: CATEGORY_TIER['ERP'],
        priority: CATEGORY_PRIORITY['ERP'],
        originalConfig: erpConfig,
        capabilities: enhancedCapabilities[brandInfo?.id || ''] || undefined,
        subLabel: brandInfo?.id === 'palantir_foundry' ? 'DataOps/AI' : undefined
      };
    
    console.log('✅ Created ERP node:', node);
    nodes.push(node);
    if (brandInfo?.globalId) seenGlobalIds.add(brandInfo.globalId);
  } else {
    console.log('❌ No valid ERP found:', {
      hasERP: !!assessmentData.integrations.erp,
      erpBrand: assessmentData.integrations.erp?.brand
    });
  }
  
  // Map sensor systems
  assessmentData.integrations.sensorsMonitoring
    .filter(sensor => sensor.brand !== 'None' && sensor.brand !== 'Not sure')
    .forEach(sensor => {
      // Resolve sensor brand name using synonym map
      const resolvedBrand = resolveSystemId(sensor.brand, config.synonymMap || {});
      const brandInfo = findBrandInConfig(config, resolvedBrand);
      const globalId = brandInfo?.globalId || brandInfo?.id || `sensor-${sensor.brand}`;
      
      if (seenGlobalIds.has(globalId)) return; // Skip duplicates
      
      const category = inferCategoryFromSection('sensors_monitoring', sensor.category?.toLowerCase().replace(/[^a-z]/g, '_'));
      
      const node: Node = {
        id: globalId,
        name: sensor.brand,
        logo: brandInfo?.logo,
        category: category as Node['category'],
        directionality: (sensor.directionality === 'one-way-to' ? 'outbound' : 
                        sensor.directionality === 'one-way-from' ? 'inbound' : 
                        CATEGORY_DIRECTIONALITY[category as Node['category']]),
        protocol: sensor.protocol || CATEGORY_PROTOCOLS[category as Node['category']],
        frequency: sensor.frequency || CATEGORY_FREQUENCY[category as Node['category']],
        tier: CATEGORY_TIER[category as Node['category']],
        priority: CATEGORY_PRIORITY[category as Node['category']],
        originalConfig: sensor,
        capabilities: enhancedCapabilities[brandInfo?.id || ''] || undefined,
        subLabel: brandInfo?.id === 'palantir_foundry' ? 'DataOps/AI' : undefined
      };
      
      nodes.push(node);
      if (brandInfo?.globalId) seenGlobalIds.add(brandInfo.globalId);
    });

  // Map data analytics systems
  if (assessmentData.integrations.dataAnalytics) {
    assessmentData.integrations.dataAnalytics
      .filter(analytics => analytics.brand !== 'None' && analytics.brand !== 'Not sure')
      .forEach(analytics => {
        const brandInfo = findBrandInConfig(config, analytics.brand);
        const globalId = brandInfo?.globalId || brandInfo?.id || `data-analytics-${analytics.brand}`;
        
        if (seenGlobalIds.has(globalId)) return; // Skip duplicates
        
        const category = 'DataOps';
        
        const node: Node = {
          id: globalId,
          name: analytics.brand,
          logo: brandInfo?.logo,
          category: category as Node['category'],
          directionality: 'bidirectional',
          protocol: ['REST API', 'Webhook', 'Kafka'],
          frequency: 'near-real-time',
          tier: CATEGORY_TIER[category as Node['category']],
          priority: CATEGORY_PRIORITY[category as Node['category']],
          originalConfig: analytics,
          capabilities: enhancedCapabilities[brandInfo?.id || ''] || undefined,
          subLabel: 'DataOps/AI'
        };
        
        nodes.push(node);
        if (brandInfo?.globalId) seenGlobalIds.add(brandInfo.globalId);
      });
  }
  
  // Map automation systems
  assessmentData.integrations.automationScada
    .filter(automation => automation.brand !== 'None' && automation.brand !== 'Not sure')
    .forEach(automation => {
      const brandInfo = findBrandInConfig(config, automation.brand);
      const globalId = brandInfo?.globalId || brandInfo?.id || `automation-${automation.brand}`;
      
      if (seenGlobalIds.has(globalId)) return; // Skip duplicates
      
      const category = automation.type === 'SCADA' ? 'SCADA' : 
                     automation.type === 'PLC' ? 'PLC' : 
                     automation.type === 'MES' ? 'MES' : 'SCADA';
      
      const node: Node = {
        id: globalId,
        name: automation.brand,
        logo: brandInfo?.logo,
        category: category as Node['category'],
        directionality: (automation.directionality === 'one-way-to' ? 'outbound' : 
                        automation.directionality === 'one-way-from' ? 'inbound' : 'bidirectional'),
        protocol: automation.protocol || CATEGORY_PROTOCOLS[category as Node['category']],
        frequency: automation.frequency || CATEGORY_FREQUENCY[category as Node['category']],
        tier: CATEGORY_TIER[category as Node['category']],
        priority: CATEGORY_PRIORITY[category as Node['category']],
        originalConfig: automation,
        capabilities: enhancedCapabilities[brandInfo?.id || ''] || undefined,
        subLabel: brandInfo?.id === 'palantir_foundry' ? 'DataOps/AI' : undefined
      };
      
      nodes.push(node);
      if (brandInfo?.globalId) seenGlobalIds.add(brandInfo.globalId);
    });
  
  // Map other systems
  assessmentData.integrations.otherSystems
    .filter(system => system.brand !== 'None' && system.brand !== 'Not sure')
    .forEach(system => {
      const brandInfo = findBrandInConfig(config, system.brand);
      const globalId = brandInfo?.globalId || brandInfo?.id || `other-${system.brand}`;
      
      if (seenGlobalIds.has(globalId)) return; // Skip duplicates
      
      const category = system.type === 'Legacy CMMS/EAM' ? 'Legacy CMMS/EAM' :
                      system.type === 'Asset Tracking' ? 'Asset Tracking' :
                      system.type === 'Inventory/Warehouse' ? 'Inventory/WMS' :
                      system.type === 'Workflow/ITSM/iPaaS' ? 'Workflow/ITSM/iPaaS' : 'Other';
      
      const node: Node = {
        id: globalId,
        name: system.brand,
        logo: brandInfo?.logo,
        category: category as Node['category'],
        directionality: (system.directionality === 'one-way-to' ? 'outbound' : 
                        system.directionality === 'one-way-from' ? 'inbound' : 
                        CATEGORY_DIRECTIONALITY[category as Node['category']]),
        protocol: system.protocol || CATEGORY_PROTOCOLS[category as Node['category']],
        frequency: system.frequency || CATEGORY_FREQUENCY[category as Node['category']],
        tier: CATEGORY_TIER[category as Node['category']],
        priority: CATEGORY_PRIORITY[category as Node['category']],
        originalConfig: system,
        capabilities: enhancedCapabilities[brandInfo?.id || ''] || undefined,
        subLabel: brandInfo?.id === 'palantir_foundry' ? 'DataOps/AI' : undefined
      };
      
      nodes.push(node);
      if (brandInfo?.globalId) seenGlobalIds.add(brandInfo.globalId);
    });
  
  console.log('📋 Final nodes summary:', {
    totalNodes: nodes.length,
    nodesByCategory: nodes.reduce((acc, node) => {
      acc[node.category] = (acc[node.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    nodeNames: nodes.map(n => `${n.name} (${n.category})`)
  });

  // Enhance nodes with capabilities (legacy) and new capability tagger
  const legacyEnhanced = enhanceNodesWithCapabilities(nodes);
  const capabilityEnhanced = tagNodesWithCapabilities(legacyEnhanced);
  
  // Sort by priority (closer to hub) then alphabetically
  return capabilityEnhanced.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.name.localeCompare(b.name);
  });
}