-- Create feature_flags table for managing feature toggles
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Create policies for feature flags (admin only)
CREATE POLICY "Admin users can view feature flags" 
ON public.feature_flags 
FOR SELECT 
USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['admin@maintainx.com'::text, 'nick@maintainx.com'::text, 'nick@getmaintainx.com'::text]));

CREATE POLICY "Admin users can modify feature flags" 
ON public.feature_flags 
FOR ALL
USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['admin@maintainx.com'::text, 'nick@maintainx.com'::text, 'nick@getmaintainx.com'::text]));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial feature flags
INSERT INTO public.feature_flags (flag_name, enabled, description) VALUES 
('FOUNDRY', false, 'Enable Palantir Foundry brand and DataOps functionality including enhanced flow generation and visual indicators');