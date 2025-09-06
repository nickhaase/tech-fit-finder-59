import { supabase } from "@/integrations/supabase/client";

export interface FeatureFlag {
  id: string;
  flag_name: string;
  enabled: boolean;
  description?: string;
  updated_at: string;
  updated_by?: string;
  created_at: string;
}

class FeatureFlagService {
  private cache: Map<string, boolean> = new Map();
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getAllFlags(): Promise<FeatureFlag[]> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('flag_name');

    if (error) {
      console.error('Error fetching feature flags:', error);
      return [];
    }

    return data || [];
  }

  async getFlag(flagName: string): Promise<boolean> {
    // Check cache first
    if (this.isCacheValid() && this.cache.has(flagName)) {
      return this.cache.get(flagName) || false;
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('flag_name', flagName)
      .single();

    if (error) {
      console.warn(`Feature flag ${flagName} not found, defaulting to false`);
      return false;
    }

    // Update cache
    this.cache.set(flagName, data.enabled);
    this.refreshCacheExpiry();

    return data.enabled;
  }

  async updateFlag(flagName: string, enabled: boolean, updatedBy?: string): Promise<boolean> {
    const { error } = await supabase
      .from('feature_flags')
      .update({ 
        enabled, 
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      })
      .eq('flag_name', flagName);

    if (error) {
      console.error('Error updating feature flag:', error);
      return false;
    }

    // Update cache
    this.cache.set(flagName, enabled);
    this.refreshCacheExpiry();

    // If this is a config-affecting flag, invalidate config
    if (flagName === 'FOUNDRY') {
      console.log('🔄 FOUNDRY flag changed, invalidating config...');
      // Dynamically import to avoid circular dependency
      const { ConfigService } = await import('@/services/configService');
      ConfigService.invalidateConfig();
    }

    return true;
  }

  async createFlag(flagName: string, enabled: boolean, description?: string, createdBy?: string): Promise<boolean> {
    const { error } = await supabase
      .from('feature_flags')
      .insert({
        flag_name: flagName,
        enabled,
        description,
        updated_by: createdBy
      });

    if (error) {
      console.error('Error creating feature flag:', error);
      return false;
    }

    // Update cache
    this.cache.set(flagName, enabled);
    this.refreshCacheExpiry();

    return true;
  }

  private isCacheValid(): boolean {
    return Date.now() < this.cacheExpiry;
  }

  private refreshCacheExpiry(): void {
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
  }

  // Add synchronous cache access for sync feature checking
  getCachedFlag(flagName: string): boolean | null {
    if (this.isCacheValid() && this.cache.has(flagName)) {
      return this.cache.get(flagName) || false;
    }
    return null; // Not cached or cache expired
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry = 0;
  }
}

export const featureFlagService = new FeatureFlagService();