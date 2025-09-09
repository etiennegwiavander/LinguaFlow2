// Script to identify and clean up orphaned auth users
// These are users that exist in Supabase Auth but don't have corresponding tutor records

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findOrphanedUsers() {
  console.log("🔍 Finding orphaned auth users...\n");

  try {
    // Get all auth users
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error fetching auth users:", authError);
      return [];
    }

    console.log(`Found ${authUsers.users.length} auth users`);

    // Get all tutor records
    const { data: tutors, error: tutorError } = await supabase
      .from("tutors")
      .select("id, email");

    if (tutorError) {
      console.error("❌ Error fetching tutors:", tutorError);
      return [];
    }

    console.log(`Found ${tutors.length} tutor records`);

    // Find orphaned users (auth users without tutor records)
    const tutorIds = new Set(tutors.map((t) => t.id));
    const orphanedUsers = authUsers.users.filter(
      (user) => !tutorIds.has(user.id)
    );

    console.log(`\n📊 Found ${orphanedUsers.length} orphaned auth users:`);

    orphanedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Confirmed: ${user.email_confirmed_at ? "Yes" : "No"}`);
      console.log("");
    });

    return orphanedUsers;
  } catch (error) {
    console.error("❌ Error finding orphaned users:", error);
    return [];
  }
}

async function cleanupOrphanedUser(userId, email) {
  try {
    console.log(`🧹 Cleaning up orphaned user: ${email}`);

    // Delete the auth user
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error(`❌ Error deleting user ${email}:`, error);
      return false;
    }

    console.log(`✅ Successfully deleted orphaned user: ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error cleaning up user ${email}:`, error);
    return false;
  }
}

async function cleanupAllOrphanedUsers(orphanedUsers) {
  if (orphanedUsers.length === 0) {
    console.log("✅ No orphaned users found. Database is clean!");
    return;
  }

  console.log(`\n🧹 Cleaning up ${orphanedUsers.length} orphaned users...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const user of orphanedUsers) {
    const success = await cleanupOrphanedUser(user.id, user.email);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Cleanup Results:`);
  console.log(`✅ Successfully cleaned: ${successCount} users`);
  console.log(`❌ Failed to clean: ${failCount} users`);

  if (successCount > 0) {
    console.log("\n🎉 Orphaned users have been cleaned up!");
    console.log(
      "You can now try registering with those email addresses again."
    );
  }
}

async function main() {
  console.log("🚀 Starting orphaned user cleanup...\n");

  const orphanedUsers = await findOrphanedUsers();

  if (orphanedUsers.length > 0) {
    // Ask for confirmation (in a real scenario, you might want to add a prompt)
    console.log("⚠️  This will permanently delete the orphaned auth users.");
    console.log(
      "They will be able to register again with the same email addresses.\n"
    );

    await cleanupAllOrphanedUsers(orphanedUsers);
  }

  console.log("\n✨ Cleanup process completed!");
}

main().catch(console.error);
