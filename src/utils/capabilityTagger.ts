import { Node } from './mapConfigToNodes';

/**
 * System capabilities that can trigger automated integration flows
 */
export type SystemCapability = 
  | 'insight_to_work'    // Generate work orders from analytics insights
  | 'asset_health'       // Provide asset health scoring  
  | 'parts_intel'        // Supply parts intelligence and ETA
  | 'fan_in'            // Aggregate data from multiple upstream sources
  | 'model_sync'        // Sync models with data warehouses
  | 'real_time_alerts'  // Real-time alerting capabilities
  | 'predictive_maint'  // Predictive maintenance algorithms
  | 'quality_control'   // Quality control and inspection workflows

/**
 * Capability definitions with metadata
 */
interface CapabilityDefinition {
  id: SystemCapability;
  name: string;
  description: string;
  flowType: 'inbound' | 'outbound' | 'bidirectional';
  requiresUpstream?: boolean;
  requiresDownstream?: boolean;
}

/**
 * Registry of all supported capabilities
 */
const CAPABILITY_REGISTRY: Record<SystemCapability, CapabilityDefinition> = {
  'insight_to_work': {
    id: 'insight_to_work',
    name: 'Insights to Work Orders',
    description: 'Generate work orders automatically from analytics insights',
    flowType: 'outbound',
    requiresDownstream: true
  },
  'asset_health': {
    id: 'asset_health',
    name: 'Asset Health Monitoring',
    description: 'Provide real-time asset health scores and predictions',
    flowType: 'outbound',
    requiresDownstream: true
  },
  'parts_intel': {
    id: 'parts_intel',
    name: 'Parts Intelligence',
    description: 'Supply parts availability, pricing, and delivery intelligence',
    flowType: 'outbound',
    requiresDownstream: true
  },
  'fan_in': {
    id: 'fan_in',
    name: 'Data Aggregation',
    description: 'Aggregate and normalize data from multiple upstream sources',
    flowType: 'inbound',
    requiresUpstream: true
  },
  'model_sync': {
    id: 'model_sync',
    name: 'Model Synchronization',
    description: 'Sync ML models and training data with data warehouses',
    flowType: 'bidirectional',
    requiresDownstream: true
  },
  'real_time_alerts': {
    id: 'real_time_alerts',
    name: 'Real-time Alerting',
    description: 'Generate real-time alerts and notifications',
    flowType: 'outbound',
    requiresDownstream: true
  },
  'predictive_maint': {
    id: 'predictive_maint',
    name: 'Predictive Maintenance',
    description: 'Predict equipment failures and maintenance needs',
    flowType: 'outbound',
    requiresDownstream: true
  },
  'quality_control': {
    id: 'quality_control',
    name: 'Quality Control',
    description: 'Automate quality control and inspection workflows',
    flowType: 'bidirectional',
    requiresDownstream: true
  }
};

/**
 * Platform-specific capability mappings
 * Only includes capabilities if the system is actually capable of that function
 */
const PLATFORM_CAPABILITIES: Record<string, SystemCapability[]> = {
  // Data & Analytics Platforms
  'palantir_foundry': ['insight_to_work', 'asset_health', 'parts_intel', 'fan_in', 'model_sync'],
  'cognite_data_fusion': ['insight_to_work', 'asset_health', 'fan_in', 'model_sync'],
  'seeq': ['insight_to_work', 'asset_health', 'fan_in'],
  
  // Cloud Data Platforms
  'databricks': ['fan_in', 'model_sync', 'predictive_maint'],
  'snowflake': ['fan_in', 'model_sync'],
  'azure_synapse': ['fan_in', 'model_sync', 'insight_to_work'],
  'aws_sagemaker': ['fan_in', 'insight_to_work', 'predictive_maint'],
  'google_vertex': ['fan_in', 'insight_to_work', 'predictive_maint'],
  
  // Industrial Analytics
  'honeywell_forge': ['insight_to_work', 'asset_health', 'fan_in', 'predictive_maint'],
  'aspen_mtell': ['asset_health', 'predictive_maint', 'insight_to_work'],
  'ge_predix': ['asset_health', 'predictive_maint', 'fan_in'],
  'siemens_mindsphere': ['asset_health', 'predictive_maint', 'fan_in'],
  
  // Vision & Quality Systems
  'cognex_insight': ['quality_control', 'real_time_alerts'],
  'keyence_cv': ['quality_control', 'real_time_alerts'],
  'omron_fh': ['quality_control', 'real_time_alerts'],
  
  // Condition Monitoring
  'fluke_connect': ['asset_health', 'real_time_alerts'],
  'pruftechnik_omnitrend': ['asset_health', 'predictive_maint'],
  'skf_insight': ['asset_health', 'predictive_maint'],
  
  // MES/MOM Systems
  'rockwell_mom': ['quality_control', 'real_time_alerts', 'insight_to_work'],
  'siemens_opcenter': ['quality_control', 'real_time_alerts', 'insight_to_work'],
  'ge_proficy': ['quality_control', 'real_time_alerts', 'fan_in']
};

/**
 * Pattern-based capability detection for systems not explicitly mapped
 */
