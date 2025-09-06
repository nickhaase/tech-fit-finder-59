// Feature flags for gating new functionality
export const features = {
  // Foundry Feature: Gate all Palantir Foundry related functionality
  FOUNDRY: false as boolean, // Default: disabled for safety
  
  // Other future feature flags can be added here
  // ENHANCED_ANALYTICS: false,
  // REAL_TIME_ALERTS: false,
} as const;

export type FeatureFlags = typeof features;

// Helper function to check if a feature is enabled
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
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
