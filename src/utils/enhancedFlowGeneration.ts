import { Node } from './mapConfigToNodes';
import { Flow, generateFlowsForNode } from './generateFlows';

// Capability-based flow generation rules
const CAPABILITY_FLOWS: Record<string, {
  flows: Array<{
    target: string;
    dataType: string;
    direction: 'inbound' | 'outbound';
    color: Flow['color'];
    domain?: Flow['domain'];
  }>;
}> = {
  'insight_to_work': {
    flows: [
      {
        target: 'work-orders',
        dataType: 'Recommended WO',
        direction: 'outbound',
        color: 'flow-primary',
        domain: 'WorkOrders'
      }
    ]
  },
  'asset_health': {
    flows: [
      {
        target: 'assets',
        dataType: 'Asset Health Score',
        direction: 'outbound',
        color: 'flow-warning',
        domain: 'Assets'
      }
    ]
  },
  'parts_intel': {
    flows: [
      {
        target: 'work-orders',
        dataType: 'Parts/ETA Intelligence',
        direction: 'outbound',
        color: 'flow-secondary',
        domain: 'Parts'
      }
    ]
  },
  'fan_in': {
    flows: [
      // Fan-in flows are generated dynamically based on available upstream sources
    ]
  },
  'model_sync': {
    flows: [
      // Model sync flows are generated dynamically when warehouse is present
    ]
  }
};

// Generate Foundry-specific flows (always enabled)
async function generateFoundryFlows(foundryNode: Node, allNodes: Node[]): Promise<Flow[]> {
  try {
    const flows: Flow[] = [];
      
      // Only proceed if this is actually a Foundry node
      if (!foundryNode.id.includes('palantir_foundry') && 
          !foundryNode.name.toLowerCase().includes('foundry')) {
        return [];
      }
      
      console.log('[foundry] Generating Foundry-specific flows for:', foundryNode.name);
      
      // Outbound flows (MaintainX → Foundry)
      const outboundFlows = [
        {
          target: foundryNode.id,
          dataType: 'WO Events',
          from: 'work-orders',
          domain: 'WorkOrders' as const
        },
        {
          target: foundryNode.id,
          dataType: 'Asset/Meter Signals',
          from: 'assets',
          domain: 'Telemetry' as const
        },
        {
          target: foundryNode.id,
          dataType: 'Inspection Responses',
          from: 'maintenance',
          domain: 'Quality' as const
        }
      ];
      
      outboundFlows.forEach((flowDef, index) => {
        flows.push({
          id: `${flowDef.from}-to-${foundryNode.id}-foundry-${index}`,
          from: flowDef.from,
          to: foundryNode.id,
          dataType: flowDef.dataType,
          direction: 'outbound',
          frequency: 'near-real-time',
          protocol: foundryNode.protocol[0] || 'REST API',
          color: 'flow-primary',
          domain: flowDef.domain
        });
      });
      
      // Inbound flows (Foundry → MaintainX)
      const inboundFlows = [
        {
          target: 'work-orders',
          dataType: 'Recommended WO',
          domain: 'WorkOrders' as const
        },
        {
          target: 'assets',
          dataType: 'Asset Health Score',
          domain: 'Assets' as const
        },
        {
          target: 'work-orders',
          dataType: 'Parts/ETA Intelligence',
          domain: 'Parts' as const
        }
      ];
      
      inboundFlows.forEach((flowDef, index) => {
        flows.push({
          id: `${foundryNode.id}-to-${flowDef.target}-foundry-${index}`,
          from: foundryNode.id,
          to: flowDef.target,
          dataType: flowDef.dataType,
          direction: 'inbound',
          frequency: 'near-real-time',
          protocol: foundryNode.protocol[0] || 'REST API',
          color: 'flow-warning',
          domain: flowDef.domain
        });
      });
      
      // Fan-in flows (upstream sources → Foundry)
      const upstreamSources = ['historians', 'streaming', 'erp', 'mes', 'scada', 'plc', 'warehouse'];
      const selectedUpstreams = allNodes.filter(node => 
        upstreamSources.some(source => 
          node.id.toLowerCase().includes(source) || 
          node.category.toLowerCase().includes(source) ||
          node.name.toLowerCase().includes(source)
        )
      );
      
      if (selectedUpstreams.length > 0) {
        console.log('[foundry] Found upstream sources for fan-in:', selectedUpstreams.map(n => n.name));
        
        selectedUpstreams.forEach((upstream, index) => {
          flows.push({
            id: `${upstream.id}-to-${foundryNode.id}-fanin-${index}`,
            from: upstream.id,
            to: foundryNode.id,
            dataType: 'Upstream Model Inputs',
            direction: 'inbound',
            frequency: 'near-real-time',
            protocol: upstream.protocol[0] || 'Kafka',
            color: 'flow-secondary',
            domain: 'Telemetry'
          });
        });
      } else {
        console.log('[foundry] No upstream sources found for fan-in');
      }
      
      console.log('[foundry] Generated', flows.length, 'flows for Foundry');
      return flows;
      
    } catch (error) {
      console.warn('[foundry]', 'Error generating Foundry flows:', error);
      return [];
    }
}

