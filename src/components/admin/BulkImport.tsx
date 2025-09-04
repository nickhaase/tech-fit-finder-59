import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AppConfig } from '@/types/config';
import { Upload, Download, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkImportProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

export const BulkImport = ({ config, onConfigChange }: BulkImportProps) => {
  const [importData, setImportData] = useState('');
  const [previewChanges, setPreviewChanges] = useState<any>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (file.name.endsWith('.json')) {
          setImportData(content);
        } else if (file.name.endsWith('.csv')) {
          // Convert CSV to JSON format
          const lines = content.split('\n');
          const headers = lines[0].split(',');
          const jsonData = lines.slice(1).map(line => {
            const values = line.split(',');
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header.trim()] = values[index]?.trim();
            });
            return obj;
          });
          setImportData(JSON.stringify(jsonData, null, 2));
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePreview = () => {
    try {
      const data = JSON.parse(importData);
      
      // Analyze changes
      const changes = {
        additions: [],
        updates: [],
        errors: []
      };

      if (Array.isArray(data)) {
        // CSV format - array of brand objects
        data.forEach((item: any, index: number) => {
          if (!item.section || !item.name) {
            changes.errors.push(`Row ${index + 1}: Missing required fields (section, name)`);
            return;
          }
          
          // Find if brand exists
          const section = config.sections.find(s => s.id === item.section);
          if (!section) {
            changes.errors.push(`Row ${index + 1}: Section "${item.section}" not found`);
            return;
          }
          
          const existingBrand = section.options?.find(o => o.id === item.id || o.name === item.name);
          if (existingBrand) {
            changes.updates.push({
              section: item.section,
              brand: item.name,
              changes: ['logo', 'synonyms', 'state'].filter(field => item[field] !== undefined)
            });
          } else {
            changes.additions.push({
              section: item.section,
              brand: item.name
            });
          }
        });
      } else {
        // Full config format
        if (data.schemaVersion && data.sections) {
          changes.updates.push({
            type: 'Full configuration replacement',
            sections: data.sections.length
          });
        } else {
          changes.errors.push('Invalid configuration format');
        }
      }

      setPreviewChanges(changes);
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Invalid JSON format",
        variant: "destructive"
      });
    }
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importData);
      
      if (Array.isArray(data)) {
        // CSV format - merge with existing config
        const updatedConfig = { ...config };
        
        data.forEach((item: any) => {
          const section = updatedConfig.sections.find(s => s.id === item.section);
          if (section) {
            const existingIndex = section.options?.findIndex(o => o.id === item.id || o.name === item.name);
            
            const brandOption = {
              id: item.id || item.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
              name: item.name,
              logo: item.logo || '',
              synonyms: item.synonyms ? item.synonyms.split(';').map((s: string) => s.trim()) : [],
              state: item.state || 'active'
            };

            if (existingIndex !== undefined && existingIndex >= 0) {
              section.options![existingIndex] = brandOption;
            } else {
              if (!section.options) section.options = [];
              section.options.push(brandOption);
            }
          }
        });
        
        onConfigChange(updatedConfig);
      } else {
        // Full config replacement
        onConfigChange(data);
      }

      setImportData('');
      setPreviewChanges(null);
      
      toast({
        title: "Import Successful",
        description: "Configuration has been updated with imported data."
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import configuration",
        variant: "destructive"
      });
    }
  };

  const generateCSVTemplate = () => {
    const csvContent = `section,subcategory,name,id,logo,synonyms,state
erp,,Custom ERP,custom_erp,https://example.com/logo.png,ERP System;Custom,active
sensors_monitoring,condition_monitoring,Custom Sensor,custom_sensor,,Sensor;Monitoring,active`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mx-brands-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Import
          </CardTitle>
          <CardDescription>
            Import brands from CSV or JSON files. CSV format allows adding/updating individual brands, while JSON allows full configuration replacement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
                id="bulk-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('bulk-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </div>
            <Button variant="outline" onClick={generateCSVTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download CSV Template
            </Button>
          </div>

          <div>
            <Textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste JSON configuration or CSV data here..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview} disabled={!importData}>
              Preview Changes
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!importData || (previewChanges && previewChanges.errors.length > 0)}
            >
              Import Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {previewChanges && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Import Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {previewChanges.errors.length > 0 && (
                <div className="p-3 border border-destructive rounded-lg">
                  <h4 className="font-medium text-destructive mb-2">Errors ({previewChanges.errors.length})</h4>
                  <ul className="text-sm space-y-1">
                    {previewChanges.errors.map((error: string, index: number) => (
                      <li key={index} className="text-destructive">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {previewChanges.additions.length > 0 && (
                <div className="p-3 border border-green-500 rounded-lg">
                  <h4 className="font-medium text-green-700 mb-2">New Brands ({previewChanges.additions.length})</h4>
                  <ul className="text-sm space-y-1">
                    {previewChanges.additions.map((addition: any, index: number) => (
                      <li key={index} className="text-green-700">
                        • {addition.brand} → {addition.section}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {previewChanges.updates.length > 0 && (
                <div className="p-3 border border-blue-500 rounded-lg">
                  <h4 className="font-medium text-blue-700 mb-2">Updates ({previewChanges.updates.length})</h4>
                  <ul className="text-sm space-y-1">
                    {previewChanges.updates.map((update: any, index: number) => (
                      <li key={index} className="text-blue-700">
                        • {update.brand || 'Configuration'} {update.changes ? `(${update.changes.join(', ')})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};