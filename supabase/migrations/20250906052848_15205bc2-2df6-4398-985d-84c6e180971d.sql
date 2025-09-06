-- Add anonymous access policies for public assessment sharing

-- Allow anonymous inserts into companies table for company names
CREATE POLICY "Allow anonymous inserts for companies"
ON public.companies
FOR INSERT
WITH CHECK (true);

-- Allow anonymous inserts into assessments table
CREATE POLICY "Allow anonymous inserts for assessments" 
ON public.assessments
FOR INSERT
WITH CHECK (true);

-- Allow anonymous inserts into assessment_results table
CREATE POLICY "Allow anonymous inserts for assessment_results"
ON public.assessment_results
FOR INSERT  
WITH CHECK (true);