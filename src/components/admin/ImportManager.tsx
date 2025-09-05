import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { AppConfig, BrandOption, ConfigSection, GlobalBrand } from '@/types/config';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertCircle, CheckCircle, Download, ExternalLink, Sparkles } from 'lucide-react';

interface ImportManagerProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

interface ColumnMapping {
  [key: string]: string; // mapped column -> csv header
}

interface ImportDiff {
  adds: BrandOption[];
  updates: BrandOption[];
  deprecations: string[];
  conflicts: string[];
  warnings: string[];
}

interface SynonymEntry {
  synonym: string;
  canonicalName: string;
  targetSlug: string;
  type: string;
  notes?: string;
}

interface GlobalBrandImportEntry {
  id: string;
  name: string;
  logo?: string;
  synonyms: string[];
  state: 'active' | 'deprecated' | 'hidden';
  assignedSections: string[];
  notes?: string;
}

interface GlobalBrandDiff {
  adds: GlobalBrandImportEntry[];
  updates: GlobalBrandImportEntry[];
  conflicts: string[];
  warnings: string[];
}

const SAMPLE_CATALOG_CSV = `Section,Subsection,Parent Brand,Product / Platform,Slug,Logo,Synonyms,Cross-Listed,Protocols,Objects,Notes,State,Global Brand ID,Link to Global Brand
Automation & SCADA,SCADA Systems,Inductive Automation,Ignition,ignition,/assets/logos/ignition.svg,Ignition SCADA|IA Ignition,Data & Analytics.Historians / Time-Series,OPC UA|MQTT|REST,,SCADA + Historian roles,active,inductive-automation,true
Data & Analytics,Historians / Time-Series,AVEVA,PI System (formerly OSIsoft),pi-system,/assets/logos/pi-system.svg,OSIsoft|PI,,OPC|MQTT|File,,Industrial historian,active,aveva,true
ERP Systems,ERP Systems,SAP,S/4HANA,sap-s4hana,/assets/logos/sap-s4hana.svg,SAP ERP|ECC,,OData|REST|SFTP/CSV,workOrders|assets|parts|vendors|costs|users,Flagship ERP,active,sap,true`;

const SAMPLE_SYNONYM_CSV = `Synonym,Canonical Name (Product / Platform),Target Slug,Type,Notes
Wonderware,System Platform (Wonderware),system-platform-wonderware,product,Brand legacy name
ECC,S/4HANA,sap-s4hana,product,Legacy SAP term
Confluent Kafka,Apache Kafka / Confluent Platform,apache-kafka-confluent-platform,product,Streaming alias
Kepware,KEPServerEX,kepserverex,product,Common short name
AB ControlLogix,Allen-Bradley ControlLogix / CompactLogix,allen-bradley-controllogix-compactlogix,product,PLC family alias`;

const SAMPLE_GLOBAL_BRANDS_CSV = `Brand ID,Brand Name,Logo URL,Synonyms,State,Assigned Sections,Notes
sap,SAP,/assets/logos/sap-logo.png,SAP ERP|SAP S/4HANA|ECC,active,erp_systems,Leading enterprise software company
microsoft,Microsoft,/assets/logos/microsoft-logo.png,MS|MSFT,active,erp_systems|automation_scada,Technology giant with various enterprise solutions
siemens,Siemens,/assets/logos/siemens-logo.png,Siemens AG,active,automation_scada|sensors_iot,Industrial automation leader
oracle,Oracle,/assets/logos/oracle-logo.png,Oracle Corp,active,erp_systems|data_analytics,Database and cloud computing company`;

const CATALOG_REQUIRED_COLUMNS = [
  'section',
  'subsection', 
  'parentBrand',
  'productPlatform',
  'slug',
  'logo',
  'synonyms',
  'crossListed',
  'protocols',
  'objects',
  'notes',
  'state',
  'globalBrandId',
  'linkToGlobalBrand'
];

const SYNONYM_REQUIRED_COLUMNS = [
  'synonym',
  'canonicalName',
  'targetSlug',
  'type',
  'notes'
];

const GLOBAL_BRAND_REQUIRED_COLUMNS = [
  'brandId',
  'brandName',
  'logoUrl',
  'synonyms',
  'state',
  'assignedSections',
  'notes'
];

// Linker CSV (for linking existing options to global brands)
const SAMPLE_LINKER_CSV = `Slug,Global Brand ID,Link to Global Brand,Parent Brand,Product / Platform
ignition,inductive-automation,true,Inductive Automation,Ignition
pi-system,aveva,true,AVEVA,PI System (formerly OSIsoft)
custom-solution,,false,,Custom Solution`;

const LINKER_COLUMNS = [
  'slug',
  'globalBrandId',
  'linkToGlobalBrand',
  'parentBrand',
  'productPlatform'
];

