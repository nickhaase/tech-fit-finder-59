import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AssessmentResults } from "@/components/AssessmentResults";
import { AssessmentService } from "@/services/assessmentService";
import { Assessment, AssessmentResult } from "@/types/database";
import { AssessmentData } from "@/types/assessment";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const SharedAssessment = () => {
  const { uniqueUrl } = useParams<{ uniqueUrl: string }>();
  const [loading, setLoading] = useState(true);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAssessment = async () => {
      if (!uniqueUrl) {
        setError("No assessment URL provided");
        setLoading(false);
        return;
      }

      try {
        const result = await AssessmentService.getAssessmentByUrl(uniqueUrl);
        
        if (!result) {
          setError("Assessment not found");
          setLoading(false);
          return;
        }

        const { assessment, results } = result;
        
        // Reconstruct AssessmentData from stored data
        const data: AssessmentData = {
          ...assessment.assessment_data,
          companyName: assessment.company?.name,
          uniqueUrl: assessment.unique_url,
          scorecard: results.scorecard_data
        };

        setAssessmentData(data);
      } catch (error) {
        console.error('Error loading shared assessment:', error);
        setError("Failed to load assessment");
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, [uniqueUrl]);

  const handleRestart = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading assessment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !assessmentData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold mb-2">Assessment Not Found</h2>
            <p className="text-muted-foreground mb-4">{error || "This assessment link is invalid or has expired."}</p>
            <button 
              onClick={handleRestart}
              className="text-primary hover:underline"
            >
              Take a new assessment
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AssessmentResults data={assessmentData} onRestart={handleRestart} />
    </div>
  );
};

export default SharedAssessment;