import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { featureFlagService, type FeatureFlag } from "@/services/featureFlagService";
import { RefreshCw, Clock } from "lucide-react";

interface FeatureFlagManagerProps {
  userEmail?: string;
}

export function FeatureFlagManager({ userEmail }: FeatureFlagManagerProps) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const loadFlags = async () => {
    setLoading(true);
    try {
      const flagData = await featureFlagService.getAllFlags();
      setFlags(flagData);
    } catch (error) {
      console.error('Failed to load feature flags:', error);
      toast({
        title: "Error",
        description: "Failed to load feature flags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (flagName: string, enabled: boolean) => {
    setUpdating(flagName);
    try {
      const success = await featureFlagService.updateFlag(flagName, enabled, userEmail);
      
      if (success) {
        // Update local state
        setFlags(prev => prev.map(flag => 
          flag.flag_name === flagName 
            ? { ...flag, enabled, updated_at: new Date().toISOString(), updated_by: userEmail }
            : flag
        ));
        
        // Clear cache to ensure fresh data
        featureFlagService.clearCache();
        
        toast({
          title: "Success",
          description: `Feature flag "${flagName}" ${enabled ? 'enabled' : 'disabled'}`,
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to update feature flag "${flagName}"`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update feature flag:', error);
      toast({
        title: "Error",
        description: `Failed to update feature flag "${flagName}"`,
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleRefresh = () => {
    featureFlagService.clearCache();
    loadFlags();
    toast({
      title: "Refreshed",
      description: "Feature flags refreshed from database",
    });
  };

  useEffect(() => {
    loadFlags();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Loading feature flags...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feature Flags</h2>
          <p className="text-muted-foreground">
            Manage feature toggles for your application
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {flags.map((flag) => (
          <Card key={flag.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{flag.flag_name}</CardTitle>
                    <Badge variant={flag.enabled ? "default" : "secondary"}>
                      {flag.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  {flag.description && (
                    <CardDescription>{flag.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`flag-${flag.flag_name}`}
                    checked={flag.enabled}
                    onCheckedChange={(enabled) => handleToggleFlag(flag.flag_name, enabled)}
                    disabled={updating === flag.flag_name}
                  />
                  <Label htmlFor={`flag-${flag.flag_name}`} className="sr-only">
                    Toggle {flag.flag_name}
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Updated: {new Date(flag.updated_at).toLocaleString()}
                </div>
                {flag.updated_by && (
                  <div>By: {flag.updated_by}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {flags.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No feature flags configured</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}