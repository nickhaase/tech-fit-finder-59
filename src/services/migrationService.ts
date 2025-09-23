import { AppConfig, ConfigSection, BrandOption, GlobalBrand } from '@/types/config';

export class MigrationService {
  /**
   * Remove duplicated sections and brands, consolidating into global brands with references
   */
  static deduplicateSections(config: AppConfig): AppConfig {
    const updatedConfig = { ...config };
    
    // Remove legacy platforms_historians from sensors section
    const sensorsSection = updatedConfig.sections.find(s => s.id === 'sensors_monitoring');
    if (sensorsSection?.subcategories) {
      const historiansIndex = sensorsSection.subcategories.findIndex(sub => sub.id === 'platforms_historians');
      if (historiansIndex >= 0) {
        sensorsSection.subcategories.splice(historiansIndex, 1);
        console.log('🧹 Removed legacy platforms_historians section');
      }
    }
    
    return updatedConfig;
  }

  /**
   * Create global brands from duplicated brands and replace with references
   */
  static consolidateCrossListedBrands(config: AppConfig): AppConfig {
    const updatedConfig = { ...config };
    const globalBrandsMap = new Map<string, GlobalBrand>();
    const brandReferences = new Map<string, string[]>(); // brandId -> section paths
    
    // Find all brands with categories (cross-listed brands)
    updatedConfig.sections.forEach(section => {
      section.options?.forEach(option => {
        if (option.categories?.length) {
          this.trackBrandReference(option, `${section.id}`, brandReferences, globalBrandsMap);
        }
      });
      
      section.subcategories?.forEach(sub => {
        sub.options?.forEach(option => {
          if (option.categories?.length) {
            this.trackBrandReference(option, `${section.id}.${sub.id}`, brandReferences, globalBrandsMap);
          }
        });
      });
    });
    
    // Initialize global brands array if not exists
    if (!updatedConfig.globalBrands) {
      updatedConfig.globalBrands = [];
    }
    
    // Convert cross-listed brands to global brands
    globalBrandsMap.forEach((globalBrand, brandId) => {
      const existingGlobal = updatedConfig.globalBrands!.find(gb => gb.id === brandId);
      if (!existingGlobal) {
        updatedConfig.globalBrands!.push(globalBrand);
        console.log(`🌐 Created global brand: ${globalBrand.name}`);
      }
    });
    
    return updatedConfig;
  }

  private static trackBrandReference(
    option: BrandOption, 
    currentPath: string, 
    brandReferences: Map<string, string[]>,
    globalBrandsMap: Map<string, GlobalBrand>
  ) {
    const refs = brandReferences.get(option.id) || [];
    refs.push(currentPath);
    brandReferences.set(option.id, refs);
    
    // Create global brand entry
    if (!globalBrandsMap.has(option.id)) {
      const allSections = [currentPath, ...(option.categories || [])];
      globalBrandsMap.set(option.id, {
        id: option.id,
        name: option.name,
        logo: option.logo,
        synonyms: option.synonyms || [],
        state: option.state === 'optional' ? 'active' : (option.state || 'active'),
        assignedSections: Array.from(new Set(allSections)),
        sectionSpecificMeta: option.meta ? { [currentPath]: option.meta } : {}
      });
    }
  }

