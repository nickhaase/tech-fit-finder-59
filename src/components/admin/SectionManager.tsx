import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppConfig, ConfigSection } from '@/types/config';
import { OptionManager } from './OptionManager';
import { Settings, Plus, ChevronRight, ChevronDown } from 'lucide-react';

interface SectionManagerProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

export const SectionManager = ({ config, onConfigChange }: SectionManagerProps) => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
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

  const handleSectionSelect = (sectionId: string, subcategoryId?: string) => {
    setSelectedSection(sectionId);
    setSelectedSubcategory(subcategoryId || null);
  };

  const updateSection = (updatedSection: ConfigSection) => {
    const newConfig = { ...config };
    const sectionIndex = newConfig.sections.findIndex(s => s.id === updatedSection.id);
    if (sectionIndex >= 0) {
      newConfig.sections[sectionIndex] = updatedSection;
      onConfigChange(newConfig);
    }
  };

  const updateSubcategory = (sectionId: string, updatedSubcategory: ConfigSection) => {
    const newConfig = { ...config };
    const section = newConfig.sections.find(s => s.id === sectionId);
    if (section && section.subcategories) {
      const subIndex = section.subcategories.findIndex(sub => sub.id === updatedSubcategory.id);
      if (subIndex >= 0) {
        section.subcategories[subIndex] = updatedSubcategory;
        onConfigChange(newConfig);
      }
    }
  };

  const getCurrentSection = (): ConfigSection | null => {
    if (!selectedSection) return null;
    
    const section = config.sections.find(s => s.id === selectedSection);
    if (!section) return null;
    
    if (selectedSubcategory && section.subcategories) {
      return section.subcategories.find(sub => sub.id === selectedSubcategory) || null;
    }
    
    return section;
  };

  const handleSectionUpdate = (updatedSection: ConfigSection) => {
    if (selectedSubcategory) {
      updateSubcategory(selectedSection!, updatedSection);
    } else {
      updateSection(updatedSection);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Section List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Sections
          </CardTitle>
          <CardDescription>
            Manage configuration sections and categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {config.sections.map((section) => (
              <div key={section.id}>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSection === section.id && !selectedSubcategory
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    toggleSection(section.id);
                    handleSectionSelect(section.id);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {section.subcategories && section.subcategories.length > 0 ? (
                      expandedSections.has(section.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                    <div>
                      <div className="font-medium">{section.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {section.options?.length || 0} options
                      </div>
                    </div>
                  </div>
                  <Badge variant={section.multi ? "secondary" : "outline"}>
                    {section.multi ? "Multi" : "Single"}
                  </Badge>
                </div>

                {/* Subcategories */}
                {expandedSections.has(section.id) && section.subcategories && (
                  <div className="ml-6 mt-2 space-y-1">
                    {section.subcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                          selectedSection === section.id && selectedSubcategory === subcategory.id
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted/30'
                        }`}
                        onClick={() => handleSectionSelect(section.id, subcategory.id)}
                      >
                        <div>
                          <div className="font-medium text-sm">{subcategory.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {subcategory.options?.length || 0} options
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button className="w-full mt-4" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        </CardContent>
      </Card>

      {/* Option Manager */}
      <div className="lg:col-span-2">
        {getCurrentSection() ? (
          <OptionManager
            section={getCurrentSection()!}
            onSectionUpdate={handleSectionUpdate}
          />
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a section to manage its options</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};