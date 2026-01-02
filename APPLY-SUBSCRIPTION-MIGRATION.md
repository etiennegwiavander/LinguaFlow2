# Apply Subscription System Migration

## Quick Start - Manual Application (Recommended)

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/urmuwjcjcyohsrkgyapl/sql

### Step 2: Copy Migration SQL
Open the file: `supabase/migrations/20260102000001_create_subscription_system.sql`

Copy ALL the contents (it's a large file with ~500 lines)

### Step 3: Execute in SQL Editor
1. Paste the entire SQL into the Supabase SQL Editor
2. Click "Run" button
3. Wait for execution to complete (should take 5-10 seconds)

### Step 4: Verify Installation
Run this command in your terminal:
```bash
node scripts/test-subscription-system.js
```

You should see:
```
✅ Found 4 subscription plans:
   - Free (Free)
   - Starter ($12/month)
   - Professional ($25/month)
   - Enterprise ($50/month)

✅ All tables accessible
✅ Usage tracking functions working
✅ Tranzak configuration verified
```

## What Gets Created

### Tables (5)
1. **subscription_plans** - 4 pricing tiers
2. **user_subscriptions** - User subscription records
3. **usage_tracking** - Monthly usage counters
4. **payment_transactions** - Payment history
5. **subscription_history** - Audit trail

### Functions (3)
1. **get_current_usage()** - Get tutor's current usage
2. **increment_usage()** - Increment usage counters
3. **create_usage_tracking_for_period()** - Auto-create usage records

### Columns Added to tutors table (2)
- `current_subscription_id` - Link to active subscription
- `subscription_status` - Current plan name

### Security (RLS Policies)
- Public can view active plans
- Tutors can only see their own data
- Service role has full access

## Troubleshooting

### If you see "relation already exists" errors
This is normal if you run the migration twice. The migration uses `IF NOT EXISTS` and `ON CONFLICT` to handle this safely.

### If you see permission errors
Make sure you're logged into the correct Supabase project and have admin access.

### If tables aren't created
Check the SQL Editor output for specific error messages. Most common issues:
- Missing `tutors` table (should already exist)
- Network timeout (try again)

## After Successful Migration

Once verified, you're ready for **Phase 2: Payment Integration**!

Next steps will include:
- Checkout flow UI
- Payment processing with Tranzak
- Webhook handling
- Subscription management dashboard
