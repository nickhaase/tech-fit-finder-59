import { supabase } from "@/integrations/supabase/client";
import { AssessmentData } from "@/types/assessment";
import { Company, Assessment, AssessmentResult } from "@/types/database";
import { migrateAssessmentData, needsCategoryMigration } from '@/utils/categoryMigration';

export class AssessmentService {
  static async saveAssessment(assessmentData: AssessmentData, companyName?: string): Promise<{ uniqueUrl: string; assessmentId: string }> {
    try {
      // Migrate assessment data if needed for backward compatibility
      let migratedData = assessmentData;
      if (needsCategoryMigration(assessmentData)) {
        console.log('🔄 Migrating assessment data for category compatibility...');
        migratedData = migrateAssessmentData(assessmentData);
      }
      
      let companyId: string | undefined;

      // Create or get company if provided
      if (companyName) {
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('name', companyName)
          .single();

        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          // Create new company
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({
              name: companyName,
              industry: migratedData.company.industry,
              size: migratedData.company.size
            })
            .select('id')
            .single();

          if (companyError) throw companyError;
          companyId = newCompany.id;

          // Trigger logo fetch for new company
          this.fetchCompanyLogo(companyName, companyId);
        }
      }

      // Save assessment with migrated data
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          company_id: companyId,
          assessment_data: migratedData as any
        })
        .select('unique_url, id')
        .single();

      if (assessmentError) throw assessmentError;

      // Save assessment results
      const { error: resultsError } = await supabase
        .from('assessment_results')
        .insert({
          assessment_id: assessment.id,
          scorecard_data: assessmentData.scorecard
        });

      if (resultsError) throw resultsError;

      return { uniqueUrl: assessment.unique_url, assessmentId: assessment.id };
    } catch (error) {
      console.error('Error saving assessment:', error);
      throw error;
    }
  }

  static async getAssessmentByUrl(uniqueUrl: string): Promise<{ assessment: Assessment; results: AssessmentResult } | null> {
    try {
      // Use secure RPC to fetch a single assessment bundle by unique URL
      const { data, error } = await supabase.rpc('get_assessment_bundle_by_unique_url', { u: uniqueUrl });

      if (error || !data) {
        return null;
      }

      const bundle = data as any;
      const assessment = bundle.assessment as Assessment | null;
      const results = bundle.results as AssessmentResult | null;

      if (!assessment || !results) {
        return null;
      }

      return { assessment, results };
    } catch (error) {
      console.error('Error fetching assessment via RPC:', error);
      return null;
    }
  }

  static async getAllAssessments(): Promise<Assessment[]> {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          company:companies(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching assessments:', error);
      return [];
    }
  }

  private static async fetchCompanyLogo(companyName: string, companyId: string) {
    try {
      // Call our logo fetching edge function
      const { data, error } = await supabase.functions.invoke('fetch-company-logo', {
        body: { companyName, companyId }
      });

      if (error) {
        console.error('Error fetching company logo:', error);
      }
    } catch (error) {
      console.error('Error calling logo fetch function:', error);
    }
  }
}