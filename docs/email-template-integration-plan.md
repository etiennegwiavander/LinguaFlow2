# Email Template Integration Plan

## Current Status
✅ Hybrid email system complete (Resend HTTP API + SMTP)
✅ SMTP configuration UI working
✅ Resend configuration tested and validated
✅ Unified email sender created (`lib/unified-email-sender.ts`)

## Email Sending Points in the App

### 1. Welcome Emails
**Location:** `supabase/functions/send-welcome-email/index.ts`
**Trigger:** When new user signs up
**Status:** ⚠️ Needs integration with unified sender

### 2. Password Reset Emails
**Location:** `app/api/auth/reset-password/route.ts`
**Trigger:** When user requests password reset
**Status:** ⚠️ Needs integration with unified sender

### 3. Test Emails
**Location:** `supabase/functions/send-test-email/index.ts`
**Trigger:** Admin testing SMTP config
**Status:** ✅ Already uses test endpoint

### 4. Integrated Email Service
**Location:** `supabase/functions/send-integrated-email/index.ts`
**Purpose:** General email sending service
**Status:** ⚠️ Needs integration with unified sender

## Integration Steps

### Step 1: Create Email Sending Service
Create a centralized service that:
- Fetches active SMTP config from database
- Uses unified sender to send emails
- Handles errors gracefully
- Logs email attempts

### Step 2: Update Welcome Email
Modify `send-welcome-email` to use the new service

### Step 3: Update Password Reset
Modify password reset flow to use the new service

### Step 4: Update Other Email Points
Update any other email sending points

## Implementation Approach

```typescript
// New service: lib/email-sender-service.ts
export async function sendEmailWithActiveConfig(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  // 1. Get active SMTP config from database
  // 2. Use unified sender
  // 3. Log to email_logs table
  // 4. Return result
}
```

## Next Steps
1. Create centralized email sending service
2. Update welcome email integration
3. Update password reset integration
4. Test end-to-end email flow
5. Document for production use
