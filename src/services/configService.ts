import { AppConfig, ConfigVersion } from '@/types/config';
import { ERP_SYSTEMS, SENSOR_CATEGORIES, AUTOMATION_CATEGORIES, OTHER_SYSTEM_CATEGORIES } from '@/data/brandCatalogs';
import { MigrationService } from './migrationService';

const CONFIG_KEY = 'mx_config_live';
const DRAFT_KEY = 'mx_config_draft';
const VERSIONS_KEY = 'mx_config_versions';

// Import new section data
import { DATA_ANALYTICS_CATEGORIES, CONNECTIVITY_EDGE_CATEGORY, RESULT_COPY_TEMPLATES } from '@/data/newSectionCatalogs';

export class ConfigService {
  private static config: AppConfig | null = null;
  private static isLoading = false;

  // Convert legacy data to new config format
  private static createDefaultConfig(): AppConfig {
    console.log('[createDefaultConfig] Creating default config...');

    const sections = [
      {
        id: 'erp',
        label: 'ERP Systems',
        description: 'Select your current ERP system',
        multi: false,
        systemOptions: ['None', 'Not sure'],
        options: (ERP_SYSTEMS[0]?.brands || []).map(brand => {
          
          return {
            id: brand.id,
            name: brand.name,
            logo: brand.logo,
            synonyms: brand.commonNames || [],
            categories: brand.categories,
            state: 'active' as const
          };
        })
      },
      {
        id: 'sensors_monitoring',
        label: 'Sensors & Monitoring',
        description: 'Select your sensors and monitoring systems',
        multi: true,
        systemOptions: ['None', 'Not sure'],
        options: [],
        subcategories: SENSOR_CATEGORIES.map(cat => ({
          id: cat.id,
          label: cat.name,
          description: cat.description,
          multi: true,
          systemOptions: ['None', 'Not sure'],
          options: cat.brands.map(brand => ({
            id: brand.id,
            name: brand.name,
            logo: brand.logo,
            synonyms: brand.commonNames || [],
            categories: brand.categories,
            state: 'active' as const
          }))
        }))
      },
      {
        id: 'automation_scada',
        label: 'Automation & SCADA',
        description: 'Select your automation and SCADA systems',
        multi: true,
        systemOptions: ['None', 'Not sure'],
        options: [],
        subcategories: [
          ...AUTOMATION_CATEGORIES.map(cat => ({
            id: cat.id,
            label: cat.name,
            description: cat.description,
            multi: true,
            systemOptions: ['None', 'Not sure'],
            options: cat.brands.map(brand => ({
              id: brand.id,
              name: brand.name,
              logo: brand.logo,
              synonyms: brand.commonNames || [],
              categories: brand.categories,
              state: 'active' as const
            }))
          })),
          // Add Connectivity & Edge subcategory
          {
            id: CONNECTIVITY_EDGE_CATEGORY.id,
            label: CONNECTIVITY_EDGE_CATEGORY.name,
            description: CONNECTIVITY_EDGE_CATEGORY.description,
            multi: true,
            systemOptions: ['None', 'Not sure'],
            options: CONNECTIVITY_EDGE_CATEGORY.brands.map(brand => ({
              id: brand.id,
              name: brand.name,
              logo: brand.logo,
              synonyms: brand.commonNames || [],
              categories: brand.categories,
              state: 'active' as const
            }))
          }
        ]
      },
      {
        id: 'other_systems',
        label: 'Other Systems',
        description: 'Select your other systems',
        multi: true,
        systemOptions: ['None', 'Not sure'],
        options: [],
        subcategories: OTHER_SYSTEM_CATEGORIES.map(cat => ({
          id: cat.id,
          label: cat.name,
          description: cat.description,
          multi: true,
          systemOptions: ['None', 'Not sure'],
          options: cat.brands.map(brand => ({
            id: brand.id,
            name: brand.name,
            logo: brand.logo,
            synonyms: brand.commonNames || [],
            categories: brand.categories,
            state: 'active' as const
          }))
        }))
      },
      // Add Data & Analytics section
      {
        id: 'data_analytics',
        label: 'Data & Analytics',
        description: 'Data platforms, historians, and analytics systems',
        multi: true,
        systemOptions: ['None', 'Not sure'],
        options: [],
        subcategories: DATA_ANALYTICS_CATEGORIES.map(cat => ({
          id: cat.id,
          label: cat.name,
          description: cat.description,
          multi: true,
          systemOptions: ['None', 'Not sure'],
          state: ['bi', 'etl', 'governance'].includes(cat.id) ? 'optional' as const : 'active' as const,
          options: cat.brands.map(brand => ({
            id: brand.id,
            name: brand.name,
            logo: brand.logo,
            synonyms: brand.commonNames || [],
            categories: brand.categories,
            state: 'active' as const
          }))
        }))
      }
    ];

    // Add alias for Platforms/Historians in Sensors section
    const sensorsSection = sections.find(s => s.id === 'sensors_monitoring');
    if (sensorsSection && sensorsSection.subcategories) {
      const historiansAlias = sensorsSection.subcategories.find(sub => sub.id === 'platforms_historians');
      if (historiansAlias) {
        // Cast to include aliasOf property
        (historiansAlias as any).aliasOf = 'data_analytics.historians';
        historiansAlias.description = 'Data collection and historian platforms (→ Data & Analytics)';
      }
    }

    return {
      schemaVersion: 2, // Increment for new taxonomy
      status: 'published',
      updatedAt: new Date().toISOString(),
      sections,
      crossListingEnabled: true,
      globalBrands: [], // Initialize empty global brands array
      synonymMap: {
        'Wonderware': 'AVEVA/Wonderware',
        'Agora': 'Kojo (Formerly Agora Systems)',
        'System Platform': 'AVEVA/Wonderware'
      },
        resultCopy: {
          headers: {
            'data_analytics': 'Data & Analytics Integration',
            'connectivity_edge': 'Edge Connectivity & Protocols'
          },
          perBrand: {
            defaultTemplate: "MaintainX integrates with {brand} to sync {objects} and enhance {workflow}.",
            ...RESULT_COPY_TEMPLATES
          }
        }
    };
  }

