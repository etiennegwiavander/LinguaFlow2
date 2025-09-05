# 📧 **Supabase Email Customization Guide for LinguaFlow**

## 🎯 **Overview**
This guide shows how to customize Supabase email templates and change the sender email from `noreply@mail.app.supabase.io` to your custom domain.

## 📝 **1. Customizing Email Templates**

### **Where to Configure:**
Email templates are configured in the **Supabase Dashboard**, not in code files.

### **Steps to Customize:**
1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Authentication** → **Email Templates**
3. Select **Reset Password** template
4. Customize the template with LinguaFlow branding

### **Custom Password Reset Template for LinguaFlow:**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your LinguaFlow Password</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #2563eb;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .security-note {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🌐 LinguaFlow</div>
            <h1 class="title">Reset Your Password</h1>
        </div>
        
        <div class="content">
            <p>Hello,</p>
            
            <p>We received a request to reset your password for your LinguaFlow account. If you made this request, click the button below to create a new password:</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Reset My Password</a>
            </div>
            
            <div class="security-note">
                <strong>🔒 Security Notice:</strong> This link will expire in 1 hour for your security. If you didn't request this password reset, you can safely ignore this email.
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3b82f6;">{{ .ConfirmationURL }}</p>
            
            <p>Need help? Contact our support team at <a href="mailto:support@linguaflow.com" style="color: #3b82f6;">support@linguaflow.com</a></p>
        </div>
        
        <div class="footer">
            <p><strong>LinguaFlow</strong> - Your AI-Powered Language Learning Platform</p>
            <p>This email was sent to {{ .Email }}. If you have any questions, please contact us.</p>
            <p>&copy; 2024 LinguaFlow. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```

## 📮 **2. Changing Sender Email Address**

### **Current Default:**
- Sender: `noreply@mail.app.supabase.io`
- This is Supabase's default SMTP service

### **Option A: Custom SMTP (Recommended)**

#### **Steps:**
1. **Supabase Dashboard** → Your Project → **Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Configure your email provider

#### **Example Configuration (using Gmail/Google Workspace):**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: noreply@linguaflow.com
SMTP Pass: [your-app-password]
SMTP Admin Email: admin@linguaflow.com
SMTP Sender Name: LinguaFlow
```

#### **Popular Email Providers:**

**Gmail/Google Workspace:**
```
Host: smtp.gmail.com
Port: 587
Security: STARTTLS
```

**SendGrid:**
```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Pass: [your-sendgrid-api-key]
```

**Mailgun:**
```
Host: smtp.mailgun.org
Port: 587
User: [your-mailgun-smtp-user]
Pass: [your-mailgun-smtp-password]
```

**AWS SES:**
```
Host: email-smtp.[region].amazonaws.com
Port: 587
User: [your-ses-smtp-user]
Pass: [your-ses-smtp-password]
```

### **Option B: Supabase Pro Plan Custom Domain**

If you're on Supabase Pro plan:
1. **Settings** → **Auth** → **Email**
2. Configure **Custom Email Domain**
3. Set up DNS records as instructed
4. Verify domain ownership

## 🔧 **3. Environment Variables (If Using Custom SMTP)**

Add these to your `.env.local` if you need to reference them in code:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@linguaflow.com
SMTP_FROM_NAME=LinguaFlow
SMTP_FROM_EMAIL=noreply@linguaflow.com
SUPPORT_EMAIL=support@linguaflow.com
```

## 📋 **4. Complete Setup Checklist**

### **Email Template Customization:**
- [ ] Access Supabase Dashboard → Authentication → Email Templates
- [ ] Select "Reset Password" template
- [ ] Replace with LinguaFlow-branded template
- [ ] Test with preview function
- [ ] Save changes

### **Custom SMTP Setup:**
- [ ] Choose email provider (Gmail, SendGrid, etc.)
- [ ] Create email account: `noreply@linguaflow.com`
- [ ] Generate app password/API key
- [ ] Configure SMTP settings in Supabase Dashboard
- [ ] Test email delivery
- [ ] Update DNS records if required

### **Domain Setup (Optional):**
- [ ] Purchase domain: `linguaflow.com`
- [ ] Set up email hosting
- [ ] Configure DNS MX records
- [ ] Verify domain in Supabase (Pro plan)

## 🧪 **5. Testing Your Setup**

### **Test Email Template:**
1. Go to **Authentication** → **Email Templates**
2. Click **Preview** on your custom template
3. Check formatting and links

### **Test SMTP Configuration:**
1. Use the password reset flow on your app
2. Check email delivery and formatting
3. Verify sender shows as "LinguaFlow <noreply@linguaflow.com>"

### **Test Code:**
```typescript
// Test password reset email
const { error } = await supabase.auth.resetPasswordForEmail(
  'test@example.com',
  {
    redirectTo: 'https://linguaflow.com/auth/reset-password'
  }
);
```

## 🎨 **6. Additional Customizations**

### **Other Email Templates to Customize:**
- **Confirm Signup** - Welcome new users
- **Magic Link** - For passwordless login
- **Email Change** - When users change email
- **Invite User** - For team invitations

### **Branding Elements:**
- Logo: Add LinguaFlow logo URL
- Colors: Use your brand colors (#3b82f6, etc.)
- Fonts: Match your website typography
- Footer: Add company information

## 📞 **7. Support Information**

### **Email Addresses to Set Up:**
- `noreply@linguaflow.com` - Automated emails
- `support@linguaflow.com` - Customer support
- `admin@linguaflow.com` - Administrative emails

### **DNS Records Needed:**
```
MX Record: linguaflow.com → [your-email-provider]
SPF Record: "v=spf1 include:[provider-spf] ~all"
DKIM Record: [provided by email service]
DMARC Record: "v=DMARC1; p=quarantine; rua=mailto:admin@linguaflow.com"
```

---

## 🎉 **Result**

After setup, your password reset emails will:
- ✅ Show "LinguaFlow" branding
- ✅ Come from `noreply@linguaflow.com`
- ✅ Have professional styling
- ✅ Include your support contact
- ✅ Match your brand identity

**Users will receive professional, branded emails that build trust and reinforce your LinguaFlow brand!** 📧