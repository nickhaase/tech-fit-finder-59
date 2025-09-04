import { AppConfig, ConfigVersion } from '@/types/config';
import { ERP_SYSTEMS, SENSOR_CATEGORIES, AUTOMATION_CATEGORIES, OTHER_SYSTEM_CATEGORIES } from '@/data/brandCatalogs';

const CONFIG_KEY = 'mx_config_live';
const DRAFT_KEY = 'mx_config_draft';
const VERSIONS_KEY = 'mx_config_versions';

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
      subcategories: AUTOMATION_CATEGORIES.map(cat => ({
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
          state: 'active' as const
        }))
      }))
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
          state: 'active' as const
        }))
      }))
    }
  ];

  return {
    schemaVersion: 1,
    status: 'published',
    updatedAt: new Date().toISOString(),
    sections,
    synonymMap: {
      'Wonderware': 'AVEVA/Wonderware',
      'Agora': 'Kojo (Formerly Agora Systems)',
      'System Platform': 'AVEVA/Wonderware'
    },
    resultCopy: {
      headers: {
        architecture: 'Your Custom MaintainX Integration Architecture'
      },
      perBrand: {
        defaultTemplate: 'MaintainX integrates with {brand} via {protocol} to sync {objects} ({directionality}, {frequency}).'
      }
    }
  };
};

export class ConfigService {
  static getLive(): AppConfig {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to parse stored config, using default');
      }
    }
    return createDefaultConfig();
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
    config.status = 'draft';
    config.updatedAt = new Date().toISOString();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(config));
  }

  static publish(config?: AppConfig): void {
    const toPublish = config || this.getDraft();
    if (!toPublish) {
      throw new Error('No draft config to publish');
    }

    // Save current live as version
    const current = this.getLive();
    this.saveVersion(current, 'Pre-publish backup');

    // Publish new config
    toPublish.status = 'published';
    toPublish.updatedAt = new Date().toISOString();
    localStorage.setItem(CONFIG_KEY, JSON.stringify(toPublish));
    localStorage.removeItem(DRAFT_KEY);
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
}
