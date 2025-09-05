import { AppConfig, ConfigSection, BrandOption } from '@/types/config';

export class MigrationService {
  /**
   * Migrate legacy assessments that selected "platforms_historians" to new "data_analytics.historians"
   */
  static migrateHistoriansAlias(config: AppConfig): AppConfig {
    const updatedConfig = { ...config };
    
    // Update stored assessments to use new path
    const storedAssessments = localStorage.getItem('mx_stored_assessments');
    if (storedAssessments) {
      try {
        const assessments = JSON.parse(storedAssessments);
        const migratedAssessments = assessments.map((assessment: any) => {
          if (assessment.integrations?.sensorsMonitoring) {
            assessment.integrations.sensorsMonitoring = assessment.integrations.sensorsMonitoring.map((sensor: any) => {
              if (sensor.category === 'Platforms/Historians') {
                return {
                  ...sensor,
                  category: 'Historians / Time-Series',
                  migrated: true
                };
              }
              return sensor;
            });
          }
          return assessment;
        });
        localStorage.setItem('mx_stored_assessments', JSON.stringify(migratedAssessments));
      } catch (e) {
        console.warn('Failed to migrate stored assessments:', e);
      }
    }
    
    return updatedConfig;
  }

  /**
   * Create cross-listing entries for brands that appear in multiple sections
   */
  static setupCrossListing(config: AppConfig): AppConfig {
    const crossListedBrands = new Map<string, BrandOption>();
    
    // Collect all brands with categories field
    config.sections.forEach(section => {
      section.options?.forEach(option => {
        if (option.categories?.length) {
          crossListedBrands.set(option.id, option);
        }
      });
      
      section.subcategories?.forEach(sub => {
        sub.options?.forEach(option => {
          if (option.categories?.length) {
            crossListedBrands.set(option.id, option);
          }
        });
      });
    });
    
    // Add cross-listed brands to their target sections
    crossListedBrands.forEach((brand, brandId) => {
      brand.categories?.forEach(categoryPath => {
        const [sectionId, subcategoryId] = categoryPath.split('.');
        const section = config.sections.find(s => s.id === sectionId);
        
        if (section) {
          let targetContainer: ConfigSection;
          
          if (subcategoryId) {
            targetContainer = section.subcategories?.find(sub => sub.id === subcategoryId) || section;
          } else {
            targetContainer = section;
          }
          
          // Check if brand already exists in target container
          const existsInTarget = targetContainer.options.some(opt => opt.id === brandId);
          
          if (!existsInTarget) {
            targetContainer.options.push({
              ...brand,
              // Mark as cross-listed for UI purposes
              meta: {
                ...brand.meta,
                crossListed: true
              }
            });
          }
        }
      });
    });
    
    return config;
  }

  /**
   * Create a snapshot version before major migrations
   */
  static createMigrationSnapshot(description: string = 'Pre-migration snapshot'): void {
    const versionsKey = 'mx_config_versions';
    const versions = JSON.parse(localStorage.getItem(versionsKey) || '[]');
    
    const currentConfig = localStorage.getItem('mx_config_live');
    if (currentConfig) {
      const snapshot = {
        id: `migration-${Date.now()}`,
        config: JSON.parse(currentConfig),
        createdAt: new Date().toISOString(),
        description
      };
      
      versions.unshift(snapshot);
      
      // Keep only last 20 versions
      if (versions.length > 20) {
        versions.splice(20);
      }
      
      localStorage.setItem(versionsKey, JSON.stringify(versions));
      console.log('📸 Created migration snapshot:', snapshot.id);
    }
  }

  /**
   * Full migration pipeline for taxonomy expansion
   */
  static runTaxonomyMigration(config: AppConfig): AppConfig {
    console.log('🚀 Starting taxonomy migration...');
    
    // Create snapshot first
    this.createMigrationSnapshot('Before taxonomy expansion');
    
    // Run migrations
    let migratedConfig = config;
    migratedConfig = this.migrateHistoriansAlias(migratedConfig);
    migratedConfig = this.setupCrossListing(migratedConfig);
    
    // Update schema version
    migratedConfig.schemaVersion = 2;
    migratedConfig.updatedAt = new Date().toISOString();
    
    console.log('✅ Taxonomy migration completed');
    return migratedConfig;
  }
}
