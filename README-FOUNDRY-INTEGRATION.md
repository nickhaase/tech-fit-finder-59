# Safe Palantir Foundry Integration

This document describes the safe integration of Palantir Foundry into the MaintainX assessment platform using surgical migration scripts and feature flags.

## Overview

The Foundry integration is designed with safety and rollback capabilities as the top priority:

- **Non-destructive**: Never deletes or overwrites existing configuration data
- **Feature-gated**: All Foundry functionality is behind the `FOUNDRY` feature flag
- **Backup-first**: Creates timestamped backups before any changes
- **Audit trail**: Logs exactly what was added/changed
- **Rollback ready**: Multiple rollback mechanisms available

## Architecture

### 1. Migration Script (`scripts/migrations/add-foundry-safe.ts`)

Safely adds Palantir Foundry to configuration files:

```bash
# Run the migration
npm run cli migrate-foundry path/to/config.json

# Creates:
# - config_with_foundry_SAFE.json (new config)
# - config.json.bak.2025-01-15T10-30-00-000Z.json (backup)
# - config_with_foundry_SAFE_AUDIT.json (audit log)
```

**What it adds:**
- `data_analytics` section (if missing)
- `industrial_data_os` subcategory (if missing)
- `palantir_foundry` option (only if not present)
- Synonym mappings: `foundry`, `palantir` → `palantir_foundry`
- Global brand entries for cross-reference

**Safety guarantees:**
- Zero deletions (enforced by validation)
- Sections count never decreases
- Existing options preserved unchanged
- Backup created before any modifications

### 2. Feature Flag System

All Foundry functionality is gated by `features.FOUNDRY`:

```typescript
// Check feature status
const enabled = await isFeatureEnabled('FOUNDRY');
const enabledSync = isFeatureEnabledSync('FOUNDRY');

// Toggle in admin panel immediately affects:
// - Assessment form options
// - Flow generation
// - Capability tagging
// - Integration explanations
```

### 3. Enhanced Synonym Resolution (`src/utils/synonymResolver.ts`)

Maps user inputs to canonical system IDs:

```typescript
// Direct mapping
resolveId('Foundry', synonymMap) // → 'palantir_foundry'
resolveId('Palantir', synonymMap) // → 'palantir_foundry'

// Pattern-based fallback
resolveSystemId('foundry platform', synonymMap) // → 'palantir_foundry'
```

### 4. Capability-Based Flow Generation (`src/utils/capabilityTagger.ts`)

Reusable system for tagging platforms with integration capabilities:

```typescript
// Foundry capabilities (when feature enabled)
const foundryCapabilities = [
  'insight_to_work',    // Generate work orders from insights
  'asset_health',       // Provide asset health scores
  'parts_intel',        // Supply parts intelligence
  'fan_in',            // Aggregate from upstream sources
  'model_sync'         // Sync with data warehouses
];

// Other platforms get similar capabilities
// - Cognite Data Fusion: ['insight_to_work', 'asset_health', 'fan_in']
// - Seeq: ['insight_to_work', 'asset_health']
// - Databricks: ['fan_in', 'model_sync']
```

### 5. Enhanced Flow Generation (`src/utils/enhancedFlowGeneration.ts`)

Generates integration flows based on capabilities:

```typescript
// Foundry-specific flows (feature-gated)
if (features.FOUNDRY && hasFoundry) {
  // MaintainX → Foundry
  flows.push(
    'work_orders → foundry (WO Events)',
    'assets → foundry (Asset Signals)',
    'inspections → foundry (Quality Data)'
  );
  
  // Foundry → MaintainX  
  flows.push(
    'foundry → work_orders (Recommended WO)',
    'foundry → assets (Health Scores)',
    'foundry → work_orders (Parts Intelligence)'
  );
  
  // Fan-in from upstream sources
  upstreamSources.forEach(source => 
    flows.push(`${source} → foundry (Model Inputs)`)
  );
}
```

## Usage

### Development Mode

1. **Enable Foundry feature flag**:
   ```bash
   # In admin panel: /admin → Features → FOUNDRY = true
   ```

2. **Export current config**:
   ```bash
   npm run cli download-config current-config.json
   ```

3. **Run migration**:
   ```bash
   npm run cli migrate-foundry current-config.json
   ```

4. **Import migrated config**:
   ```bash
   # Upload current-config_with_foundry_SAFE.json via admin panel
   ```

### Production Deployment

1. **Create rollback point**:
   ```bash
   npm run cli create-rollback "Pre-Foundry deployment"
   ```

2. **Apply migration**:
   ```bash
   npm run cli migrate-foundry production-config.json
   ```

3. **Deploy with feature flag disabled**:
   ```sql
   -- In feature_flags table
   UPDATE feature_flags 
   SET enabled = false 
   WHERE flag_name = 'FOUNDRY';
   ```

4. **Enable gradually**:
   ```sql
   -- Enable when ready
   UPDATE feature_flags 
   SET enabled = true 
   WHERE flag_name = 'FOUNDRY';
   ```

## Rollback Procedures

### Immediate Rollback (Feature Flag)
```sql
-- Instant disable (zero downtime)
UPDATE feature_flags 
SET enabled = false 
WHERE flag_name = 'FOUNDRY';
```

### Configuration Rollback
```bash
# Restore from backup
cp config.json.bak.2025-01-15T10-30-00-000Z.json config.json

# Or use version manager
npm run cli rollback-to-version <version-id>
```

### Database Rollback
```sql
-- Remove Foundry feature flag entirely
DELETE FROM feature_flags WHERE flag_name = 'FOUNDRY';
```

## Validation & Testing

### Acceptance Criteria

1. **Config safety**: ✅ Zero deletions, counts preserved
2. **Flag off parity**: ✅ Identical UI when `FOUNDRY=false`
3. **Scenario A**: ✅ Foundry + upstream sources → full flows
4. **Scenario B**: ✅ Foundry only → baseline flows
5. **Scenario C**: ✅ Other platforms use capability system

### Test Commands

```bash
# Check current config
npm run cli config-info

# Validate migration
npm run cli migrate-foundry test-config.json

# Monitor feature flag status
# Check /admin → Features panel
```

## CLI Reference

```bash
# Migration
npm run cli migrate-foundry <config-file>

# Info & management  
npm run cli config-info
npm run cli download-config [filename]
npm run cli create-rollback [description]

# Help
npm run cli help
```

## Security & Compliance

- **Data protection**: All migrations create backups before changes
- **Audit logging**: Complete trail of what was added/modified
- **Feature isolation**: Foundry code only executes when flag enabled
- **Zero trust**: Multiple validation layers prevent data loss
- **Rollback testing**: All rollback mechanisms tested in development

## Monitoring

Key metrics to monitor post-deployment:

1. Feature flag toggle frequency
2. Assessment completion rates
3. Flow generation performance
4. Configuration file sizes
5. Error rates in capability tagging

## Support

For issues or questions:

1. Check audit logs: `*_AUDIT.json` files
2. Validate config: `npm run cli config-info`
3. Create rollback point before troubleshooting
4. Use feature flag for immediate mitigation

## Future Enhancements

The capability system enables easy addition of:

- Additional DataOps platforms
- Enhanced ML integration capabilities
- Real-time alerting systems
- Quality control workflows
- Predictive maintenance features

All following the same feature-gated, capability-based pattern established for Foundry.
