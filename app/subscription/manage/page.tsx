'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CreditCard, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import UsageDashboard from '@/components/subscription/UsageDashboard';
import Link from 'next/link';

interface Subscription {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan: {
    name: string;
    display_name: string;
    price_usd: number;
    price_xaf: number;
  };
}

export default function ManageSubscriptionPage() {
  const router = useRouter();
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/subscription/manage');
      return;
    }

    fetchSubscription();
  }, [user, router]);

  async function fetchSubscription() {
    if (!session) return;

    try {
      const response = await fetch('/api/subscription/current', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription({
          id: data.subscription.id,
          status: data.subscription.status,
          current_period_start: data.subscription.current_period_start,
          current_period_end: data.subscription.current_period_end,
          cancel_at_period_end: data.subscription.cancel_at_period_end,
          plan: data.plan,
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!session || !confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
      return;
    }

    setCancelling(true);

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        alert('Your subscription has been cancelled. You will have access until the end of your billing period.');
        fetchSubscription();
      } else {
        alert('Failed to cancel subscription. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ocean-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Subscription</h1>
          <p className="text-gray-600 mt-2">View and manage your LinguaFlow subscription</p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-ocean-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-ocean-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Current Plan</h2>
                <p className="text-sm text-gray-600">
                  {subscription ? subscription.plan.display_name : 'Free'}
                </p>
              </div>
            </div>
            {subscription && subscription.plan.name !== 'free' && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                subscription.status === 'active' 
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {subscription.status === 'active' ? 'Active' : subscription.status}
              </span>
            )}
          </div>

          {subscription && subscription.plan.name !== 'free' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm">
                  Billing period: {new Date(subscription.current_period_start).toLocaleDateString()} - {new Date(subscription.current_period_end).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                <span className="text-sm">
                  ${subscription.plan.price_usd}/month
                </span>
              </div>

              {subscription.cancel_at_period_end && (
                <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Subscription Cancelled</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Your subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}. You will still have access until then.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Link
              href="/pricing"
              className="flex-1 px-4 py-2 bg-ocean-500 text-white rounded-lg hover:bg-ocean-600 transition-colors font-medium text-center"
            >
              {subscription && subscription.plan.name !== 'free' ? 'Change Plan' : 'Upgrade Plan'}
            </Link>
            
            {subscription && subscription.plan.name !== 'free' && !subscription.cancel_at_period_end && (
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            )}
          </div>
        </div>

        {/* Usage Dashboard */}
        <UsageDashboard />

        {/* Billing History (placeholder) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Billing History</h2>
          <p className="text-gray-600 text-sm">
            No billing history available yet. Your payment history will appear here once you subscribe to a paid plan.
          </p>
        </div>
      </div>
    </div>
  );
}
