'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function SubscriptionCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-ocean-50 to-white px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <XCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Cancelled
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges have been made to your account.
        </p>

        <div className="bg-amber-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            If you experienced any issues during checkout, please contact our support team.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full bg-ocean-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-ocean-600 transition-colors"
          >
            Try Again
          </Link>
          
          <Link
            href="/dashboard"
            className="block w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
