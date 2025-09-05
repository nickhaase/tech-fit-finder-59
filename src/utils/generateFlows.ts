import { Node } from './mapConfigToNodes';

export interface Flow {
  id: string;
  from: string;  // node.id or "MaintainX/<module>"
  to: string;    // node.id or "MaintainX/<module>"
  dataType: string;
  direction: 'inbound' | 'outbound';
  frequency: Node['frequency'];
  protocol: string;
  color: 'flow-primary' | 'flow-secondary' | 'flow-warning';
}

const FLOW_RULES: Record<Node['category'], {
  inbound: Array<{ module: string; dataType: string; color: Flow['color'] }>;
  outbound: Array<{ module: string; dataType: string; color: Flow['color'] }>;
}> = {
  'ERP': {
    inbound: [
      { module: 'assets', dataType: 'Asset Master Data', color: 'flow-primary' },
      { module: 'assets', dataType: 'Parts & Inventory', color: 'flow-secondary' },
      { module: 'work-orders', dataType: 'GL & Cost Centers', color: 'flow-secondary' }
    ],
    outbound: [
      { module: 'work-orders', dataType: 'Work Order Status', color: 'flow-primary' },
      { module: 'work-orders', dataType: 'Labor & Materials', color: 'flow-secondary' }
    ]
  },
  'MES': {
    inbound: [
      { module: 'work-orders', dataType: 'Production Status', color: 'flow-primary' },
      { module: 'analytics', dataType: 'OEE Metrics', color: 'flow-secondary' }
    ],
    outbound: [
      { module: 'work-orders', dataType: 'Dispatch Schedule', color: 'flow-primary' },
      { module: 'maintenance', dataType: 'Planned Downtime', color: 'flow-warning' }
    ]
  },
  'SCADA': {
    inbound: [
      { module: 'work-orders', dataType: 'Downtime Events', color: 'flow-warning' },
      { module: 'analytics', dataType: 'Process Data', color: 'flow-secondary' }
    ],
    outbound: [
      { module: 'work-orders', dataType: 'Work Instructions', color: 'flow-primary' },
      { module: 'maintenance', dataType: 'Maintenance Windows', color: 'flow-warning' }
    ]
  },
  'PLC': {
    inbound: [
      { module: 'assets', dataType: 'Machine Status', color: 'flow-primary' },
      { module: 'analytics', dataType: 'Cycle Counts', color: 'flow-secondary' }
    ],
    outbound: [
      { module: 'maintenance', dataType: 'Maintenance Triggers', color: 'flow-warning' }
    ]
  },
  'Sensors': {
    inbound: [
      { module: 'assets', dataType: 'Sensor Telemetry', color: 'flow-warning' },
      { module: 'analytics', dataType: 'Condition Data', color: 'flow-secondary' }
    ],
    outbound: []
  },
  'Historian': {
    inbound: [
      { module: 'analytics', dataType: 'Time-Series Data', color: 'flow-secondary' },
      { module: 'analytics', dataType: 'Historical Trends', color: 'flow-primary' }
    ],
    outbound: []
  },
  'Inventory/WMS': {
    inbound: [
      { module: 'assets', dataType: 'Inventory Levels', color: 'flow-secondary' },
      { module: 'work-orders', dataType: 'Parts Receipts', color: 'flow-primary' }
    ],
    outbound: [
      { module: 'work-orders', dataType: 'Parts Reservations', color: 'flow-primary' },
      { module: 'assets', dataType: 'Stock Replenishment', color: 'flow-secondary' }
    ]
  },
  'Workflow/ITSM/iPaaS': {
    inbound: [
      { module: 'work-orders', dataType: 'Incident Tickets', color: 'flow-warning' }
    ],
    outbound: [
      { module: 'work-orders', dataType: 'Work Order Events', color: 'flow-primary' }
    ]
  },
  'Legacy CMMS/EAM': {
    inbound: [],
    outbound: [
      { module: 'assets', dataType: 'Asset Export', color: 'flow-secondary' },
      { module: 'work-orders', dataType: 'Work History Export', color: 'flow-secondary' }
    ]
  },
  'Asset Tracking': {
    inbound: [
      { module: 'assets', dataType: 'Asset Location Events', color: 'flow-primary' },
      { module: 'assets', dataType: 'RFID/Barcode Scans', color: 'flow-secondary' }
    ],
    outbound: [
      { module: 'assets', dataType: 'Asset Assignments', color: 'flow-primary' }
    ]
  },
  'Construction': {
    inbound: [
      { module: 'work-orders', dataType: 'Project References', color: 'flow-secondary' }
    ],
    outbound: [
      { module: 'work-orders', dataType: 'Progress Updates', color: 'flow-primary' }
    ]
  },
  'Other': {
    inbound: [
      { module: 'work-orders', dataType: 'System Data', color: 'flow-secondary' }
    ],
    outbound: [
      { module: 'work-orders', dataType: 'Status Updates', color: 'flow-secondary' }
    ]
  }
};

export function generateFlowsForNode(node: Node): Flow[] {
  const flows: Flow[] = [];
  const rules = FLOW_RULES[node.category];
  
  if (!rules) return flows;
  
  // Generate inbound flows (to MaintainX)
  if (node.directionality === 'inbound' || node.directionality === 'bidirectional') {
    rules.inbound.forEach((rule, index) => {
      flows.push({
        id: `${node.id}-to-${rule.module}-${index}`,
        from: node.id,
        to: rule.module,
        dataType: rule.dataType,
        direction: 'inbound',
        frequency: node.frequency,
        protocol: node.protocol[0] || 'REST',
        color: rule.color
      });
    });
  }
  
  // Generate outbound flows (from MaintainX)
  if (node.directionality === 'outbound' || node.directionality === 'bidirectional') {
    rules.outbound.forEach((rule, index) => {
      flows.push({
        id: `${rule.module}-to-${node.id}-${index}`,
        from: rule.module,
        to: node.id,
        dataType: rule.dataType,
        direction: 'outbound',
        frequency: node.frequency,
        protocol: node.protocol[0] || 'REST',
        color: rule.color
      });
    });
  }
  
  return flows;
}