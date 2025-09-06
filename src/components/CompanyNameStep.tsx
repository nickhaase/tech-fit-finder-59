import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, CheckCircle, Share2, Database, Link } from "lucide-react";

interface CompanyNameStepProps {
  onSaveToDatabase: (companyName: string) => void;
  onShareWithCompany: (companyName: string) => void;
  onShareAnonymous: () => void;
}

export const CompanyNameStep = ({ onSaveToDatabase, onShareWithCompany, onShareAnonymous }: CompanyNameStepProps) => {
  const [companyName, setCompanyName] = useState("");

  const handleSaveToDatabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName.trim()) {
      onSaveToDatabase(companyName.trim());
    }
  };

  const handleShareWithCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName.trim()) {
      onShareWithCompany(companyName.trim());
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name" className="text-sm font-medium">
                Company Name (Optional)
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
                Adding a company name helps personalize results and fetches your logo
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <form onSubmit={handleSaveToDatabase}>
                <Button 
                  type="submit" 
                  disabled={!companyName.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Save Assessment with Company Name
                </Button>
              </form>
              
              <form onSubmit={handleShareWithCompany}>
                <Button 
                  type="submit"
                  disabled={!companyName.trim()}
                  variant="outline" 
                  className="w-full"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share via URL with Company Name
                </Button>
              </form>
              
              <Button 
                type="button" 
                variant="secondary" 
                onClick={onShareAnonymous}
                className="w-full"
              >
                <Link className="w-4 h-4 mr-2" />
                Share via URL (Anonymous)
              </Button>
            </div>
          </div>

          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <p><strong>Save to Database:</strong> Enables logo fetching and admin visibility</p>
              <p><strong>Share with Company:</strong> URL includes company name for personalization</p>
              <p><strong>Anonymous Share:</strong> No company data stored or shared</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};