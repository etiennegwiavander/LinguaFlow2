# Complete Subscription User Flows

## Overview
This document addresses all user journey scenarios for the subscription system, including edge cases and navigation patterns.

---

## Flow 1: New User Wants to Subscribe (Not Signed Up)

### Scenario
A visitor browses the pricing page and wants to subscribe but doesn't have an account yet.

### User Journey
```
1. User visits /pricing
   ↓
2. User selects a paid plan (e.g., Professional)
   ↓
3. System detects user is not authenticated
   ↓
4. System saves plan selection to sessionStorage
   ↓
5. System redirects to /auth/login?redirect=/pricing
   ↓
6. User sees "Don't have an account? Sign up" link
   ↓
7. User clicks "Sign up" link
   ↓
8. System redirects to /auth/signup?redirect=/pricing
   ↓
9. User fills out signup form and creates account
   ↓
10. System auto-logs in user
   ↓
11. System redirects to /pricing (from redirect parameter)
   ↓
12. System detects pending_plan in sessionStorage
   ↓
13. System auto-resumes checkout
   ↓
14. User is redirected to Tranzak payment page
```

### Key Features
- ✅ Plan selection is preserved across login/signup
- ✅ Seamless flow from pricing → signup → checkout
- ✅ No need to re-select plan after signup
- ✅ Redirect parameter passed through login → signup

### Code Implementation
**Login Page** (`app/auth/login/page.tsx`):
```typescript
// Pass redirect to signup link
<Link
  href={searchParams?.get('redirect') 
    ? `/auth/signup?redirect=${searchParams.get('redirect')}` 
    : '/auth/signup'}
>
  Sign up
</Link>
```

**Signup Page** (`app/auth/signup/page.tsx`):
```typescript
// After successful signup, redirect to original destination
const redirect = searchParams?.get('redirect');
if (redirect) {
  router.push(redirect);
}
```

**Pricing Page** (`app/pricing/page.tsx`):
```typescript
// Save plan selection before redirect
sessionStorage.setItem('pending_plan', JSON.stringify({
  planName,
  billingCycle,
  currency,
}));
router.push('/auth/login?redirect=/pricing');
```

---

## Flow 2: User Backs Out of Pricing Page

### Scenario
User browses pricing but decides not to subscribe and wants to go back.

### User Journey
```
1. User visits /pricing
   ↓
2. User reviews plans
   ↓
3. User clicks "Back to Dashboard" or "Back to Home" button
   ↓
4. If authenticated → Redirects to /dashboard
   If not authenticated → Redirects to / (home page)
```

### Key Features
- ✅ Clear back button at top of pricing page
- ✅ Context-aware: Shows "Dashboard" for logged-in users, "Home" for visitors
- ✅ No forced commitment - users can browse freely
- ✅ No data loss - can return to pricing anytime

### Code Implementation
**Pricing Page** (`app/pricing/page.tsx`):
```typescript
<Link
  href={user ? "/dashboard" : "/"}
  className="inline-flex items-center gap-2"
>
  <ArrowLeft className="w-4 h-4" />
  <span>Back to {user ? "Dashboard" : "Home"}</span>
</Link>
```

### Additional Exit Points
1. **Browser Back Button**: Works normally, returns to previous page
2. **Logo Click**: Returns to home page (if implemented in header)
3. **Navigation Menu**: Can navigate to any other section
4. **Free Plan**: Clicking "Get Started" on Free plan redirects to dashboard

---

## Flow 3: User Signs Up Without Going Through Pricing

### Scenario
User creates an account directly from signup page or landing page, not through pricing flow.

### User Journey
```
1. User visits / (home page) or /auth/signup directly
   ↓
2. User clicks "Sign up" or "Get Started"
   ↓
3. User fills out signup form
   ↓
4. System creates account and auto-logs in
   ↓
5. System redirects to /dashboard (default)
   ↓
6. User is on FREE plan by default
   ↓
7. User can upgrade anytime by:
   - Clicking "Upgrade" button in dashboard
   - Visiting /pricing directly
   - Clicking "Upgrade Plan" in /subscription/manage
```

