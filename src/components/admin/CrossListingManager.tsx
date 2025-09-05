import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AppConfig, BrandOption } from '@/types/config';
import { Search, Share2, Link2, ArrowRight } from 'lucide-react';

interface CrossListingManagerProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

export const CrossListingManager = ({ config, onConfigChange }: CrossListingManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<(BrandOption & { currentSections: string[] }) | null>(null);

  // Get all brands with their current sections
  const getAllBrands = (): (BrandOption & { currentSections: string[] })[] => {
    const brands: (BrandOption & { currentSections: string[] })[] = [];
    
    config.sections.forEach(section => {
      section.options?.forEach(option => {
        const existing = brands.find(b => b.id === option.id);
        if (existing) {
          existing.currentSections.push(`${section.id}`);
        } else {
          brands.push({
            ...option,
            currentSections: [`${section.id}`]
          });
        }
      });
      
      section.subcategories?.forEach(sub => {
        sub.options?.forEach(option => {
          const existing = brands.find(b => b.id === option.id);
          if (existing) {
            existing.currentSections.push(`${section.id}.${sub.id}`);
          } else {
            brands.push({
              ...option,
              currentSections: [`${section.id}.${sub.id}`]
            });
          }
        });
      });
    });
    
    return brands;
  };

  const filteredBrands = getAllBrands().filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.synonyms.some(synonym => synonym.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get cross-listed brands (appearing in multiple sections)
  const crossListedBrands = filteredBrands.filter(brand => brand.currentSections.length > 1);

  // Get all available sections for assignment
  const getAllSections = () => {
    const sections: { id: string; label: string; path: string }[] = [];
    
    config.sections.forEach(section => {
      if (section.options?.length > 0) {
        sections.push({
          id: section.id,
          label: section.label,
          path: section.id
        });
      }
      
      section.subcategories?.forEach(sub => {
        sections.push({
          id: `${section.id}.${sub.id}`,
          label: `${section.label} → ${sub.label}`,
          path: `${section.id}.${sub.id}`
        });
      });
    });
    
    return sections;
  };

  const updateBrandAssignments = (brandId: string, newSections: string[]) => {
    const newConfig = { ...config };
    
    // Remove brand from all current locations
    newConfig.sections.forEach(section => {
      section.options = section.options?.filter(opt => opt.id !== brandId) || [];
      section.subcategories?.forEach(sub => {
        sub.options = sub.options?.filter(opt => opt.id !== brandId) || [];
      });
    });
    
    // Find the brand data
    const brandData = getAllBrands().find(b => b.id === brandId);
    if (!brandData) return;
    
    // Add brand to new sections
    newSections.forEach(sectionPath => {
      const [sectionId, subcategoryId] = sectionPath.split('.');
      const section = newConfig.sections.find(s => s.id === sectionId);
      
      if (section) {
        const brandOption = {
          ...brandData,
          categories: newSections, // Update cross-listing info
          meta: {
            ...brandData.meta,
            crossListed: newSections.length > 1
          }
        };
        
        if (subcategoryId) {
          const subcategory = section.subcategories?.find(sub => sub.id === subcategoryId);
          if (subcategory) {
            subcategory.options.push(brandOption);
          }
        } else {
          section.options.push(brandOption);
        }
      }
    });
    
    onConfigChange(newConfig);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Cross-Listing Manager
          </CardTitle>
          <CardDescription>
            Manage brands that appear in multiple sections. Cross-listed brands show with multiple badges in results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search brands..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="secondary">
                {crossListedBrands.length} cross-listed
              </Badge>
            </div>

            <div className="grid gap-4">
              {filteredBrands.map((brand) => (
                <Card
                  key={brand.id}
                  className={`cursor-pointer transition-colors ${
                    selectedBrand?.id === brand.id ? 'border-primary' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedBrand(brand)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {brand.logo && (
                          <img 
                            src={brand.logo} 
                            alt={`${brand.name} logo`}
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <div>
                          <div className="font-medium">{brand.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {brand.synonyms.slice(0, 2).join(', ')}
                            {brand.synonyms.length > 2 && '...'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {brand.currentSections.length > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            <Link2 className="w-3 h-3 mr-1" />
                            Cross-listed
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {brand.currentSections.length} section{brand.currentSections.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-1">
                      {brand.currentSections.map(section => {
                        const sectionData = getAllSections().find(s => s.id === section);
                        return (
                          <Badge key={section} variant="outline" className="text-xs">
                            {sectionData?.label || section}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Assignment Panel */}
      {selectedBrand && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Assign Sections for "{selectedBrand.name}"
            </CardTitle>
            <CardDescription>
              Select which sections this brand should appear in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getAllSections().map((section) => (
                <div key={section.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{section.label}</div>
                  </div>
                  <Checkbox
                    checked={selectedBrand.currentSections.includes(section.id)}
                    onCheckedChange={(checked) => {
                      const newSections = checked
                        ? [...selectedBrand.currentSections, section.id]
                        : selectedBrand.currentSections.filter(s => s !== section.id);
                      
                      updateBrandAssignments(selectedBrand.id, newSections);
                      setSelectedBrand({
                        ...selectedBrand,
                        currentSections: newSections
                      } as BrandOption & { currentSections: string[] });
                    }}
                  />
                </div>
              ))}
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Currently assigned to {selectedBrand.currentSections.length} section{selectedBrand.currentSections.length !== 1 ? 's' : ''}
                </div>
                <Button variant="outline" onClick={() => setSelectedBrand(null)}>
                  Done
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cross-Listing Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Cross-Listing Examples</CardTitle>
          <CardDescription>
            How brands appear when cross-listed in results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border rounded bg-muted/20">
              <div className="font-medium">Ignition</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">SCADA</Badge>
                <Badge variant="secondary">Historian</Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Shows as one card with multiple role badges
              </div>
            </div>
            
            <div className="p-3 border rounded bg-muted/20">
              <div className="font-medium">AVEVA PI System</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">SCADA</Badge>
                <Badge variant="secondary">Historian</Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Eliminates duplicate entries in results
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};