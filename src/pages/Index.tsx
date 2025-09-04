import { useState } from "react";
import { NewTechStackAssessment } from "@/components/NewTechStackAssessment";
import { AssessmentResults } from "@/components/AssessmentResults";
import { AssessmentData } from "@/types/assessment";

const Index = () => {
  const [showResults, setShowResults] = useState(false);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);

  const handleAssessmentComplete = (data: AssessmentData) => {
    setAssessmentData(data);
    setShowResults(true);
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