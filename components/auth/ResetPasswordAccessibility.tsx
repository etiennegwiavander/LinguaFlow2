import React from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AccessibilityAnnouncementProps {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  id?: string;
}

// Screen reader announcements for dynamic content
export const AccessibilityAnnouncement: React.FC<AccessibilityAnnouncementProps> = ({
  message,
  type,
  id
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAriaLabel = () => {
    switch (type) {
      case 'success':
        return 'Success message';
      case 'error':
        return 'Error message';
      case 'warning':
        return 'Warning message';
      case 'info':
      default:
        return 'Information message';
    }
  };

  return (
    <div
      role="status"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-label={getAriaLabel()}
      id={id}
    >
      <Alert className={`
        ${type === 'success' ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : ''}
        ${type === 'error' ? 'border-red-200 bg-red-50 dark:bg-red-900/20' : ''}
        ${type === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20' : ''}
        ${type === 'info' ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20' : ''}
      `}>
        <div className={`
          ${type === 'success' ? 'text-green-600' : ''}
          ${type === 'error' ? 'text-red-600' : ''}
          ${type === 'warning' ? 'text-yellow-600' : ''}
          ${type === 'info' ? 'text-blue-600' : ''}
        `}>
          {getIcon()}
        </div>
        <AlertDescription className={`
          ${type === 'success' ? 'text-green-800 dark:text-green-200' : ''}
          ${type === 'error' ? 'text-red-800 dark:text-red-200' : ''}
          ${type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' : ''}
          ${type === 'info' ? 'text-blue-800 dark:text-blue-200' : ''}
        `}>
          {message}
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Progress indicator with accessibility features
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label: string;
  description?: string;
}

export const AccessibleProgress: React.FC<AccessibleProgressProps> = ({
  value,
  max = 100,
  label,
  description
}) => {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
        <span className="text-sm text-muted-foreground" aria-label={`${percentage} percent complete`}>
          {percentage}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        aria-describedby={description ? `progress-desc-${label.replace(/\s+/g, '-')}` : undefined}
        className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
      >
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {description && (
        <p
          id={`progress-desc-${label.replace(/\s+/g, '-')}`}
          className="text-xs text-muted-foreground mt-1"
        >
          {description}
        </p>
      )}
    </div>
  );
};

// Skip link for keyboard navigation
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children
}) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
    >
      {children}
    </a>
  );
};

// Focus management hook
export const useFocusManagement = () => {
  const focusElement = React.useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  }, []);

  const focusFirstError = React.useCallback(() => {
    const firstError = document.querySelector('[aria-invalid="true"]') as HTMLElement;
    if (firstError) {
      firstError.focus();
    }
  }, []);

  const announceToScreenReader = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return {
    focusElement,
    focusFirstError,
    announceToScreenReader
  };
};

// High contrast mode detection
export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  React.useEffect(() => {
    const checkHighContrast = () => {
      if (typeof window !== 'undefined' && window.matchMedia) {
        try {
          const mediaQuery = window.matchMedia('(prefers-contrast: high)');
          setIsHighContrast(mediaQuery.matches);
          
          const handleChange = (e: MediaQueryListEvent) => {
            setIsHighContrast(e.matches);
          };
          
          mediaQuery.addEventListener('change', handleChange);
          return () => mediaQuery.removeEventListener('change', handleChange);
        } catch (error) {
          // Fallback for environments without matchMedia support
          setIsHighContrast(false);
        }
      }
    };

    checkHighContrast();
  }, []);

  return isHighContrast;
};

// Reduced motion detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);
        
        const handleChange = (e: MediaQueryListEvent) => {
          setPrefersReducedMotion(e.matches);
        };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } catch (error) {
        // Fallback for environments without matchMedia support
        setPrefersReducedMotion(false);
      }
    }
  }, []);

  return prefersReducedMotion;
};