import { SensorIntegration, AssessmentData } from '@/types/assessment';

/**
 * Category migration utilities for backward compatibility
 * Handles migration of legacy sensor categories to consolidated structure
 */

// Legacy category mappings to new consolidated categories
export const LEGACY_CATEGORY_MAPPINGS = {
  // Sensor category consolidation - map to proper type names
  'IoT Sensors': 'Sensors',
  'Environmental Sensors': 'Sensors', 
  'Safety Sensors': 'Sensors',
  'Smart Meters': 'Smart Meters', // Keep as-is
  'Condition Monitoring': 'Condition Monitoring', // Keep as-is
  
  // For future use - other potential consolidations
  'legacy_cmms': 'cmms_eam',
  'workflow_itsm': 'workflow_tools'
} as const;

/**
 * Migrates legacy sensor integration categories to new consolidated structure
 */
export function migrateSensorCategories(
  sensors: SensorIntegration[]
): SensorIntegration[] {
  return sensors.map(sensor => {
    const mappedCategory = LEGACY_CATEGORY_MAPPINGS[sensor.category as keyof typeof LEGACY_CATEGORY_MAPPINGS];
    
    // Return sensor with migrated category or original if no mapping exists
    if (mappedCategory) {
      return {
        ...sensor,
        category: mappedCategory as SensorIntegration['category']
      };
    }
    
    return sensor;
  });
}

/**
 * Migrates entire assessment data structure to handle legacy categories
 */
export function migrateAssessmentData(data: AssessmentData): AssessmentData {
  const migratedData = { ...data };
  
  // Migrate sensor categories
  if (migratedData.integrations?.sensorsMonitoring) {
    migratedData.integrations.sensorsMonitoring = migrateSensorCategories(
      migratedData.integrations.sensorsMonitoring
    );
  }
  
  return migratedData;
}

/**
 * Check if assessment data needs migration
 */
export function needsCategoryMigration(data: AssessmentData): boolean {
  const sensorsNeedMigration = data.integrations?.sensorsMonitoring?.some(
    sensor => Object.keys(LEGACY_CATEGORY_MAPPINGS).includes(sensor.category)
  ) || false;
  
  return sensorsNeedMigration;
}

/**
 * Get display name for legacy categories (for UI compatibility)
 */
export function getLegacyCategoryDisplayName(category: string): string {
  const displayNames = {
    'iot_sensors': 'IoT Sensors',
    'environmental_sensors': 'Environmental Sensors', 
    'safety_sensors': 'Safety Sensors',
    'smart_meters': 'Smart Meters',
    'condition_monitoring': 'Condition Monitoring'
  } as const;
  
  return displayNames[category as keyof typeof displayNames] || category;
}