# Subscription Flow Manual Test Checklist

## Pre-Test Setup
- [ ] Ensure you have a test user account
- [ ] Clear browser cache and cookies
- [ ] Open browser DevTools (F12) to monitor network and console

## Test 1: Pricing Page - Unauthenticated User

### Steps:
1. [ ] Log out if currently logged in
2. [ ] Navigate to `http://localhost:3000/pricing`
3. [ ] Verify page loads without redirect
4. [ ] Verify all 4 plans are displayed (Free, Starter, Professional, Enterprise)
5. [ ] Toggle between Monthly and Annual billing
6. [ ] Verify prices update correctly
7. [ ] Toggle between USD and XAF currency
8. [ ] Verify currency symbols update
9. [ ] Click "Get Started" on Professional plan

### Expected Results:
- [ ] Should redirect to `/auth/login?redirect=/pricing`
- [ ] Check sessionStorage: `pending_plan` should be saved
- [ ] Console should show no errors

## Test 2: Login and Resume Checkout

### Steps:
1. [ ] On login page, enter credentials and sign in
2. [ ] Wait for redirect back to pricing page

### Expected Results:
- [ ] Should redirect to `/pricing`
- [ ] Should show loading spinner briefly
- [ ] Should auto-trigger checkout for Professional plan
- [ ] Should redirect to Tranzak payment page
- [ ] Check sessionStorage: `pending_plan` should be cleared
- [ ] Console should show no errors

## Test 3: Pricing Page - Authenticated User

### Steps:
1. [ ] Navigate to `http://localhost:3000/pricing`
2. [ ] Verify page loads without redirect
3. [ ] Click "Get Started" on Starter plan

### Expected Results:
- [ ] Should NOT redirect to login
- [ ] Should show "Processing..." button state
- [ ] Should redirect to Tranzak payment page
- [ ] Console should show no errors
- [ ] Network tab should show successful POST to `/api/payments/create-checkout`

## Test 4: Subscription Management - No Subscription

### Steps:
1. [ ] Navigate to `http://localhost:3000/subscription/manage`
2. [ ] Verify page loads without redirect

### Expected Results:
- [ ] Should show "Current Plan: Free"
- [ ] Should show "Upgrade Plan" button
- [ ] Should show usage dashboard
- [ ] Should show "No billing history" message
- [ ] Console should show no errors

## Test 5: Complete Payment Flow (Sandbox)

### Steps:
1. [ ] From pricing page, select Professional plan
2. [ ] Complete payment on Tranzak sandbox
3. [ ] Wait for redirect back to success page
4. [ ] Navigate to `/subscription/manage`

### Expected Results:
- [ ] Should redirect to `/subscription/success`
- [ ] Subscription manage page should show Professional plan
- [ ] Should show "Active" status badge
- [ ] Should show billing period dates
- [ ] Should show monthly price
- [ ] Should show "Change Plan" and "Cancel Subscription" buttons
- [ ] Usage dashboard should show plan limits

## Test 6: Check Database Records

### Steps:
1. [ ] Open Supabase dashboard
2. [ ] Check `payment_transactions` table
3. [ ] Check `user_subscriptions` table
4. [ ] Check `subscription_history` table
5. [ ] Check `tutors` table

### Expected Results:
- [ ] `payment_transactions`: Should have record with status "completed"
- [ ] `user_subscriptions`: Should have active subscription
- [ ] `subscription_history`: Should have "created" action logged
- [ ] `tutors`: Should have `current_subscription_id` and `subscription_status` updated

## Test 7: Usage Tracking

### Steps:
1. [ ] Navigate to dashboard
2. [ ] Create a new lesson for a student
3. [ ] Navigate back to `/subscription/manage`
4. [ ] Check usage dashboard

### Expected Results:
- [ ] Lessons generated count should increment
- [ ] Should show progress bar
- [ ] Should show "X of Y lessons used this month"

## Test 8: Subscription Cancellation

### Steps:
1. [ ] On `/subscription/manage`, click "Cancel Subscription"
2. [ ] Confirm cancellation in dialog
3. [ ] Wait for success message

### Expected Results:
- [ ] Should show success alert
- [ ] Page should refresh
- [ ] Should show amber warning banner
- [ ] Banner should say "Subscription Cancelled"
- [ ] Should show access until date
- [ ] "Cancel Subscription" button should disappear
- [ ] Should still show "Change Plan" button

## Test 9: Plan Change (Upgrade)

### Steps:
1. [ ] On `/subscription/manage`, click "Change Plan"
2. [ ] Select Enterprise plan
3. [ ] Complete payment

### Expected Results:
- [ ] Should redirect to pricing page
- [ ] Should complete checkout flow
- [ ] Old subscription should be cancelled
- [ ] New subscription should be created
- [ ] Subscription history should log the upgrade

## Test 10: Session Expiration Handling

### Steps:
1. [ ] Log in and navigate to pricing page
2. [ ] Open DevTools → Application → Storage
3. [ ] Delete Supabase auth token from localStorage
4. [ ] Click "Get Started" on any plan

### Expected Results:
- [ ] Should detect expired session
- [ ] Should save pending plan to sessionStorage
- [ ] Should redirect to login
- [ ] After login, should resume checkout

## Test 11: Error Handling

### Steps:
1. [ ] Disconnect internet
2. [ ] Try to select a plan
3. [ ] Reconnect internet

### Expected Results:
- [ ] Should show error alert
- [ ] Should not redirect
- [ ] Should allow retry
- [ ] Console should show network error

## Test 12: Multiple Tab Handling

### Steps:
1. [ ] Open pricing page in two tabs
2. [ ] In Tab 1, start checkout for Professional plan
3. [ ] In Tab 2, start checkout for Starter plan

### Expected Results:
- [ ] Both should process independently
- [ ] Only one should succeed (if duplicate prevention is implemented)
- [ ] Or both succeed but second overwrites first

## Test 13: Browser Back Button

### Steps:
1. [ ] Start checkout flow
2. [ ] On Tranzak payment page, click browser back button
3. [ ] Verify you're back on pricing page

### Expected Results:
- [ ] Should return to pricing page
- [ ] Should not show errors
- [ ] Should be able to start new checkout

## Test 14: Direct URL Access

### Steps:
1. [ ] Log out
2. [ ] Navigate directly to `http://localhost:3000/subscription/manage`

### Expected Results:
- [ ] Should redirect to `/auth/login?redirect=/subscription/manage`
- [ ] After login, should redirect to manage page

## Test 15: Free Plan Selection

### Steps:
1. [ ] On pricing page, click "Get Started" on Free plan

### Expected Results:
- [ ] Should redirect to `/dashboard`
- [ ] Should NOT create payment transaction
- [ ] Should NOT redirect to Tranzak

## Issues Found

### Critical Issues
- [ ] Issue 1: _____________________
- [ ] Issue 2: _____________________

### Medium Issues
- [ ] Issue 1: _____________________
- [ ] Issue 2: _____________________

### Minor Issues
- [ ] Issue 1: _____________________
- [ ] Issue 2: _____________________

## Test Summary

**Date**: _______________
**Tester**: _______________
**Environment**: _______________

**Tests Passed**: _____ / 15
**Tests Failed**: _____ / 15
**Critical Issues**: _____
**Medium Issues**: _____
**Minor Issues**: _____

**Overall Status**: ⬜ PASS ⬜ FAIL ⬜ NEEDS WORK

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Sign-off**: _______________
