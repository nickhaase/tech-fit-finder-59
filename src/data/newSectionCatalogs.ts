import { CategoryOption } from '@/types/assessment';
import { getFoundryBrands, getFoundryBrandsAsync } from './foundryBrands';

// Base Data & Analytics Categories (without feature-flagged content)
const BASE_DATA_ANALYTICS_CATEGORIES: CategoryOption[] = [
  {
    id: 'warehouse_lakehouse',
    name: 'Data Warehouse / Lakehouse',
    description: 'Cloud data platforms for analytics and reporting',
    brands: [
      { id: 'snowflake', name: 'Snowflake', commonNames: ['Snowflake Cloud'] },
      { id: 'bigquery', name: 'Google BigQuery', commonNames: ['BigQuery'] },
      { id: 'redshift', name: 'Amazon Redshift', commonNames: ['AWS Redshift'] },
      { id: 'azure_synapse', name: 'Azure Synapse Analytics', commonNames: ['Synapse', 'Azure SQL DW'] },
      { id: 'databricks', name: 'Databricks Lakehouse', commonNames: ['Databricks'] },
      { id: 'teradata', name: 'Teradata Vantage', commonNames: ['Teradata'] },
      { id: 'oracle_adw', name: 'Oracle Autonomous Data Warehouse', commonNames: ['Oracle ADW', 'Autonomous DW'] },
      { id: 'ibm_db2_warehouse', name: 'IBM Db2 Warehouse', commonNames: ['Db2 Warehouse'] },
    ]
  },
  {
    id: 'historians',
    name: 'Historians / Time-Series',
    description: 'Industrial data historians and time-series platforms',
    brands: [
      { 
        id: 'aveva_pi', 
        name: 'AVEVA PI System', 
        commonNames: ['PI System', 'OSIsoft PI', 'AVEVA PI'],
        categories: ['data_analytics.historians', 'automation.scada'] // Cross-listing
      },
      { id: 'proficy_historian', name: 'GE Proficy Historian', commonNames: ['Proficy Historian'] },
      { id: 'canary_historian', name: 'Canary Historian', commonNames: ['Canary Labs'] },
      { 
        id: 'ignition_historian', 
        name: 'Ignition Tag Historian', 
        commonNames: ['Ignition Historian'],
        categories: ['data_analytics.historians', 'automation.scada'] // Cross-listing
      },
      { id: 'aveva_historian', name: 'AVEVA Historian', commonNames: [] },
      { id: 'aspen_ip21', name: 'AspenTech InfoPlus.21', commonNames: ['InfoPlus.21', 'Aspen IP.21'] },
    ]
  },
  {
    id: 'streaming',
    name: 'Streaming & Eventing',
    description: 'Real-time data streaming and event platforms',
    brands: [
      { id: 'kafka_confluent', name: 'Apache Kafka / Confluent', commonNames: ['Kafka', 'Confluent Platform'] },
      { id: 'aws_kinesis', name: 'Amazon Kinesis', commonNames: ['AWS Kinesis'] },
      { id: 'azure_event_hubs', name: 'Azure Event Hubs', commonNames: ['Event Hubs'] },
    ]
  },
  {
    id: 'bi',
    name: 'BI / Visualization',
    description: 'Business intelligence and data visualization tools',
    brands: [
      { id: 'power_bi', name: 'Power BI', commonNames: ['Microsoft Power BI'] },
      { id: 'tableau', name: 'Tableau', commonNames: ['Tableau Desktop', 'Tableau Server'] },
      { id: 'grafana', name: 'Grafana', commonNames: ['Grafana Labs'] },
    ]
  },
  {
    id: 'etl',
    name: 'ETL/ELT & Data Integration',
    description: 'Data integration and transformation platforms',
    brands: [
      { id: 'fivetran', name: 'Fivetran', commonNames: [] },
      { id: 'matillion', name: 'Matillion', commonNames: ['Matillion ETL'] },
      { id: 'informatica', name: 'Informatica', commonNames: ['Informatica PowerCenter'] },
      { id: 'dbt', name: 'dbt', commonNames: ['dbt Labs'] },
    ]
  },
  {
    id: 'governance',
    name: 'Data Governance / Catalog',
    description: 'Data governance and catalog management',
    brands: [
      { id: 'microsoft_purview', name: 'Microsoft Purview', commonNames: ['Purview'] },
      { id: 'collibra', name: 'Collibra', commonNames: ['Collibra Data Governance'] },
      { id: 'alation', name: 'Alation', commonNames: ['Alation Data Catalog'] },
    ]
  },
];

// Dynamic function to get data analytics categories with feature-flagged content
export function getDataAnalyticsCategories(): CategoryOption[] {
  console.log('[getDataAnalyticsCategories] Building categories dynamically...');
  const categories = [...BASE_DATA_ANALYTICS_CATEGORIES];
  
  // Add Foundry brands conditionally
  const foundryBrands = getFoundryBrands();
  if (foundryBrands.length > 0) {
    console.log('[getDataAnalyticsCategories] Adding Foundry categories:', foundryBrands.length);
    categories.push(...foundryBrands);
  } else {
    console.log('[getDataAnalyticsCategories] No Foundry categories to add');
  }
  
  return categories;
}

