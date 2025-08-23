// @ts-ignore: Deno import for Edge Function
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore: Deno npm import
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GenerateDescriptionRequest {
  student_id: string;
  topic_title: string;
}

interface Student {
  id: string;
  name: string;
  target_language: string;
  native_language: string | null;
  level: string;
  age_group?: string;
  end_goals: string | null;
  learning_styles: string[] | null;
}

// Generate personalized topic description
function generateTopicDescription(
  student: Student,
  topicTitle: string
): string {
  const targetLanguage =
    student.target_language === "en" ? "English" : student.target_language;
  const level = student.level.toUpperCase();
  const ageGroup = student.age_group || "adult";
  const goals = student.end_goals || "language learning";

  // Create personalized description based on student profile
  const descriptions = [
    `Explore ${topicTitle} through ${level}-level ${targetLanguage} conversation practice. `,
    `This topic is designed for ${ageGroup} learners focusing on ${goals}. `,
    `Practice vocabulary, grammar, and fluency while discussing ${topicTitle} in meaningful ways. `,
    `Questions will be tailored to your ${level} proficiency level and learning objectives.`,
  ];

  // Add level-specific context
  if (student.level === "a1" || student.level === "a2") {
    descriptions.push(
      ` Focus on basic vocabulary and simple sentence structures related to ${topicTitle}.`
    );
  } else if (student.level === "b1" || student.level === "b2") {
    descriptions.push(
      ` Develop intermediate conversation skills with opinion-sharing and detailed explanations about ${topicTitle}.`
    );
  } else {
    descriptions.push(
      ` Engage in advanced discussions with complex analysis and critical thinking about ${topicTitle}.`
    );
  }

  return descriptions.join("");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🚀 Generate Topic Description function called");

    // Parse request body
    const { student_id, topic_title }: GenerateDescriptionRequest =
      await req.json();

    // Validate required fields
    if (!student_id || !topic_title) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: student_id and topic_title",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get student information
    console.log("📚 Fetching student information...");
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("id", student_id)
      .single();

    if (studentError || !student) {
      console.error("❌ Student fetch error:", studentError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Student not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Student found:", student.name);

    // Generate personalized description
    console.log("📝 Generating topic description...");
    const description = generateTopicDescription(student, topic_title);

    console.log("✅ Description generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        description: description,
        message: `Generated description for "${topic_title}"`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("💥 Function error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
