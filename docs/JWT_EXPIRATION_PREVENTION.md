# JWT Expiration Prevention Guide

## Overview

This guide explains how to prevent "JWT expired" errors in your application using the enhanced authentication system with automatic token refresh.

## What Was Implemented

### 1. Enhanced Supabase Client (`lib/supabase.ts`)

The Supabase client now includes:
- **Automatic token refresh** before expiration (5 minutes before expiry)
- **Persistent sessions** in localStorage
- **Enhanced error handling** with automatic retry on JWT expiration
- **Request wrapper** for automatic token refresh

### 2. Proactive Session Monitoring (`lib/auth-context.tsx`)

The auth context now includes:
- **Proactive session refresh** every 5 minutes
- **Token expiration monitoring** (refreshes when < 10 minutes remaining)
- **Enhanced error handling** for authentication failures

### 3. Request Wrapper Utilities

- **`supabaseRequest()`** - Wraps any Supabase request with automatic JWT refresh
- **`useSupabaseQuery()`** - React hook for JWT-safe database queries
- **`handleSupabaseError()`** - Centralized JWT error handling

## How to Use

### Method 1: Using `supabaseRequest()` Wrapper

```typescript
import { supabaseRequest } from '@/lib/supabase';

// Instead of this (old way):
const { data, error } = await supabase
  .from('lessons')
  .select('*')
  .eq('id', lessonId);

// Use this (JWT-safe way):
const { data, error } = await supabaseRequest(() =>
  supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
);
```

### Method 2: Using React Hooks

```typescript
import { useSupabaseFetch, useSupabaseMutation } from '@/hooks/useSupabaseQuery';

function MyComponent() {
  const { execute: fetchLessons, loading, error } = useSupabaseFetch();
  const { execute: updateLesson } = useSupabaseMutation();

  const loadLessons = async () => {
    const result = await fetchLessons(() =>
      supabase
        .from('lessons')
        .select('*')
        .eq('tutor_id', user.id)
    );
    
    if (result.data) {
      setLessons(result.data);
    }
  };

  const saveLesson = async (lessonData) => {
    const result = await updateLesson(() =>
      supabase
        .from('lessons')
        .update(lessonData)
        .eq('id', lessonId)
    );
    
    if (result.data) {
      toast.success('Lesson saved successfully!');
    }
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {/* Your component content */}
    </div>
  );
}
```

### Method 3: Direct Error Handling

```typescript
import { handleSupabaseError } from '@/lib/supabase';

const fetchData = async () => {
  try {
    const { data, error } = await supabase
      .from('table')
      .select('*');
    
    if (error) {
      // This will automatically handle JWT expiration and retry
      return await handleSupabaseError(error, () =>
        supabase.from('table').select('*')
      );
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Request failed:', error);
  }
};
```

## Key Features

### 🔄 Automatic Token Refresh
- Tokens refresh automatically 5 minutes before expiration
- Proactive monitoring prevents expiration during user activity
- Seamless background refresh without user interruption

### 🔁 Automatic Retry
- Failed requests due to JWT expiration are automatically retried
- Original request is executed again with fresh token
- No data loss or user disruption

### 🛡️ Graceful Fallbacks
- If token refresh fails, user is redirected to login
- Clear error messages for authentication issues
- Maintains application stability

### ⚡ Performance Optimized
- Minimal overhead with smart caching
- Only refreshes when necessary
- Background processing doesn't block UI

## Migration Guide

### Update Existing Code

1. **Replace direct Supabase calls:**
```typescript
// Before
const { data, error } = await supabase.from('table').select('*');

// After
const { data, error } = await supabaseRequest(() =>
  supabase.from('table').select('*')
);
```

2. **Use React hooks for components:**
```typescript
// Before
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase.from('table').select('*');
    // Handle response...
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// After
const { execute: fetchData, loading, error } = useSupabaseFetch();

const loadData = async () => {
  const result = await fetchData(() =>
    supabase.from('table').select('*')
  );
  // Handle result...
};
```

3. **Update API routes:**
```typescript
// In your API routes, use the enhanced error handling
import { handleSupabaseError } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { data, error } = await supabase
      .from('table')
      .insert(requestData);
    
    if (error) {
      // Handle JWT expiration automatically
      const result = await handleSupabaseError(error, () =>
        supabase.from('table').insert(requestData)
      );
      return Response.json(result);
    }
    
    return Response.json({ data, error: null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

## Configuration Options

### Supabase Client Configuration
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,        // Enable automatic refresh
    persistSession: true,          // Save session in localStorage
    detectSessionInUrl: true,      // Handle OAuth redirects
    refreshTokenMargin: 300,       // Refresh 5 minutes before expiry
  },
});
```

### Hook Configuration
```typescript
const { execute } = useSupabaseFetch({
  showErrorToast: false,          // Disable automatic error toasts
  errorMessage: 'Custom error'    // Override error message
});
```

## Best Practices

1. **Always use the wrapper functions** for database operations
2. **Handle loading states** properly in your UI
3. **Provide user feedback** for long-running operations
4. **Test token expiration scenarios** during development
5. **Monitor authentication errors** in production

## Troubleshooting

### Common Issues

1. **"JWT expired" still appearing:**
   - Ensure you're using `supabaseRequest()` or the hooks
   - Check that automatic refresh is enabled
   - Verify network connectivity for refresh requests

2. **Infinite redirect loops:**
   - Check UNPROTECTED_ROUTES in auth-context.tsx
   - Ensure login page is accessible without authentication

3. **Session not persisting:**
   - Verify localStorage is available
   - Check browser privacy settings
   - Ensure persistSession is enabled

### Debug Mode

Enable debug logging:
```typescript
// Add to your component
useEffect(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event, session?.expires_at);
  });
}, []);
```

## Summary

The enhanced JWT system provides:
- ✅ **Automatic token refresh** before expiration
- ✅ **Seamless retry mechanism** for expired tokens
- ✅ **Proactive session monitoring**
- ✅ **Easy-to-use wrapper functions**
- ✅ **React hooks for components**
- ✅ **Graceful error handling**

No more "JWT expired" errors! 🎉