import { AssessmentService } from '@/services/assessmentService';
import { AssessmentData } from '@/types/assessment';

export const createTestAssessment = async (): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const testData: AssessmentData = {
      mode: 'quick',
      company: {
        size: 'medium',
        industry: 'manufacturing'
      },
      goals: ['Improve efficiency'],
      integrations: {
        sensorsMonitoring: [],
        automationScada: [],
        otherSystems: []
      },
      integrationPatterns: [],
      scorecard: {
        compatibilityPercent: 85,
        integrationsFound: 3,
        goalsMatched: 2,
        complexity: 'Medium'
      }
    };

    console.log('🧪 Creating test assessment...');
    const result = await AssessmentService.saveAssessment(testData, 'Test Company');
    
    console.log('✅ Test assessment created:', result);
    return { 
      success: true, 
      url: `${window.location.origin}/assessment/${result.uniqueUrl}`
    };
  } catch (error) {
    console.error('❌ Test assessment failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};