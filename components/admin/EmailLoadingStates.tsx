'use client';

import React from 'react';
import { Loader2, Mail, Settings, TestTube, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  );
}

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ progress, className, showPercentage = true }: ProgressBarProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

interface EmailOperationLoadingProps {
  operation: 'smtp-test' | 'template-save' | 'email-send' | 'analytics-load';
  message?: string;
  progress?: number;
}

export function EmailOperationLoading({ 
  operation, 
  message, 
  progress 
}: EmailOperationLoadingProps) {
  const operationConfig = {
    'smtp-test': {
      icon: Settings,
      defaultMessage: 'Testing SMTP connection...',
      color: 'text-blue-600'
    },
    'template-save': {
      icon: Mail,
      defaultMessage: 'Saving email template...',
      color: 'text-green-600'
    },
    'email-send': {
      icon: TestTube,
      defaultMessage: 'Sending test email...',
      color: 'text-purple-600'
    },
    'analytics-load': {
      icon: BarChart3,
      defaultMessage: 'Loading analytics data...',
      color: 'text-orange-600'
    }
  };

  const config = operationConfig[operation];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <div className="flex items-center space-x-3">
        <Icon className={cn('h-6 w-6', config.color)} />
        <LoadingSpinner size="md" className={config.color} />
      </div>
      <p className="text-gray-700 text-center">
        {message || config.defaultMessage}
      </p>
      {typeof progress === 'number' && (
        <ProgressBar progress={progress} className="w-64" />
      )}
    </div>
  );
}

export function SMTPConfigLoading() {
  return (
    <div className="space-y-4 p-4">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export function EmailTemplateLoading() {
  return (
    <div className="space-y-4 p-4">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/5 mb-2"></div>
        <div className="h-32 bg-gray-200 rounded mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export function EmailAnalyticsLoading() {
  return (
    <div className="space-y-6 p-4">
      <div className="animate-pulse">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
          ))}
        </div>
        
        {/* Chart area */}
        <div className="bg-gray-200 rounded-lg h-64 mb-6"></div>
        
        {/* Table */}
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 rounded"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface InlineLoadingProps {
  text: string;
  className?: string;
}

export function InlineLoading({ text, className }: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <LoadingSpinner size="sm" />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
}