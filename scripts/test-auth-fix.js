// Test authentication fix for pricing and subscription pages
// Run this in your browser console while on the pricing or subscription/manage page

console.log('🔍 Testing Authentication Fix...\n');

// 1. Check if user is authenticated
const checkAuth = async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting session:', error);
      return null;
    }
    
    if (session) {
      console.log('✅ User is authenticated');
      console.log('📧 Email:', session.user.email);
      console.log('🔑 Session expires:', new Date(session.expires_at * 1000).toLocaleString());
      return session;
    } else {
      console.log('❌ No active session found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking auth:', error);
    return null;
  }
};

// 2. Check localStorage for auth data
const checkLocalStorage = () => {
  console.log('\n📦 Checking localStorage...');
  const authKey = Object.keys(localStorage).find(key => key.includes('supabase.auth.token'));
  
  if (authKey) {
    console.log('✅ Auth token found in localStorage');
    try {
      const authData = JSON.parse(localStorage.getItem(authKey));
      console.log('Token expires at:', new Date(authData.expires_at * 1000).toLocaleString());
    } catch (e) {
      console.error('❌ Failed to parse auth data');
    }
  } else {
    console.log('❌ No auth token in localStorage');
  }
};

// 3. Check current page
const checkCurrentPage = () => {
  console.log('\n📍 Current page:', window.location.pathname);
  console.log('🔗 Full URL:', window.location.href);
};

// Run all checks
(async () => {
  checkCurrentPage();
  checkLocalStorage();
  console.log('\n🔐 Checking authentication...');
  await checkAuth();
  
  console.log('\n✅ Diagnostic complete!');
  console.log('\n💡 If you see "User is authenticated" but still get redirected:');
  console.log('   1. Check browser console for errors');
  console.log('   2. Try clearing cache and hard refresh (Ctrl+Shift+R)');
  console.log('   3. Check if auth context is loading properly');
})();
