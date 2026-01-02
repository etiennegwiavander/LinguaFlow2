'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Plan {
  id: string;
  name: string;
  display_name: string;
  price_usd: number;
  price_xaf: number;
  annual_price_usd: number | null;
  annual_price_xaf: number | null;
  lessons_per_month: number | null;
  max_students: number | null;
  vocabulary_sessions_per_month: number | null;
  discussion_prompts_per_month: number | null;
  calendar_sync_enabled: boolean;
  priority_support: boolean;
  phone_support: boolean;
  features: {
    description: string;
    highlights: string[];
    popular?: boolean;
  };
  sort_order: number;
}

export default function PricingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [currency, setCurrency] = useState<'USD' | 'XAF'>('USD');

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSelectPlan = useCallback(async (planName: string) => {
    // Free plan doesn't require payment - just redirect to dashboard
    if (planName === 'free') {
      if (!user) {
        router.push('/auth/login?redirect=/pricing');
        return;
      }
      router.push('/dashboard');
      return;
    }

    // For paid plans, check authentication
    if (!user) {
      // Store the selected plan in sessionStorage to resume after login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pending_plan', JSON.stringify({
          planName,
          billingCycle,
          currency,
        }));
      }
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    // Get session directly from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Session expired, redirect to login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pending_plan', JSON.stringify({
          planName,
          billingCycle,
          currency,
        }));
      }
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    setProcessingPlan(planName);

    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          planName,
          billingCycle,
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Clear pending plan from storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pending_plan');
      }

      // Redirect to Tranzak payment page
      window.location.href = data.payment_url;

    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setProcessingPlan(null);
    }
  }, [user, billingCycle, currency, router]);

  // Check for pending plan selection after login
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    if (user && typeof window !== 'undefined') {
      const pendingPlan = sessionStorage.getItem('pending_plan');
      if (pendingPlan) {
        try {
          const { planName, billingCycle: savedCycle, currency: savedCurrency } = JSON.parse(pendingPlan);
          // Set the saved preferences
          setBillingCycle(savedCycle);
          setCurrency(savedCurrency);
          // Clear from storage
          sessionStorage.removeItem('pending_plan');
          // Auto-trigger checkout
          setTimeout(() => {
            handleSelectPlan(planName);
          }, 500);
        } catch (error) {
          console.error('Error resuming checkout:', error);
        }
      }
    }
  }, [user, authLoading, handleSelectPlan]);

  async function fetchPlans() {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  }

  function getPrice(plan: Plan) {
    if (billingCycle === 'annual') {
      return currency === 'USD' ? plan.annual_price_usd : plan.annual_price_xaf;
    }
    return currency === 'USD' ? plan.price_usd : plan.price_xaf;
  }

  function formatPrice(price: number | null) {
    if (price === null || price === 0) return 'Free';
    return currency === 'USD' ? `$${price}` : `${price.toLocaleString()} XAF`;
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ocean-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Select the perfect plan for your tutoring needs
          </p>

          {/* Login prompt if not authenticated */}
          {/* {!user && (
            <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
              <p className="text-ocean-800">
                <span className="font-medium">Not logged in?</span> You can browse plans now and{' '}
                <button
                  onClick={() => router.push('/auth/login?redirect=/pricing')}
                  className="text-ocean-600 hover:text-ocean-700 underline font-medium"
                >
                  sign in
                </button>{' '}
                when you're ready to subscribe.
              </p>
            </div>
          )} */}

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-ocean-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-ocean-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Annual
              <span className="ml-2 text-sm">(Save 17%)</span>
            </button>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
                currency === 'USD'
                  ? 'bg-ocean-100 text-ocean-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('XAF')}
              className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
                currency === 'XAF'
                  ? 'bg-ocean-100 text-ocean-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              XAF (FCFA)
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const price = getPrice(plan);
            const isPopular = plan.features.popular;
            const isProcessing = processingPlan === plan.name;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                  isPopular ? 'ring-2 ring-ocean-500 scale-105' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-ocean-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.display_name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {plan.features.description}
                  </p>
                  <div className="text-4xl font-bold text-gray-900">
                    {formatPrice(price)}
                    {price !== null && price > 0 && (
                      <span className="text-lg font-normal text-gray-600">
                        /{billingCycle === 'annual' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{highlight}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.name)}
                  disabled={isProcessing}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    isPopular
                      ? 'bg-ocean-500 text-white hover:bg-ocean-600'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Get Started'
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-600">
            All plans include a 7-day money-back guarantee. Cancel anytime.
          </p>
          <p className="text-gray-600 mt-2">
            Need help choosing? <a href="/contact" className="text-ocean-500 hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  );
}
