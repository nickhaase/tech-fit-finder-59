-- Create companies table for company information and logo caching
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  logo_cached_at TIMESTAMP WITH TIME ZONE,
  industry TEXT,
  size TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assessments table to store all submission data
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  assessment_data JSONB NOT NULL,
  unique_url TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assessment_results table for computed results and visualizations
CREATE TABLE public.assessment_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  scorecard_data JSONB NOT NULL,
  visualizations JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access on shared assessments
CREATE POLICY "Public can view assessment results by unique URL" 
ON public.assessments 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view assessment results data" 
ON public.assessment_results 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view company data for assessments" 
ON public.companies 
FOR SELECT 
USING (true);

-- Create policies for admin access (we'll use a simple admin role approach)
CREATE POLICY "Allow all operations for admin users" 
ON public.companies 
FOR ALL 
USING (auth.jwt() ->> 'email' IN ('admin@maintainx.com', 'nick@maintainx.com'));

CREATE POLICY "Allow all operations for admin users on assessments" 
ON public.assessments 
FOR ALL 
USING (auth.jwt() ->> 'email' IN ('admin@maintainx.com', 'nick@maintainx.com'));

CREATE POLICY "Allow all operations for admin users on results" 
ON public.assessment_results 
FOR ALL 
USING (auth.jwt() ->> 'email' IN ('admin@maintainx.com', 'nick@maintainx.com'));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indices for performance
CREATE INDEX idx_assessments_unique_url ON public.assessments(unique_url);
CREATE INDEX idx_assessments_company_id ON public.assessments(company_id);
CREATE INDEX idx_assessments_created_at ON public.assessments(created_at DESC);
CREATE INDEX idx_companies_name ON public.companies(name);
CREATE INDEX idx_assessment_results_assessment_id ON public.assessment_results(assessment_id);