import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Search, X } from "lucide-react";
import { BrandOption, CategoryOption } from "@/types/assessment";
import { ConfigSection } from "@/types/config";

interface BrandPickerProps {
  category: CategoryOption | ConfigSection;
  selectedBrands: string[];
  onBrandToggle: (brandId: string, brandName: string) => void;
  onClose: () => void;
  allowMultiple?: boolean;
}

// Helper to convert ConfigSection to CategoryOption format
const convertConfigToCategory = (config: ConfigSection): CategoryOption => {
  return {
    id: config.id,
    name: config.label,
    description: config.description || '',
    brands: config.options.filter(opt => opt.state === 'active').map(opt => ({
      id: opt.id,
      name: opt.name,
      logo: opt.logo,
      commonNames: opt.synonyms,
      description: ''
    }))
  };
};

export const BrandPicker = ({ 
  category, 
  selectedBrands, 
  onBrandToggle, 
  onClose,
  allowMultiple = true 
}: BrandPickerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [customBrand, setCustomBrand] = useState("");

  // Convert category to consistent format
  const categoryData = 'options' in category ? convertConfigToCategory(category) : category;

  const filteredBrands = useMemo(() => {
    if (!searchTerm) return categoryData.brands;
    
    return categoryData.brands.filter(brand => 
      brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.commonNames?.some(name => 
        name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [categoryData.brands, searchTerm]);

  const handleBrandSelect = (brand: BrandOption) => {
    onBrandToggle(brand.id, brand.name);
    if (!allowMultiple) {
      onClose();
    }
  };

  const handleCustomBrandAdd = () => {
    if (customBrand.trim()) {
      const customId = `custom_${customBrand.toLowerCase().replace(/\s+/g, '_')}`;
      onBrandToggle(customId, customBrand.trim());
      setCustomBrand("");
      if (!allowMultiple) {
        onClose();
      }
    }
  };

  const handleNoneSelection = () => {
    onBrandToggle('none', 'None');
    onClose();
  };

  const handleNotSureSelection = () => {
    onBrandToggle('not_sure', 'Not sure');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden bg-gradient-card">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold mb-2">{categoryData.name}</h3>
              <p className="text-sm text-muted-foreground">{categoryData.description}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {/* None and Not Sure options */}
          <div className="grid md:grid-cols-2 gap-3 mb-6">
            <Card
              className="p-3 cursor-pointer transition-all duration-200 hover:shadow-soft border-dashed"
              onClick={handleNoneSelection}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">None</span>
                {selectedBrands.includes('none') && (
                  <CheckCircle className="w-5 h-5 text-primary" />
                )}
              </div>
            </Card>
            
            <Card
              className="p-3 cursor-pointer transition-all duration-200 hover:shadow-soft border-dashed"
              onClick={handleNotSureSelection}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">Not sure</span>
                {selectedBrands.includes('not_sure') && (
                  <CheckCircle className="w-5 h-5 text-primary" />
                )}
              </div>
            </Card>
          </div>

          {/* Brand options */}
          <div className="grid md:grid-cols-2 gap-3 mb-6">
            {filteredBrands.map((brand) => (
              <Card
                key={brand.id}
                className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-soft ${
                  selectedBrands.includes(brand.id)
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "hover:border-primary/50"
                }`}
                onClick={() => handleBrandSelect(brand)}
              >
                <div className="flex items-start gap-3">
                  {brand.logo && (
                    <img 
                      src={brand.logo} 
                      alt={`${brand.name} logo`}
                      className="w-8 h-8 object-contain flex-shrink-0 mt-1"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold mb-1">{brand.name}</h4>
                        {brand.commonNames && brand.commonNames.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {brand.commonNames.slice(0, 3).map((name, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {brand.description && (
                          <p className="text-sm text-muted-foreground">{brand.description}</p>
                        )}
                      </div>
                      {selectedBrands.includes(brand.id) && (
                        <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Custom brand input */}
          <div className="border-t border-border/50 pt-4">
            <h4 className="font-medium mb-3">Don't see your brand?</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Enter custom brand name..."
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomBrandAdd()}
              />
              <Button 
                onClick={handleCustomBrandAdd}
                disabled={!customBrand.trim()}
                variant="outline"
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border/50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {selectedBrands.length} selected
            </p>
            <Button onClick={onClose} variant="gradient">
              Continue
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};