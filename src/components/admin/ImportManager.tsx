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
import { AppConfig, BrandOption, ConfigSection } from '@/types/config';
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

const SAMPLE_CATALOG_CSV = `Section,Subsection,Parent Brand,Product / Platform,Slug,Logo,Synonyms,Cross-Listed,Protocols,Objects,Notes,State
Automation & SCADA,SCADA Systems,Inductive Automation,Ignition,ignition,/assets/logos/ignition.svg,Ignition SCADA|IA Ignition,Data & Analytics.Historians / Time-Series,OPC UA|MQTT|REST,,SCADA + Historian roles,active
Data & Analytics,Historians / Time-Series,AVEVA,PI System (formerly OSIsoft),pi-system,/assets/logos/pi-system.svg,OSIsoft|PI,,OPC|MQTT|File,,Industrial historian,active
ERP Systems,ERP Systems,SAP,S/4HANA,sap-s4hana,/assets/logos/sap-s4hana.svg,SAP ERP|ECC,,OData|REST|SFTP/CSV,workOrders|assets|parts|vendors|costs|users,Flagship ERP,active`;

const SAMPLE_SYNONYM_CSV = `Synonym,Canonical Name (Product / Platform),Target Slug,Type,Notes
Wonderware,System Platform (Wonderware),system-platform-wonderware,product,Brand legacy name
ECC,S/4HANA,sap-s4hana,product,Legacy SAP term
Confluent Kafka,Apache Kafka / Confluent Platform,apache-kafka-confluent-platform,product,Streaming alias
Kepware,KEPServerEX,kepserverex,product,Common short name
AB ControlLogix,Allen-Bradley ControlLogix / CompactLogix,allen-bradley-controllogix-compactlogix,product,PLC family alias`;

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
  'state'
];

const SYNONYM_REQUIRED_COLUMNS = [
  'synonym',
  'canonicalName',
  'targetSlug',
  'type',
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
    if (!catalogDiff) return;
    
    const newConfig = { ...config };
    
    // Apply additions and updates
    [...catalogDiff.adds, ...catalogDiff.updates].forEach(brand => {
      // Implementation would go here to add/update brands in sections
      // This is a complex operation that would need to handle cross-listing
    });
    
    onConfigChange(newConfig);
    
    toast({
      title: "Catalog Imported",
      description: `Added ${catalogDiff.adds.length} brands, updated ${catalogDiff.updates.length}`
    });
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="catalog">Catalog Import</TabsTrigger>
          <TabsTrigger value="synonyms">Synonym Map Import</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Catalog Data Import</CardTitle>
              <CardDescription>
                Import products, brands, and cross-listing information
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