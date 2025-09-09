# Infinite Recursion RLS Policy Fix

## Issue
When trying to create a tutor profile during user registration, the system threw an error:
```
Failed to create tutor profile: infinite recursion detected in policy for relation "tutors"
```

## Root Cause
The RLS (Row Level Security) policy I created was causing infinite recursion:

```sql
-- PROBLEMATIC POLICY (caused recursion)
CREATE POLICY "Tutors can view own record and admins can view all" ON tutors
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM tutors admin_tutor  -- ❌ Querying tutors table within tutors policy!
      WHERE admin_tutor.id = auth.uid() 
      AND admin_tutor.is_admin = true
    )
  );
```

The policy was trying to check if a user is an admin by querying the same `tutors` table that the policy is protecting, creating a circular reference.

## Solution
Created a non-recursive solution using a `SECURITY DEFINER` function:

```sql
-- Create a function that bypasses RLS to check admin status
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER  -- This bypasses RLS
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM tutors WHERE id = user_id LIMIT 1),
    false
  );
$$;

-- Use the function in the policy (no recursion)
CREATE POLICY "Admins can manage all tutors" ON tutors
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()) OR auth.uid() = id)
  WITH CHECK (is_admin_user(auth.uid()) OR auth.uid() = id);
```

## Key Changes

### 1. Removed Recursive Policies
- Dropped all policies that queried the `tutors` table within `tutors` table policies

### 2. Created Non-Recursive Function
- `is_admin_user()` function uses `SECURITY DEFINER` to bypass RLS
- Function directly queries the table without triggering policy checks

### 3. Simplified Policy Structure
- Users can view/update their own records
- Admins can manage all records (using the non-recursive function)
- New users can insert their own records during registration

## Files Modified
- `supabase/migrations/20250909000006_fix_recursive_rls_policy.sql` - Fixed RLS policies

## Testing
Created test script to verify:
- User registration works without infinite recursion
- Admin function works correctly
- No circular policy dependencies

## Security Considerations
- `SECURITY DEFINER` function runs with elevated privileges
- Function is simple and only checks admin status
- Still maintains proper access control through RLS policies

## Alternative Approaches Considered

1. **Disable RLS entirely** - Not secure, rejected
2. **Use service role for all operations** - Good for admin operations, but users still need basic access
3. **Separate admin table** - More complex, not needed for current requirements
4. **Hard-coded admin UUIDs** - Less flexible, harder to maintain

## Result
✅ User registration now works without infinite recursion errors
✅ Admin operations still work through API routes
✅ Proper security maintained with non-recursive policies