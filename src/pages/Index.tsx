import { useState } from "react";
import { NewTechStackAssessment } from "@/components/NewTechStackAssessment";
import { AssessmentResults } from "@/components/AssessmentResults";
import { CompanyNameStep } from "@/components/CompanyNameStep";
import { AssessmentData } from "@/types/assessment";
import { AssessmentService } from "@/services/assessmentService";
import { URLSharingService } from "@/utils/urlSharing";
import { toast } from "sonner";

const Index = () => {
  const [showResults, setShowResults] = useState(false);
  const [showCompanyStep, setShowCompanyStep] = useState(false);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);

  const handleAssessmentComplete = (data: AssessmentData) => {
    // Store assessment data and show company step
    setAssessmentData(data);
    setShowCompanyStep(true);
  };

  const handleSaveToDatabase = async (companyName: string) => {
    if (!assessmentData) return;
    
    try {
      const dataWithCompany = { ...assessmentData, companyName };
      const { uniqueUrl } = await AssessmentService.saveAssessment(dataWithCompany, companyName);
      const updatedData = { ...dataWithCompany, uniqueUrl };
      setAssessmentData(updatedData);
      setShowCompanyStep(false);
      setShowResults(true);
      toast.success("Assessment saved successfully!");
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error("Failed to save assessment, but you can still view results");
      setShowCompanyStep(false);
      setShowResults(true);
    }
  };

  const handleShareWithCompany = async (companyName: string) => {
    if (!assessmentData) return;
    
    try {
      const dataWithCompany = { ...assessmentData, companyName };
      const shareableURL = URLSharingService.generateShareableURL(dataWithCompany);
      
      await navigator.clipboard.writeText(shareableURL);
      setAssessmentData(dataWithCompany);
      setShowCompanyStep(false);
      setShowResults(true);
      toast.success("Assessment URL copied to clipboard (with company name)!");
    } catch (error) {
      console.error('Error sharing assessment:', error);
      toast.error("Failed to create shareable URL, but you can still view results");
      setShowCompanyStep(false);
      setShowResults(true);
    }
  };

  const handleShareAnonymous = async () => {
    if (!assessmentData) return;
    
    try {
      const shareableURL = URLSharingService.generateShareableURL(assessmentData);
      
      await navigator.clipboard.writeText(shareableURL);
      setShowCompanyStep(false);
      setShowResults(true);
      toast.success("Assessment URL copied to clipboard (anonymous)!");
    } catch (error) {
      console.error('Error sharing assessment:', error);
      toast.error("Failed to create shareable URL, but you can still view results");
      setShowCompanyStep(false);
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setShowResults(false);
    setShowCompanyStep(false);
    setAssessmentData(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {!showCompanyStep && !showResults ? (
        <NewTechStackAssessment onComplete={handleAssessmentComplete} />
      ) : showCompanyStep ? (
        <CompanyNameStep 
          onSaveToDatabase={handleSaveToDatabase}
          onShareWithCompany={handleShareWithCompany}
          onShareAnonymous={handleShareAnonymous}
        />
      ) : (
        <AssessmentResults data={assessmentData!} onRestart={handleRestart} />
      )}
    </div>
  );
};

export default Index;