import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfigSection, BrandOption } from '@/types/config';
import { Plus, Edit, Trash2, Upload, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OptionManagerProps {
  section: ConfigSection;
  onSectionUpdate: (section: ConfigSection) => void;
}

export const OptionManager = ({ section, onSectionUpdate }: OptionManagerProps) => {
  const [editingOption, setEditingOption] = useState<BrandOption | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createNewOption = (): BrandOption => ({
    id: '',
    name: '',
    logo: '',
    synonyms: [],
    state: 'active'
  });

  const handleCreateOption = () => {
    setEditingOption(createNewOption());
    setIsCreating(true);
  };

  const handleEditOption = (option: BrandOption) => {
    setEditingOption({ ...option });
    setIsCreating(false);
  };

  const handleSaveOption = () => {
    if (!editingOption) return;

    // Generate ID if creating new
    if (isCreating && !editingOption.id) {
      editingOption.id = editingOption.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    }

    const updatedSection = { ...section };
    if (!updatedSection.options) {
      updatedSection.options = [];
    }

    if (isCreating) {
      updatedSection.options.push(editingOption);
    } else {
      const index = updatedSection.options.findIndex(o => o.id === editingOption.id);
      if (index >= 0) {
        updatedSection.options[index] = editingOption;
      }
    }

    onSectionUpdate(updatedSection);
    setEditingOption(null);
    setIsCreating(false);
    
    toast({
      title: isCreating ? "Option Created" : "Option Updated",
      description: `${editingOption.name} has been ${isCreating ? 'created' : 'updated'}.`
    });
  };

  const handleDeleteOption = (optionId: string) => {
    const updatedSection = { ...section };
    updatedSection.options = updatedSection.options?.filter(o => o.id !== optionId) || [];
    onSectionUpdate(updatedSection);
    
    toast({
      title: "Option Deleted",
      description: "The option has been removed."
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingOption) {
      // In a real app, this would upload to a storage service
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditingOption({
          ...editingOption,
          logo: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const getStateBadgeVariant = (state: string) => {
    switch (state) {
      case 'active': return 'default';
      case 'deprecated': return 'secondary';
      case 'hidden': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <Card>
        <CardHeader>
          <CardTitle>{section.label}</CardTitle>
          <CardDescription>{section.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={section.multi ? "default" : "outline"}>
                {section.multi ? "Multi-select" : "Single-select"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {section.options?.length || 0} options
              </span>
            </div>
            <Button onClick={handleCreateOption}>
              <Plus className="w-4 h-4 mr-2" />
              Add Option
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Options List */}
      <Card>
        <CardHeader>
          <CardTitle>Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {section.options?.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {option.logo ? (
                    <img
                      src={option.logo}
                      alt={option.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      <Image className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{option.name}</div>
                    {option.synonyms.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Synonyms: {option.synonyms.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStateBadgeVariant(option.state)}>
                    {option.state}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditOption(option)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteOption(option.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-muted-foreground">
                No options yet. Add your first option above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingOption && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isCreating ? 'Create Option' : 'Edit Option'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editingOption.name}
                  onChange={(e) => setEditingOption({
                    ...editingOption,
                    name: e.target.value
                  })}
                  placeholder="Brand name"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Select
                  value={editingOption.state}
                  onValueChange={(value: 'active' | 'deprecated' | 'hidden') =>
                    setEditingOption({ ...editingOption, state: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="logo">Logo</Label>
              <div className="flex items-center gap-4">
                {editingOption.logo && (
                  <img
                    src={editingOption.logo}
                    alt="Logo preview"
                    className="w-12 h-12 object-contain border rounded"
                  />
                )}
                <div className="flex-1">
                  <Input
                    id="logo"
                    value={editingOption.logo || ''}
                    onChange={(e) => setEditingOption({
                      ...editingOption,
                      logo: e.target.value
                    })}
                    placeholder="Logo URL or upload below"
                  />
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="synonyms">Synonyms</Label>
              <Textarea
                id="synonyms"
                value={editingOption.synonyms.join(', ')}
                onChange={(e) => setEditingOption({
                  ...editingOption,
                  synonyms: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                placeholder="Common names, separated by commas"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingOption(null);
                  setIsCreating(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveOption}>
                {isCreating ? 'Create' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};