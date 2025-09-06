/**
 * Configuration file service for bridging file-based and localStorage configurations
 */

import { AppConfig } from '@/types/config';
import { ConfigService } from '@/services/configService';

export interface ConfigSource {
  type: 'file' | 'localStorage';
  path?: string;
  lastModified?: string;
}

export class ConfigFileService {
  private static readonly FILE_CONFIG_KEY = 'mx_config_file_source';
  
  /**
   * Detect the current configuration source
   */
  static getCurrentSource(): ConfigSource {
    const fileSource = localStorage.getItem(this.FILE_CONFIG_KEY);
    
    if (fileSource) {
      try {
        return JSON.parse(fileSource) as ConfigSource;
      } catch (error) {
        console.warn('Failed to parse file source config:', error);
      }
    }
    
    return { type: 'localStorage' };
  }
  
  /**
   * Set the configuration source to a specific file
   */
  static setFileSource(filePath: string): void {
    const source: ConfigSource = {
      type: 'file',
      path: filePath,
      lastModified: new Date().toISOString()
    };
    
    localStorage.setItem(this.FILE_CONFIG_KEY, JSON.stringify(source));
    console.log(`📂 Config source set to file: ${filePath}`);
  }
  
  /**
   * Reset configuration source to localStorage
   */
  static resetToLocalStorage(): void {
    localStorage.removeItem(this.FILE_CONFIG_KEY);
    console.log('📦 Config source reset to localStorage');
  }
  
  /**
   * Load configuration from file and merge with localStorage
   * This is where we'd implement file loading in a real file system
   */
  static async loadFromFile(filePath: string): Promise<AppConfig> {
    // In a browser environment, we can't directly read files
    // This would be implemented in a Node.js environment or with file upload
    throw new Error('File loading not supported in browser environment');
  }
  
  /**
   * Save current configuration to downloadable file
   */
  static downloadConfigAsFile(filename?: string): void {
    try {
      const config = ConfigService.getLive();
      const configString = JSON.stringify(config, null, 2);
      
      const blob = new Blob([configString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `maintainx-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      console.log(`📥 Config downloaded as: ${a.download}`);
    } catch (error) {
      console.error('Failed to download config:', error);
      throw error;
    }
  }
  
  /**
   * Import configuration from uploaded file
   */
  static async importConfigFromFile(file: File): Promise<AppConfig> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const configString = event.target?.result as string;
          const config = JSON.parse(configString) as AppConfig;
          
          // Validate basic structure
          if (!config.sections || !Array.isArray(config.sections)) {
            throw new Error('Invalid config file: missing sections array');
          }
          
          console.log(`📤 Config imported from file: ${file.name}`);
          resolve(config);
        } catch (error) {
          reject(new Error(`Failed to parse config file: ${error}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read config file'));
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * Apply imported configuration to the system
   */
  static async applyImportedConfig(config: AppConfig, backup: boolean = true): Promise<void> {
    try {
      if (backup) {
        // Create backup of current config
        ConfigService.createSnapshot('Pre-import backup');
      }
      
      // Apply the imported config
      ConfigService.publish(config);
      
      // Set source to indicate this came from a file
      this.setFileSource('imported-file');
      
      console.log('✅ Imported config applied successfully');
    } catch (error) {
      console.error('Failed to apply imported config:', error);
      throw error;
    }
  }
  
  /**
   * Get configuration info for display
   */
  static getConfigInfo(): {
    source: ConfigSource;
    size: string;
    lastModified: string;
    sectionsCount: number;
    brandsCount: number;
  } {
    const config = ConfigService.getLive();
    const source = this.getCurrentSource();
    
    const configString = JSON.stringify(config);
    const sizeKB = Math.round(configString.length / 1024);
    
    const sectionsCount = config.sections.length;
    const brandsCount = config.sections.reduce((total, section) => {
      return total + (section.options?.length || 0) + 
        (section.subcategories?.reduce((subTotal, sub) => 
          subTotal + (sub.options?.length || 0), 0) || 0);
    }, 0);
    
    return {
      source,
      size: `${sizeKB}KB`,
      lastModified: config.updatedAt,
      sectionsCount,
      brandsCount
    };
  }
  
  /**
   * Create a rollback package with backup file
   */
  static createRollbackPackage(description: string = 'Manual rollback point'): {
    backupId: string;
    config: AppConfig;
    timestamp: string;
  } {
    const config = ConfigService.getLive();
    const timestamp = new Date().toISOString();
    const backupId = `rollback_${timestamp.replace(/[:.]/g, '-')}`;
    
    // Create snapshot in version history
    ConfigService.createSnapshot(description);
    
    return {
      backupId,
      config,
      timestamp
    };
  }
  
  /**
   * Execute rollback to a previous configuration
   */
  static rollbackToVersion(versionId: string): void {
    try {
      const versions = ConfigService.listVersions();
      const targetVersion = versions.find(v => v.id === versionId);
      
      if (!targetVersion) {
        throw new Error(`Version ${versionId} not found`);
      }
      
      // Create snapshot before rollback
      ConfigService.createSnapshot('Pre-rollback snapshot');
      
      // Apply the rollback
      ConfigService.publish(targetVersion.config);
      
      console.log(`🔄 Rolled back to version: ${versionId} (${targetVersion.description})`);
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
}