  static getLiveConfig(): AppConfig {
    if (this.config) {
      return this.config;
    }

    console.log('🔄 Loading live config...');
    this.config = this.getLive();
    console.log('✅ Live config loaded successfully');
    return this.config;
  }

  // Clear config cache to force regeneration
  static invalidateConfig(): void {
    console.log('🗑️ Invalidating config cache...');
    this.config = null;
    localStorage.removeItem('mx_config_live');
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('configInvalidated'));
  }

  static getLive(): AppConfig {
    console.log('🔍 ConfigService.getLive() called');
    
    const stored = localStorage.getItem(CONFIG_KEY);
    console.log('📦 Raw localStorage data:', stored ? 'EXISTS' : 'MISSING');
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Check if migration is needed
        if (!parsed.schemaVersion || parsed.schemaVersion < 3) {
          console.log('🔄 Running taxonomy migration...');
          // For synchronous version, use sync helper
          const def = this.createDefaultConfigSync();

          // Clone parsed to avoid mutation
          const base: AppConfig = { ...parsed };
          // Ensure required fields exist
          base.sections = base.sections || [];
          base.synonymMap = base.synonymMap || {} as any;
          base.resultCopy = base.resultCopy || def.resultCopy;

          // 1) Merge sections: add only missing sections/subcategories from default
          def.sections.forEach(defSection => {
            const existingSection = base.sections.find(s => s.id === defSection.id);
            if (!existingSection) {
              base.sections.push(defSection); // add whole new section
            } else {
              // Ensure options arrays exist
              existingSection.options = existingSection.options || [];
              // Merge missing subcategories by id
              if (defSection.subcategories?.length) {
                existingSection.subcategories = existingSection.subcategories || [];
                defSection.subcategories.forEach(defSub => {
                  const hasSub = existingSection.subcategories!.some(s => s.id === defSub.id);
                  if (!hasSub) existingSection.subcategories!.push(defSub);
                });
              }
            }
          });

          // 2) Merge synonyms (keep user's overrides)
          base.synonymMap = { ...def.synonymMap, ...base.synonymMap };

          // 3) Preserve global brands and custom links/logos
          if (parsed.globalBrands) {
            base.globalBrands = parsed.globalBrands;
          } else {
            base.globalBrands = def.globalBrands || [];
          }

          // 4) Carry over cross-listing flag
          if (typeof base.crossListingEnabled === 'undefined') {
            base.crossListingEnabled = def.crossListingEnabled;
          }

          // 5) Merge result copy
          base.resultCopy = {
            headers: { ...(def.resultCopy?.headers || {}), ...(base.resultCopy?.headers || {}) },
            perBrand: {
              ...(def.resultCopy?.perBrand || {}),
              ...(base.resultCopy?.perBrand || {}),
              defaultTemplate: (base.resultCopy as any)?.perBrand?.defaultTemplate || (def.resultCopy as any)?.perBrand?.defaultTemplate,
            },
          } as any;

          const migratedConfig = MigrationService.runTaxonomyMigration(base);
          this.publish(migratedConfig);
          return migratedConfig;
        }
        
        console.log('✅ Successfully parsed stored config:', {
          sectionsCount: parsed.sections?.length || 0,
          status: parsed.status,
          updatedAt: parsed.updatedAt,
          totalBrands: parsed.sections?.reduce((acc: number, s: any) => 
            acc + (s.options?.length || 0) + 
            (s.subcategories?.reduce((sub: number, cat: any) => sub + (cat.options?.length || 0), 0) || 0), 0
          ),
          totalLogos: parsed.sections?.reduce((acc: number, s: any) => 
            acc + (s.options?.filter((o: any) => o.logo)?.length || 0) + 
            (s.subcategories?.reduce((sub: number, cat: any) => 
              sub + (cat.options?.filter((o: any) => o.logo)?.length || 0), 0) || 0), 0
          )
        });
        return parsed;
      } catch (e) {
        console.error('❌ Failed to parse stored config:', e);
        console.log('🗂️ Creating default config as fallback');
      }
    } else {
      console.log('📂 No stored config found, creating default');
    }
    
    const defaultConfig = this.createDefaultConfigSync();
    console.log('🏭 Created default config:', {
      sectionsCount: defaultConfig.sections.length,
      totalBrands: defaultConfig.sections.reduce((acc, s) => 
        acc + s.options.length + 
        (s.subcategories?.reduce((sub, cat) => sub + cat.options.length, 0) || 0), 0
      ),
      totalLogos: defaultConfig.sections.reduce((acc, s) => 
        acc + s.options.filter(o => o.logo).length + 
        (s.subcategories?.reduce((sub, cat) => sub + cat.options.filter(o => o.logo).length, 0) || 0), 0
      )
    });
    
    return defaultConfig;
  }

  // Synchronous version for backwards compatibility
  private static createDefaultConfigSync(): AppConfig {
    console.log('[createDefaultConfigSync] Creating default config synchronously...');

    const sections = [
      {
        id: 'erp',
        label: 'ERP Systems',
        description: 'Select your current ERP system',
        multi: false,
        systemOptions: ['None', 'Not sure'],
        options: (ERP_SYSTEMS[0]?.brands || []).map(brand => ({
          id: brand.id,
          name: brand.name,
          logo: brand.logo,
          synonyms: brand.commonNames || [],
          categories: brand.categories,
          state: 'active' as const
        }))
      },
      {
        id: 'sensors_monitoring',
        label: 'Sensors & Monitoring',
        description: 'Select your sensors and monitoring systems',
        multi: true,
        systemOptions: ['None', 'Not sure'],
        options: [],
        subcategories: SENSOR_CATEGORIES.map(cat => ({
          id: cat.id,
          label: cat.name,
          description: cat.description,
          multi: true,
          systemOptions: ['None', 'Not sure'],
          options: cat.brands.map(brand => ({
            id: brand.id,
            name: brand.name,
            logo: brand.logo,
            synonyms: brand.commonNames || [],
            categories: brand.categories,
            state: 'active' as const
          }))
        }))
      },
      {
        id: 'automation_scada',
        label: 'Automation & SCADA',
        description: 'Select your automation and SCADA systems',
        multi: true,
        systemOptions: ['None', 'Not sure'],
        options: [],
        subcategories: [
          ...AUTOMATION_CATEGORIES.map(cat => ({
            id: cat.id,
            label: cat.name,
            description: cat.description,
            multi: true,
            systemOptions: ['None', 'Not sure'],
            options: cat.brands.map(brand => ({
              id: brand.id,
              name: brand.name,
              logo: brand.logo,
              synonyms: brand.commonNames || [],
              categories: brand.categories,
              state: 'active' as const
            }))
          })),
          {
            id: CONNECTIVITY_EDGE_CATEGORY.id,
            label: CONNECTIVITY_EDGE_CATEGORY.name,
            description: CONNECTIVITY_EDGE_CATEGORY.description,
            multi: true,
            systemOptions: ['None', 'Not sure'],
            options: CONNECTIVITY_EDGE_CATEGORY.brands.map(brand => ({
              id: brand.id,
              name: brand.name,
              logo: brand.logo,
              synonyms: brand.commonNames || [],
              categories: brand.categories,
              state: 'active' as const
            }))
          }
        ]
      },
      {
        id: 'other_systems',
        label: 'Other Systems',
        description: 'Select your other systems',
        multi: true,
        systemOptions: ['None', 'Not sure'],
        options: [],
        subcategories: OTHER_SYSTEM_CATEGORIES.map(cat => ({
          id: cat.id,
          label: cat.name,
          description: cat.description,
          multi: true,
          systemOptions: ['None', 'Not sure'],
          options: cat.brands.map(brand => ({
            id: brand.id,
            name: brand.name,
            logo: brand.logo,
            synonyms: brand.commonNames || [],
            categories: brand.categories,
            state: 'active' as const
          }))
        }))
      },
      // Add Data & Analytics section
      {
        id: 'data_analytics',
        label: 'Data & Analytics',
        description: 'Data platforms, historians, and analytics systems',
        multi: true,
        systemOptions: ['None', 'Not sure'],
        options: [],
        subcategories: DATA_ANALYTICS_CATEGORIES.map(cat => ({
          id: cat.id,
          label: cat.name,
          description: cat.description,
          multi: true,
          systemOptions: ['None', 'Not sure'],
          state: ['bi', 'etl', 'governance'].includes(cat.id) ? 'optional' as const : 'active' as const,
          options: cat.brands.map(brand => ({
            id: brand.id,
            name: brand.name,
            logo: brand.logo,
            synonyms: brand.commonNames || [],
            categories: brand.categories,
            state: 'active' as const
          }))
        }))
      }
    ];

    return {
      schemaVersion: 2,
      status: 'published',
      updatedAt: new Date().toISOString(),
      sections,
      crossListingEnabled: true,
      globalBrands: [],
      synonymMap: {
        'Wonderware': 'AVEVA/Wonderware',
        'Agora': 'Kojo (Formerly Agora Systems)',
        'System Platform': 'AVEVA/Wonderware'
      },
      resultCopy: {
        headers: {
          'data_analytics': 'Data & Analytics Integration',
          'connectivity_edge': 'Edge Connectivity & Protocols'
        },
        perBrand: {
          defaultTemplate: "MaintainX integrates with {brand} to sync {objects} and enhance {workflow}.",
          ...RESULT_COPY_TEMPLATES
        }
      }
    };
  }

  private static async loadConfig(): Promise<AppConfig> {
    // For now, just load from storage since we don't have file loading in browser
    return await this.loadFromStorage();
  }

  private static async loadFromStorage(): Promise<AppConfig> {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse stored config:', error);
      }
    }
    
    console.log('📄 No stored config found, creating default config...');
    return await this.createDefaultConfig();
  }

  static clearCache(): void {
    this.config = null;
    console.log('🗑️ Config cache cleared');
  }

  static async refreshConfig(): Promise<AppConfig> {
    console.log('🔄 Refreshing config after feature flag change...');
    this.clearCache();
    return await this.getLiveConfig();
  }

  static getDraft(): AppConfig | null {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to parse draft config');
        return null;
      }
    }
    return null;
  }

  static saveDraft(config: AppConfig): void {
    try {
      config.status = 'draft';
      config.updatedAt = new Date().toISOString();
      
      let configToSave = config;
      let configString = JSON.stringify(config);
      const sizeKB = Math.round(configString.length / 1024);
      
      console.log('💾 Saving draft:', {
        size: sizeKB + 'KB',
        totalBrands: config.sections.reduce((acc, s) => 
          acc + (s.options?.length || 0) + 
          (s.subcategories?.reduce((sub, cat) => sub + (cat.options?.length || 0), 0) || 0), 0),
        totalLogos: config.sections.reduce((acc, s) => 
          acc + (s.options?.filter(o => o.logo)?.length || 0) + 
          (s.subcategories?.reduce((sub, cat) => 
            sub + (cat.options?.filter(o => o.logo)?.length || 0), 0) || 0), 0)
      });

      // If config is too large, try to optimize
      if (sizeKB > 4000) {
        console.warn('⚠️ Config size is large, attempting optimization...');
        configToSave = this.optimizeImages(config);
        configString = JSON.stringify(configToSave);
        const newSizeKB = Math.round(configString.length / 1024);
        console.log(`🔧 Optimized config from ${sizeKB}KB to ${newSizeKB}KB`);
      }
      
      localStorage.setItem(DRAFT_KEY, configString);
      console.log('✅ Draft saved successfully');
    } catch (error) {
      console.error('❌ Failed to save draft:', error);
      if (error instanceof DOMException && error.code === 22) {
        throw new Error('Configuration too large for browser storage. Please reduce image sizes or remove some logos.');
      }
      throw error;
    }
  }

  static publish(config?: AppConfig): void {
    console.log('📢 Publishing config...');
    const toPublish = config || this.getDraft();
    if (!toPublish) {
      console.error('❌ No config to publish');
      throw new Error('No draft config to publish');
    }

    try {
      // Save current live as version (avoid recursive getLive during migration)
      const currentStored = localStorage.getItem(CONFIG_KEY);
      if (currentStored) {
        try {
          const currentParsed = JSON.parse(currentStored);
          this.saveVersion(currentParsed, 'Pre-publish backup');
        } catch (e) {
          console.warn('Could not parse current live config for backup, skipping.');
        }
      }

      // Publish new config
      toPublish.status = 'published';
      toPublish.updatedAt = new Date().toISOString();
      
      let configToPublish = toPublish;
      let configString = JSON.stringify(toPublish);
      const sizeKB = Math.round(configString.length / 1024);
      
      console.log('📤 Publishing config:', {
        size: sizeKB + 'KB',
        status: toPublish.status,
        updatedAt: toPublish.updatedAt,
        totalBrands: toPublish.sections.reduce((acc, s) => 
          acc + (s.options?.length || 0) + 
          (s.subcategories?.reduce((sub, cat) => sub + (cat.options?.length || 0), 0) || 0), 0),
        totalLogos: toPublish.sections.reduce((acc, s) => 
          acc + (s.options?.filter(o => o.logo)?.length || 0) + 
          (s.subcategories?.reduce((sub, cat) => 
            sub + (cat.options?.filter(o => o.logo)?.length || 0), 0) || 0), 0)
      });

      // If config is too large, try to optimize
      if (sizeKB > 4000) {
        console.warn('⚠️ Config size is large, attempting optimization...');
        configToPublish = this.optimizeImages(toPublish);
        configString = JSON.stringify(configToPublish);
        const newSizeKB = Math.round(configString.length / 1024);
        console.log(`🔧 Optimized config from ${sizeKB}KB to ${newSizeKB}KB`);
      }
      
      localStorage.setItem(CONFIG_KEY, configString);
      console.log('✅ Config published to localStorage successfully');

      localStorage.removeItem(DRAFT_KEY);
      console.log('🗑️ Draft removed');
      
      // Enhanced notification system for cross-component updates
      const logoCount = configToPublish.sections.reduce((acc, s) => 
        acc + (s.options?.filter(o => o.logo)?.length || 0) + 
        (s.subcategories?.reduce((sub, cat) => 
          sub + (cat.options?.filter(o => o.logo)?.length || 0), 0) || 0), 0);

      // Multiple event types for different listeners
      window.dispatchEvent(new CustomEvent('configUpdated', { 
        detail: { 
          action: 'published', 
          timestamp: configToPublish.updatedAt,
          logoCount: logoCount,
          sectionsCount: configToPublish.sections.length
        } 
      }));

      window.dispatchEvent(new CustomEvent('forceConfigRefresh', { 
        detail: { 
          timestamp: Date.now(),
          logoCount: logoCount,
          sectionsCount: configToPublish.sections.length,
          source: 'admin-publish'
        } 
      }));
      
      console.log('📡 Multiple config update events dispatched');
      
      // Force immediate refresh with delay to ensure storage is written
      this.notifyConfigChange();
      
    } catch (error) {
      console.error('❌ Failed to publish config:', error);
      if (error instanceof DOMException && error.code === 22) {
        throw new Error('Configuration too large for browser storage. Please reduce image sizes or remove some logos.');
      }
      throw error;
    }
  }

  // New method to force config refresh across all components
  static notifyConfigChange(): void {
    // Use a small delay to ensure storage write is complete
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('forceConfigRefresh', { 
        detail: { timestamp: Date.now() }
      }));
    }, 100);
  }

  static saveVersion(config: AppConfig, description?: string): void {
    const versions = this.listVersions();
    const newVersion: ConfigVersion = {
      id: Date.now().toString(),
      config,
      createdAt: new Date().toISOString(),
      description
    };

    versions.unshift(newVersion);
    
    // Keep only last 20 versions
    if (versions.length > 20) {
      versions.splice(20);
    }

    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
  }

  static createSnapshot(description: string = 'Manual Snapshot'): void {
    const current = this.getLive();
    this.saveVersion(current, description);
    console.log('📸 Snapshot created:', description);
  }

  static listVersions(): ConfigVersion[] {
    const stored = localStorage.getItem(VERSIONS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  static rollback(versionId: string): void {
    const versions = this.listVersions();
    const version = versions.find(v => v.id === versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    // Save current as backup
    const current = this.getLive();
    this.saveVersion(current, 'Pre-rollback backup');

    // Restore version
    localStorage.setItem(CONFIG_KEY, JSON.stringify(version.config));
    localStorage.removeItem(DRAFT_KEY);
  }

  static createDraftFromLive(): AppConfig {
    const live = this.getLive();
    const draft = { ...live, status: 'draft' as const };
    this.saveDraft(draft);
    return draft;
  }

  // Image optimization to reduce localStorage usage
  static optimizeImages(config: AppConfig): AppConfig {

    // For synchronous operation, we'll do a simpler optimization
    const simpleOptimizeOptions = (options: any[]): any[] => {
      return options.map(option => {
        if (option.logo && typeof option.logo === 'string' && option.logo.startsWith('data:') && option.logo.length > 50000) {
          // For very large images, remove them temporarily and log
          console.warn(`Large logo detected for ${option.name}, temporarily removing to save space`);
          return { ...option, logo: undefined };
        }
        return option;
      });
    };

    return {
      ...config,
      sections: config.sections.map(section => ({
        ...section,
        options: simpleOptimizeOptions(section.options || []),
        subcategories: section.subcategories?.map(sub => ({
          ...sub,
          options: simpleOptimizeOptions(sub.options || [])
        })) || []
      }))
    };
  }

  // Brand connection utilities
  static linkOptionToGlobalBrand(config: AppConfig, sectionId: string, subcategoryId: string | null, optionId: string, globalBrandId: string): AppConfig {
    const updatedConfig = { ...config };
    
    // Find the global brand
    const globalBrand = updatedConfig.globalBrands?.find(b => b.id === globalBrandId);
    if (!globalBrand) {
      throw new Error('Global brand not found');
    }

    // Find and update the option
    const section = updatedConfig.sections.find(s => s.id === sectionId);
    if (!section) return updatedConfig;

    let targetOptions: any[] = [];
    
    if (subcategoryId) {
      const subcategory = section.subcategories?.find(sub => sub.id === subcategoryId);
      if (subcategory) {
        targetOptions = subcategory.options || [];
      }
    } else {
      targetOptions = section.options || [];
    }

    const optionIndex = targetOptions.findIndex(o => o.id === optionId);
    if (optionIndex >= 0) {
      const existingOption = targetOptions[optionIndex];
      
      // Sync core brand data from global brand
      targetOptions[optionIndex] = {
        ...existingOption,
        globalId: globalBrandId,
        isLinkedToGlobal: true,
        name: globalBrand.name,
        logo: globalBrand.logo,
        synonyms: globalBrand.synonyms,
        state: globalBrand.state
      };
    }

    return updatedConfig;
  }

  static unlinkOptionFromGlobalBrand(config: AppConfig, sectionId: string, subcategoryId: string | null, optionId: string): AppConfig {
    const updatedConfig = { ...config };
    const section = updatedConfig.sections.find(s => s.id === sectionId);
    if (!section) return updatedConfig;

    let targetOptions: any[] = [];
    
    if (subcategoryId) {
      const subcategory = section.subcategories?.find(sub => sub.id === subcategoryId);
      if (subcategory) {
        targetOptions = subcategory.options || [];
      }
    } else {
      targetOptions = section.options || [];
    }

    const optionIndex = targetOptions.findIndex(o => o.id === optionId);
    if (optionIndex >= 0) {
      const { globalId, isLinkedToGlobal, sectionSpecificOverrides, ...option } = targetOptions[optionIndex];
      targetOptions[optionIndex] = option;
    }

    return updatedConfig;
  }

  static syncLinkedOptionsFromGlobalBrand(config: AppConfig, globalBrandId: string): AppConfig {
    const updatedConfig = { ...config };
    const globalBrand = updatedConfig.globalBrands?.find(b => b.id === globalBrandId);
    if (!globalBrand) return updatedConfig;

    // Find all linked options and sync them
    updatedConfig.sections.forEach(section => {
      // Sync section-level options
      if (section.options) {
        section.options.forEach((option, index) => {
          if (option.globalId === globalBrandId) {
            section.options![index] = {
              ...option,
              name: globalBrand.name,
              logo: globalBrand.logo,
              synonyms: globalBrand.synonyms,
              state: globalBrand.state
            };
          }
        });
      }

      // Sync subcategory options
      if (section.subcategories) {
        section.subcategories.forEach(subcategory => {
          if (subcategory.options) {
            subcategory.options.forEach((option, index) => {
              if (option.globalId === globalBrandId) {
                subcategory.options![index] = {
                  ...option,
                  name: globalBrand.name,
                  logo: globalBrand.logo,
                  synonyms: globalBrand.synonyms,
                  state: globalBrand.state
                };
              }
            });
          }
        });
      }
    });

    return updatedConfig;
  }

  static createGlobalBrandFromOption(config: AppConfig, sectionId: string, subcategoryId: string | null, optionId: string): AppConfig {
    const updatedConfig = { ...config };
    const section = updatedConfig.sections.find(s => s.id === sectionId);
    if (!section) return updatedConfig;

    let targetOptions: any[] = [];
    
    if (subcategoryId) {
      const subcategory = section.subcategories?.find(sub => sub.id === subcategoryId);
      if (subcategory) {
        targetOptions = subcategory.options || [];
      }
    } else {
      targetOptions = section.options || [];
    }

    const option = targetOptions.find(o => o.id === optionId);
    if (!option) return updatedConfig;

    // Create global brand from option
    const newGlobalBrand = {
      id: option.id + '_global',
      name: option.name,
      logo: option.logo,
      synonyms: option.synonyms || [],
      state: option.state === 'optional' ? 'active' as const : option.state,
      assignedSections: [subcategoryId ? `${sectionId}.${subcategoryId}` : sectionId],
      sectionSpecificMeta: {}
    };

    // Add to global brands
    if (!updatedConfig.globalBrands) {
      updatedConfig.globalBrands = [];
    }
    updatedConfig.globalBrands.push(newGlobalBrand);

    // Link the option to the new global brand
    return this.linkOptionToGlobalBrand(updatedConfig, sectionId, subcategoryId, optionId, newGlobalBrand.id);
  }

  // Debug method to check localStorage usage
  static getStorageInfo(): { used: number, total: number, remaining: number } {
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length;
      }
    }
    
    // Rough estimate of localStorage limit
    const total = 5 * 1024 * 1024; // 5MB typical limit
    
    return {
      used,
      total,
      remaining: total - used
    };
  }

  // Async helper methods for feature flag dependent data
  private static async getDataAnalyticsCategoriesAsync() {
    const { isFeatureEnabled } = await import('@/config/features');
    const { getDataAnalyticsCategories } = await import('@/data/newSectionCatalogs');
    
    console.log('[getDataAnalyticsCategoriesAsync] Getting data analytics categories...');
    const foundryEnabled = await isFeatureEnabled('FOUNDRY');
    console.log('[getDataAnalyticsCategoriesAsync] FOUNDRY enabled:', foundryEnabled);
    
    return getDataAnalyticsCategories();
  }

  private static async getFoundrySynonymsAsync() {
    const { isFeatureEnabled } = await import('@/config/features');
    const { getFoundrySynonyms } = await import('@/data/foundryBrands');
    
    console.log('[getFoundrySynonymsAsync] Getting Foundry synonyms...');
    const foundryEnabled = await isFeatureEnabled('FOUNDRY');
    console.log('[getFoundrySynonymsAsync] FOUNDRY enabled:', foundryEnabled);
    
    return getFoundrySynonyms();
  }
}
