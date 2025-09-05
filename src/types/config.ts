export interface BrandOption {
  id: string;
  name: string;
  logo?: string;
  synonyms: string[];
  categories?: string[]; // Cross-listing: which sections this brand appears in
  meta?: {
    categories?: string[];
    crossListed?: boolean; // For UI purposes
    brandFollowups?: {
      edition?: string[];
      method?: string[];
      objects?: string[];
      directionality?: string[];
      frequency?: string[];
      // New advanced question types
      gateway?: string[];
      protocols?: string[];
      broker?: string[];
      deployment?: string[];
      security?: string[];
      platform?: string[];
      movement?: string[];
      updateMode?: string[];
      interfaces?: string[];
      retention?: string[];
      pattern?: string[];
      serialization?: string[];
      tool?: string[];
      modeling?: string[];
      refresh?: string[];
      audience?: string[];
      tooling?: string[];
      schedule?: string[];
      catalog?: string[];
      policies?: string[];
    };
  };
  state: 'active' | 'deprecated' | 'hidden' | 'optional';
  globalId?: string; // Reference to global brand
  assignedSections?: string[]; // Which sections this brand is assigned to
}

export interface GlobalBrand {
  id: string;
  name: string;
  logo?: string;
  synonyms: string[];
  state: 'active' | 'deprecated' | 'hidden';
  assignedSections: string[]; // Array of section IDs where this brand appears
  sectionSpecificMeta?: Record<string, any>; // Section-specific metadata
}

export interface ConfigSection {
  id: string;
  label: string;
  description?: string;
  multi: boolean;
  options: BrandOption[];
  systemOptions: string[]; // ['None', 'Not sure']
  subcategories?: ConfigSection[];
  aliasOf?: string; // Points to another section (e.g., "data_analytics.historians")
  state?: 'active' | 'optional' | 'hidden'; // Optional sections
}

export interface AppConfig {
  schemaVersion: number;
  status: 'published' | 'draft';
  updatedAt: string;
  sections: ConfigSection[];
  synonymMap: Record<string, string>;
  globalBrands?: GlobalBrand[]; // Global brand library
  crossListingEnabled?: boolean; // Enable cross-section brand listing
  resultCopy: {
    headers: Record<string, string>;
    perBrand: {
      defaultTemplate: string;
      // New templates for expanded sections
      warehouse_lakehouse?: string;
      historians?: string;
      streaming?: string;
      connectivity_edge?: string;
    };
  };
}

export interface ConfigVersion {
  id: string;
  config: AppConfig;
  createdAt: string;
  description?: string;
}