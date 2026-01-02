'use client';

import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Loader2, TrendingUp, Users, BookOpen, MessageSquare, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';

export default function UsageDashboard() {
  const { loading, limits, usage, planName, usagePercentage } = useSubscriptionLimits();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-ocean-500" />
      </div>
    );
  }

  if (!limits || !usage) {
    return null;
  }

  const usageItems = [
    {
      icon: BookOpen,
      label: 'Lessons Generated',
      current: usage.lessons_generated,
      limit: limits.lessons_per_month,
      percentage: usagePercentage.lessons,
      color: 'ocean',
    },
    {
      icon: Users,
      label: 'Students',
      current: usage.students_count,
      limit: limits.max_students,
      percentage: usagePercentage.students,
      color: 'indigo',
    },
    {
      icon: MessageSquare,
      label: 'Vocabulary Sessions',
      current: usage.vocabulary_sessions_created,
      limit: limits.vocabulary_sessions_per_month,
      percentage: usagePercentage.vocabulary,
      color: 'emerald',
    },
    {
      icon: TrendingUp,
      label: 'Discussion Prompts',
      current: usage.discussion_prompts_created,
      limit: limits.discussion_prompts_per_month,
      percentage: usagePercentage.discussions,
      color: 'amber',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Usage This Month</h2>
          <p className="text-sm text-gray-600 mt-1">
            Current Plan: <span className="font-medium capitalize">{planName}</span>
          </p>
        </div>
        {planName === 'free' && (
          <Link
            href="/pricing"
            className="flex items-center gap-2 bg-ocean-500 text-white px-4 py-2 rounded-lg hover:bg-ocean-600 transition-colors text-sm font-medium"
          >
            <ArrowUpCircle className="w-4 h-4" />
            Upgrade
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {usageItems.map((item, index) => {
          const Icon = item.icon;
          const isUnlimited = item.limit === null;
          const isNearLimit = item.percentage >= 80 && !isUnlimited;
          const isAtLimit = item.percentage >= 100 && !isUnlimited;

          return (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                isAtLimit
                  ? 'border-red-200 bg-red-50'
                  : isNearLimit
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 text-${item.color}-500`} />
                  <span className="text-sm font-medium text-gray-700">
                    {item.label}
                  </span>
                </div>
                {isAtLimit && (
                  <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                    Limit Reached
                  </span>
                )}
                {isNearLimit && !isAtLimit && (
                  <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded">
                    Near Limit
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-gray-900">
                  {item.current}
                </span>
                <span className="text-sm text-gray-600">
                  / {isUnlimited ? '∞' : item.limit}
                </span>
              </div>

              {!isUnlimited && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isAtLimit
                        ? 'bg-red-500'
                        : isNearLimit
                        ? 'bg-amber-500'
                        : `bg-${item.color}-500`
                    }`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              )}

              {isUnlimited && (
                <p className="text-xs text-gray-500 mt-1">Unlimited usage</p>
              )}
            </div>
          );
        })}
      </div>

      {(usagePercentage.lessons >= 80 || usagePercentage.students >= 80) && planName === 'free' && (
        <div className="mt-6 p-4 bg-ocean-50 border border-ocean-200 rounded-lg">
          <p className="text-sm text-ocean-800 mb-3">
            <span className="font-medium">You're approaching your plan limits!</span> Upgrade to continue using LinguaFlow without interruption.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-ocean-500 text-white px-4 py-2 rounded-lg hover:bg-ocean-600 transition-colors text-sm font-medium"
          >
            <ArrowUpCircle className="w-4 h-4" />
            View Plans
          </Link>
        </div>
      )}
    </div>
  );
}
