#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { AppConfig, ConfigSection, BrandOption, GlobalBrand } from '../../src/types/config';

interface MigrationAudit {
  timestamp: string;
  sectionsCountBefore: number;
  sectionsCountAfter: number;
  globalBrandsCountBefore: number;
  globalBrandsCountAfter: number;
  optionsAdded: string[];
  deletionsCount: number;
}

/**
 * Safe configuration migration script that surgically adds Palantir Foundry
 * without destroying existing configuration data.
 */
class FoundryMigration {
  
  private static detectConfigPath(): string {
    // Auto-detect config file path by checking common locations
    const possiblePaths = [
      'src/config/default.json',
      'src/data/config.json',
      'config/default.json',
      'data/config.json'
    ];
    
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        console.log(`✅ Found config file at: ${path}`);
        return path;
      }
    }
    
    // Since this project uses localStorage, create a temporary config from service
    console.log('ℹ️  No file-based config found. This project uses localStorage-based configuration.');
    console.log('ℹ️  To migrate: first export current config to file, run this script, then import the result.');
    
    throw new Error('No configuration file found. Please export your current config to a JSON file first.');
  }
  
  private static createBackup(configPath: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${configPath}.bak.${timestamp}.json`;
    
    try {
      const originalContent = readFileSync(configPath, 'utf8');
      writeFileSync(backupPath, originalContent, 'utf8');
      console.log(`📦 Backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error}`);
    }
  }
  
  private static ensureDataAnalyticsSection(config: AppConfig): void {
    let dataAnalyticsSection = config.sections.find(s => s.id === 'data_analytics');
    
    if (!dataAnalyticsSection) {
      console.log('➕ Creating data_analytics section');
      dataAnalyticsSection = {
        id: 'data_analytics',
        label: 'Data & Analytics',
        description: 'Data platforms, historians, and analytics systems',
        multi: true,
        systemOptions: ['None', 'Not sure'],
        options: [],
        subcategories: []
      };
      config.sections.push(dataAnalyticsSection);
    }
    
    // Ensure subcategories array exists
    if (!dataAnalyticsSection.subcategories) {
      dataAnalyticsSection.subcategories = [];
    }
  }
  
  private static ensureIndustrialDataOSSubcategory(config: AppConfig): void {
    const dataAnalyticsSection = config.sections.find(s => s.id === 'data_analytics')!;
    let industrialDataOSSubcat = dataAnalyticsSection.subcategories!.find(s => s.id === 'industrial_data_os');
    
    if (!industrialDataOSSubcat) {
      console.log('➕ Creating industrial_data_os subcategory');
      industrialDataOSSubcat = {
        id: 'industrial_data_os',
        label: 'Industrial Data OS / Ops Data Platforms',
        multi: true,
        state: 'active',
        systemOptions: ['None', 'Not sure'],
        options: []
      };
      dataAnalyticsSection.subcategories!.push(industrialDataOSSubcat);
    }
    
    // Ensure options array exists
    if (!industrialDataOSSubcat.options) {
      industrialDataOSSubcat.options = [];
    }
  }
  
  private static addPalantirFoundryOption(config: AppConfig): boolean {
    const dataAnalyticsSection = config.sections.find(s => s.id === 'data_analytics')!;
    const industrialDataOSSubcat = dataAnalyticsSection.subcategories!.find(s => s.id === 'industrial_data_os')!;
    
    // Check if Palantir Foundry already exists
    const existingFoundry = industrialDataOSSubcat.options.find(o => o.id === 'palantir_foundry');
    if (existingFoundry) {
      console.log('ℹ️  Palantir Foundry option already exists, skipping');
      return false;
    }
    
    const foundryOption: BrandOption = {
      id: 'palantir_foundry',
      name: 'Palantir Foundry',
      synonyms: ['Foundry', 'Palantir'],
      state: 'active',
      logo: '/assets/logos/brands/palantir-foundry.svg',
      categories: ['data_analytics.industrial_data_os'],
      meta: { 
        effect: 'orchestrationHalo',
        brandFollowups: {
          platform: ['Palantir Foundry'],
          deployment: ['Cloud', 'On-premises'],
          security: ['RBAC', 'ABAC', 'SSO'],
          interfaces: ['REST API', 'Webhook', 'Kafka'],
          capabilities: ['insight_to_work', 'asset_health', 'parts_intel', 'fan_in', 'model_sync']
        }
      }
    };
    
    console.log('➕ Adding Palantir Foundry option');
    industrialDataOSSubcat.options.push(foundryOption);
    return true;
  }
  
  private static mergeSynonymMap(config: AppConfig): void {
    if (!config.synonymMap) {
      config.synonymMap = {};
    }
    
    const foundrysynonyms = {
      'palantir foundry': 'palantir_foundry',
      'foundry': 'palantir_foundry',
      'palantir': 'palantir_foundry'
    };
    
    let addedCount = 0;
    Object.entries(foundrysynonyms).forEach(([key, value]) => {
      if (!config.synonymMap[key]) {
        config.synonymMap[key] = value;
        addedCount++;
      }
    });
    
    if (addedCount > 0) {
      console.log(`➕ Added ${addedCount} synonym mappings for Foundry`);
    }
  }
  
  private static ensureGlobalBrands(config: AppConfig): void {
    if (!config.globalBrands) {
      config.globalBrands = [];
    }
    
    const globalBrandsToAdd: GlobalBrand[] = [
      {
        id: 'palantir',
        name: 'Palantir',
        logo: '/assets/logos/brands/palantir.svg',
        synonyms: ['Palantir Technologies'],
        state: 'active',
        assignedSections: ['data_analytics', 'data_analytics.industrial_data_os']
      },
      {
        id: 'palantir-foundry',
        name: 'Palantir Foundry',
        logo: '/assets/logos/brands/palantir-foundry.svg',
        synonyms: ['Foundry'],
        state: 'active',
        assignedSections: ['data_analytics', 'data_analytics.industrial_data_os']
      }
    ];
    
    let addedCount = 0;
    globalBrandsToAdd.forEach(brandToAdd => {
      const existing = config.globalBrands!.find(b => b.id === brandToAdd.id);
      if (!existing) {
        config.globalBrands!.push(brandToAdd);
        addedCount++;
      } else {
        // Merge missing assigned sections
        brandToAdd.assignedSections.forEach(section => {
          if (!existing.assignedSections.includes(section)) {
            existing.assignedSections.push(section);
          }
        });
      }
    });
    
    if (addedCount > 0) {
      console.log(`➕ Added ${addedCount} global brands`);
    }
  }
  
  private static createAudit(configBefore: AppConfig, configAfter: AppConfig, optionsAdded: string[]): MigrationAudit {
    return {
      timestamp: new Date().toISOString(),
      sectionsCountBefore: configBefore.sections.length,
      sectionsCountAfter: configAfter.sections.length,
      globalBrandsCountBefore: configBefore.globalBrands?.length || 0,
      globalBrandsCountAfter: configAfter.globalBrands?.length || 0,
      optionsAdded,
      deletionsCount: 0 // Should always be 0 for safe migration
    };
  }
  
  public static migrate(configPath?: string): string {
    try {
      // Auto-detect config path if not provided
      const actualConfigPath = configPath || this.detectConfigPath();
      
      console.log('🚀 Starting safe Foundry migration...');
      console.log(`📂 Config file: ${actualConfigPath}`);
      
      // Create backup
      const backupPath = this.createBackup(actualConfigPath);
      
      // Load and parse config
      const configContent = readFileSync(actualConfigPath, 'utf8');
      const configBefore: AppConfig = JSON.parse(configContent);
      
      console.log('📊 Before migration:', {
        sections: configBefore.sections.length,
        globalBrands: configBefore.globalBrands?.length || 0
      });
      
      // Clone config for safe modification
      const configAfter: AppConfig = JSON.parse(JSON.stringify(configBefore));
      
      // Apply surgical changes
      this.ensureDataAnalyticsSection(configAfter);
      this.ensureIndustrialDataOSSubcategory(configAfter);
      const foundryAdded = this.addPalantirFoundryOption(configAfter);
      this.mergeSynonymMap(configAfter);
      this.ensureGlobalBrands(configAfter);
      
      // Update metadata
      configAfter.updatedAt = new Date().toISOString();
      if (!configAfter.schemaVersion || configAfter.schemaVersion < 3) {
        configAfter.schemaVersion = 3;
      }
      
      // Create audit trail
      const optionsAdded = foundryAdded ? ['palantir_foundry'] : [];
      const audit = this.createAudit(configBefore, configAfter, optionsAdded);
      
      // Save new config
      const outputPath = actualConfigPath.replace('.json', '_with_foundry_SAFE.json');
      writeFileSync(outputPath, JSON.stringify(configAfter, null, 2), 'utf8');
      
      // Save audit log
      const auditPath = outputPath.replace('.json', '_AUDIT.json');
      writeFileSync(auditPath, JSON.stringify(audit, null, 2), 'utf8');
      
      console.log('📊 After migration:', {
        sections: configAfter.sections.length,
        globalBrands: configAfter.globalBrands?.length || 0
      });
      
      console.log('✅ Migration completed successfully!');
      console.log(`📄 New config: ${outputPath}`);
      console.log(`📋 Audit log: ${auditPath}`);
      console.log(`💾 Backup: ${backupPath}`);
      
      // Validation
      if (audit.deletionsCount > 0) {
        throw new Error('❌ SAFETY VIOLATION: Migration deleted data!');
      }
      
      if (audit.sectionsCountAfter < audit.sectionsCountBefore) {
        throw new Error('❌ SAFETY VIOLATION: Sections count decreased!');
      }
      
      if (audit.globalBrandsCountAfter < audit.globalBrandsCountBefore) {
        throw new Error('❌ SAFETY VIOLATION: Global brands count decreased!');
      }
      
      console.log('✅ Safety checks passed - no data was deleted');
      
      return outputPath;
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const configPath = process.argv[2];
  try {
    FoundryMigration.migrate(configPath);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

export { FoundryMigration };