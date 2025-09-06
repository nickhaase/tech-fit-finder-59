-- Secure public access to assessments by removing overly permissive SELECT and introducing parameterized RPC

-- 1) Drop overly permissive public SELECT policies
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'assessments' 
      AND policyname = 'Public can view assessment results by unique URL')
  THEN
    EXECUTE 'DROP POLICY "Public can view assessment results by unique URL" ON public.assessments;';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'assessment_results' 
      AND policyname = 'Public can view assessment results data')
  THEN
    EXECUTE 'DROP POLICY "Public can view assessment results data" ON public.assessment_results;';
  END IF;
END $$;

-- 2) Create a SECURITY DEFINER RPC to fetch one assessment bundle by unique_url
CREATE OR REPLACE FUNCTION public.get_assessment_bundle_by_unique_url(u TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a_row public.assessments%ROWTYPE;
  r_row public.assessment_results%ROWTYPE;
  c_row public.companies%ROWTYPE;
  result JSONB;
BEGIN
  -- Look up assessment by unique URL
  SELECT * INTO a_row
  FROM public.assessments
  WHERE unique_url = u
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Fetch associated results (may be NULL if not yet computed)
  SELECT * INTO r_row
  FROM public.assessment_results
  WHERE assessment_id = a_row.id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Fetch company (optional)
  IF a_row.company_id IS NOT NULL THEN
    SELECT * INTO c_row
    FROM public.companies
    WHERE id = a_row.company_id;
  END IF;

  result := jsonb_build_object(
    'assessment', to_jsonb(a_row),
    'results', to_jsonb(r_row),
    'company', to_jsonb(c_row)
  );

  RETURN result;
END;
$$;

-- 3) Grant execute on the RPC to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_assessment_bundle_by_unique_url(TEXT) TO anon, authenticated;