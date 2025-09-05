import { AppConfig, ConfigVersion } from '@/types/config';
import { ERP_SYSTEMS, SENSOR_CATEGORIES, AUTOMATION_CATEGORIES, OTHER_SYSTEM_CATEGORIES } from '@/data/brandCatalogs';
import { MigrationService } from './migrationService';

const CONFIG_KEY = 'mx_config_live';
const DRAFT_KEY = 'mx_config_draft';
const VERSIONS_KEY = 'mx_config_versions';

// Import new section data
import { DATA_ANALYTICS_CATEGORIES, CONNECTIVITY_EDGE_CATEGORY, RESULT_COPY_TEMPLATES } from '@/data/newSectionCatalogs';

// Convert legacy data to new config format
const createDefaultConfig = (): AppConfig => {
  const sections = [
    {
      id: 'erp',
      label: 'ERP Systems',
      description: 'Select your current ERP system',
      multi: false,
      systemOptions: ['None', 'Not sure'],
      options: ERP_SYSTEMS[0].brands.map(brand => ({
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
};

export class ConfigService {
  static getLive(): AppConfig {
    console.log('🔍 ConfigService.getLive() called');
    
    const stored = localStorage.getItem(CONFIG_KEY);
    console.log('📦 Raw localStorage data:', stored ? 'EXISTS' : 'MISSING');
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Check if migration is needed
        if (!parsed.schemaVersion || parsed.schemaVersion < 2) {
          console.log('🔄 Running taxonomy migration...');
          const migratedConfig = MigrationService.runTaxonomyMigration(parsed);
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
    
    const defaultConfig = createDefaultConfig();
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
      // Save current live as version
      const current = this.getLive();
      this.saveVersion(current, 'Pre-publish backup');

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
}
