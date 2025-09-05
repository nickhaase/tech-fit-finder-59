import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AppConfig, GlobalBrand, ConfigSection } from '@/types/config';
import { 
  Plus, Edit, Trash2, Upload, Image as ImageIcon, Search, 
  Filter, Globe, Settings, ArrowRight 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/utils/imageUtils';

interface GlobalBrandManagerProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

export const GlobalBrandManager = ({ config, onConfigChange }: GlobalBrandManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterState, setFilterState] = useState<string>('all');
  const [editingBrand, setEditingBrand] = useState<GlobalBrand | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Initialize global brands if not present
  const globalBrands = config.globalBrands || [];

  // Get all section options for filtering
  const allSections = useMemo(() => {
    const sections: { id: string; label: string }[] = [];
    config.sections.forEach(section => {
      sections.push({ id: section.id, label: section.label });
      if (section.subcategories) {
        section.subcategories.forEach(sub => {
          sections.push({ id: sub.id, label: `${section.label} > ${sub.label}` });
        });
      }
    });
    return sections;
  }, [config.sections]);

  // Filter brands based on search and filters
  const filteredBrands = useMemo(() => {
    return globalBrands.filter(brand => {
      const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           brand.synonyms.some(syn => syn.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSection = filterSection === 'all' || 
                            brand.assignedSections.includes(filterSection) ||
                            (filterSection === 'unassigned' && brand.assignedSections.length === 0);
      
      const matchesState = filterState === 'all' || brand.state === filterState;
      
      return matchesSearch && matchesSection && matchesState;
    });
  }, [globalBrands, searchTerm, filterSection, filterState]);

  const createNewBrand = (): GlobalBrand => ({
    id: '',
    name: '',
    logo: '',
    synonyms: [],
    state: 'active',
    assignedSections: [],
    sectionSpecificMeta: {}
  });

  const handleCreateBrand = () => {
    setEditingBrand(createNewBrand());
    setIsCreating(true);
  };

  const handleEditBrand = (brand: GlobalBrand) => {
    setEditingBrand({ ...brand });
    setIsCreating(false);
  };

  const handleSaveBrand = () => {
    if (!editingBrand) return;

    // Generate ID if creating new
    if (isCreating && !editingBrand.id) {
      editingBrand.id = editingBrand.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    }

    const updatedConfig = { ...config };
    if (!updatedConfig.globalBrands) {
      updatedConfig.globalBrands = [];
    }

    if (isCreating) {
      updatedConfig.globalBrands.push(editingBrand);
    } else {
      const index = updatedConfig.globalBrands.findIndex(b => b.id === editingBrand.id);
      if (index >= 0) {
        updatedConfig.globalBrands[index] = editingBrand;
      }
    }

    onConfigChange(updatedConfig);
    setEditingBrand(null);
    setIsCreating(false);
    
    toast({
      title: isCreating ? "Brand Created" : "Brand Updated",
      description: `${editingBrand.name} has been ${isCreating ? 'created' : 'updated'}.`
    });
  };

  const handleDeleteBrand = (brandId: string) => {
    const updatedConfig = { ...config };
    updatedConfig.globalBrands = updatedConfig.globalBrands?.filter(b => b.id !== brandId) || [];
    onConfigChange(updatedConfig);
    
    toast({
      title: "Brand Deleted",
      description: "The brand has been removed from the global library."
    });
  };

  const handleSectionToggle = (sectionId: string, checked: boolean) => {
    if (!editingBrand) return;
    
    const newAssignedSections = checked 
      ? [...editingBrand.assignedSections, sectionId]
      : editingBrand.assignedSections.filter(id => id !== sectionId);
    
    setEditingBrand({
      ...editingBrand,
      assignedSections: newAssignedSections
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingBrand) {
      try {
        if (file.size > 2 * 1024 * 1024) {
          toast({
            title: "File Too Large",
            description: "Please select an image smaller than 2MB.",
            variant: "destructive"
          });
          return;
        }

        const compressedImage = await compressImage(file);
        setEditingBrand({
          ...editingBrand,
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
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Global Brand Library
          </CardTitle>
          <CardDescription>
            Manage all brands in one place. Assign brands to multiple sections without duplicating logos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="default">
                {filteredBrands.length} brands
              </Badge>
              <span className="text-sm text-muted-foreground">
                {globalBrands.filter(b => b.assignedSections.length === 0).length} unassigned
              </span>
            </div>
            <Button onClick={handleCreateBrand}>
              <Plus className="w-4 h-4 mr-2" />
              Add Brand
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search brands..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="section-filter">Section</Label>
              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {allSections.map(section => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="state-filter">State</Label>
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setFilterSection('all');
                setFilterState('all');
              }}>
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brands List */}
      <Card>
        <CardHeader>
          <CardTitle>Brands ({filteredBrands.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30"
              >
                <div className="flex items-center gap-4">
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{brand.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>{brand.assignedSections.length} sections</span>
                      {brand.synonyms.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{brand.synonyms.length} synonyms</span>
                        </>
                      )}
                    </div>
                    {brand.assignedSections.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {brand.assignedSections.slice(0, 3).map(sectionId => {
                          const section = allSections.find(s => s.id === sectionId);
                          return section ? (
                            <Badge key={sectionId} variant="outline" className="text-xs">
                              {section.label}
                            </Badge>
                          ) : null;
                        })}
                        {brand.assignedSections.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{brand.assignedSections.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStateBadgeVariant(brand.state)}>
                    {brand.state}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditBrand(brand)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteBrand(brand.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredBrands.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No brands found matching your filters.</p>
                <p className="text-sm">Try adjusting your search or create a new brand.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingBrand && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {isCreating ? 'Create Global Brand' : 'Edit Global Brand'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Brand Name</Label>
                <Input
                  id="name"
                  value={editingBrand.name}
                  onChange={(e) => setEditingBrand({
                    ...editingBrand,
                    name: e.target.value
                  })}
                  placeholder="Brand name"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Select
                  value={editingBrand.state}
                  onValueChange={(value: 'active' | 'deprecated' | 'hidden') =>
                    setEditingBrand({ ...editingBrand, state: value })
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

            {/* Logo */}
            <div>
              <Label htmlFor="logo">Logo</Label>
              <div className="flex items-center gap-4">
                {editingBrand.logo && (
                  <img
                    src={editingBrand.logo}
                    alt="Logo preview"
                    className="w-16 h-16 object-contain border rounded"
                  />
                )}
                <div className="flex-1">
                  <Input
                    id="logo"
                    value={editingBrand.logo || ''}
                    onChange={(e) => setEditingBrand({
                      ...editingBrand,
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

            {/* Synonyms */}
            <div>
              <Label htmlFor="synonyms">Synonyms</Label>
              <Textarea
                id="synonyms"
                value={editingBrand.synonyms.join(', ')}
                onChange={(e) => setEditingBrand({
                  ...editingBrand,
                  synonyms: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                placeholder="Common names, separated by commas"
                rows={2}
              />
            </div>

            {/* Section Assignment */}
            <div>
              <Label>Assign to Sections</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                {allSections.map(section => (
                  <div key={section.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={section.id}
                      checked={editingBrand.assignedSections.includes(section.id)}
                      onCheckedChange={(checked) => handleSectionToggle(section.id, checked as boolean)}
                    />
                    <Label 
                      htmlFor={section.id} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {section.label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Selected sections: {editingBrand.assignedSections.length}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingBrand(null);
                  setIsCreating(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveBrand}>
                {isCreating ? 'Create Brand' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};