import { featureFlagService } from "@/services/featureFlagService";

// Feature flags for gating new functionality
export const features = {
  // Foundry Feature: Gate all Palantir Foundry related functionality
  FOUNDRY: false as boolean, // Default: disabled for safety
  
  // Other future feature flags can be added here
  // ENHANCED_ANALYTICS: false,
  // REAL_TIME_ALERTS: false,
} as const;

export type FeatureFlags = typeof features;

// Helper function to check if a feature is enabled (now with database support)
export async function isFeatureEnabled(feature: keyof FeatureFlags): Promise<boolean> {
  try {
    // Try database first, fall back to static config
    const dbEnabled = await featureFlagService.isFeatureEnabled(feature);
    return dbEnabled;
  } catch (error) {
    console.warn('[features]', `Error checking feature ${feature}, falling back to static:`, error);
    return features[feature] === true; // Fallback to static config
  }
}

// Synchronous version for backwards compatibility (uses static config only)
export function isFeatureEnabledSync(feature: keyof FeatureFlags): boolean {
  try {
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
    if (isFeatureEnabled(feature)) {
      return callback();
    }
    return fallback;
  } catch (error) {
    console.warn(`[${feature}]`, 'Feature callback error:', error);
    return fallback; // Fail-closed
  }
}
