import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as bcrypt from "npm:bcrypt@5.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get request body
    const { username, password } = await req.json();

    // Validate input
    if (!username || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Username and password are required" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get admin credentials from database
    const { data: adminData, error: adminError } = await supabaseClient
      .from("admin_credentials")
      .select("*")
      .eq("username", username)
      .single();

    if (adminError || !adminData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid username or password" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }

    // Compare password with hashed password in database
    const passwordMatch = await bcrypt.compare(password, adminData.hashed_password);

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid username or password" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }

    // Get tutor data
    const { data: tutorData, error: tutorError } = await supabaseClient
      .from("tutors")
      .select("id, name, email, avatar_url, is_admin")
      .eq("is_admin", true)
      .eq("email", adminData.username)
      .single();

    if (tutorError || !tutorData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Admin account not found in tutors table" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }

    // Create admin session
    const adminSession = {
      loggedIn: true,
      username: adminData.username,
      tutorId: tutorData.id,
      name: tutorData.name,
      email: tutorData.email,
      avatar_url: tutorData.avatar_url,
      timestamp: Date.now()
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        session: adminSession 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal server error" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});