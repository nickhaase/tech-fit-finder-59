import { featureFlagService } from "@/services/featureFlagService";

// Feature flags for gating new functionality
// Now dynamically loaded from database
export const features = {
  // Foundry Feature: Gate all Palantir Foundry related functionality
  FOUNDRY: false as boolean, // Default: disabled for safety
  
  // Other future feature flags can be added here
  // ENHANCED_ANALYTICS: false,
  // REAL_TIME_ALERTS: false,
} as const;

export type FeatureFlags = typeof features;

// Helper function to check if a feature is enabled (async for database lookup)
export async function isFeatureEnabled(feature: keyof FeatureFlags): Promise<boolean> {
  try {
    // For database-backed features, query the service
    if (feature === 'FOUNDRY') {
      return await featureFlagService.getFlag(feature);
    }
    
    // Fallback to static config for other features
    return features[feature] === true;
  } catch (error) {
    console.warn('[features]', `Error checking feature ${feature}:`, error);
    return false; // Fail-closed
  }
}

// Synchronous version for backwards compatibility (uses cache)
export function isFeatureEnabledSync(feature: keyof FeatureFlags): boolean {
  try {
    // For database-backed features, check the service cache first
    if (feature === 'FOUNDRY') {
      // Try to get from cache - this will return false if not cached yet
      const cached = featureFlagService['cache'].get(feature);
      return cached === true;
    }
    
    // Fallback to static config for other features
    return features[feature] === true;
  } catch (error) {
    console.warn('[features]', `Error checking feature ${feature}:`, error);
    return false; // Fail-closed
  }
}

// Type-safe feature checking
export function withFeature<T>(
  feature: keyof FeatureFlags,
  callback: () => T,
  fallback?: T
): T | undefined {
  try {
    if (isFeatureEnabledSync(feature)) {
      return callback();
    }
    return fallback;
  } catch (error) {
    console.warn(`[${feature}]`, 'Feature callback error:', error);
    return fallback; // Fail-closed
  }
}
