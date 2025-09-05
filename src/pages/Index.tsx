import { useState } from "react";
import { NewTechStackAssessment } from "@/components/NewTechStackAssessment";
import { AssessmentResults } from "@/components/AssessmentResults";
import { AssessmentData } from "@/types/assessment";
import { AssessmentService } from "@/services/assessmentService";
import { toast } from "sonner";

const Index = () => {
  const [showResults, setShowResults] = useState(false);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);

  const handleAssessmentComplete = async (data: AssessmentData) => {
    try {
      const { uniqueUrl } = await AssessmentService.saveAssessment(data, data.companyName);
      const updatedData = { ...data, uniqueUrl };
      setAssessmentData(updatedData);
      setShowResults(true);
      toast.success("Assessment saved successfully!");
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error("Failed to save assessment, but you can still view results");
      setAssessmentData(data);
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setShowResults(false);
    setAssessmentData(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {!showResults ? (
        <NewTechStackAssessment onComplete={handleAssessmentComplete} />
      ) : (
        <AssessmentResults data={assessmentData!} onRestart={handleRestart} />
      )}
    </div>
  );
};

export default Index;