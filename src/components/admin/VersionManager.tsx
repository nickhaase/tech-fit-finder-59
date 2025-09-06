import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfigService } from '@/services/configService';
import { ConfigVersion } from '@/types/config';
import { History, RotateCcw, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VersionManagerProps {
  onConfigRestore: () => void;
}

export const VersionManager = ({ onConfigRestore }: VersionManagerProps) => {
  const [versions, setVersions] = useState<ConfigVersion[]>(ConfigService.listVersions());
  const { toast } = useToast();

  const handleRollback = (versionId: string) => {
    try {
      ConfigService.rollback(versionId);
      setVersions(ConfigService.listVersions());
      onConfigRestore();
      toast({
        title: "Configuration Restored",
        description: "Successfully rolled back to the selected version."
      });
    } catch (error) {
      toast({
        title: "Rollback Failed",
        description: "Failed to restore the configuration.",
        variant: "destructive"
      });
    }
  };

  const handleCreateSnapshot = () => {
    try {
      ConfigService.createSnapshot('Pre-Global-Brands Snapshot');
      setVersions(ConfigService.listVersions());
      toast({
        title: "Snapshot Created",
        description: "Current configuration saved as 'Pre-Global-Brands Snapshot'."
      });
    } catch (error) {
      toast({
        title: "Snapshot Failed",
        description: "Failed to create snapshot.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const refresh = () => setVersions(ConfigService.listVersions());
    refresh();

    const onUpdated = () => refresh();
    window.addEventListener('versionsUpdated', onUpdated as EventListener);
    window.addEventListener('configUpdated', onUpdated as EventListener);
    window.addEventListener('forceConfigRefresh', onUpdated as EventListener);

    return () => {
      window.removeEventListener('versionsUpdated', onUpdated as EventListener);
      window.removeEventListener('configUpdated', onUpdated as EventListener);
      window.removeEventListener('forceConfigRefresh', onUpdated as EventListener);
    };
  }, []);

  const handleExportVersion = (version: ConfigVersion) => {
    const blob = new Blob([JSON.stringify(version.config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mx-config-${version.id}-${version.config.status}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Version History
        </CardTitle>
        <CardDescription>
          View and restore previous configuration versions. Last 20 versions are kept.
        </CardDescription>
      </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button onClick={handleCreateSnapshot}>
              <History className="w-4 h-4 mr-2" />
              Create Snapshot
            </Button>
          </div>
          {versions.length > 0 ? (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={version.config.status === 'published' ? 'default' : 'secondary'}>
                      {version.config.status}
                    </Badge>
                    <span className="text-sm font-medium">
                      {new Date(version.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {version.description && (
                    <p className="text-sm text-muted-foreground">{version.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {version.config.sections.reduce((acc, section) => 
                      acc + (section.options?.length || 0) + 
                      (section.subcategories?.reduce((subAcc, sub) => 
                        subAcc + (sub.options?.length || 0), 0) || 0), 0
                    )} total brands • Schema v{version.config.schemaVersion}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportVersion(version)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRollback(version.id)}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No version history yet.</p>
            <p className="text-sm">Versions are automatically created when you publish changes.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};