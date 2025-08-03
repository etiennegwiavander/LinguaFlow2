"use client";

import React, { Component, ReactNode } from 'react';
import { User } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackCharacter?: string;
  fallbackSize?: 'sm' | 'md' | 'lg';
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Error boundary specifically for dialogue avatars
export default class DialogueAvatarErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('DialogueAvatar error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback to simple avatar
      const { fallbackCharacter = 'User', fallbackSize = 'sm' } = this.props;
      
      const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12'
      };

      const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
      };

      return (
        <div className={`
          ${sizeClasses[fallbackSize]} 
          rounded-full 
          flex items-center justify-center 
          bg-gray-100 dark:bg-gray-900/30 
          border-2 border-gray-200 dark:border-gray-800
        `}>
          <User className={`${iconSizes[fallbackSize]} text-gray-600 dark:text-gray-400`} />
        </div>
      );
    }

    return this.props.children;
  }
}