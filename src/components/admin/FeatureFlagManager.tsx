import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, RefreshCw } from "lucide-react";
import { featureFlagService, type FeatureFlag } from "@/services/featureFlagService";

export function FeatureFlagManager() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [newFlag, setNewFlag] = useState({ name: "", description: "", enabled: false });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadFlags = async () => {
    try {
      setLoading(true);
      const data = await featureFlagService.getFeatureFlags();
      setFlags(data);
    } catch (error) {
      console.error('Error loading feature flags:', error);
      toast({
        title: "Error",
        description: "Failed to load feature flags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleToggle = async (flagName: string, enabled: boolean) => {
    try {
      setUpdating(flagName);
      await featureFlagService.updateFeatureFlag(flagName, enabled, "admin");
      
      // Update local state
      setFlags(prev => prev.map(flag => 
        flag.flag_name === flagName 
          ? { ...flag, enabled, updated_at: new Date().toISOString() }
          : flag
      ));

      toast({
        title: "Success",
        description: `Feature "${flagName}" ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating feature flag:', error);
      toast({
        title: "Error",
        description: "Failed to update feature flag",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleCreateFlag = async () => {
    try {
      if (!newFlag.name.trim()) {
        toast({
          title: "Error",
          description: "Flag name is required",
          variant: "destructive",
        });
        return;
      }

      await featureFlagService.createFeatureFlag(
        newFlag.name.toUpperCase().replace(/\s+/g, '_'),
        newFlag.enabled,
        newFlag.description
      );

      setNewFlag({ name: "", description: "", enabled: false });
      setDialogOpen(false);
      await loadFlags();

      toast({
        title: "Success",
        description: "Feature flag created successfully",
      });
    } catch (error) {
      console.error('Error creating feature flag:', error);
      toast({
        title: "Error",
        description: "Failed to create feature flag",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading feature flags...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Feature Flags</h3>
          <p className="text-sm text-muted-foreground">
            Control application features dynamically without code deployment
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadFlags} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Flag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
                <DialogDescription>
                  Add a new feature flag to control application functionality
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="flag-name">Flag Name</Label>
                  <Input
                    id="flag-name"
                    value={newFlag.name}
                    onChange={(e) => setNewFlag(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="FEATURE_NAME"
                  />
                </div>
                <div>
                  <Label htmlFor="flag-description">Description</Label>
                  <Textarea
                    id="flag-description"
                    value={newFlag.description}
                    onChange={(e) => setNewFlag(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this feature flag controls..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="flag-enabled"
                    checked={newFlag.enabled}
                    onCheckedChange={(enabled) => setNewFlag(prev => ({ ...prev, enabled }))}
                  />
                  <Label htmlFor="flag-enabled">Start enabled</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFlag}>Create Flag</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {flags.map((flag) => (
          <Card key={flag.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-medium">
                    {flag.flag_name}
                    <Badge 
                      variant={flag.enabled ? "default" : "secondary"} 
                      className="ml-2"
                    >
                      {flag.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </CardTitle>
                  {flag.description && (
                    <CardDescription className="mt-1">
                      {flag.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={(enabled) => handleToggle(flag.flag_name, enabled)}
                    disabled={updating === flag.flag_name}
                  />
                  {updating === flag.flag_name && (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  )}
                </div>
              </div>
            </CardHeader>
            {(flag.updated_at || flag.updated_by) && (
              <CardContent className="pt-0">
                <div className="text-xs text-muted-foreground">
                  Last updated: {new Date(flag.updated_at).toLocaleString()}
                  {flag.updated_by && ` by ${flag.updated_by}`}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {flags.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No feature flags found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first feature flag to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}