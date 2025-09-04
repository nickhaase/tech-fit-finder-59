import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppConfig } from '@/types/config';
import { Plus, Trash2, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SynonymManagerProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

export const SynonymManager = ({ config, onConfigChange }: SynonymManagerProps) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const { toast } = useToast();

  const handleAddSynonym = () => {
    if (!newKey.trim() || !newValue.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both a synonym and canonical name.",
        variant: "destructive"
      });
      return;
    }

    const updatedConfig = {
      ...config,
      synonymMap: {
        ...config.synonymMap,
        [newKey.trim()]: newValue.trim()
      }
    };

    onConfigChange(updatedConfig);
    setNewKey('');
    setNewValue('');
    
    toast({
      title: "Synonym Added",
      description: `"${newKey}" will now map to "${newValue}"`
    });
  };

  const handleDeleteSynonym = (key: string) => {
    const updatedConfig = { ...config };
    delete updatedConfig.synonymMap[key];
    onConfigChange(updatedConfig);
    
    toast({
      title: "Synonym Removed",
      description: `Mapping for "${key}" has been removed.`
    });
  };

  const handleUpdateSynonym = (oldKey: string, newKey: string, newValue: string) => {
    const updatedConfig = { ...config };
    delete updatedConfig.synonymMap[oldKey];
    updatedConfig.synonymMap[newKey] = newValue;
    onConfigChange(updatedConfig);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Synonym Management
          </CardTitle>
          <CardDescription>
            Map alternative names to canonical brand names. This helps users find brands even when they use different terminology.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="synonym">Alternative Name</Label>
              <Input
                id="synonym"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g., Wonderware"
              />
            </div>
            <div>
              <Label htmlFor="canonical">Canonical Name</Label>
              <Input
                id="canonical"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="e.g., AVEVA/Wonderware"
              />
            </div>
          </div>
          <Button onClick={handleAddSynonym} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Synonym Mapping
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Synonyms</CardTitle>
          <CardDescription>
            {Object.keys(config.synonymMap).length} synonym mappings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(config.synonymMap).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(config.synonymMap).map(([key, value]) => (
                <SynonymRow
                  key={key}
                  originalKey={key}
                  synonym={key}
                  canonical={value}
                  onUpdate={handleUpdateSynonym}
                  onDelete={handleDeleteSynonym}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No synonym mappings yet.</p>
              <p className="text-sm">Add your first mapping above to help users find brands more easily.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface SynonymRowProps {
  originalKey: string;
  synonym: string;
  canonical: string;
  onUpdate: (oldKey: string, newKey: string, newValue: string) => void;
  onDelete: (key: string) => void;
}

const SynonymRow = ({ originalKey, synonym, canonical, onUpdate, onDelete }: SynonymRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editKey, setEditKey] = useState(synonym);
  const [editValue, setEditValue] = useState(canonical);

  const handleSave = () => {
    onUpdate(originalKey, editKey, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditKey(synonym);
    setEditValue(canonical);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-3 border rounded-lg">
        <Input
          value={editKey}
          onChange={(e) => setEditKey(e.target.value)}
          className="flex-1"
        />
        <span className="text-muted-foreground">→</span>
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-1">
          <Button size="sm" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{synonym}</span>
        <span className="text-muted-foreground">→</span>
        <span className="font-medium">{canonical}</span>
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDelete(originalKey)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};