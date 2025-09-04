export interface BrandOption {
  id: string;
  name: string;
  logo?: string;
  synonyms: string[];
  meta?: {
    categories?: string[];
    brandFollowups?: {
      edition?: string[];
      method?: string[];
      objects?: string[];
      directionality?: string[];
      frequency?: string[];
    };
  };
  state: 'active' | 'deprecated' | 'hidden';
}

export interface ConfigSection {
  id: string;
  label: string;
  description?: string;
  multi: boolean;
  options: BrandOption[];
  systemOptions: string[]; // ['None', 'Not sure']
  subcategories?: ConfigSection[];
}

export interface AppConfig {
  schemaVersion: number;
  status: 'published' | 'draft';
  updatedAt: string;
  sections: ConfigSection[];
  synonymMap: Record<string, string>;
  resultCopy: {
    headers: Record<string, string>;
    perBrand: {
      defaultTemplate: string;
    };
  };
}

export interface ConfigVersion {
  id: string;
  config: AppConfig;
  createdAt: string;
  description?: string;
}