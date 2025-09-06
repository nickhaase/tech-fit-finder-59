import { CategoryOption } from '@/types/assessment';

// Palantir Foundry brand definition (permanent part of the app)
export function getFoundryBrands(): CategoryOption[] {
  return [
    {
      id: 'dataops_integration',
      name: 'DataOps/Integration Platforms',
      description: 'Advanced data operations and integration platforms for insights-driven workflows',
      brands: [
        {
          id: 'palantir_foundry',
          name: 'Palantir Foundry',
          commonNames: ['Foundry', 'Palantir'],
          logo: '/assets/logos/brands/palantir.svg', // Optional - will fallback to initials
          categories: ['data_analytics.dataops_integration'],
          description: 'DataOps platform for operational intelligence and automated decision-making'
        }
      ]
    }
  ];
}

// Enhanced brand definitions with capabilities for existing systems
export function getEnhancedBrands(): Record<string, string[]> {
  const capabilities: Record<string, string[]> = {};
  
  // Add Foundry capabilities (permanent)
  capabilities['palantir_foundry'] = ['insight_to_work', 'asset_health', 'parts_intel', 'fan_in', 'model_sync'];
  
  // Add capabilities for other systems
  capabilities['cognite_data_fusion'] = ['insight_to_work', 'asset_health', 'fan_in', 'model_sync'];
  capabilities['seeq'] = ['insight_to_work', 'asset_health', 'fan_in'];
  capabilities['databricks'] = ['fan_in', 'model_sync'];
  capabilities['snowflake'] = ['fan_in', 'model_sync'];
  capabilities['azure_synapse'] = ['fan_in', 'model_sync', 'insight_to_work'];
  capabilities['google_vertex'] = ['fan_in', 'insight_to_work'];
  capabilities['aws_sagemaker'] = ['fan_in', 'insight_to_work'];
  capabilities['honeywell_forge'] = ['insight_to_work', 'asset_health', 'fan_in'];
  capabilities['aspen_apm'] = ['insight_to_work', 'asset_health', 'fan_in'];
  capabilities['cognex'] = ['insight_to_work'];
  capabilities['keyence'] = ['insight_to_work'];
  
  return capabilities;
}

// Synonym mappings for Foundry (permanent)
export function getFoundrySynonyms(): Record<string, string> {
  return {
    'foundry': 'palantir_foundry',
    'palantir foundry': 'palantir_foundry',
    'palantir': 'palantir_foundry'
  };
}