// Async version for proper feature flag loading
export async function getDataAnalyticsCategoriesAsync(): Promise<CategoryOption[]> {
  console.log('[getDataAnalyticsCategoriesAsync] Building categories dynamically...');
  const categories = [...BASE_DATA_ANALYTICS_CATEGORIES];
  
  // Add Foundry brands conditionally (async check)
  const foundryBrands = await getFoundryBrandsAsync();
  if (foundryBrands.length > 0) {
    console.log('[getDataAnalyticsCategoriesAsync] Adding Foundry categories:', foundryBrands.length);
    categories.push(...foundryBrands);
  } else {
    console.log('[getDataAnalyticsCategoriesAsync] No Foundry categories to add');
  }
  
  return categories;
}

// For backward compatibility, export the dynamic function result
export const DATA_ANALYTICS_CATEGORIES = BASE_DATA_ANALYTICS_CATEGORIES;

// Connectivity & Edge Category
export const CONNECTIVITY_EDGE_CATEGORY: CategoryOption = {
  id: 'connectivity_edge',
  name: 'Connectivity & Edge',
  description: 'Industrial gateways, brokers, and protocol bridges',
  brands: [
    { id: 'kepware_kep', name: 'Kepware KEPServerEX', commonNames: ['KEPServerEX', 'Kepware'] },
    { id: 'red_lion_crimson', name: 'Red Lion Crimson', commonNames: ['Crimson 3.0'] },
    { id: 'moxa_gateways', name: 'Moxa Gateways', commonNames: ['Moxa Industrial'] },
    { id: 'siemens_edge', name: 'Siemens Industrial Edge', commonNames: ['Industrial Edge'] },
    { id: 'rockwell_edge', name: 'Rockwell Edge Gateway', commonNames: ['Edge Gateway'] },
    { id: 'hivemq', name: 'HiveMQ', commonNames: ['HiveMQ Broker'] },
    { id: 'emqx', name: 'EMQX', commonNames: ['EMQX Broker'] },
    { id: 'mosquitto', name: 'Eclipse Mosquitto', commonNames: ['Mosquitto'] },
    { id: 'aws_iot_core', name: 'AWS IoT Core', commonNames: ['Amazon IoT Core'] },
    { id: 'azure_iot_hub', name: 'Azure IoT Hub', commonNames: ['IoT Hub'] },
  ]
};

// Advanced Question Sets
export const ADVANCED_QUESTION_SETS = {
  connectivity_edge: {
    gateway: ['Kepware', 'Red Lion', 'Moxa', 'Siemens Industrial Edge', 'Rockwell Edge Gateway', 'Other'],
    protocols: ['OPC UA/DA', 'Modbus/TCP', 'EtherNet/IP', 'PROFINET', 'MQTT', 'REST'],
    broker: ['HiveMQ', 'EMQX', 'Mosquitto', 'AWS IoT Core', 'Azure IoT Hub', 'Other'],
    deployment: ['Edge appliance', 'VM', 'Container', 'Cloud'],
    security: ['TLS', 'Client certs', 'VPN', 'Outbound-only'],
  },
  warehouse_lakehouse: {
    platform: ['Snowflake', 'BigQuery', 'Redshift', 'Azure Synapse', 'Databricks', 'Teradata', 'Oracle ADW', 'IBM Db2 Warehouse', 'Other'],
    movement: ['Fivetran', 'Matillion', 'Informatica', 'dbt', 'Custom ELT', 'S3/ADLS batch'],
    updateMode: ['Real-time', 'Micro-batch', 'Nightly'],
    objects: ['Work orders', 'Assets', 'Parts', 'Costs', 'Users', 'Custom fields'],
  },
  historians: {
    platform: ['AVEVA PI', 'Proficy Historian', 'Canary', 'Ignition Tag Historian', 'AVEVA Historian', 'Aspen IP.21', 'Other'],
    interfaces: ['OPC', 'MQTT', 'File drop', 'Custom'],
    retention: ['Raw', '1m', '15m', '1h'],
    objects: ['Trigger PM/PdM', 'Attach readings to WOs', 'Asset trends'],
  },
  streaming: {
    platform: ['Kafka/Confluent', 'AWS Kinesis', 'Azure Event Hubs', 'Other'],
    pattern: ['Events from MaintainX', 'To MaintainX webhooks', 'Both'],
    serialization: ['JSON', 'Avro', 'Protobuf'],
  },
  bi: {
    tool: ['Power BI', 'Tableau', 'Grafana', 'Other'],
    modeling: ['Star schema', 'Semantic model'],
    refresh: ['DirectQuery', 'Scheduled extract'],
    audience: ['Ops', 'Maintenance', 'Exec'],
  },
  etl: {
    tooling: ['Fivetran', 'Matillion', 'Informatica', 'dbt', 'Other'],
    schedule: ['Real-time', 'Micro-batch', 'Nightly'],
  },
  governance: {
    catalog: ['Microsoft Purview', 'Collibra', 'Alation', 'Other'],
    policies: ['PII masking', 'Role-based access', 'Lineage'],
  },
};

// Result Copy Templates
export const RESULT_COPY_TEMPLATES = {
  warehouse_lakehouse: "MaintainX exports {objects} to {platform} via {method} ({updateMode}) with schema {prefix} for downstream BI/AI.",
  historians: "MaintainX listens to {interfaces} from {historian} to attach readings to assets and trigger PM/PdM.",
  streaming: "MaintainX publishes {events} to {platform} using {serialization}; consumers update ERP/MES in near real-time.",
  connectivity_edge: "MaintainX integrates via {gateway} using {protocols}; {security}; topology {deployment}.",
};