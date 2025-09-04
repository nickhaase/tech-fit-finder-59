import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminAuthProps {
  onAuthSuccess: () => void;
}

export const AdminAuth = ({ onAuthSuccess }: AdminAuthProps) => {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async () => {
    setLoading(true);
    
    // Simple passcode check (in real app, this would be proper auth)
    if (passcode === 'admin123' || passcode === 'maintainx') {
      localStorage.setItem('mx_admin_auth', JSON.stringify({
        timestamp: Date.now()
      }));
      onAuthSuccess();
      toast({
        title: "Authenticated",
        description: "Welcome to Admin Mode"
      });
    } else {
      toast({
        title: "Authentication Failed",
        description: "Invalid passcode",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAuth();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
          <CardTitle>Admin Access</CardTitle>
          <CardDescription>
            Enter the admin passcode to access configuration management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="Enter passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button 
            onClick={handleAuth} 
            disabled={loading || !passcode}
            className="w-full"
          >
            {loading ? 'Authenticating...' : 'Access Admin'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Demo passcode: <code>admin123</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};