// Generate capability-based flows for any system with capabilities
function generateCapabilityFlows(node: Node, allNodes: Node[]): Flow[] {
  try {
    if (!node.capabilities || node.capabilities.length === 0) {
      return [];
    }
    
    const flows: Flow[] = [];
    
    node.capabilities.forEach(capability => {
      const capabilityRules = CAPABILITY_FLOWS[capability];
      if (!capabilityRules) return;
      
      capabilityRules.flows.forEach((flowRule, index) => {
        // Handle special cases
        if (capability === 'fan_in') {
          // Fan-in: aggregate from multiple upstream sources
          const upstreamSources = allNodes.filter(n => 
            ['historian', 'streaming', 'erp', 'mes', 'scada', 'plc'].some(type => 
              n.category.toLowerCase().includes(type.toLowerCase())
            )
          );
          
          upstreamSources.forEach((upstream, upstreamIndex) => {
            flows.push({
              id: `${upstream.id}-to-${node.id}-capability-fanin-${upstreamIndex}`,
              from: upstream.id,
              to: node.id,
              dataType: 'Upstream Model Inputs',
              direction: 'inbound',
              frequency: 'near-real-time',
              protocol: upstream.protocol[0] || 'REST',
              color: 'flow-secondary',
              domain: 'Telemetry'
            });
          });
          
        } else if (capability === 'model_sync') {
          // Model sync: bidirectional with warehouse/lakehouse
          const warehouse = allNodes.find(n => 
            n.category === 'Inventory/WMS' || 
            n.name.toLowerCase().includes('warehouse') ||
            n.name.toLowerCase().includes('lakehouse')
          );
          
          if (warehouse) {
            flows.push({
              id: `${node.id}-to-${warehouse.id}-capability-modelsync`,
              from: node.id,
              to: warehouse.id,
              dataType: 'Model Sync',
              direction: 'outbound',
              frequency: 'scheduled',
              protocol: node.protocol[0] || 'REST',
              color: 'flow-secondary',
              domain: 'Telemetry'
            });
          }
          
        } else {
          // Standard capability flows
          const flowDirection = flowRule.direction === 'inbound' ? 'inbound' : 'outbound';
          const fromNode = flowDirection === 'inbound' ? flowRule.target : node.id;
          const toNode = flowDirection === 'inbound' ? node.id : flowRule.target;
          
          flows.push({
            id: `${fromNode}-to-${toNode}-capability-${capability}-${index}`,
            from: fromNode,
            to: toNode,
            dataType: flowRule.dataType,
            direction: flowDirection,
            frequency: 'near-real-time',
            protocol: node.protocol[0] || 'REST',
            color: flowRule.color,
            domain: flowRule.domain
          });
        }
      });
    });
    
    return flows;
    
  } catch (error) {
    console.warn('[capabilities]', 'Error generating capability flows for', node.name, ':', error);
    return [];
  }
}

