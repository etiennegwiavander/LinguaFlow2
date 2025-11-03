# Lesson Reminders Cron Setup Guide

## Problem
The automated lesson reminder cron job was failing because it required the `pg_net` extension (for `net.http_post`), which is not available in all Supabase plans.

## Solution
Use an external cron service or Supabase's Edge Function scheduling to trigger the reminder function every 5 minutes.

## Option 1: Use an External Cron Service (Recommended)

### Services You Can Use:
- **Cron-job.org** (Free, reliable)
- **EasyCron** (Free tier available)
- **GitHub Actions** (Free for public repos)
- **Vercel Cron** (If deployed on Vercel)
- **Netlify Scheduled Functions** (If deployed on Netlify)

### Setup Steps:

1. **Get your Edge Function URL:**
   ```
   https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/schedule-lesson-reminders
   ```

2. **Get your Service Role Key:**
   - Go to Supabase Dashboard → Project Settings → API
   - Copy the `service_role` key (keep it secret!)

3. **Configure the cron service:**
   - **URL**: `https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/schedule-lesson-reminders`
   - **Method**: POST
   - **Headers**:
     ```
     Authorization: Bearer YOUR_SERVICE_ROLE_KEY
     Content-Type: application/json
     ```
   - **Body** (optional):
     ```json
     {
       "timestamp": "{{timestamp}}"
     }
     ```
   - **Schedule**: Every 5 minutes (`*/5 * * * *`)

### Example: Using cron-job.org

1. Go to https://cron-job.org
2. Create a free account
3. Click "Create Cronjob"
4. Fill in:
   - **Title**: LinguaFlow Lesson Reminders
   - **URL**: Your Edge Function URL
   - **Schedule**: Every 5 minutes
   - **Request Method**: POST
   - **Headers**: Add Authorization header with your service role key
5. Save and enable

## Option 2: Use GitHub Actions (Free)

Create `.github/workflows/lesson-reminders.yml`:

\`\`\`yaml
name: Lesson Reminders Cron

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  trigger-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Lesson Reminders
        run: |
          curl -X POST \\
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \\
            -H "Content-Type: application/json" \\
            -d '{"timestamp": "'$(date +%s)'"}' \\
            https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/schedule-lesson-reminders
\`\`\`

Then add `SUPABASE_SERVICE_ROLE_KEY` to your GitHub repository secrets.

## Option 3: Use Netlify Scheduled Functions

If you're deploying on Netlify, create `netlify/functions/lesson-reminders-cron.js`:

\`\`\`javascript
const { schedule } = require('@netlify/functions');

const handler = async (event) => {
  try {
    const response = await fetch(
      'https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/schedule-lesson-reminders',
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${process.env.SUPABASE_SERVICE_ROLE_KEY}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timestamp: Date.now() })
      }
    );
    
    const data = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Run every 5 minutes
module.exports.handler = schedule('*/5 * * * *', handler);
\`\`\`

## Testing

To manually test the reminder system:

\`\`\`powershell
node scripts/trigger-reminder-manually.js
\`\`\`

Or use curl:

\`\`\`bash
curl -X POST \\
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \\
  -H "Content-Type: application/json" \\
  https://urmuwjcjcyohsrkgyapl.supabase.co/functions/v1/schedule-lesson-reminders
\`\`\`

## Verification

1. Create a test lesson 32 minutes in the future
2. Wait for the cron to run (within 5 minutes)
3. Check your email for the reminder
4. Check email logs:
   \`\`\`powershell
   node scripts/check-email-error-logs.js
   \`\`\`

## Current Status

✅ Edge Function deployed and working
✅ Email system configured
✅ Database schema fixed
⏳ Waiting for external cron setup

Once you set up the external cron service, the 30-minute lesson reminders will work automatically!
