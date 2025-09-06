import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AssessmentResults } from "@/components/AssessmentResults";
import { AssessmentData } from "@/types/assessment";
import { URLSharingService } from "@/utils/urlSharing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

const Share = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAssessmentFromURL = () => {
      try {
        const encodedData = searchParams.get('data');
        
        if (!encodedData) {
          setError('No assessment data found in URL');
          setLoading(false);
          return;
        }

        const data = URLSharingService.decodeAssessmentData(encodedData);
        
        if (!data) {
          setError('Invalid or corrupted assessment data');
          setLoading(false);
          return;
        }

        setAssessmentData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading assessment from URL:', error);
        setError('Failed to load assessment data');
        setLoading(false);
      }
    };

    loadAssessmentFromURL();
  }, [searchParams]);

  const handleRestart = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assessment results...</p>
        </div>
      </div>
    );
  }

  if (error || !assessmentData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Assessment Not Found</h2>
            <p className="text-muted-foreground">
              {error || 'The assessment results could not be loaded. The URL might be invalid or corrupted.'}
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Take New Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AssessmentResults data={assessmentData} onRestart={handleRestart} />;
};

export default Share;