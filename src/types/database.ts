export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  logo_cached_at?: string;
  industry?: string;
  size?: string;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  company_id?: string;
  assessment_data: any;
  unique_url: string;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface AssessmentResult {
  id: string;
  assessment_id: string;
  scorecard_data: any;
  visualizations?: any;
  created_at: string;
  updated_at: string;
}