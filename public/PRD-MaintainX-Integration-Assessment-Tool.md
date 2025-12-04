# Product Requirements Document (PRD)
## MaintainX Integration Assessment Tool

**Version:** 1.0  
**Date:** December 2024  
**Status:** Production  
**Classification:** Internal / Partner Use

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Feature Specifications](#feature-specifications)
4. [Technical Architecture](#technical-architecture)
5. [User Stories](#user-stories)
6. [Current Limitations](#current-limitations)
7. [Appendix](#appendix)

---

## Executive Summary

### Product Vision

The MaintainX Integration Assessment Tool is a **technical discovery and sales enablement platform** that helps prospects and sales engineers understand how MaintainX integrates with their existing technology ecosystem. It generates personalized integration architecture visualizations, data flow diagrams, and PDF reports.

### Target Users

| User Type | Primary Goal |
|-----------|--------------|
| **Prospects** | Understand integration capabilities before purchase |
| **Sales Engineers** | Generate compelling technical proposals |
| **Solution Architects** | Plan implementation strategies |
| **Admin Users** | Manage taxonomy, brands, and configurations |

### Key Success Metrics

- Assessment completion rate
- PDF report downloads
- Share link generation
- Time-to-completion (Quick: <2min, Advanced: <5min)

---

## Product Overview

### Core Value Proposition

Transform complex integration discovery into a guided, visual experience that demonstrates MaintainX's connectivity with enterprise systems.

### Feature Categories

| Category | Features |
|----------|----------|
| **Assessment Engine** | Quick/Advanced modes, multi-step wizard, search with synonyms |
| **Technology Catalog** | 150+ brands, 5 categories, protocol metadata |
| **Visualization Engine** | Live SVG animations, Canvas rendering, flow logic |
| **Export System** | PDF reports, GIF/MP4 animations, static diagrams |
| **Sharing** | Unique URLs, with/without company data options |
| **Admin Panel** | Taxonomy management, feature flags, version control |

---

## Feature Specifications

### 1. Assessment Flow

#### 1.1 Assessment Modes

**Quick Assessment (Default)**
- 8 steps total
- Categories: ERP, Sensors, Automation, Other Systems, Data & Analytics
- Estimated time: 1-2 minutes

**Advanced Assessment**
- 10 steps with follow-up questions
- Deeper discovery on protocols, data requirements
- Estimated time: 3-5 minutes

#### 1.2 Step Structure

| Step | Name | Purpose |
|------|------|---------|
| 1 | Company Name | Optional branding for reports |
| 2 | ERP Systems | Core business systems |
| 3 | Sensor Platforms | IoT and monitoring |
| 4 | Automation Systems | PLCs, SCADA, HMI |
| 5 | Other Systems | Specialty tools |
| 6 | Data & Analytics | BI, data platforms |
| 7 | Follow-up Questions | Protocol/requirement discovery |
| 8 | Results | Visualization + exports |

#### 1.3 Technology Categories

```
ERP & Business Systems
├── SAP (S/4HANA, ECC, Business One)
├── Oracle (Cloud, JDE, NetSuite)
├── Microsoft Dynamics
├── Workday
├── Infor
└── 20+ more...

Sensors & IoT
├── Samsara
├── MachineMetrics
├── Cognite Data Fusion
├── OSIsoft PI
├── Aveva
└── 15+ more...

Automation & Control
├── Siemens (TIA Portal)
├── Rockwell/Allen-Bradley
├── Schneider Electric
├── ABB
├── Honeywell
└── 12+ more...

Other Systems
├── Procore
├── Autodesk
├── Bluebeam
├── PlanGrid
└── 10+ more...

Data & Analytics
├── Palantir Foundry
├── Snowflake
├── Databricks
├── Power BI
├── Tableau
└── 15+ more...
```

### 2. Technology Catalog (Consolidated Taxonomy)

#### 2.1 Brand Option Structure

```typescript
interface BrandOption {
  id: string;           // Unique identifier
  name: string;         // Display name
  category: string;     // Primary category
  protocol?: string;    // Integration protocol
  logoUrl?: string;     // Brand logo path
  description?: string; // Integration description
  synonyms?: string[];  // Search aliases
  capabilities?: string[]; // Special capabilities
}
```

#### 2.2 Catalog Statistics

| Metric | Count |
|--------|-------|
| Total Brands | 150+ |
| Categories | 5 |
| Protocols | 12 unique |
| Synonyms | 100+ |
| Global Brands | 15+ |

#### 2.3 Synonym Resolution System

```typescript
// Example synonym mappings
const SYNONYMS = {
  'S4': 'SAP S/4HANA',
  'S4HANA': 'SAP S/4HANA',
  'dynamics': 'Microsoft Dynamics 365',
  'd365': 'Microsoft Dynamics 365',
  'pi': 'OSIsoft PI',
  'osipi': 'OSIsoft PI',
  'rockwell': 'Allen-Bradley',
  'ab': 'Allen-Bradley'
};
```

### 3. Visualization Engine

#### 3.1 Live Interactive Animations

**Technology Stack:**
- React Hooks (`useState`, `useEffect`, `useRef`)
- SVG elements for paths and particles
- CSS animations with `@keyframes`
- `requestAnimationFrame` for smooth cycling

**Key Components:**
- `DataFlowVisualization.tsx` - Main visualization component
- `AnimatedPath` - Bezier curve connections
- `AnimatedParticle` - Moving data indicators
- `SystemCard` - Technology brand cards

**Animation Cycle:**
```
┌─────────────────────────────────────────┐
│  3-second cycle per system              │
│                                         │
│  [System] ──particles──> [MaintainX]    │
│     │                         │         │
│     └── Bezier curve path ────┘         │
│                                         │
│  Colors:                                │
│  • Blue (#246CFF) - Primary flows       │
│  • Green (#22C55E) - Secondary flows    │
│  • Orange (#F97316) - Warning flows     │
└─────────────────────────────────────────┘
```

#### 3.2 Static Architecture Diagrams

**Technology Stack:**
- HTML5 Canvas API
- Custom `StaticFlowRenderer` class

**Used For:**
- PDF report embedding
- Static image exports
- Print-friendly diagrams

#### 3.3 Animation Export

**GIF Export:**
- Library: GIF.js with Web Workers
- Quality settings: Low/Medium/High
- Worker count: 2 parallel workers

**Video Export:**
- API: MediaRecorder
- Format: WebM (VP9 codec)
- Fallback: VP8 codec

### 4. Integration Flow Logic

#### 4.1 Standard Flow Rules

```typescript
// From src/utils/generateFlows.ts
const FLOW_RULES = {
  'ERP': {
    toMaintainX: ['Work Orders', 'Asset Data', 'Inventory'],
    fromMaintainX: ['Completed WOs', 'Labor Hours', 'Parts Usage']
  },
  'Sensors': {
    toMaintainX: ['Sensor Readings', 'Alerts', 'Meter Data'],
    fromMaintainX: ['Thresholds', 'Acknowledgments']
  },
  'Automation': {
    toMaintainX: ['PLC Data', 'Alarms', 'Production Counts'],
    fromMaintainX: ['Setpoints', 'Commands']
  },
  'Analytics': {
    toMaintainX: ['Predictions', 'Recommendations'],
    fromMaintainX: ['Historical Data', 'Events']
  }
};
```

#### 4.2 Capability-Based Flow Rules

```typescript
// From src/utils/enhancedFlowGeneration.ts
const CAPABILITY_FLOWS = {
  'insight_to_work': {
    flows: [
      { target: 'maintainx', dataType: 'Recommended WO', direction: 'inbound' }
    ]
  },
  'asset_health': {
    flows: [
      { target: 'maintainx', dataType: 'Asset Health Score', direction: 'inbound' }
    ]
  },
  'parts_intel': {
    flows: [
      { target: 'maintainx', dataType: 'Parts/ETA Intelligence', direction: 'inbound' }
    ]
  },
  'fan_in': {
    // Aggregates from multiple upstream sources
  },
  'model_sync': {
    // Bidirectional with data warehouses
  }
};
```

#### 4.3 Palantir Foundry Special Handling

```typescript
// Foundry-specific flows
const FOUNDRY_FLOWS = {
  outbound: [
    'WO Events',
    'Asset/Meter Signals', 
    'Inspection Responses'
  ],
  inbound: [
    'Recommended WO',
    'Asset Health Score',
    'Parts/ETA Intelligence'
  ]
};
```

### 5. PDF Report Generation

#### 5.1 Report Structure

```
┌────────────────────────────────────────┐
│  COVER PAGE                            │
│  • Company logo (if provided)          │
│  • Assessment title                    │
│  • Generation date                     │
└────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│  INTEGRATION DASHBOARD                 │
│  • System count by category            │
│  • Protocol summary                    │
│  • Complexity score                    │
└────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│  ARCHITECTURE DIAGRAM                  │
│  • Static Canvas rendering             │
│  • Color-coded flows                   │
│  • MaintainX hub visualization         │
└────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│  TECHNOLOGY ECOSYSTEM                  │
│  • Detailed system list                │
│  • Integration protocols               │
│  • Data flow descriptions              │
└────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│  RECOMMENDATIONS                       │
│  • Implementation priorities           │
│  • Quick wins                          │
│  • Advanced integrations               │
└────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│  CALL TO ACTION                        │
│  • Next steps                          │
│  • Contact information                 │
│  • Resource links                      │
└────────────────────────────────────────┘
```

#### 5.2 PDF Technology

- Library: jsPDF
- Page size: A4 (210mm × 297mm)
- Resolution: 72 DPI (screen), 150 DPI (print)

### 6. Data Persistence & Sharing

#### 6.1 Database Schema

**Companies Table:**
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  industry TEXT,
  size TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Assessments Table:**
```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  unique_url TEXT UNIQUE,
  assessment_data JSONB NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Assessment Results Table:**
```sql
CREATE TABLE assessment_results (
  id UUID PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id),
  scorecard_data JSONB NOT NULL,
  visualizations JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Feature Flags Table:**
```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY,
  flag_name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### 6.2 Sharing Options

| Option | URL Format | Data Included |
|--------|------------|---------------|
| With Company | `/share/{unique_url}` | Full assessment + company |
| Anonymous | `/share/{unique_url}` | Assessment only |
| Direct Link | Query params | Encoded selections |

### 7. Admin Interface

#### 7.1 Admin Capabilities

| Feature | Description |
|---------|-------------|
| **Taxonomy Preview** | View complete catalog structure |
| **Global Brands** | Manage cross-category brands |
| **Sections** | Configure assessment categories |
| **Cross-Listing** | Map brands across categories |
| **Synonyms** | Manage search aliases |
| **Import/Export** | JSON configuration backup |
| **Bulk Import** | CSV brand import |
| **Versions** | Configuration version control |
| **Submissions** | Review saved assessments |
| **Feature Flags** | Toggle experimental features |

#### 7.2 Configuration Storage

```
┌─────────────────────────────────────────────────────────┐
│                 CONFIGURATION LAYERS                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┐                                │
│  │  TypeScript Files   │  Source of truth               │
│  │  (brandCatalogs.ts) │  Version controlled            │
│  └──────────┬──────────┘                                │
│             │                                           │
│             ▼                                           │
│  ┌─────────────────────┐                                │
│  │   localStorage      │  Runtime modifications         │
│  │  (mx_config_live)   │  Admin changes                 │
│  └──────────┬──────────┘                                │
│             │                                           │
│             ▼                                           │
│  ┌─────────────────────┐                                │
│  │     Supabase        │  Persistent storage            │
│  │  (submissions,      │  Feature flags                 │
│  │   feature_flags)    │  Shared assessments            │
│  └─────────────────────┘                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS |
| **UI Components** | shadcn/ui |
| **State Management** | React Hooks + TanStack Query |
| **Routing** | React Router v6 |
| **Backend** | Supabase (PostgreSQL + Auth + Edge Functions) |
| **PDF Generation** | jsPDF |
| **Animation Export** | GIF.js + MediaRecorder API |
| **Charts** | Recharts |

### File Structure Overview

```
src/
├── components/
│   ├── admin/           # Admin panel components
│   ├── ui/              # shadcn/ui components
│   ├── DataFlowVisualization.tsx
│   ├── AssessmentResults.tsx
│   ├── TechStackAssessment.tsx
│   └── ...
├── data/
│   ├── brandCatalogs.ts      # Technology taxonomy
│   ├── newSectionCatalogs.ts # Category definitions
│   └── foundryBrands.ts      # Foundry-specific config
├── services/
│   ├── assessmentService.ts  # Supabase operations
│   ├── configService.ts      # Config management
│   └── featureFlagService.ts # Feature toggles
├── utils/
│   ├── generateFlows.ts      # Flow rule engine
│   ├── enhancedFlowGeneration.ts # Capability flows
│   ├── staticFlowRenderer.ts # Canvas rendering
│   ├── animationExporter.ts  # GIF/MP4 export
│   ├── pdfGenerator.ts       # Report generation
│   └── synonymResolver.ts    # Search aliases
├── types/
│   ├── assessment.ts         # Core type definitions
│   ├── config.ts             # Config types
│   └── database.ts           # DB types
└── pages/
    ├── Index.tsx             # Main assessment
    ├── Admin.tsx             # Admin panel
    ├── Share.tsx             # Sharing handler
    └── SharedAssessment.tsx  # Shared view
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Custom Canvas Rendering** | Full control over visual output, pixel-perfect PDF embedding |
| **localStorage for Config** | Fast iteration without deployments, offline capability |
| **Hybrid Storage Model** | Balance between code-controlled taxonomy and runtime flexibility |
| **Deterministic Flow Rules** | Consistent, predictable integration visualizations |
| **Dual Animation Systems** | Interactive SVG for web, Canvas for exports |

---

## User Stories

### Assessment Takers

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| AT-1 | As a prospect, I want to quickly assess my tech stack | Complete in <2 minutes |
| AT-2 | As a user, I want to search for my systems by name or alias | Synonym resolution works |
| AT-3 | As a user, I want to see how my systems connect to MaintainX | Visual flow diagram generated |
| AT-4 | As a user, I want to download a PDF report | PDF generates with all sections |
| AT-5 | As a user, I want to share my assessment | Shareable URL generated |

### Admin Users

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| AD-1 | As an admin, I want to add new brands | Brand appears in assessment |
| AD-2 | As an admin, I want to manage synonyms | Search finds brands by alias |
| AD-3 | As an admin, I want to toggle features | Feature flags work in real-time |
| AD-4 | As an admin, I want to export configuration | JSON backup downloadable |
| AD-5 | As an admin, I want to view submissions | Submissions list accessible |

---

## Current Limitations

### Known Limitations

| Area | Limitation | Impact |
|------|------------|--------|
| **Taxonomy** | Stored in TypeScript, not database | Requires code deploy for changes |
| **Visualization** | Custom Canvas code | High maintenance burden |
| **PDF Diagrams** | Static only | No animation in reports |
| **Multi-tenancy** | Single tenant | No organization isolation |
| **Localization** | English only | Limited international use |

### Technical Debt

| Item | Description | Priority |
|------|-------------|----------|
| Migrate taxonomy to DB | Move brands to Supabase | High |
| React Flow integration | Replace custom SVG code | Medium |
| Test coverage | Add unit/integration tests | Medium |
| Error boundaries | Improve error handling | Low |

### Recommended v2 Improvements

1. **Migrate Taxonomy to Database**
   - Full CRUD via admin UI
   - No code deploys for brand changes
   - Version history in DB

2. **React Flow Integration**
   - Interactive node editing
   - Drag-and-drop layout
   - Built-in export capabilities

3. **Multi-Tenancy Support**
   - Organization-level isolation
   - Custom branding per org
   - Role-based access control

4. **Advanced Analytics**
   - Assessment completion funnels
   - Popular technology combinations
   - Drop-off analysis

5. **API Layer**
   - REST/GraphQL endpoints
   - Webhook integrations
   - Third-party embedding

---

## Appendix

### A. Integration Protocol Reference

| Protocol | Systems | Data Format |
|----------|---------|-------------|
| REST API | Most modern systems | JSON |
| OPC-UA | Industrial automation | Binary/XML |
| MQTT | IoT sensors | Binary |
| Modbus | PLCs, meters | Binary |
| ODBC/JDBC | Databases | SQL |
| File-based | Legacy systems | CSV/XML |
| Webhooks | Event-driven | JSON |

### B. MaintainX Module Reference

| Module | Description |
|--------|-------------|
| Work Orders | Maintenance task management |
| Assets | Equipment and location tracking |
| Parts | Inventory and procurement |
| Procedures | Standard operating procedures |
| Meters | Condition monitoring |
| Requests | Service request management |
| Reporting | Analytics and dashboards |

### C. Color System

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | #246CFF | MaintainX brand, primary actions |
| Secondary | #1E3A5F | Headers, dark backgrounds |
| Accent | #22C55E | Success states, secondary flows |
| Warning | #F97316 | Alerts, warning flows |
| Muted | #64748B | Secondary text |

### D. Animation Specifications

| Property | Live | Export (GIF) | Export (Video) |
|----------|------|--------------|----------------|
| Target FPS | 60 | 10-30 | 30 |
| Duration | Infinite | 5-10s | 5-10s |
| Quality | GPU-accelerated | Adjustable | High (VP9) |
| File Size | N/A | 2-10MB | 5-20MB |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2024 | AI Assistant | Initial PRD |

---

*This document serves as the comprehensive specification for the MaintainX Integration Assessment Tool v1.0*
