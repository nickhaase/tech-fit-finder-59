import { featureFlagService } from './featureFlagService';

class FeatureFlagInitializer {
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialization();
    await this.initPromise;
  }

  private async doInitialization(): Promise<void> {
    try {
      console.log('🔄 Initializing feature flags...');
      
      // Preload known feature flags into cache
      const knownFlags = ['FOUNDRY'];
      
      const flagPromises = knownFlags.map(async (flagName) => {
        try {
          const value = await featureFlagService.getFlag(flagName);
          console.log(`🏁 Feature flag ${flagName}:`, value);
          return value;
        } catch (error) {
          console.warn(`⚠️ Failed to load feature flag ${flagName}:`, error);
          return false;
        }
      });

      await Promise.all(flagPromises);
      
      this.initialized = true;
      console.log('✅ Feature flags initialized');
      
      // Dispatch custom event to notify that feature flags are ready
      window.dispatchEvent(new CustomEvent('featureFlagsReady'));
      
    } catch (error) {
      console.error('❌ Feature flag initialization failed:', error);
      this.initialized = true; // Mark as initialized even on failure to prevent infinite loops
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Force re-initialization (useful when flags are updated)
  async reinitialize(): Promise<void> {
    this.initialized = false;
    this.initPromise = null;
    featureFlagService.clearCache();
    await this.initialize();
  }
}

export const featureFlagInitializer = new FeatureFlagInitializer();