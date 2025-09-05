import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { GlobalBrand } from '@/types/config';
import { Search, Globe, Check, Image as ImageIcon } from 'lucide-react';

interface BrandSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  globalBrands: GlobalBrand[];
  onSelectBrand: (brandId: string) => void;
  currentLinkedBrandId?: string;
}

export const BrandSelector = ({ 
  isOpen, 
  onClose, 
  globalBrands, 
  onSelectBrand,
  currentLinkedBrandId 
}: BrandSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBrands = globalBrands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.synonyms.some(syn => syn.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectBrand = (brandId: string) => {
    onSelectBrand(brandId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Link to Global Brand
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div>
            <Label htmlFor="search">Search Brands</Label>
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

          {/* Brand List */}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/30 ${
                  currentLinkedBrandId === brand.id ? 'bg-primary/10 border-primary' : ''
                }`}
                onClick={() => handleSelectBrand(brand.id)}
              >
                <div className="flex items-center gap-3">
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{brand.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {brand.assignedSections.length} sections
                      {brand.synonyms.length > 0 && (
                        <span> • {brand.synonyms.length} synonyms</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={brand.state === 'active' ? 'default' : 'secondary'}>
                    {brand.state}
                  </Badge>
                  {currentLinkedBrandId === brand.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </div>
            ))}
            {filteredBrands.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No brands found matching your search.</p>
                <p className="text-sm">Try a different search term or create a new global brand first.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};