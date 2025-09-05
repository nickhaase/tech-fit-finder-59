import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AppConfig } from '@/types/config';
import { ChevronDown, ChevronRight, Database, Cpu, Settings, Factory, BarChart3, Globe } from 'lucide-react';

interface TaxonomyPreviewProps {
  config: AppConfig;
}

export const TaxonomyPreview = ({ config }: TaxonomyPreviewProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getSectionIcon = (sectionId: string) => {
    const icons: Record<string, any> = {
      'erp': Database,
      'sensors_monitoring': Cpu,
      'automation_scada': Settings,
      'data_analytics': BarChart3,
      'other_systems': Factory
    };
    return icons[sectionId] || Globe;
  };

  const getSectionStats = (section: any) => {
    const totalOptions = (section.options?.length || 0) + 
      (section.subcategories?.reduce((acc: number, sub: any) => acc + (sub.options?.length || 0), 0) || 0);
    
    const crossListedOptions = (section.options?.filter((opt: any) => opt.categories?.length > 1)?.length || 0) +
      (section.subcategories?.reduce((acc: number, sub: any) => 
        acc + (sub.options?.filter((opt: any) => opt.categories?.length > 1)?.length || 0), 0) || 0);
    
    return { totalOptions, crossListedOptions };
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Expanded Taxonomy Structure</CardTitle>
          <CardDescription>
            New sections: Data & Analytics, Connectivity & Edge, and cross-listing support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-primary">{config.sections.length}</div>
              <div className="text-sm text-muted-foreground">Total Sections</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-primary">
                {config.sections.reduce((acc, s) => 
                  acc + (s.subcategories?.length || 0), 0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Subcategories</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-primary">
                {config.sections.reduce((acc, s) => 
                  acc + (s.options?.length || 0) + 
                  (s.subcategories?.reduce((subAcc, sub) => subAcc + (sub.options?.length || 0), 0) || 0), 0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Total Brands</div>
            </div>
          </div>

          <div className="space-y-3">
            {config.sections.map((section) => {
              const Icon = getSectionIcon(section.id);
              const stats = getSectionStats(section);
              const isExpanded = expandedSections.has(section.id);
              
              return (
                <Card key={section.id} className="border-l-4 border-l-primary/30">
                  <Collapsible>
                    <CollapsibleTrigger
                      className="w-full"
                      onClick={() => toggleSection(section.id)}
                    >
                      <CardHeader className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-primary" />
                            <div className="text-left">
                              <CardTitle className="text-lg">{section.label}</CardTitle>
                              {section.description && (
                                <CardDescription>{section.description}</CardDescription>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {stats.totalOptions} brands
                            </Badge>
                            {stats.crossListedOptions > 0 && (
                              <Badge variant="secondary">
                                {stats.crossListedOptions} cross-listed
                              </Badge>
                            )}
                            <Badge variant={section.multi ? "default" : "secondary"}>
                              {section.multi ? "Multi-select" : "Single-select"}
                            </Badge>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {section.subcategories && section.subcategories.length > 0 ? (
                          <div className="space-y-2">
                            {section.subcategories.map((sub) => (
                              <div key={sub.id} className="ml-6 p-3 border rounded bg-muted/20">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{sub.label}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {sub.description}
                                      {(sub as any).aliasOf && (
                                        <span className="ml-2 text-primary">
                                          → Points to {(sub as any).aliasOf}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {sub.options?.length || 0} brands
                                    </Badge>
                                    {sub.state === 'optional' && (
                                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Show sample brands */}
                                {sub.options && sub.options.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {sub.options.slice(0, 5).map((brand) => (
                                      <div key={brand.id} className="flex items-center gap-1 bg-background p-1 rounded border">
                                        {brand.logo && (
                                          <img 
                                            src={brand.logo} 
                                            alt={brand.name}
                                            className="w-4 h-4 object-contain"
                                          />
                                        )}
                                        <span className="text-xs">{brand.name}</span>
                                        {brand.categories && brand.categories.length > 1 && (
                                          <Badge variant="outline" className="text-xs h-auto py-0">
                                            Cross-listed
                                          </Badge>
                                        )}
                                      </div>
                                    ))}
                                    {sub.options.length > 5 && (
                                      <div className="text-xs text-muted-foreground p-1">
                                        +{sub.options.length - 5} more
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="ml-6 text-sm text-muted-foreground">
                            No subcategories - brands are at section level
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>

          {/* Migration Status */}
          {config.schemaVersion >= 2 && (
            <Card className="mt-6 border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="text-sm">
                    <strong>Migration Complete:</strong> Schema v{config.schemaVersion} includes expanded taxonomy with Data & Analytics and cross-listing support.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};