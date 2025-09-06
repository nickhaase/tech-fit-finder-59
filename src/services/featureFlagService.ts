import { supabase } from "@/integrations/supabase/client";
import type { FeatureFlags } from "@/config/features";

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
  private cache = new Map<string, boolean>();
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 30000; // 30 seconds

  // Get all feature flags from database
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('flag_name');

    if (error) {
      console.error('[FeatureFlagService] Error fetching feature flags:', error);
      return [];
    }

    return data || [];
  }

  // Get cached flag value with fallback
  async isFeatureEnabled(flagName: keyof FeatureFlags): Promise<boolean> {
    const now = Date.now();
    
    // Check cache first
    if (this.cache.has(flagName) && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.cache.get(flagName) || false;
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('flag_name', flagName)
      .single();

    if (error) {
      console.warn(`[FeatureFlagService] Error checking feature ${flagName}:`, error);
      return false; // Fail-closed
    }

    const enabled = data?.enabled || false;
    this.cache.set(flagName, enabled);
    this.cacheTimestamp = now;
    
    return enabled;
  }

  // Update feature flag
  async updateFeatureFlag(flagName: string, enabled: boolean, updatedBy?: string): Promise<void> {
    const { error } = await supabase
      .from('feature_flags')
      .update({ 
        enabled, 
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      })
      .eq('flag_name', flagName);

    if (error) {
      console.error('[FeatureFlagService] Error updating feature flag:', error);
      throw error;
    }

    // Invalidate cache
    this.cache.delete(flagName);
    this.cacheTimestamp = 0;
  }

  // Create new feature flag
  async createFeatureFlag(flagName: string, enabled: boolean, description?: string): Promise<void> {
    const { error } = await supabase
      .from('feature_flags')
      .insert({
        flag_name: flagName,
        enabled,
        description
      });

    if (error) {
      console.error('[FeatureFlagService] Error creating feature flag:', error);
      throw error;
    }

    // Invalidate cache
    this.cache.clear();
    this.cacheTimestamp = 0;
  }

  // Clear cache (useful for real-time updates)
  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamp = 0;
  }
}

export const featureFlagService = new FeatureFlagService();