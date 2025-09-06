import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ConfigService } from '@/services/configService';
import { AppConfig } from '@/types/config';
import { SectionManager } from '@/components/admin/SectionManager';
import { VersionManager } from '@/components/admin/VersionManager';
import { SubmissionsManager } from '@/components/admin/SubmissionsManager';
import { SynonymManager } from '@/components/admin/SynonymManager';
import { BulkImport } from '@/components/admin/BulkImport';
import { GlobalBrandManager } from '@/components/admin/GlobalBrandManager';
import { CrossListingManager } from '@/components/admin/CrossListingManager';
import { TaxonomyPreview } from '@/components/admin/TaxonomyPreview';
import { ImportManager } from '@/components/admin/ImportManager';
import { FeatureFlagManager } from '@/components/admin/FeatureFlagManager';
import { Save, Eye, Zap, Download, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { createTestAssessment } from '@/utils/testAssessment';
import { supabase } from '@/integrations/supabase/client';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated with Supabase
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email === 'nick@getmaintainx.com') {
        setIsAuthenticated(true);
        setCurrentUser(session.user);
        loadConfig();
      } else {
        // Redirect to auth page if not authenticated
        navigate('/auth');
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email === 'nick@getmaintainx.com') {
        setIsAuthenticated(true);
        setCurrentUser(session.user);
        if (!config) loadConfig();
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, config]);

  // Prompt to restore pre-migration snapshot if detected
  useEffect(() => {
    if (!config) return;
    try {
      const shownKey = 'mx_migration_restore_prompt_shown';
      if (localStorage.getItem(shownKey)) return;
      const versions = ConfigService.listVersions();
      const migration = versions.find(v => v.id.startsWith('migration-') || (v.description || '').toLowerCase().includes('before taxonomy expansion'));
      if (migration) {
        toast({
          title: 'Restore pre-migration configuration?',
          description: 'We found a snapshot taken before migration. You can restore it to recover your edits.',
          action: (
            <ToastAction altText="Restore"
              onClick={() => {
                try {
                  ConfigService.rollback(migration.id);
                  localStorage.setItem(shownKey, '1');
                  loadConfig();
                  toast({ title: 'Restored', description: 'Pre-migration configuration has been restored.' });
                } catch (e) {
                  toast({ title: 'Restore failed', description: e instanceof Error ? e.message : 'Unable to restore snapshot', variant: 'destructive' });
                }
              }}
            >
              Restore
            </ToastAction>
          )
        });
      }
    } catch {}
  }, [config]);

  const loadConfig = () => {
    const draft = ConfigService.getDraft();
    if (draft) {
      setConfig(draft);
      setIsDraft(true);
    } else {
      setConfig(ConfigService.getLive());
      setIsDraft(false);
    }
  };

  // Auto-save when config changes
  const handleConfigChange = (newConfig: AppConfig) => {
    setConfig(newConfig);
    if (autoSaveEnabled) {
      try {
        ConfigService.saveDraft(newConfig);
        setIsDraft(true);
        console.log('🔄 Auto-saved draft');
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
        toast({
          title: "Auto-save Failed",
          description: "Changes weren't saved automatically. Please save manually.",
          variant: "destructive"
        });
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleSaveDraft = () => {
    if (!config) return;
    try {
      ConfigService.saveDraft(config);
      setIsDraft(true);
      toast({
        title: "Draft Saved",
        description: "Your changes have been saved as a draft."
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save draft. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePublish = () => {
    if (!config) return;
    try {
      console.log('🚀 Starting publish process...');
      
      // Check storage usage before publishing
      const storageInfo = (ConfigService as any).getStorageInfo();
      console.log('💾 Storage usage before publish:', {
        used: Math.round(storageInfo.used / 1024) + 'KB',
        remaining: Math.round(storageInfo.remaining / 1024) + 'KB'
      });
      
      ConfigService.publish(config);
      setIsDraft(false);
      
      toast({
        title: "Published Successfully",
        description: "Configuration published! Changes should appear on the external page within seconds."
      });
      
      console.log('✅ Publish completed successfully');
      
      // Additional verification
      setTimeout(() => {
        const verifyConfig = localStorage.getItem('mx_config_live');
        console.log('🔍 Post-publish verification:', {
          configExists: !!verifyConfig,
          configSize: verifyConfig ? Math.round(verifyConfig.length / 1024) + 'KB' : '0KB'
        });
      }, 500);
      
    } catch (error) {
      console.error('❌ Failed to publish:', error);
      toast({
        title: "Publish Failed",
        description: error instanceof Error ? error.message : "Failed to publish. Please try reducing image sizes.",
        variant: "destructive"
      });
    }
  };

  const handleCreateDraft = () => {
    const draft = ConfigService.createDraftFromLive();
    setConfig(draft);
    setIsDraft(true);
    toast({
      title: "Draft Created",
      description: "Created a draft from the live configuration."
    });
  };

  const handlePreview = () => {
    if (!config) return;
    // Save current draft
    if (isDraft) {
      ConfigService.saveDraft(config);
    }
    // Open preview in new tab
    window.open('/preview', '_blank');
  };

  const handleExport = () => {
    if (!config) return;
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mx-config-${config.status}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Mode</h1>
            <p className="text-muted-foreground mt-1">
              Manage brands, logos, categories, and content
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isDraft ? "secondary" : "default"}>
              {isDraft ? "Draft" : "Published"}
            </Badge>
            <Badge variant={autoSaveEnabled ? "default" : "outline"} className="text-xs">
              Auto-save: {autoSaveEnabled ? "ON" : "OFF"}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                const result = await createTestAssessment();
                if (result.success && result.url) {
                  toast({
                    title: "Test Assessment Created",
                    description: "Assessment saved successfully",
                    action: (
                      <ToastAction altText="View" onClick={() => window.open(result.url, '_blank')}>
                        View External
                      </ToastAction>
                    ),
                  });
                } else {
                  toast({
                    title: "Test Failed",
                    description: result.error || "Unknown error",
                    variant: "destructive"
                  });
                }
              }}
            >
              Test Assessment
            </Button>
            {isDraft ? (
              <>
                <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button size="sm" onClick={handlePublish}>
                  <Zap className="w-4 h-4 mr-2" />
                  Publish
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={handleCreateDraft}>
                Create Draft
              </Button>
            )}
          </div>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Configuration Status
              <Badge variant={isDraft ? "secondary" : "default"}>
                {isDraft ? "Draft" : "Published"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Last updated: {new Date(config.updatedAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">
                  {config.sections.reduce((acc, section) => 
                    acc + (section.options?.length || 0) + 
                    (section.subcategories?.reduce((subAcc, sub) => 
                      subAcc + (sub.options?.length || 0), 0) || 0), 0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Total Brands</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{config.sections.length}</div>
                <div className="text-sm text-muted-foreground">Sections</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Object.keys(config.synonymMap).length}
                </div>
                <div className="text-sm text-muted-foreground">Synonyms</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="taxonomy" className="w-full">
          <TabsList className="grid w-full grid-cols-11">
            <TabsTrigger value="taxonomy">Taxonomy</TabsTrigger>
            <TabsTrigger value="global-brands">Global Brands</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="cross-listing">Cross-Listing</TabsTrigger>
            <TabsTrigger value="synonyms">Synonyms</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="copy">Copy</TabsTrigger>
          </TabsList>

          <TabsContent value="taxonomy">
            <TaxonomyPreview config={config} />
          </TabsContent>

          <TabsContent value="global-brands">
            <GlobalBrandManager config={config} onConfigChange={handleConfigChange} />
          </TabsContent>

          <TabsContent value="sections">
            <SectionManager config={config} onConfigChange={handleConfigChange} />
          </TabsContent>

          <TabsContent value="cross-listing">
            <CrossListingManager config={config} onConfigChange={handleConfigChange} />
          </TabsContent>

          <TabsContent value="synonyms">
            <SynonymManager config={config} onConfigChange={handleConfigChange} />
          </TabsContent>

          <TabsContent value="import">
            <ImportManager config={config} onConfigChange={handleConfigChange} />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkImport config={config} onConfigChange={handleConfigChange} />
          </TabsContent>

          <TabsContent value="versions">
            <VersionManager onConfigRestore={loadConfig} />
          </TabsContent>

          <TabsContent value="submissions">
            <SubmissionsManager />
          </TabsContent>

          <TabsContent value="features">
            <FeatureFlagManager />
          </TabsContent>

          <TabsContent value="copy">
            <Card>
              <CardHeader>
                <CardTitle>Copy Management</CardTitle>
                <CardDescription>
                  Manage text and copy used throughout the application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Copy management interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;