export const ImportManager = ({ config, onConfigChange }: ImportManagerProps) => {
  const { toast } = useToast();
  
  // Catalog Import State
  const [catalogMode, setCatalogMode] = useState<'paste' | 'url'>('paste');
  const [catalogText, setCatalogText] = useState('');
  const [catalogUrl, setCatalogUrl] = useState('');
  const [catalogParsed, setCatalogParsed] = useState<ParsedCSV | null>(null);
  const [catalogMapping, setCatalogMapping] = useState<ColumnMapping>({});
  const [catalogDiff, setCatalogDiff] = useState<ImportDiff | null>(null);
  
  // Synonym Import State
  const [synonymMode, setSynonymMode] = useState<'paste' | 'url'>('paste');
  const [synonymText, setSynonymText] = useState('');
  const [synonymUrl, setSynonymUrl] = useState('');
  const [synonymParsed, setSynonymParsed] = useState<ParsedCSV | null>(null);
  const [synonymMapping, setSynonymMapping] = useState<ColumnMapping>({});
  const [synonymDiff, setSynonymDiff] = useState<SynonymEntry[]>([]);

  // Global Brand Import State
  const [globalBrandMode, setGlobalBrandMode] = useState<'paste' | 'url'>('paste');
  const [globalBrandText, setGlobalBrandText] = useState('');
  const [globalBrandUrl, setGlobalBrandUrl] = useState('');
  const [globalBrandParsed, setGlobalBrandParsed] = useState<ParsedCSV | null>(null);
  const [globalBrandMapping, setGlobalBrandMapping] = useState<ColumnMapping>({});
  const [globalBrandDiff, setGlobalBrandDiff] = useState<GlobalBrandDiff | null>(null);

  // Linker CSV State (link existing options to global brands)
  const [linkerMode, setLinkerMode] = useState<'paste' | 'url'>('paste');
  const [linkerText, setLinkerText] = useState('');
  const [linkerUrl, setLinkerUrl] = useState('');
  const [linkerParsed, setLinkerParsed] = useState<ParsedCSV | null>(null);
  const [linkerMapping, setLinkerMapping] = useState<ColumnMapping>({});
  const [linkerPreview, setLinkerPreview] = useState<any | null>(null);
  const [unresolvedSelections, setUnresolvedSelections] = useState<Record<number, string>>({});
  const [allowFieldUpdates, setAllowFieldUpdates] = useState(false);
  const [confirmRelink, setConfirmRelink] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const convertGoogleSheetsUrl = (url: string): string => {
    if (url.includes('docs.google.com/spreadsheets')) {
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
      }
    }
    return url;
  };

  const detectDelimiter = (text: string): string => {
    const firstLine = text.split('\n')[0];
    const delimiters = [',', ';', '\t'];
    let maxCount = 0;
    let detectedDelimiter = ',';
    
    delimiters.forEach(delimiter => {
      const count = firstLine.split(delimiter).length;
      if (count > maxCount) {
        maxCount = count;
        detectedDelimiter = delimiter;
      }
    });
    
    return detectedDelimiter;
  };

  const parseCSV = (text: string): ParsedCSV => {
    const delimiter = detectDelimiter(text);
    const lines = text.trim().split('\n');
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => 
      line.split(delimiter).map(cell => cell.trim().replace(/"/g, ''))
    );
    
    return { headers, rows };
  };

  const handleCatalogParse = async () => {
    try {
      let csvText = catalogText;
      
      if (catalogMode === 'url') {
        const url = convertGoogleSheetsUrl(catalogUrl);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch CSV from URL');
        csvText = await response.text();
      }
      
      const parsed = parseCSV(csvText);
      setCatalogParsed(parsed);
      
      // Auto-map columns
      const mapping: ColumnMapping = {};
      CATALOG_REQUIRED_COLUMNS.forEach(reqCol => {
        const found = parsed.headers.find(h => 
          h.toLowerCase().replace(/[^a-z]/g, '') === reqCol.toLowerCase().replace(/[^a-z]/g, '')
        );
        if (found) mapping[reqCol] = found;
      });
      setCatalogMapping(mapping);
      
      toast({
        title: "CSV Parsed",
        description: `Found ${parsed.rows.length} rows with ${parsed.headers.length} columns`
      });
    } catch (error) {
      toast({
        title: "Parse Failed",
        description: error instanceof Error ? error.message : "Failed to parse CSV",
        variant: "destructive"
      });
    }
  };

  const generateCatalogDiff = () => {
    if (!catalogParsed) return;
    
    const diff: ImportDiff = {
      adds: [],
      updates: [],
      deprecations: [],
      conflicts: [],
      warnings: []
    };
    
    // Find existing brands by slug
    const existingBrands = new Map<string, BrandOption>();
    config.sections.forEach(section => {
      section.options?.forEach(opt => existingBrands.set(opt.id, opt));
      section.subcategories?.forEach(sub => {
        sub.options?.forEach(opt => existingBrands.set(opt.id, opt));
      });
    });
    
    catalogParsed.rows.forEach(row => {
      const brand: Partial<BrandOption> = {};
      
      Object.entries(catalogMapping).forEach(([reqCol, csvHeader]) => {
        const colIndex = catalogParsed.headers.indexOf(csvHeader);
        if (colIndex >= 0 && row[colIndex]) {
          const value = row[colIndex];
          
          switch (reqCol) {
            case 'slug':
              brand.id = value;
              break;
            case 'productPlatform':
              brand.name = value;
              break;
            case 'synonyms':
              brand.synonyms = value.split('|').map(s => s.trim()).filter(Boolean);
              break;
            case 'state':
              brand.state = value as 'active' | 'deprecated' | 'hidden';
              break;
            case 'logo':
              brand.logo = value;
              break;
            case 'crossListed':
              brand.categories = value.split('|').map(s => s.trim()).filter(Boolean);
              break;
          }
        }
      });
      
      if (brand.id) {
        if (existingBrands.has(brand.id)) {
          diff.updates.push(brand as BrandOption);
        } else {
          diff.adds.push(brand as BrandOption);
        }
      }
    });
    
    setCatalogDiff(diff);
  };

  const handleSynonymParse = async () => {
    try {
      let csvText = synonymText;
      
      if (synonymMode === 'url') {
        const url = convertGoogleSheetsUrl(synonymUrl);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch CSV from URL');
        csvText = await response.text();
      }
      
      const parsed = parseCSV(csvText);
      setSynonymParsed(parsed);
      
      // Auto-map columns
      const mapping: ColumnMapping = {};
      SYNONYM_REQUIRED_COLUMNS.forEach(reqCol => {
        const found = parsed.headers.find(h => 
          h.toLowerCase().replace(/[^a-z]/g, '') === reqCol.toLowerCase().replace(/[^a-z]/g, '')
        );
        if (found) mapping[reqCol] = found;
      });
      setSynonymMapping(mapping);
      
      toast({
        title: "Synonym CSV Parsed",
        description: `Found ${parsed.rows.length} synonym entries`
      });
    } catch (error) {
      toast({
        title: "Parse Failed", 
        description: error instanceof Error ? error.message : "Failed to parse synonym CSV",
        variant: "destructive"
      });
    }
  };

  const generateSynonymDiff = () => {
    if (!synonymParsed) return;
    
    const entries: SynonymEntry[] = [];
    
    synonymParsed.rows.forEach(row => {
      const entry: Partial<SynonymEntry> = {};
      
      Object.entries(synonymMapping).forEach(([reqCol, csvHeader]) => {
        const colIndex = synonymParsed.headers.indexOf(csvHeader);
        if (colIndex >= 0 && row[colIndex]) {
          const value = row[colIndex];
          
          switch (reqCol) {
            case 'synonym':
              entry.synonym = value;
              break;
            case 'canonicalName':
              entry.canonicalName = value;
              break;
            case 'targetSlug':
              entry.targetSlug = value;
              break;
            case 'type':
              entry.type = value;
              break;
            case 'notes':
              entry.notes = value;
              break;
          }
        }
      });
      
      if (entry.synonym && entry.targetSlug) {
        entries.push(entry as SynonymEntry);
      }
    });
    
    setSynonymDiff(entries);
  };

  const publishCatalogChanges = () => {
    try {
      if (!catalogDiff || !catalogParsed) {
        toast({
          title: "Import Error",
          description: "No changes to publish. Please parse the CSV first.",
          variant: "destructive"
        });
        return;
      }
      
      const newConfig = { ...config };
    
    // Create a map of existing sections and subsections
    const sectionMap = new Map<string, ConfigSection>();
    const subsectionMap = new Map<string, ConfigSection>();
    
    newConfig.sections.forEach(section => {
      sectionMap.set(section.id, section);
      section.subcategories?.forEach(sub => {
        subsectionMap.set(sub.id, sub);
      });
    });
    
    // Process each row from the CSV
    catalogParsed.rows.forEach(row => {
      const rowData: Record<string, string> = {};
      Object.entries(catalogMapping).forEach(([reqCol, csvHeader]) => {
        const colIndex = catalogParsed.headers.indexOf(csvHeader);
        if (colIndex >= 0 && row[colIndex]) {
          rowData[reqCol] = row[colIndex];
        }
      });
      
      if (!rowData.slug || !rowData.productPlatform) return;
      
      // Create the brand option
      const brand: BrandOption = {
        id: rowData.slug,
        name: rowData.productPlatform,
        synonyms: rowData.synonyms ? rowData.synonyms.split('|').map(s => s.trim()).filter(Boolean) : [],
        state: (rowData.state as 'active' | 'deprecated' | 'hidden') || 'active',
        logo: rowData.logo || undefined,
        categories: rowData.crossListed ? rowData.crossListed.split('|').map(s => s.trim()).filter(Boolean) : undefined,
      };
      
      // Handle global brand linking
      if (rowData.linkToGlobalBrand === 'true' && rowData.globalBrandId) {
        brand.globalId = rowData.globalBrandId;
        brand.isLinkedToGlobal = true;
      }
      
      // Add meta information
      if (rowData.protocols || rowData.objects) {
        brand.meta = {
          categories: brand.categories,
          crossListed: !!brand.categories?.length,
        };
      }
      
      // Find the target section/subsection
      const sectionId = rowData.section?.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const subsectionId = rowData.subsection?.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      let targetSection: ConfigSection | undefined;
      
      if (subsectionId && sectionId) {
        // Try to find existing subsection
        const fullSubsectionId = `${sectionId}.${subsectionId}`;
        targetSection = subsectionMap.get(fullSubsectionId);
        
        if (!targetSection) {
          // Create new subsection
          const parentSection = sectionMap.get(sectionId);
          if (parentSection) {
            const newSubsection: ConfigSection = {
              id: fullSubsectionId,
              label: rowData.subsection || 'New Subsection',
              multi: true,
              options: [],
              systemOptions: ['None', 'Not sure']
            };
            
            if (!parentSection.subcategories) {
              parentSection.subcategories = [];
            }
            parentSection.subcategories.push(newSubsection);
            subsectionMap.set(fullSubsectionId, newSubsection);
            targetSection = newSubsection;
          }
        }
      } else if (sectionId) {
        targetSection = sectionMap.get(sectionId);
      }
      
      // Add the brand to the target section
      if (targetSection) {
        const existingIndex = targetSection.options.findIndex(opt => opt.id === brand.id);
        if (existingIndex >= 0) {
          // Update existing
          targetSection.options[existingIndex] = brand;
        } else {
          // Add new
          targetSection.options.push(brand);
        }
      }
    });
    
    onConfigChange(newConfig);
    
    toast({
      title: "Catalog Imported",
      description: `Added ${catalogDiff.adds.length} brands, updated ${catalogDiff.updates.length} brands`
    });
    
      // Reset state
      setCatalogDiff(null);
      setCatalogParsed(null);
      setCatalogText('');
      setCatalogUrl('');
    } catch (error) {
      console.error('Catalog import failed:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import catalog. Please check the data and try again.",
        variant: "destructive"
      });
    }
  };

  const publishSynonymChanges = () => {
    if (!synonymDiff.length) return;
    
    const newConfig = { ...config };
    const newSynonymMap = { ...config.synonymMap };
    
    synonymDiff.forEach(entry => {
      newSynonymMap[entry.synonym.toLowerCase()] = entry.targetSlug;
    });
    
    newConfig.synonymMap = newSynonymMap;
    onConfigChange(newConfig);
    
    toast({
      title: "Synonyms Imported",
      description: `Added ${synonymDiff.length} synonym mappings`
    });
    
    // Reset state
    setSynonymDiff([]);
    setSynonymParsed(null);
    setSynonymText('');
    setSynonymUrl('');
  };

  // Global Brand Import Functions
  const handleGlobalBrandParse = async () => {
    try {
      let csvText = globalBrandText;
      
      if (globalBrandMode === 'url') {
        const url = convertGoogleSheetsUrl(globalBrandUrl);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch CSV from URL');
        csvText = await response.text();
      }
      
      const parsed = parseCSV(csvText);
      setGlobalBrandParsed(parsed);
      
      // Auto-map columns
      const mapping: ColumnMapping = {};
      GLOBAL_BRAND_REQUIRED_COLUMNS.forEach(reqCol => {
        const found = parsed.headers.find(h => 
          h.toLowerCase().replace(/[^a-z]/g, '') === reqCol.toLowerCase().replace(/[^a-z]/g, '')
        );
        if (found) mapping[reqCol] = found;
      });
      setGlobalBrandMapping(mapping);
      
      toast({
        title: "Global Brands CSV Parsed",
        description: `Found ${parsed.rows.length} global brand entries`
      });
    } catch (error) {
      toast({
        title: "Parse Failed", 
        description: error instanceof Error ? error.message : "Failed to parse global brands CSV",
        variant: "destructive"
      });
    }
  };

  const generateGlobalBrandDiff = () => {
    if (!globalBrandParsed) return;
    
    const diff: GlobalBrandDiff = {
      adds: [],
      updates: [],
      conflicts: [],
      warnings: []
    };
    
    // Find existing global brands
    const existingGlobalBrands = new Map<string, GlobalBrand>();
    config.globalBrands?.forEach(brand => existingGlobalBrands.set(brand.id, brand));
    
    globalBrandParsed.rows.forEach(row => {
      const brand: Partial<GlobalBrandImportEntry> = {};
      
      Object.entries(globalBrandMapping).forEach(([reqCol, csvHeader]) => {
        const colIndex = globalBrandParsed.headers.indexOf(csvHeader);
        if (colIndex >= 0 && row[colIndex]) {
          const value = row[colIndex];
          
          switch (reqCol) {
            case 'brandId':
              brand.id = value;
              break;
            case 'brandName':
              brand.name = value;
              break;
            case 'logoUrl':
              brand.logo = value;
              break;
            case 'synonyms':
              brand.synonyms = value.split('|').map(s => s.trim()).filter(Boolean);
              break;
            case 'state':
              brand.state = value as 'active' | 'deprecated' | 'hidden';
              break;
            case 'assignedSections':
              brand.assignedSections = value.split('|').map(s => s.trim()).filter(Boolean);
              break;
            case 'notes':
              brand.notes = value;
              break;
          }
        }
      });
      
      if (brand.id && brand.name) {
        if (existingGlobalBrands.has(brand.id)) {
          diff.updates.push(brand as GlobalBrandImportEntry);
        } else {
          diff.adds.push(brand as GlobalBrandImportEntry);
        }
      }
    });
    
    setGlobalBrandDiff(diff);
  };

  const publishGlobalBrandChanges = () => {
    try {
      if (!globalBrandDiff) {
        toast({
          title: "Import Error",
          description: "No changes to publish. Please parse the CSV first.",
          variant: "destructive"
        });
        return;
      }
      
      const newConfig = { ...config };
      
      // Initialize global brands array if it doesn't exist
      if (!newConfig.globalBrands) {
        newConfig.globalBrands = [];
      }
      
      // Validate all changes before applying
      const allImportBrands = [...globalBrandDiff.adds, ...globalBrandDiff.updates];
      const brandIds = new Set<string>();
      const duplicateNames = new Set<string>();
      
      for (const importBrand of allImportBrands) {
        if (!importBrand.name?.trim()) {
          toast({
            title: "Validation Error",
            description: "All brands must have a name.",
            variant: "destructive"
          });
          return;
        }
        
        if (brandIds.has(importBrand.id)) {
          duplicateNames.add(importBrand.name);
        }
        brandIds.add(importBrand.id);
      }
      
      if (duplicateNames.size > 0) {
        toast({
          title: "Duplicate Brands",
          description: `Duplicate brand names found: ${Array.from(duplicateNames).join(', ')}`,
          variant: "destructive"
        });
        return;
      }
      
      // Apply additions and updates
      allImportBrands.forEach(importBrand => {
        const globalBrand: GlobalBrand = {
          id: importBrand.id,
          name: importBrand.name,
          logo: importBrand.logo || '',
          synonyms: Array.isArray(importBrand.synonyms) ? importBrand.synonyms : [],
          state: importBrand.state || 'active',
          assignedSections: Array.isArray(importBrand.assignedSections) ? importBrand.assignedSections : [],
        };
        
        const existingIndex = newConfig.globalBrands!.findIndex(b => b.id === globalBrand.id);
        if (existingIndex >= 0) {
          // Update existing
          newConfig.globalBrands![existingIndex] = globalBrand;
        } else {
          // Add new
          newConfig.globalBrands!.push(globalBrand);
        }
      });
      
      onConfigChange(newConfig);
      
      toast({
        title: "Global Brands Imported",
        description: `Added ${globalBrandDiff.adds.length} brands, updated ${globalBrandDiff.updates.length} brands`
      });
      
      // Reset state
      setGlobalBrandDiff(null);
      setGlobalBrandParsed(null);
      setGlobalBrandText('');
      setGlobalBrandUrl('');
    } catch (error) {
      console.error('Global brand import failed:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import global brands. Please check the data and try again.",
        variant: "destructive"
      });
    }
  };

  // Helpers for Linker CSV
  const normalize = (s?: string) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const toBool = (v?: string) => (v || '').toString().trim().toLowerCase() === 'true';

  const handleLinkerParse = async () => {
    try {
      let csvText = linkerText;
      if (linkerMode === 'url') {
        const url = convertGoogleSheetsUrl(linkerUrl);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch CSV from URL');
        csvText = await response.text();
      }
      const parsed = parseCSV(csvText);
      setLinkerParsed(parsed);

      const mapping: ColumnMapping = {};
      LINKER_COLUMNS.forEach(reqCol => {
        const found = parsed.headers.find(h => 
          h.toLowerCase().replace(/[^a-z]/g, '') === reqCol.toLowerCase().replace(/[^a-z]/g, '')
        );
        if (found) mapping[reqCol] = found;
      });
      setLinkerMapping(mapping);

      setLinkerPreview(null);
      setUnresolvedSelections({});
      setConfirmRelink(false);
      toast({ title: 'CSV Parsed', description: `Found ${parsed.rows.length} rows` });
    } catch (error) {
      toast({ title: 'Parse Failed', description: error instanceof Error ? error.message : 'Failed to parse CSV', variant: 'destructive' });
    }
  };

  const generateLinkerPreview = () => {
    if (!linkerParsed) return;

    // Index options by slug
    const optionIndex = new Map<string, { sectionId: string; subcategoryId?: string; option: BrandOption }>();
    config.sections.forEach(section => {
      section.options?.forEach(opt => optionIndex.set(opt.id, { sectionId: section.id, option: opt }));
      section.subcategories?.forEach(sub => {
        sub.options?.forEach(opt => optionIndex.set(opt.id, { sectionId: section.id, subcategoryId: sub.id, option: opt }));
      });
    });

    // Index global brands
    const globalMap = new Map<string, GlobalBrand>();
    const normalizedIndex = new Map<string, string>();
    (config.globalBrands || []).forEach(g => {
      globalMap.set(g.id, g);
      normalizedIndex.set(normalize(g.id), g.id);
      normalizedIndex.set(normalize(g.name), g.id);
    });

    const preview = {
      toLink: [] as any[],
      reLinked: [] as any[],
      unlinked: [] as any[],
      noOp: [] as any[],
      skipped: [] as any[],
      unresolved: [] as any[]
    };

    linkerParsed.rows.forEach((row, rowIndex) => {
      const rowData: Record<string, string> = {};
      Object.entries(linkerMapping).forEach(([reqCol, csvHeader]) => {
        const colIndex = linkerParsed.headers.indexOf(csvHeader);
        if (colIndex >= 0) rowData[reqCol] = row[colIndex] || '';
      });

      const slug = (rowData.slug || '').trim();
      if (!slug) {
        preview.skipped.push({ rowIndex, reason: 'Missing slug' });
        return;
      }

      const optInfo = optionIndex.get(slug);
      if (!optInfo) {
        preview.skipped.push({ rowIndex, slug, reason: 'Slug not found' });
        return;
      }

      const linkFlag = toBool(rowData.linkToGlobalBrand);
      const parentBrand = rowData.parentBrand || '';
      let targetId = (rowData.globalBrandId || '').trim();

      if (linkFlag) {
        // Resolve target global brand id
        let resolvedId: string | null = null;
        if (targetId && globalMap.has(targetId)) {
          resolvedId = targetId;
        } else {
          const pb = normalize(parentBrand);
          if (pb && normalizedIndex.has(pb)) {
            resolvedId = normalizedIndex.get(pb)!;
          }
        }

        if (!resolvedId) {
          preview.unresolved.push({ rowIndex, slug, parentBrand, reason: targetId ? 'Global Brand ID not found' : 'Missing Global Brand ID' });
          return;
        }

        // Determine action
        const currentId = optInfo.option.globalId;
        const isLinked = !!optInfo.option.isLinkedToGlobal;
        if (isLinked && currentId === resolvedId) {
          preview.noOp.push({ rowIndex, slug, currentId });
        } else if (isLinked && currentId && currentId !== resolvedId) {
          preview.reLinked.push({ rowIndex, slug, from: currentId, to: resolvedId, conflict: true });
        } else {
          preview.toLink.push({ rowIndex, slug, to: resolvedId });
        }
      } else {
        // Unlink requested
        if (optInfo.option.isLinkedToGlobal) {
          preview.unlinked.push({ rowIndex, slug });
        } else {
          preview.noOp.push({ rowIndex, slug });
        }
      }
    });

    setLinkerPreview(preview);
  };

  // Enhanced auto-suggestion with similarity scoring
  const calculateSimilarity = (str1: string, str2: string): number => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const a = normalize(str1);
    const b = normalize(str2);
    
    // Exact match
    if (a === b) return 1.0;
    
    // Contains match
    if (a.includes(b) || b.includes(a)) return 0.8;
    
    // Simple Levenshtein-like scoring
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    const editDistance = longer.length - shorter.length;
    
    if (editDistance === 0) {
      let matches = 0;
      for (let i = 0; i < a.length; i++) {
        if (a[i] === b[i]) matches++;
      }
      return matches / a.length;
    }
    
    return Math.max(0, (longer.length - editDistance) / longer.length * 0.6);
  };

  const findBestGlobalBrandMatch = (parentBrand: string, productPlatform?: string) => {
    if (!config.globalBrands || !parentBrand) return null;
    
    const searchTerms = [
      parentBrand,
      productPlatform,
      `${parentBrand} ${productPlatform || ''}`.trim()
    ].filter(Boolean);
    
    let bestMatch = null;
    let bestScore = 0.7; // Minimum threshold
    
    config.globalBrands.forEach(brand => {
      const candidateNames = [brand.name, ...brand.synonyms];
      
      searchTerms.forEach(term => {
        candidateNames.forEach(candidate => {
          const score = calculateSimilarity(term, candidate);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = { brand, score, matchedOn: candidate };
          }
        });
      });
    });
    
    return bestMatch;
  };

  const autofillProposals = () => {
    if (!linkerParsed || !linkerPreview) return;
    
    const newSelections: Record<number, string> = { ...unresolvedSelections };
    let proposalCount = 0;
    
    linkerPreview.unresolved.forEach((item: any) => {
      if (!newSelections[item.rowIndex] && item.parentBrand) {
        const match = findBestGlobalBrandMatch(item.parentBrand, item.productPlatform);
        if (match) {
          newSelections[item.rowIndex] = match.brand.id;
          proposalCount++;
        }
      }
    });
    
    setUnresolvedSelections(newSelections);
    toast({
      title: "Smart Proposals Generated",
      description: `Auto-filled ${proposalCount} smart proposals based on similarity matching`
    });
  };

  // Bulk operations
  const selectAllUnresolved = () => {
    if (!linkerPreview) return;
    setSelectedItems(new Set(
      linkerPreview.unresolved.map((item: any) => item.rowIndex)
    ));
  };

  const selectAllWithProposals = () => {
    if (!linkerPreview) return;
    setSelectedItems(new Set(
      linkerPreview.unresolved
        .filter((item: any) => unresolvedSelections[item.rowIndex])
        .map((item: any) => item.rowIndex)
    ));
  };

  const applyBulkGlobalBrand = (globalBrandId: string) => {
    if (selectedItems.size === 0) return;
    
    const newSelections = { ...unresolvedSelections };
    selectedItems.forEach(rowIndex => {
      newSelections[rowIndex] = globalBrandId;
    });
    
    setUnresolvedSelections(newSelections);
    setSelectedItems(new Set());
    toast({
      title: "Bulk Applied",
      description: `Applied global brand to ${selectedItems.size} items`
    });
  };

  const acceptAllProposals = () => {
    if (!linkerPreview) return;
    // Proposals are already in unresolvedSelections, so this is effectively a no-op
    // but we can show feedback
    const proposalCount = linkerPreview.unresolved.filter((item: any) => 
      unresolvedSelections[item.rowIndex]
    ).length;
    
    if (proposalCount > 0) {
      toast({
        title: "Proposals Accepted",
        description: `${proposalCount} proposals are ready to apply`
      });
    }
  };

  const publishLinkerChanges = () => {
    if (!linkerPreview || !linkerParsed) return;

    // Validate unresolved mappings
    const missing = (linkerPreview.unresolved as any[]).filter(u => !unresolvedSelections[u.rowIndex]);
    if (missing.length > 0) {
      toast({ title: 'Unresolved Brands', description: 'Please resolve all unresolved rows before applying.', variant: 'destructive' });
      return;
    }

    // Validate conflicts
    if ((linkerPreview.reLinked as any[]).length > 0 && !confirmRelink) {
      toast({ title: 'Confirmation Required', description: 'Please confirm re-linking conflicting items.', variant: 'destructive' });
      return;
    }

    const newConfig = { ...config };

    // Build a mutable index to update options in-place
    const optionIndex = new Map<string, { option: BrandOption }>();
    newConfig.sections.forEach(section => {
      section.options?.forEach((opt, i) => optionIndex.set(opt.id, { option: section.options![i] }));
      section.subcategories?.forEach(sub => {
        sub.options?.forEach((opt, i) => optionIndex.set(opt.id, { option: sub.options![i] }));
      });
    });

    const applyLink = (slug: string, globalId: string, rowIndex?: number) => {
      const ref = optionIndex.get(slug);
      if (!ref) return;
      ref.option.globalId = globalId;
      ref.option.isLinkedToGlobal = true;
      if (allowFieldUpdates && linkerMapping['productPlatform']) {
        const header = linkerMapping['productPlatform'];
        const colIndex = linkerParsed.headers.indexOf(header);
        if (rowIndex !== undefined && colIndex >= 0) {
          const val = linkerParsed.rows[rowIndex][colIndex];
          if (val) ref.option.name = val;
        }
      }
    };

    const applyUnlink = (slug: string) => {
      const ref = optionIndex.get(slug);
      if (!ref) return;
      ref.option.globalId = undefined;
      ref.option.isLinkedToGlobal = false;
    };

    // Apply actions
    (linkerPreview.toLink as any[]).forEach(item => applyLink(item.slug, item.to, item.rowIndex));
    (linkerPreview.unlinked as any[]).forEach(item => applyUnlink(item.slug));
    (linkerPreview.reLinked as any[]).forEach(item => {
      if (confirmRelink) applyLink(item.slug, item.to, item.rowIndex);
    });
    (linkerPreview.unresolved as any[]).forEach(item => {
      const mappedId = unresolvedSelections[item.rowIndex];
      if (mappedId) applyLink(item.slug, mappedId, item.rowIndex);
    });

    onConfigChange(newConfig);

    toast({
      title: 'Linker Applied to Draft',
      description: `Linked ${linkerPreview.toLink.length + linkerPreview.unresolved.length} • Re-linked ${linkerPreview.reLinked.length} • Unlinked ${linkerPreview.unlinked.length} • No-op ${linkerPreview.noOp.length} • Skipped ${linkerPreview.skipped.length}`
    });

    // Reset state
    setLinkerPreview(null);
    setLinkerParsed(null);
    setLinkerText('');
    setLinkerUrl('');
    setUnresolvedSelections({});
    setConfirmRelink(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            CSV / Google Sheets Importer
          </CardTitle>
          <CardDescription>
            Import catalog data and synonyms from CSV files or Google Sheets
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="catalog">Section Brands</TabsTrigger>
          <TabsTrigger value="global-brands">Global Brands</TabsTrigger>
          <TabsTrigger value="linker">Link Existing</TabsTrigger>
          <TabsTrigger value="synonyms">Synonyms</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Section Brand Import</CardTitle>
              <CardDescription>
                Import section-specific brands with global brand linking support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode Selector */}
              <div className="flex gap-2">
                <Button 
                  variant={catalogMode === 'paste' ? 'default' : 'outline'}
                  onClick={() => setCatalogMode('paste')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Paste CSV
                </Button>
                <Button 
                  variant={catalogMode === 'url' ? 'default' : 'outline'}
                  onClick={() => setCatalogMode('url')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Google Sheet URL
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCatalogText(SAMPLE_CATALOG_CSV)}
                >
                  Sample CSV
                </Button>
              </div>

              {catalogMode === 'paste' ? (
                <div className="space-y-2">
                  <Label htmlFor="catalog-csv">CSV Data</Label>
                  <Textarea
                    id="catalog-csv"
                    placeholder="Paste your CSV data here..."
                    value={catalogText}
                    onChange={(e) => setCatalogText(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="catalog-url">Google Sheet URL</Label>
                  <Input
                    id="catalog-url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={catalogUrl}
                    onChange={(e) => setCatalogUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Make sure your Google Sheet is set to "Anyone with link can view"
                  </p>
                </div>
              )}

              <Button onClick={handleCatalogParse} disabled={!catalogText && !catalogUrl}>
                Parse CSV
              </Button>

              {/* Column Mapping */}
              {catalogParsed && (
                <div className="space-y-4">
                  <Separator />
                  <h4 className="font-medium">Column Mapping</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CATALOG_REQUIRED_COLUMNS.map(reqCol => (
                      <div key={reqCol} className="space-y-2">
                        <Label className="text-sm font-medium">
                          {reqCol.charAt(0).toUpperCase() + reqCol.slice(1).replace(/([A-Z])/g, ' $1')}
                        </Label>
                        <Select 
                          value={catalogMapping[reqCol] || ''} 
                          onValueChange={(value) => 
                            setCatalogMapping(prev => ({ ...prev, [reqCol]: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {catalogParsed.headers.map(header => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  
                  <Button onClick={generateCatalogDiff} disabled={Object.keys(catalogMapping).length === 0}>
                    Generate Preview
                  </Button>
                </div>
              )}

              {/* Diff Preview */}
              {catalogDiff && (
                <div className="space-y-4">
                  <Separator />
                  <h4 className="font-medium">Import Preview</h4>
                  
                  {catalogDiff.adds.length > 0 && (
                    <Alert>
                      <CheckCircle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>{catalogDiff.adds.length} new products</strong> will be added
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {catalogDiff.updates.length > 0 && (
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>{catalogDiff.updates.length} existing products</strong> will be updated
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {catalogDiff.conflicts.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>{catalogDiff.conflicts.length} conflicts</strong> found that need resolution
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button onClick={publishCatalogChanges} className="w-full">
                    Publish to Draft
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="global-brands" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Brand Import</CardTitle>
              <CardDescription>
                Import global brand library to be reused across sections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode Selector */}
              <div className="flex gap-2">
                <Button 
                  variant={globalBrandMode === 'paste' ? 'default' : 'outline'}
                  onClick={() => setGlobalBrandMode('paste')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Paste CSV
                </Button>
                <Button 
                  variant={globalBrandMode === 'url' ? 'default' : 'outline'}
                  onClick={() => setGlobalBrandMode('url')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Google Sheet URL
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setGlobalBrandText(SAMPLE_GLOBAL_BRANDS_CSV)}
                >
                  Sample CSV
                </Button>
              </div>

              {globalBrandMode === 'paste' ? (
                <div className="space-y-2">
                  <Label htmlFor="global-brand-csv">Global Brands CSV Data</Label>
                  <Textarea
                    id="global-brand-csv"
                    placeholder="Paste your global brands CSV data here..."
                    value={globalBrandText}
                    onChange={(e) => setGlobalBrandText(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="global-brand-url">Google Sheet URL</Label>
                  <Input
                    id="global-brand-url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={globalBrandUrl}
                    onChange={(e) => setGlobalBrandUrl(e.target.value)}
                  />
                </div>
              )}

              <Button onClick={handleGlobalBrandParse} disabled={!globalBrandText && !globalBrandUrl}>
                Parse Global Brands CSV
              </Button>

              {/* Global Brand Column Mapping */}
              {globalBrandParsed && (
                <div className="space-y-4">
                  <Separator />
                  <h4 className="font-medium">Column Mapping</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {GLOBAL_BRAND_REQUIRED_COLUMNS.map(reqCol => (
                      <div key={reqCol} className="space-y-2">
                        <Label className="text-sm font-medium">
                          {reqCol.charAt(0).toUpperCase() + reqCol.slice(1).replace(/([A-Z])/g, ' $1')}
                        </Label>
                        <Select 
                          value={globalBrandMapping[reqCol] || ''} 
                          onValueChange={(value) => 
                            setGlobalBrandMapping(prev => ({ ...prev, [reqCol]: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {globalBrandParsed.headers.map(header => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  
                  <Button onClick={generateGlobalBrandDiff} disabled={Object.keys(globalBrandMapping).length === 0}>
                    Generate Preview
                  </Button>
                </div>
              )}

              {/* Global Brand Diff Preview */}
              {globalBrandDiff && (
                <div className="space-y-4">
                  <Separator />
                  <h4 className="font-medium">Global Brand Import Preview</h4>
                  
                  {globalBrandDiff.adds.length > 0 && (
                    <Alert>
                      <CheckCircle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>{globalBrandDiff.adds.length} new global brands</strong> will be added
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {globalBrandDiff.updates.length > 0 && (
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>{globalBrandDiff.updates.length} existing global brands</strong> will be updated
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {globalBrandDiff.conflicts.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>{globalBrandDiff.conflicts.length} conflicts</strong> found that need resolution
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="max-h-60 overflow-y-auto border rounded p-4 space-y-2">
                    {[...globalBrandDiff.adds, ...globalBrandDiff.updates].slice(0, 10).map((brand, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm p-2 border rounded">
                        <Badge variant="outline">{brand.id}</Badge>
                        <span className="font-medium">{brand.name}</span>
                        <Badge variant="secondary">{brand.state}</Badge>
                        {brand.assignedSections.length > 0 && (
                          <div className="flex gap-1">
                            {brand.assignedSections.map(section => (
                              <Badge key={section} variant="outline" className="text-xs">
                                {section}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {(globalBrandDiff.adds.length + globalBrandDiff.updates.length) > 10 && (
                      <p className="text-muted-foreground text-xs">
                        ... and {(globalBrandDiff.adds.length + globalBrandDiff.updates.length) - 10} more
                      </p>
                    )}
                  </div>
                  
                  <Button onClick={publishGlobalBrandChanges} className="w-full">
                    Publish Global Brands to Draft
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="linker" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Link Existing Options to Global Brands</CardTitle>
              <CardDescription>
                Bulk link existing section options to global brands without recreating them
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode Selector */}
              <div className="flex gap-2">
                <Button 
                  variant={linkerMode === 'paste' ? 'default' : 'outline'}
                  onClick={() => setLinkerMode('paste')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Paste CSV
                </Button>
                <Button 
                  variant={linkerMode === 'url' ? 'default' : 'outline'}
                  onClick={() => setLinkerMode('url')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Google Sheet URL
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLinkerText(SAMPLE_LINKER_CSV)}
                >
                  Sample CSV
                </Button>
              </div>

              {linkerMode === 'paste' ? (
                <div className="space-y-2">
                  <Label htmlFor="linker-csv">Linker CSV Data</Label>
                  <Textarea
                    id="linker-csv"
                    placeholder="Paste your linker CSV data here..."
                    value={linkerText}
                    onChange={(e) => setLinkerText(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="linker-url">Google Sheet URL</Label>
                  <Input
                    id="linker-url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={linkerUrl}
                    onChange={(e) => setLinkerUrl(e.target.value)}
                  />
                </div>
              )}

              <Button onClick={handleLinkerParse} disabled={!linkerText && !linkerUrl}>
                Parse Linker CSV
              </Button>

              {/* Column Mapping */}
              {linkerParsed && (
                <div className="space-y-4">
                  <Separator />
                  <h4 className="font-medium">Column Mapping</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {LINKER_COLUMNS.map(reqCol => (
                      <div key={reqCol} className="space-y-2">
                        <Label className="text-sm font-medium">
                          {reqCol.charAt(0).toUpperCase() + reqCol.slice(1).replace(/([A-Z])/g, ' $1')}
                        </Label>
                        <Select 
                          value={linkerMapping[reqCol] || ''} 
                          onValueChange={(value) => 
                            setLinkerMapping(prev => ({ ...prev, [reqCol]: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {linkerParsed.headers.map(header => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={generateLinkerPreview} disabled={!linkerMapping.slug}>
                      Generate Preview
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="allow-field-updates"
                        checked={allowFieldUpdates}
                        onCheckedChange={(checked) => setAllowFieldUpdates(checked === true)}
                      />
                      <Label htmlFor="allow-field-updates" className="text-sm">
                        Allow field updates
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Linker Preview */}
              {linkerPreview && (
                <div className="space-y-4">
                  <Separator />
                  <h4 className="font-medium">Link Preview</h4>
                  
                  {/* Bulk Operations Panel */}
                  <div className="space-y-4 mb-4">
                    <div className="flex gap-2">
                      <Button 
                        onClick={autofillProposals}
                        variant="outline"
                        disabled={linkerPreview.unresolved.length === 0}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Smart Autofill ({linkerPreview.unresolved.length})
                      </Button>
                      
                      <Button 
                        onClick={acceptAllProposals}
                        variant="outline"
                        disabled={linkerPreview.unresolved.filter((item: any) => unresolvedSelections[item.rowIndex]).length === 0}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept All Proposals ({linkerPreview.unresolved.filter((item: any) => unresolvedSelections[item.rowIndex]).length})
                      </Button>
                      
                      <Button 
                        onClick={publishLinkerChanges}
                        disabled={linkerPreview.toLink.length + Object.keys(unresolvedSelections).length + linkerPreview.unlinked.length === 0}
                      >
                        Apply Links ({linkerPreview.toLink.length + Object.keys(unresolvedSelections).length + linkerPreview.unlinked.length})
                      </Button>
                    </div>

                    {selectedItems.size > 0 && (
                      <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <span className="text-sm font-medium">
                          {selectedItems.size} items selected
                        </span>
                        <div className="flex gap-2 ml-auto">
                          <Select onValueChange={applyBulkGlobalBrand}>
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Apply Global Brand" />
                            </SelectTrigger>
                            <SelectContent>
                              {(config.globalBrands || []).map(brand => (
                                <SelectItem key={brand.id} value={brand.id}>
                                  {brand.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={() => setSelectedItems(new Set())}
                            variant="outline"
                            size="sm"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 text-sm">
                      <Button 
                        onClick={selectAllUnresolved}
                        variant="ghost"
                        size="sm"
                        disabled={linkerPreview.unresolved.length === 0}
                      >
                        Select All Unresolved ({linkerPreview.unresolved.length})
                      </Button>
                      <Button 
                        onClick={selectAllWithProposals}
                        variant="ghost"
                        size="sm"
                        disabled={linkerPreview.unresolved.filter((item: any) => unresolvedSelections[item.rowIndex]).length === 0}
                      >
                        Select All With Proposals ({linkerPreview.unresolved.filter((item: any) => unresolvedSelections[item.rowIndex]).length})
                      </Button>
                    </div>
                  </div>

                  {/* Results Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                      <div className="text-2xl font-bold text-green-600">{linkerPreview.toLink.length}</div>
                      <div className="text-sm text-muted-foreground">To Link</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded">
                      <div className="text-2xl font-bold text-yellow-600">{linkerPreview.reLinked.length}</div>
                      <div className="text-sm text-muted-foreground">Re-link</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded">
                      <div className="text-2xl font-bold text-red-600">{linkerPreview.unlinked.length}</div>
                      <div className="text-sm text-muted-foreground">Unlink</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-950 rounded">
                      <div className="text-2xl font-bold text-gray-600">{linkerPreview.noOp.length}</div>
                      <div className="text-sm text-muted-foreground">No Change</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded">
                      <div className="text-2xl font-bold text-orange-600">{linkerPreview.unresolved.length}</div>
                      <div className="text-sm text-muted-foreground">Unresolved</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded">
                      <div className="text-2xl font-bold text-blue-600">{linkerPreview.skipped.length}</div>
                      <div className="text-sm text-muted-foreground">Skipped</div>
                    </div>
                  </div>

                  {/* Conflicts Warning */}
                  {linkerPreview.reLinked.length > 0 && (
                    <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded">
                      <Checkbox 
                        id="confirm-relink"
                        checked={confirmRelink}
                        onCheckedChange={(checked) => setConfirmRelink(checked === true)}
                      />
                      <Label htmlFor="confirm-relink" className="text-sm">
                        Confirm re-linking {linkerPreview.reLinked.length} items with conflicts
                      </Label>
                    </div>
                  )}

                  {/* Detailed View */}
                  <div className="max-h-96 overflow-y-auto border rounded">
                    <div className="divide-y">
                      {/* Unresolved Items */}
                      {linkerPreview.unresolved.map((item: any, index: number) => (
                        <div key={`unresolved-${index}`} className="p-4 bg-orange-50 dark:bg-orange-950">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedItems.has(item.rowIndex)}
                              onCheckedChange={(checked) => {
                                const newSelected = new Set(selectedItems);
                                if (checked) {
                                  newSelected.add(item.rowIndex);
                                } else {
                                  newSelected.delete(item.rowIndex);
                                }
                                setSelectedItems(newSelected);
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">Unresolved</Badge>
                                <span className="font-mono text-sm">{item.slug}</span>
                                {item.parentBrand && (
                                  <span className="text-sm text-muted-foreground">
                                    ({item.parentBrand})
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{item.reason}</p>
                            </div>
                            <Select 
                              value={unresolvedSelections[item.rowIndex] || ''} 
                              onValueChange={(value) => setUnresolvedSelections(prev => ({ ...prev, [item.rowIndex]: value }))}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select global brand" />
                              </SelectTrigger>
                              <SelectContent>
                                {(config.globalBrands || []).map(brand => (
                                  <SelectItem key={brand.id} value={brand.id}>
                                    {brand.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}

                      {/* Other Status Items */}
                      {[
                        { items: linkerPreview.toLink, status: 'To Link', bgClass: 'bg-green-50 dark:bg-green-950' },
                        { items: linkerPreview.reLinked, status: 'Re-link', bgClass: 'bg-yellow-50 dark:bg-yellow-950' },
                        { items: linkerPreview.unlinked, status: 'Unlink', bgClass: 'bg-red-50 dark:bg-red-950' },
                        { items: linkerPreview.noOp, status: 'No Change', bgClass: 'bg-gray-50 dark:bg-gray-950' },
                        { items: linkerPreview.skipped, status: 'Skipped', bgClass: 'bg-blue-50 dark:bg-blue-950' }
                      ].map(({ items, status, bgClass }) => 
                        items.map((item: any, index: number) => (
                          <div key={`${status}-${index}`} className={`p-4 ${bgClass}`}>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{status}</Badge>
                              <span className="font-mono text-sm">{item.slug}</span>
                              {item.to && (
                                <span className="text-sm text-muted-foreground">
                                  → {(config.globalBrands || []).find(b => b.id === item.to)?.name || item.to}
                                </span>
                              )}
                              {item.from && item.to && (
                                <span className="text-sm text-muted-foreground">
                                  {(config.globalBrands || []).find(b => b.id === item.from)?.name || item.from} → {(config.globalBrands || []).find(b => b.id === item.to)?.name || item.to}
                                </span>
                              )}
                              {item.reason && (
                                <span className="text-sm text-muted-foreground">
                                  ({item.reason})
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="synonyms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Synonym Map Import</CardTitle>
              <CardDescription>
                Import synonym mappings for better product matching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode Selector */}
              <div className="flex gap-2">
                <Button 
                  variant={synonymMode === 'paste' ? 'default' : 'outline'}
                  onClick={() => setSynonymMode('paste')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Paste CSV
                </Button>
                <Button 
                  variant={synonymMode === 'url' ? 'default' : 'outline'}
                  onClick={() => setSynonymMode('url')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Google Sheet URL
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSynonymText(SAMPLE_SYNONYM_CSV)}
                >
                  Sample CSV
                </Button>
              </div>

              {synonymMode === 'paste' ? (
                <div className="space-y-2">
                  <Label htmlFor="synonym-csv">Synonym CSV Data</Label>
                  <Textarea
                    id="synonym-csv"
                    placeholder="Paste your synonym CSV data here..."
                    value={synonymText}
                    onChange={(e) => setSynonymText(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="synonym-url">Google Sheet URL</Label>
                  <Input
                    id="synonym-url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={synonymUrl}
                    onChange={(e) => setSynonymUrl(e.target.value)}
                  />
                </div>
              )}

              <Button onClick={handleSynonymParse} disabled={!synonymText && !synonymUrl}>
                Parse Synonym CSV
              </Button>

              {/* Synonym Column Mapping */}
              {synonymParsed && (
                <div className="space-y-4">
                  <Separator />
                  <h4 className="font-medium">Column Mapping</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SYNONYM_REQUIRED_COLUMNS.map(reqCol => (
                      <div key={reqCol} className="space-y-2">
                        <Label className="text-sm font-medium">
                          {reqCol.charAt(0).toUpperCase() + reqCol.slice(1).replace(/([A-Z])/g, ' $1')}
                        </Label>
                        <Select 
                          value={synonymMapping[reqCol] || ''} 
                          onValueChange={(value) => 
                            setSynonymMapping(prev => ({ ...prev, [reqCol]: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {synonymParsed.headers.map(header => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  
                  <Button onClick={generateSynonymDiff} disabled={Object.keys(synonymMapping).length === 0}>
                    Generate Preview
                  </Button>
                </div>
              )}

              {/* Synonym Diff Preview */}
              {synonymDiff.length > 0 && (
                <div className="space-y-4">
                  <Separator />
                  <h4 className="font-medium">Synonym Import Preview</h4>
                  
                  <Alert>
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      <strong>{synonymDiff.length} synonym mappings</strong> will be added
                    </AlertDescription>
                  </Alert>
                  
                  <div className="max-h-60 overflow-y-auto border rounded p-4 space-y-2">
                    {synonymDiff.slice(0, 10).map((entry, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{entry.synonym}</Badge>
                        <span>→</span>
                        <span className="font-medium">{entry.canonicalName}</span>
                        <Badge variant="secondary">{entry.targetSlug}</Badge>
                      </div>
                    ))}
                    {synonymDiff.length > 10 && (
                      <p className="text-muted-foreground text-xs">
                        ... and {synonymDiff.length - 10} more
                      </p>
                    )}
                  </div>
                  
                  <Button onClick={publishSynonymChanges} className="w-full">
                    Publish Synonyms to Draft
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};