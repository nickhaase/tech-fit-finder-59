import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfigSection, BrandOption, AppConfig } from '@/types/config';
import { Plus, Edit, Trash2, Upload, Image as ImageIcon, Globe, Link, Unlink, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/utils/imageUtils';
import { BrandSelector } from './BrandSelector';
import { ConfigService } from '@/services/configService';

interface OptionManagerProps {
  section: ConfigSection;
  onSectionUpdate: (section: ConfigSection) => void;
  config: AppConfig;
  onConfigUpdate: (config: AppConfig) => void;
  subcategoryId?: string; // For subcategory options
}

export const OptionManager = ({ 
  section, 
  onSectionUpdate, 
  config, 
  onConfigUpdate, 
  subcategoryId 
}: OptionManagerProps) => {
  const [editingOption, setEditingOption] = useState<BrandOption | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showBrandSelector, setShowBrandSelector] = useState(false);
  const { toast } = useToast();

  const globalBrands = config.globalBrands || [];

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

  const handleLinkToGlobalBrand = (brandId: string) => {
    if (!editingOption) return;
    
    const updatedConfig = ConfigService.linkOptionToGlobalBrand(
      config, 
      section.id, 
      subcategoryId || null, 
      editingOption.id, 
      brandId
    );
    
    const globalBrand = globalBrands.find(b => b.id === brandId);
    if (globalBrand) {
      setEditingOption({
        ...editingOption,
        globalId: brandId,
        isLinkedToGlobal: true,
        name: globalBrand.name,
        logo: globalBrand.logo,
        synonyms: globalBrand.synonyms,
        state: globalBrand.state
      });
    }
    
    onConfigUpdate(updatedConfig);
    
    toast({
      title: "Linked to Global Brand",
      description: `${editingOption.name} is now linked to the global brand library.`
    });
  };

  const handleUnlinkFromGlobalBrand = () => {
    if (!editingOption) return;
    
    const updatedConfig = ConfigService.unlinkOptionFromGlobalBrand(
      config, 
      section.id, 
      subcategoryId || null, 
      editingOption.id
    );
    
    setEditingOption({
      ...editingOption,
      globalId: undefined,
      isLinkedToGlobal: false
    });
    
    onConfigUpdate(updatedConfig);
    
    toast({
      title: "Unlinked from Global Brand",
      description: `${editingOption.name} is now independent of the global brand library.`
    });
  };

  const handleCreateGlobalBrand = () => {
    if (!editingOption) return;
    
    const updatedConfig = ConfigService.createGlobalBrandFromOption(
      config, 
      section.id, 
      subcategoryId || null, 
      editingOption.id
    );
    
    onConfigUpdate(updatedConfig);
    
    toast({
      title: "Global Brand Created",
      description: `${editingOption.name} has been added to the global brand library.`
    });
  };

  const getLinkedGlobalBrand = (option: BrandOption) => {
    if (!option.globalId) return null;
    return globalBrands.find(b => b.id === option.globalId);
  };

  const checkForDuplicateBrands = (optionName: string) => {
    return globalBrands.filter(brand => 
      brand.name.toLowerCase() === optionName.toLowerCase()
    );
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


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingOption) {
      try {
        // Check file size (limit to 2MB before compression)
        if (file.size > 2 * 1024 * 1024) {
          toast({
            title: "File Too Large",
            description: "Please select an image smaller than 2MB.",
            variant: "destructive"
          });
          return;
        }

        const compressedImage = await compressImage(file);
        setEditingOption({
          ...editingOption,
          logo: compressedImage
        });
        
        toast({
          title: "Image Uploaded",
          description: "Image has been compressed and optimized for storage."
        });
      } catch (error) {
        console.error('Image upload failed:', error);
        toast({
          title: "Upload Failed",
          description: "Failed to process the image. Please try again.",
          variant: "destructive"
        });
      }
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
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.name}</span>
                      {option.isLinkedToGlobal && (
                        <Badge variant="outline" className="text-xs">
                          <Globe className="w-3 h-3 mr-1" />
                          Global
                        </Badge>
                      )}
                    </div>
                    {option.synonyms.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Synonyms: {option.synonyms.join(', ')}
                      </div>
                    )}
                    {option.isLinkedToGlobal && (
                      <div className="text-xs text-muted-foreground">
                        Synced with global brand library
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
            {/* Global Brand Connection */}
            {editingOption && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <Label className="text-sm font-medium">Global Brand Connection</Label>
                  </div>
                  {editingOption.isLinkedToGlobal && (
                    <Badge variant="outline" className="text-xs">
                      <Link className="w-3 h-3 mr-1" />
                      Linked
                    </Badge>
                  )}
                </div>
                
                {editingOption.isLinkedToGlobal ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      This option is linked to a global brand. Core information (name, logo, synonyms) will sync automatically.
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBrandSelector(true)}
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Change Global Brand
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUnlinkFromGlobalBrand}
                      >
                        <Unlink className="w-4 h-4 mr-2" />
                        Unlink
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Link to a global brand for consistent logos and naming across sections.
                    </div>
                    {checkForDuplicateBrands(editingOption.name || '').length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        Similar global brands found: {checkForDuplicateBrands(editingOption.name || '').map(b => b.name).join(', ')}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBrandSelector(true)}
                      >
                        <Link className="w-4 h-4 mr-2" />
                        Link Existing Global Brand
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCreateGlobalBrand}
                        disabled={!editingOption.name}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Global Brand
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                  disabled={editingOption.isLinkedToGlobal}
                />
                {editingOption.isLinkedToGlobal && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Name synced from global brand
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Select
                  value={editingOption.state}
                  onValueChange={(value: 'active' | 'deprecated' | 'hidden') =>
                    setEditingOption({ ...editingOption, state: value })
                  }
                  disabled={editingOption.isLinkedToGlobal}
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
                {editingOption.isLinkedToGlobal && (
                  <div className="text-xs text-muted-foreground mt-1">
                    State synced from global brand
                  </div>
                )}
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
                    disabled={editingOption.isLinkedToGlobal}
                  />
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="logo-upload"
                    disabled={editingOption.isLinkedToGlobal}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={editingOption.isLinkedToGlobal}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
              {editingOption.isLinkedToGlobal && (
                <div className="text-xs text-muted-foreground mt-1">
                  Logo synced from global brand
                </div>
              )}
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
                disabled={editingOption.isLinkedToGlobal}
              />
              {editingOption.isLinkedToGlobal && (
                <div className="text-xs text-muted-foreground mt-1">
                  Synonyms synced from global brand
                </div>
              )}
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

      {/* Brand Selector Modal */}
      <BrandSelector
        isOpen={showBrandSelector}
        onClose={() => setShowBrandSelector(false)}
        globalBrands={globalBrands}
        onSelectBrand={handleLinkToGlobalBrand}
        currentLinkedBrandId={editingOption?.globalId}
      />
    </div>
  );
};