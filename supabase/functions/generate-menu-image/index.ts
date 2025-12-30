import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { itemName, customPrompt, menuItemId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Base prompt that ensures only the product is shown, without additional items
    let prompt = `Professional food photography of a single ${itemName}, isolated product only, no other food items, no accompaniments, no plates with multiple items. Clean white or neutral background, soft studio lighting, high-end commercial photography style, sharp focus on the product, appetizing presentation.`;
    
    // Add custom instructions if provided
    if (customPrompt && customPrompt.trim()) {
      prompt += ` Additional style: ${customPrompt.trim()}.`;
    }
    
    prompt += ` Ultra realistic, 4K quality, professional food styling.`;

    console.log("Generating image for:", itemName);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          { role: "user", content: prompt }
        ],
        modalities: ["image", "text"]
      }),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");
    
    const base64ImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!base64ImageUrl) {
      console.error("No image URL found in response");
      throw new Error("No image generated");
    }

    // Extract base64 data and convert to blob
    const base64Data = base64ImageUrl.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Create Supabase client with service role for storage upload
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = itemName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
    const fileName = `${menuItemId || 'item'}-${sanitizedName}-${timestamp}.png`;
    
    console.log("Uploading image to storage:", fileName);
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(fileName, imageBytes, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('menu-images')
      .getPublicUrl(fileName);
    
    const imageUrl = publicUrlData.publicUrl;
    console.log("Image uploaded successfully:", imageUrl);

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating image:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
