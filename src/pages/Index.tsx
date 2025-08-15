import { useState } from "react";
import { TechStackAssessment } from "@/components/TechStackAssessment";
import { AssessmentResults } from "@/components/AssessmentResults";

export interface TechStackData {
  erp: string[];
  sensors: string[];
  automation: string[];
  other: string[];
  companySize: string;
  industry: string;
  goals: string[];
  followUpAnswers?: Record<string, string>;
}

const Index = () => {
  const [showResults, setShowResults] = useState(false);
  const [techStackData, setTechStackData] = useState<TechStackData | null>(null);

  const handleAssessmentComplete = (data: TechStackData) => {
    setTechStackData(data);
    setShowResults(true);
  };

  const handleRestart = () => {
    setShowResults(false);
    setTechStackData(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {!showResults ? (
        <TechStackAssessment onComplete={handleAssessmentComplete} />
      ) : (
        <AssessmentResults data={techStackData!} onRestart={handleRestart} />
      )}
    </div>
  );
};

export default Index;