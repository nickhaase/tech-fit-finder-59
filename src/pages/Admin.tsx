import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ConfigService } from '@/services/configService';
import { AppConfig } from '@/types/config';
import { SectionManager } from '@/components/admin/SectionManager';
import { VersionManager } from '@/components/admin/VersionManager';
import { SynonymManager } from '@/components/admin/SynonymManager';
import { BulkImport } from '@/components/admin/BulkImport';
import { AdminAuth } from '@/components/admin/AdminAuth';
import { Save, Eye, Zap, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if already authenticated
    const auth = localStorage.getItem('mx_admin_auth');
    if (auth) {
      try {
        const { timestamp } = JSON.parse(auth);
        // Session valid for 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setIsAuthenticated(true);
          loadConfig();
        }
      } catch (e) {
        localStorage.removeItem('mx_admin_auth');
      }
    }
  }, []);

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

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    loadConfig();
  };

  const handleSaveDraft = () => {
    if (!config) return;
    ConfigService.saveDraft(config);
    setIsDraft(true);
    toast({
      title: "Draft Saved",
      description: "Your changes have been saved as a draft."
    });
  };

  const handlePublish = () => {
    if (!config) return;
    ConfigService.publish(config);
    setIsDraft(false);
    toast({
      title: "Published",
      description: "Your changes are now live on the public site."
    });
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
    return <AdminAuth onAuthSuccess={handleAuthSuccess} />;
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
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
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
        <Tabs defaultValue="sections" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="synonyms">Synonyms</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="copy">Copy</TabsTrigger>
          </TabsList>

          <TabsContent value="sections">
            <SectionManager config={config} onConfigChange={setConfig} />
          </TabsContent>

          <TabsContent value="synonyms">
            <SynonymManager config={config} onConfigChange={setConfig} />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkImport config={config} onConfigChange={setConfig} />
          </TabsContent>

          <TabsContent value="versions">
            <VersionManager onConfigRestore={loadConfig} />
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