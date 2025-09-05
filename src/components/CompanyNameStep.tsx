import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, CheckCircle } from "lucide-react";

interface CompanyNameStepProps {
  onComplete: (companyName: string) => void;
  onSkip: () => void;
}

export const CompanyNameStep = ({ onComplete, onSkip }: CompanyNameStepProps) => {
  const [companyName, setCompanyName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName.trim()) {
      onComplete(companyName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Building className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Company Information</CardTitle>
            <p className="text-muted-foreground mt-2">
              Help us personalize your assessment results and enable logo integration
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name" className="text-sm font-medium">
                Company Name
              </Label>
              <Input
                id="company-name"
                type="text"
                placeholder="e.g., Tyson Foods, Tesla, Microsoft"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                We'll use this to find your company logo and personalize the results
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={!companyName.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Continue with {companyName || 'Company Name'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={onSkip}
                className="w-full"
              >
                Skip for now
              </Button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              This information helps us create a more personalized experience
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};