// Enhanced flow generation that includes both standard and capability-based flows
export async function generateEnhancedFlows(nodes: Node[]): Promise<Flow[]> {
  try {
    const allFlows: Flow[] = [];
    
    // Generate standard flows for each node
    nodes.forEach(node => {
      const standardFlows = generateFlowsForNode(node);
      allFlows.push(...standardFlows);
    });
    
    // Generate Foundry-specific flows (always enabled)
    const foundryNodes = nodes.filter(node => 
      node.id.includes('palantir_foundry') || 
      node.name.toLowerCase().includes('foundry')
    );
    
    for (const foundryNode of foundryNodes) {
      const foundryFlows = await generateFoundryFlows(foundryNode, nodes);
      allFlows.push(...foundryFlows);
    }
    
    // Generate capability-based flows for all nodes
    nodes.forEach(node => {
      const capabilityFlows = generateCapabilityFlows(node, nodes);
      allFlows.push(...capabilityFlows);
    });
    
    // Deduplicate flows by ID
    const uniqueFlows = allFlows.filter((flow, index, self) => 
      index === self.findIndex(f => f.id === flow.id)
    );
    
    console.log('[enhancedFlows] Generated', uniqueFlows.length, 'total flows from', nodes.length, 'nodes');
    
    return uniqueFlows;
    
  } catch (error) {
    console.warn('[enhancedFlows]', 'Error in enhanced flow generation:', error);
    // Fallback to standard flow generation
    return nodes.flatMap(node => generateFlowsForNode(node));
  }
}

// Synchronous version for backward compatibility
export function generateEnhancedFlowsSync(nodes: Node[]): Flow[] {
  try {
    const allFlows: Flow[] = [];
    
    // Generate standard flows for each node
    nodes.forEach(node => {
      const standardFlows = generateFlowsForNode(node);
      allFlows.push(...standardFlows);
    });
    
    // Generate capability-based flows for all nodes
    nodes.forEach(node => {
      const capabilityFlows = generateCapabilityFlows(node, nodes);
      allFlows.push(...capabilityFlows);
    });
    
    // Deduplicate flows by ID
    const uniqueFlows = allFlows.filter((flow, index, self) => 
      index === self.findIndex(f => f.id === flow.id)
    );
    
    console.log('[enhancedFlowsSync] Generated', uniqueFlows.length, 'total flows from', nodes.length, 'nodes');
    
    return uniqueFlows;
    
  } catch (error) {
    console.warn('[enhancedFlowsSync]', 'Error in enhanced flow generation:', error);
    // Fallback to standard flow generation
    return nodes.flatMap(node => generateFlowsForNode(node));
  }
}

// Tag existing systems with capabilities based on their names/categories
export function enhanceNodesWithCapabilities(nodes: Node[]): Node[] {
  return nodes.map(node => {
    try {
      const enhanced = { ...node };
      const name = node.name.toLowerCase();
      
      // Tag systems with capabilities based on known patterns
      if (name.includes('cognite') || name.includes('data fusion')) {
        enhanced.capabilities = ['insight_to_work', 'asset_health', 'fan_in', 'model_sync'];
      } else if (name.includes('seeq')) {
        enhanced.capabilities = ['insight_to_work', 'asset_health', 'fan_in'];
      } else if (name.includes('databricks')) {
        enhanced.capabilities = ['fan_in', 'model_sync'];
      } else if (name.includes('snowflake')) {
        enhanced.capabilities = ['fan_in', 'model_sync'];
      } else if (name.includes('azure') && (name.includes('synapse') || name.includes('fabric'))) {
        enhanced.capabilities = ['fan_in', 'model_sync', 'insight_to_work'];
      } else if (name.includes('vertex') || name.includes('sagemaker')) {
        enhanced.capabilities = ['fan_in', 'insight_to_work'];
      } else if (name.includes('honeywell forge') || name.includes('aspen')) {
        enhanced.capabilities = ['insight_to_work', 'asset_health', 'fan_in'];
      } else if (name.includes('cognex') || name.includes('keyence')) {
        enhanced.capabilities = ['insight_to_work'];
      }
      
      return enhanced;
      
    } catch (error) {
      console.warn('[capabilities]', 'Error enhancing node', node.name, ':', error);
      return node; // Return original node on error
    }
  });
}