  /**
   * Consolidates sensor categories from legacy fragmented structure
   * Merges IoT, Environmental, and Safety sensors into a single 'sensors' category
   */
  static consolidateSensorCategories(config: AppConfig): AppConfig {
    console.log('🔄 Consolidating sensor categories...');
    
    const updatedConfig = JSON.parse(JSON.stringify(config));
    const sensorsSection = updatedConfig.sections.find((s: any) => s.id === 'sensors_monitoring');
    
    if (sensorsSection?.subcategories) {
      // Find the fragmented sensor categories
      const iotSensors = sensorsSection.subcategories.find((sub: any) => sub.id === 'iot_sensors');
      const envSensors = sensorsSection.subcategories.find((sub: any) => sub.id === 'environmental_sensors');
      const safetySensors = sensorsSection.subcategories.find((sub: any) => sub.id === 'safety_sensors');
      
      if (iotSensors || envSensors || safetySensors) {
        // Create consolidated sensors category
        const consolidatedSensors = {
          id: 'sensors',
          label: 'Sensors',
          description: 'General sensors for temperature, pressure, vibration, environmental monitoring, and safety',
          multi: true,
          systemOptions: ['None', 'Not sure'],
          options: []
        };
        
        // Merge all sensor brands
        const allSensorBrands: any[] = [];
        [iotSensors, envSensors, safetySensors].forEach(category => {
          if (category?.options) {
            allSensorBrands.push(...category.options);
          }
        });
        
        // Remove duplicates based on brand ID and consolidate
        const uniqueBrands = allSensorBrands.reduce((acc: any[], brand: any) => {
          const existing = acc.find(b => b.id === brand.id || b.name === brand.name);
          if (!existing) {
            acc.push(brand);
          }
          return acc;
        }, []);
        
        consolidatedSensors.options = uniqueBrands;
        
        // Remove old fragmented categories and add consolidated one
        sensorsSection.subcategories = sensorsSection.subcategories.filter((sub: any) => 
          !['iot_sensors', 'environmental_sensors', 'safety_sensors'].includes(sub.id)
        );
        
        // Add consolidated category at the beginning
        sensorsSection.subcategories.unshift(consolidatedSensors);
        
        console.log(`✅ Consolidated ${uniqueBrands.length} sensor brands into single category`);
      }
    }
    
    return updatedConfig;
  }

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
   * Create reference-based cross-listing instead of duplicating brands
   */
  static setupReferencedCrossListing(config: AppConfig): AppConfig {
    const updatedConfig = { ...config };
    
    // Remove physical duplicates - brands should only exist in one primary location
    const seenBrands = new Set<string>();
    const brandLocations = new Map<string, string>(); // brandId -> primary location
    
    updatedConfig.sections.forEach(section => {
      // Process main section options
      section.options = section.options.filter(option => {
        if (seenBrands.has(option.id)) {
          console.log(`🧹 Removed duplicate brand ${option.name} from ${section.id}`);
          return false;
        }
        seenBrands.add(option.id);
        brandLocations.set(option.id, section.id);
        return true;
      });
      
      // Process subcategory options
      section.subcategories?.forEach(sub => {
        sub.options = sub.options.filter(option => {
          if (seenBrands.has(option.id)) {
            console.log(`🧹 Removed duplicate brand ${option.name} from ${section.id}.${sub.id}`);
            return false;
          }
          seenBrands.add(option.id);
          brandLocations.set(option.id, `${section.id}.${sub.id}`);
          return true;
        });
      });
    });
    
    // Update global brands to track proper section assignments
    if (updatedConfig.globalBrands) {
      updatedConfig.globalBrands.forEach(globalBrand => {
        const primaryLocation = brandLocations.get(globalBrand.id);
        if (primaryLocation && !globalBrand.assignedSections.includes(primaryLocation)) {
          globalBrand.assignedSections.unshift(primaryLocation);
        }
      });
    }
    
    console.log(`✅ Deduplicated brands, ${seenBrands.size} unique brands remaining`);
    return updatedConfig;
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
   * Enhanced migration pipeline with deduplication
   */
  static runTaxonomyMigration(config: AppConfig): AppConfig {
    console.log('🚀 Starting enhanced taxonomy migration...');
    
    // Create snapshot first
    this.createMigrationSnapshot('Before deduplication and taxonomy expansion');
    
    // Run migrations in order
    let migratedConfig = config;
    migratedConfig = this.consolidateSensorCategories(migratedConfig);
    migratedConfig = this.migrateHistoriansAlias(migratedConfig);
    migratedConfig = this.deduplicateSections(migratedConfig);
    migratedConfig = this.consolidateCrossListedBrands(migratedConfig);
    migratedConfig = this.setupReferencedCrossListing(migratedConfig);
    
    // Update schema version
    migratedConfig.schemaVersion = 3; // Increment for deduplication
    migratedConfig.updatedAt = new Date().toISOString();
    
    console.log('✅ Enhanced taxonomy migration completed');
    return migratedConfig;
  }
}