const CAPABILITY_PATTERNS: Array<{
  pattern: RegExp;
  capabilities: SystemCapability[];
  description: string;
}> = [
  {
    pattern: /foundry|palantir/i,
    capabilities: ['insight_to_work', 'asset_health', 'parts_intel', 'fan_in', 'model_sync'],
    description: 'Data operations platform'
  },
  {
    pattern: /cognite.*data.*fusion/i,
    capabilities: ['insight_to_work', 'asset_health', 'fan_in', 'model_sync'],
    description: 'Industrial data platform'
  },
  {
    pattern: /seeq/i,
    capabilities: ['insight_to_work', 'asset_health', 'fan_in'],
    description: 'Process analytics platform'
  },
  {
    pattern: /databricks/i,
    capabilities: ['fan_in', 'model_sync', 'predictive_maint'],
    description: 'Unified analytics platform'
  },
  {
    pattern: /snowflake/i,
    capabilities: ['fan_in', 'model_sync'],
    description: 'Cloud data platform'
  },
  {
    pattern: /(azure.*synapse|synapse.*analytics)/i,
    capabilities: ['fan_in', 'model_sync', 'insight_to_work'],
    description: 'Analytics service'
  },
  {
    pattern: /(aws.*sagemaker|sagemaker)/i,
    capabilities: ['fan_in', 'insight_to_work', 'predictive_maint'],
    description: 'ML platform'
  },
  {
    pattern: /(vertex.*ai|google.*vertex)/i,
    capabilities: ['fan_in', 'insight_to_work', 'predictive_maint'],
    description: 'AI platform'
  },
  {
    pattern: /(honeywell.*forge|forge.*honeywell)/i,
    capabilities: ['insight_to_work', 'asset_health', 'fan_in', 'predictive_maint'],
    description: 'Industrial IoT platform'
  },
  {
    pattern: /(cognex|keyence.*cv|omron.*fh)/i,
    capabilities: ['quality_control', 'real_time_alerts'],
    description: 'Machine vision system'
  },
  {
    pattern: /(fluke.*connect|pruftechnik|skf.*insight)/i,
    capabilities: ['asset_health', 'predictive_maint'],
    description: 'Condition monitoring system'
  }
];

/**
 * Tag a node with appropriate capabilities based on its properties
 * @param node - Node to tag with capabilities
 * @returns Node with capabilities array populated
 */
export function tagNodeWithCapabilities(node: Node): Node {
  try {
    const enhanced = { ...node };
    const nodeId = node.id.toLowerCase();
    const nodeName = node.name.toLowerCase();
    
    // Initialize capabilities array
    enhanced.capabilities = (enhanced.capabilities as SystemCapability[]) || [];
    
    // Direct platform mapping (highest priority)
    const directCapabilities = PLATFORM_CAPABILITIES[nodeId];
    if (directCapabilities) {
      enhanced.capabilities = [...new Set([...enhanced.capabilities, ...directCapabilities])] as SystemCapability[];
      console.log(`[capabilities] Direct mapping for ${node.name}:`, directCapabilities);
      return enhanced;
    }
    
    // Pattern-based detection
    for (const { pattern, capabilities, description } of CAPABILITY_PATTERNS) {
      if (pattern.test(nodeName) || pattern.test(nodeId)) {
        enhanced.capabilities = [...new Set([...enhanced.capabilities, ...capabilities])] as SystemCapability[];
        console.log(`[capabilities] Pattern match for ${node.name} (${description}):`, capabilities);
        break; // Take first match to avoid duplicates
      }
    }
    
    // All capabilities are always enabled now
    
    return enhanced;
    
  } catch (error) {
    console.warn('[capabilities] Error tagging node', node.name, ':', error);
    return { ...node, capabilities: node.capabilities || [] };
  }
}

/**
 * Batch tag multiple nodes with capabilities
 * @param nodes - Array of nodes to enhance
 * @returns Array of nodes with capabilities
 */
export function tagNodesWithCapabilities(nodes: Node[]): Node[] {
  return nodes.map(node => tagNodeWithCapabilities(node));
}

/**
 * Get capability definition by ID
 * @param capabilityId - Capability identifier
 * @returns Capability definition or undefined
 */
export function getCapabilityDefinition(capabilityId: SystemCapability): CapabilityDefinition | undefined {
  return CAPABILITY_REGISTRY[capabilityId];
}

/**
 * Filter nodes by specific capability
 * @param nodes - Array of nodes to filter
 * @param capability - Capability to filter by
 * @returns Nodes that have the specified capability
 */
export function getNodesByCapability(nodes: Node[], capability: SystemCapability): Node[] {
  return nodes.filter(node => 
    node.capabilities && node.capabilities.includes(capability)
  );
}

/**
 * Get all unique capabilities across a set of nodes
 * @param nodes - Array of nodes
 * @returns Unique capabilities found across all nodes
 */
export function getAllCapabilities(nodes: Node[]): SystemCapability[] {
  const allCapabilities = nodes.flatMap(node => (node.capabilities as SystemCapability[]) || []);
  return [...new Set(allCapabilities)] as SystemCapability[];
}