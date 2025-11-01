require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testWelcomeEmail() {
  console.log("🧪 Testing welcome email function...\n");

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-welcome-email`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "linguaflowservices@gmail.com", // Your verified email
          firstName: "Test",
          lastName: "User",
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Welcome email sent successfully!");
      console.log("Response:", JSON.stringify(data, null, 2));
    } else {
      console.log("❌ Failed to send welcome email");
      console.log("Error:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testWelcomeEmail();
