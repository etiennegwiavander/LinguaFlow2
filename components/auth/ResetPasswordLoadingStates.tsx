import React from 'react';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LoadingStateProps {
  type: 'validating' | 'updating' | 'success' | 'error';
  message?: string;
  progress?: number;
}

export const ResetPasswordLoadingState: React.FC<LoadingStateProps> = ({ 
  type, 
  message, 
  progress 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'validating':
        return <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />;
      case 'updating':
        return <Loader2 className="w-8 h-8 text-green-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'error':
        return <AlertTriangle className="w-8 h-8 text-red-600" />;
      default:
        return <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'validating':
        return 'Verifying reset link...';
      case 'updating':
        return 'Updating password...';
      case 'success':
        return 'Password updated!';
      case 'error':
        return 'Something went wrong';
      default:
        return 'Loading...';
    }
  };

  const getDescription = () => {
    if (message) return message;
    
    switch (type) {
      case 'validating':
        return 'Please wait while we verify your password reset link';
      case 'updating':
        return 'Securely updating your password...';
      case 'success':
        return 'Your password has been successfully updated';
      case 'error':
        return 'An error occurred during the process';
      default:
        return 'Please wait...';
    }
  };

  return (
    <Card className="w-full max-w-md cyber-card">
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            type === 'success' ? 'bg-green-100 dark:bg-green-900/20' :
            type === 'error' ? 'bg-red-100 dark:bg-red-900/20' :
            'bg-blue-100 dark:bg-blue-900/20'
          }`}>
            {getIcon()}
          </div>
        </div>
        <CardTitle className={`text-2xl font-bold ${
          type === 'success' ? 'text-green-600' :
          type === 'error' ? 'text-red-600' :
          'text-foreground'
        }`}>
          {getTitle()}
        </CardTitle>
        <CardDescription>
          {getDescription()}
        </CardDescription>
      </CardHeader>
      
      {progress !== undefined && (
        <CardContent>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {progress}% complete
          </p>
        </CardContent>
      )}
    </Card>
  );
};

// Skeleton loader for form elements
export const ResetPasswordSkeleton: React.FC = () => {
  return (
    <Card className="w-full max-w-md cyber-card">
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4 mx-auto" />
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
};