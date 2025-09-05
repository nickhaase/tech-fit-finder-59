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
import { AppConfig, BrandOption, ConfigSection, GlobalBrand } from '@/types/config';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertCircle, CheckCircle, Download, ExternalLink } from 'lucide-react';

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
    if (!catalogDiff || !catalogParsed) return;
    
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
    if (!globalBrandDiff) return;
    
    const newConfig = { ...config };
    
    // Initialize global brands array if it doesn't exist
    if (!newConfig.globalBrands) {
      newConfig.globalBrands = [];
    }
    
    // Apply additions and updates
    [...globalBrandDiff.adds, ...globalBrandDiff.updates].forEach(importBrand => {
      const globalBrand: GlobalBrand = {
        id: importBrand.id,
        name: importBrand.name,
        logo: importBrand.logo,
        synonyms: importBrand.synonyms,
        state: importBrand.state,
        assignedSections: importBrand.assignedSections,
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalog">Section Brands</TabsTrigger>
          <TabsTrigger value="global-brands">Global Brands</TabsTrigger>
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