### Key Features
- ✅ All new users start on FREE plan
- ✅ No payment required to create account
- ✅ Can explore app before subscribing
- ✅ Multiple upgrade paths available
- ✅ No pressure to subscribe immediately

### Default Subscription Behavior
When a user signs up (without going through pricing):
1. Account is created in `auth.users`
2. Tutor profile is created in `tutors` table
3. `subscription_status` is set to `'free'`
4. No entry in `user_subscriptions` table (free plan doesn't need one)
5. Usage tracking uses free plan limits

### Code Implementation
**Auth Context** (`lib/auth-context.tsx`):
```typescript
// After successful signup
await signUp(email, password, firstName, lastName);
// User is auto-logged in and redirected to /dashboard
// No subscription is created - user is on free plan by default
```

**Subscription Service** (`lib/subscription-service.ts`):
```typescript
// When checking subscription
static async getTutorSubscription(tutorId: string) {
  // If no active subscription found, user is on free plan
  // Free plan limits are enforced by default
}
```

---

## Flow 4: Existing User Wants to Upgrade

### Scenario
User is on FREE plan and wants to upgrade to a paid plan.

### User Journey
```
1. User is logged in on FREE plan
   ↓
2. User navigates to /pricing (multiple entry points):
   - Dashboard "Upgrade" button
   - Subscription manage page "Upgrade Plan" button
   - Direct URL visit
   ↓
3. User selects a paid plan
   ↓
4. System detects user is authenticated
   ↓
5. System creates checkout immediately (no redirect)
   ↓
6. User is redirected to Tranzak payment page
   ↓
7. User completes payment
   ↓
8. Webhook creates subscription
   ↓
9. User is redirected to /subscription/success
   ↓
10. User can view subscription at /subscription/manage
```

### Key Features
- ✅ No login required (already authenticated)
- ✅ Instant checkout creation
- ✅ Smooth upgrade experience
- ✅ Multiple entry points to pricing

---

## Flow 5: User Wants to Change Plans

### Scenario
User has an active paid subscription and wants to change to a different plan.

### User Journey
```
1. User visits /subscription/manage
   ↓
2. User clicks "Change Plan" button
   ↓
3. System redirects to /pricing
   ↓
4. User selects new plan
   ↓
5. System creates checkout for new plan
   ↓
6. User completes payment
   ↓
7. Webhook:
   - Cancels old subscription
   - Creates new subscription
   - Logs change in subscription_history
   ↓
8. User sees new plan in /subscription/manage
```

### Key Features
- ✅ Can upgrade or downgrade
- ✅ Old subscription is cancelled automatically
- ✅ New subscription starts immediately
- ✅ Change is logged for audit trail

---

## Flow 6: Session Expires During Checkout

### Scenario
User starts checkout but their session expires before completing payment.

### User Journey
```
1. User selects plan on /pricing
   ↓
2. System checks session
   ↓
3. Session is expired
   ↓
4. System saves plan to sessionStorage
   ↓
5. System redirects to /auth/login?redirect=/pricing
   ↓
6. User logs in
   ↓
7. System redirects back to /pricing
   ↓
8. System detects pending_plan
   ↓
9. System auto-resumes checkout
   ↓
10. User completes payment
```

### Key Features
- ✅ Graceful handling of expired sessions
- ✅ No data loss
- ✅ Automatic resume after re-authentication
- ✅ User doesn't need to re-select plan

---

## Navigation Patterns

### Entry Points to Pricing Page
1. **Landing Page**: "View Pricing" or "Get Started" buttons
2. **Dashboard**: "Upgrade" button (for free users)
3. **Subscription Manage**: "Upgrade Plan" or "Change Plan" buttons
4. **Direct URL**: `/pricing`
5. **Header/Navigation**: "Pricing" link

### Exit Points from Pricing Page
1. **Back Button**: Returns to dashboard or home
2. **Browser Back**: Returns to previous page
3. **Free Plan Selection**: Redirects to dashboard
4. **Paid Plan Selection**: Proceeds to checkout
5. **Navigation Menu**: Can go to any other page

### Breadcrumb Pattern
```
Home → Pricing → Login → Signup → Pricing → Checkout → Success
  ↑                                    ↑
  └────────────────────────────────────┘
         (Back button returns here)
```

---

## Edge Cases Handled

### 1. Multiple Browser Tabs
**Scenario**: User opens pricing in multiple tabs
**Handling**: Each tab operates independently. If user completes checkout in one tab, other tabs will show updated subscription status on next action.

### 2. Browser Refresh During Checkout
**Scenario**: User refreshes page while on pricing
**Handling**: 
- If plan was selected: `pending_plan` is still in sessionStorage
- If authenticated: Can proceed with checkout
- If not authenticated: Will be prompted to login, then resume

### 3. Clearing Browser Data
**Scenario**: User clears cookies/localStorage during flow
**Handling**:
- Session is lost, user must re-authenticate
- `pending_plan` is lost, user must re-select plan
- No payment is processed without explicit user action

### 4. Payment Window Closed
**Scenario**: User closes Tranzak payment window
**Handling**:
- Transaction remains in "pending" state
- User can return to pricing and try again
- No duplicate subscriptions created

### 5. Webhook Delay
**Scenario**: Webhook takes time to process
**Handling**:
- User sees "Processing..." on success page
- Subscription is created when webhook arrives
- User can refresh to see updated status

---

## Security Considerations

### 1. Session Storage
- `pending_plan` is stored in sessionStorage (not localStorage)
- Cleared when browser tab is closed
- Only contains plan selection, no sensitive data

### 2. Redirect Parameters
- Validated to prevent open redirect vulnerabilities
- Only internal routes are allowed
- Sanitized before use

### 3. Authentication Checks
- Every API endpoint validates JWT token
- Session expiration is handled gracefully
- No payment processing without valid authentication

---

## User Experience Enhancements

### 1. Clear Communication
- "Back to Dashboard" vs "Back to Home" based on auth status
- "Sign up" link on login page preserves redirect
- "Sign in" link on signup page preserves redirect

### 2. No Dead Ends
- Every page has clear navigation options
- Users can always go back
- No forced commitment to subscribe

### 3. Seamless Flows
- Plan selection preserved across authentication
- Auto-resume after login/signup
- Minimal clicks to complete subscription

### 4. Flexible Entry Points
- Can start from any page
- Multiple paths to pricing
- Can explore before subscribing

---

## Testing Checklist

### New User Flow
- [ ] Visit pricing → Select plan → Redirected to login
- [ ] Click "Sign up" → Redirect includes pricing
- [ ] Complete signup → Auto-return to pricing
- [ ] Checkout auto-resumes with saved plan

### Back Navigation
- [ ] Click back button when not logged in → Returns to home
- [ ] Click back button when logged in → Returns to dashboard
- [ ] Browser back button works correctly
- [ ] Can navigate away and return without issues

### Direct Signup
- [ ] Sign up from home page → Lands on dashboard
- [ ] User is on free plan by default
- [ ] Can access all free features
- [ ] Can upgrade from dashboard or manage page

### Session Expiration
- [ ] Start checkout → Wait for session to expire
- [ ] Session expiration detected → Redirected to login
- [ ] Login → Return to pricing
- [ ] Checkout resumes automatically

---

## Summary

### Problem 1: New Users Not Signed Up
**Solution**: ✅ 
- Login page has "Sign up" link that preserves redirect
- Signup page accepts redirect parameter
- After signup, user returns to pricing
- Checkout auto-resumes with saved plan

### Problem 2: Users Want to Back Out
**Solution**: ✅
- Clear "Back" button at top of pricing page
- Context-aware: Shows "Dashboard" or "Home"
- No forced commitment
- Can return anytime

### Problem 3: Users Sign Up Without Pricing
**Solution**: ✅
- All users start on FREE plan by default
- No payment required to create account
- Can explore app before subscribing
- Multiple upgrade paths available
- No pressure to subscribe immediately

All three concerns have been addressed with user-friendly solutions that provide flexibility and clear navigation options!
