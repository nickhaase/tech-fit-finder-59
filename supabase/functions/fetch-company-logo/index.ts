import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, companyId } = await req.json();
    
    if (!companyName || !companyId) {
      return new Response(JSON.stringify({ error: 'Company name and ID are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Fetching logo for company: ${companyName}`);

    let logoUrl: string | null = null;
    let storedLogoUrl: string | null = null;

    // Try Clearbit Logo API first
    try {
      const domain = `${companyName.toLowerCase().replace(/\s+/g, '')}.com`;
      const clearbitUrl = `https://logo.clearbit.com/${domain}`;
      
      const response = await fetch(clearbitUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        logoUrl = clearbitUrl;
        console.log(`Found logo via Clearbit: ${logoUrl}`);
      }
    } catch (error) {
      console.log('Clearbit API failed, trying alternative methods:', error.message);
    }

    // Fallback: Try to construct common logo URLs
    if (!logoUrl) {
      const commonDomains = [
        `${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        `${companyName.toLowerCase().replace(/\s+/g, '')}.io`,
        `${companyName.toLowerCase().replace(/\s+/g, '')}.net`
      ];

      for (const domain of commonDomains) {
        try {
          const testUrl = `https://logo.clearbit.com/${domain}`;
          const response = await fetch(testUrl, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(3000)
          });
          
          if (response.ok) {
            logoUrl = testUrl;
            console.log(`Found logo via domain test: ${logoUrl}`);
            break;
          }
        } catch (error) {
          // Continue to next domain
        }
      }
    }

    // If we found a logo URL, download and store it in Supabase Storage
    if (logoUrl) {
      try {
        console.log(`Downloading logo from: ${logoUrl}`);
        const logoResponse = await fetch(logoUrl, { 
          signal: AbortSignal.timeout(10000)
        });
        
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          const fileName = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.png`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('company-logos')
            .upload(fileName, logoBlob, {
              contentType: 'image/png',
              upsert: false
            });

          if (uploadError) {
            console.error('Error uploading logo to storage:', uploadError);
          } else {
            // Get the public URL
            const { data: publicUrlData } = supabase.storage
              .from('company-logos')
              .getPublicUrl(fileName);
            
            storedLogoUrl = publicUrlData.publicUrl;
            console.log(`Logo uploaded to storage: ${storedLogoUrl}`);
          }
        }
      } catch (error) {
        console.error('Error downloading/storing logo:', error);
      }
    }

    // Update company with logo URL (prefer stored URL over external URL)
    const finalLogoUrl = storedLogoUrl || logoUrl;
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        logo_url: finalLogoUrl,
        logo_cached_at: new Date().toISOString()
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('Error updating company logo:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update company logo' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Successfully updated logo for ${companyName}: ${finalLogoUrl || 'No logo found'}`);

    return new Response(JSON.stringify({ 
      success: true, 
      logoUrl: finalLogoUrl,
      storedInStorage: !!storedLogoUrl,
      message: finalLogoUrl ? 'Logo found and cached in Storage' : 'No logo found, but company updated'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in fetch-company-logo function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});