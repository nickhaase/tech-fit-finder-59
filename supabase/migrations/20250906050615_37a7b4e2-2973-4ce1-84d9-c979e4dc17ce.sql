
-- Update admin email-based RLS policies to include nick@getmaintainx.com

-- assessments: allow all operations for admin users
DROP POLICY IF EXISTS "Allow all operations for admin users on assessments" ON public.assessments;

CREATE POLICY "Allow all operations for admin users on assessments"
ON public.assessments
FOR ALL
USING (
  (auth.jwt() ->> 'email') = ANY (
    ARRAY[
      'admin@maintainx.com',
      'nick@maintainx.com',
      'nick@getmaintainx.com'
    ]
  )
)
WITH CHECK (
  (auth.jwt() ->> 'email') = ANY (
    ARRAY[
      'admin@maintainx.com',
      'nick@maintainx.com',
      'nick@getmaintainx.com'
    ]
  )
);

-- assessment_results: allow all operations for admin users
DROP POLICY IF EXISTS "Allow all operations for admin users on results" ON public.assessment_results;

CREATE POLICY "Allow all operations for admin users on results"
ON public.assessment_results
FOR ALL
USING (
  (auth.jwt() ->> 'email') = ANY (
    ARRAY[
      'admin@maintainx.com',
      'nick@maintainx.com',
      'nick@getmaintainx.com'
    ]
  )
)
WITH CHECK (
  (auth.jwt() ->> 'email') = ANY (
    ARRAY[
      'admin@maintainx.com',
      'nick@maintainx.com',
      'nick@getmaintainx.com'
    ]
  )
);

-- companies: allow all operations for admin users
DROP POLICY IF EXISTS "Allow all operations for admin users" ON public.companies;

CREATE POLICY "Allow all operations for admin users"
ON public.companies
FOR ALL
USING (
  (auth.jwt() ->> 'email') = ANY (
    ARRAY[
      'admin@maintainx.com',
      'nick@maintainx.com',
      'nick@getmaintainx.com'
    ]
  )
)
WITH CHECK (
  (auth.jwt() ->> 'email') = ANY (
    ARRAY[
      'admin@maintainx.com',
      'nick@maintainx.com',
      'nick@getmaintainx.com'
    ]
  )
);
