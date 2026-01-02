'use client';

import { AlertCircle, ArrowUpCircle, X } from 'lucide-react';
import Link from 'next/link';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'lessons' | 'students' | 'vocabulary' | 'discussions';
  currentUsage: number;
  limit: number;
}

export default function LimitReachedModal({
  isOpen,
  onClose,
  limitType,
  currentUsage,
  limit,
}: LimitReachedModalProps) {
  if (!isOpen) return null;

  const limitMessages = {
    lessons: {
      title: 'Lesson Generation Limit Reached',
      description: `You've generated ${currentUsage} out of ${limit} lessons this month.`,
      benefit: 'Generate up to 100 lessons per month',
    },
    students: {
      title: 'Student Limit Reached',
      description: `You have ${currentUsage} out of ${limit} students.`,
      benefit: 'Manage up to 30 students',
    },
    vocabulary: {
      title: 'Vocabulary Session Limit Reached',
      description: `You've created ${currentUsage} out of ${limit} vocabulary sessions this month.`,
      benefit: 'Create unlimited vocabulary sessions',
    },
    discussions: {
      title: 'Discussion Prompt Limit Reached',
      description: `You've created ${currentUsage} out of ${limit} discussion prompts this month.`,
      benefit: 'Create unlimited discussion prompts',
    },
  };

  const message = limitMessages[limitType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{message.title}</h2>
        </div>

        <p className="text-gray-600 mb-6">{message.description}</p>

        <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-ocean-900 mb-2">
            Upgrade to Professional Plan
          </p>
          <ul className="space-y-1">
            <li className="text-sm text-ocean-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-ocean-500 rounded-full" />
              {message.benefit}
            </li>
            <li className="text-sm text-ocean-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-ocean-500 rounded-full" />
              Priority support
            </li>
            <li className="text-sm text-ocean-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-ocean-500 rounded-full" />
              Calendar sync
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Maybe Later
          </button>
          <Link
            href="/pricing"
            className="flex-1 px-4 py-2 bg-ocean-500 text-white rounded-lg hover:bg-ocean-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <ArrowUpCircle className="w-4 h-4" />
            Upgrade Now
          </Link>
        </div>
      </div>
    </div>
  );
}
