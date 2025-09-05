'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, Info, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
  type: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule[];
  helpText?: string;
  className?: string;
  disabled?: boolean;
}

export function ValidatedFormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  validation = [],
  helpText,
  className,
  disabled = false
}: FormFieldProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isTouched, setIsTouched] = React.useState(false);

  const validationResult = React.useMemo(() => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      info: []
    };

    // Required field validation
    if (required && !value.trim()) {
      result.errors.push(`${label} is required`);
      result.isValid = false;
    }

    // Custom validation rules
    validation.forEach(rule => {
      if (!rule.test(value)) {
        switch (rule.type) {
          case 'error':
            result.errors.push(rule.message);
            result.isValid = false;
            break;
          case 'warning':
            result.warnings.push(rule.message);
            break;
          case 'info':
            result.info.push(rule.message);
            break;
        }
      }
    });

    return result;
  }, [value, validation, required, label]);

  const hasErrors = isTouched && validationResult.errors.length > 0;
  const hasWarnings = isTouched && validationResult.warnings.length > 0;
  const isValid = isTouched && validationResult.isValid && value.trim() !== '';

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsTouched(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
            hasErrors && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            hasWarnings && !hasErrors && 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500',
            isValid && 'border-green-300 focus:border-green-500 focus:ring-green-500',
            !isTouched && 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
            disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed'
          )}
        />

        {/* Password visibility toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}

        {/* Validation status icon */}
        {isTouched && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {type !== 'password' && (
              <>
                {hasErrors && <AlertTriangle className="h-4 w-4 text-red-500" />}
                {hasWarnings && !hasErrors && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                {isValid && <CheckCircle className="h-4 w-4 text-green-500" />}
              </>
            )}
          </div>
        )}
      </div>

      {/* Help text */}
      {helpText && !isTouched && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}

      {/* Validation messages */}
      {isTouched && (
        <div className="space-y-1">
          {validationResult.errors.map((error, index) => (
            <div key={`error-${index}`} className="flex items-center space-x-1 text-red-600 text-sm">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
          
          {validationResult.warnings.map((warning, index) => (
            <div key={`warning-${index}`} className="flex items-center space-x-1 text-yellow-600 text-sm">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
          
          {validationResult.info.map((info, index) => (
            <div key={`info-${index}`} className="flex items-center space-x-1 text-blue-600 text-sm">
              <Info className="h-3 w-3 flex-shrink-0" />
              <span>{info}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Common validation rules for email management
export const emailValidationRules = {
  email: {
    test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please enter a valid email address',
    type: 'error' as const
  },

  smtpHost: {
    test: (value: string) => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
    message: 'Please enter a valid hostname (e.g., smtp.gmail.com)',
    type: 'error' as const
  },

  port: {
    test: (value: string) => {
      const num = parseInt(value);
      return !isNaN(num) && num > 0 && num <= 65535;
    },
    message: 'Port must be a number between 1 and 65535',
    type: 'error' as const
  },

  commonPorts: {
    test: (value: string) => {
      const num = parseInt(value);
      return [25, 465, 587, 2525].includes(num);
    },
    message: 'Common SMTP ports are 25, 465, 587, or 2525',
    type: 'info' as const
  },

  strongPassword: {
    test: (value: string) => value.length >= 8,
    message: 'Password should be at least 8 characters long',
    type: 'warning' as const
  },

  templateSubject: {
    test: (value: string) => value.length <= 200,
    message: 'Subject line should be under 200 characters for better deliverability',
    type: 'warning' as const
  },

  templatePlaceholders: {
    test: (value: string) => {
      const placeholders = value.match(/\{\{[^}]+\}\}/g) || [];
      return placeholders.every(p => /^\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}$/.test(p));
    },
    message: 'Placeholders must use format {{variable_name}} with valid variable names',
    type: 'error' as const
  },

  htmlContent: {
    test: (value: string) => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(value, 'text/html');
        return !doc.querySelector('parsererror');
      } catch {
        return false;
      }
    },
    message: 'HTML content contains syntax errors',
    type: 'error' as const
  }
};

interface FormValidationSummaryProps {
  fields: Array<{
    name: string;
    validation: ValidationResult;
  }>;
  className?: string;
}

export function FormValidationSummary({ fields, className }: FormValidationSummaryProps) {
  const totalErrors = fields.reduce((sum, field) => sum + field.validation.errors.length, 0);
  const totalWarnings = fields.reduce((sum, field) => sum + field.validation.warnings.length, 0);

  if (totalErrors === 0 && totalWarnings === 0) {
    return null;
  }

  return (
    <div className={cn('bg-gray-50 border border-gray-200 rounded-lg p-4', className)}>
      <h4 className="font-medium text-gray-900 mb-2">Form Validation Summary</h4>
      
      {totalErrors > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-red-800 mb-1">
            {totalErrors} Error{totalErrors > 1 ? 's' : ''} Found:
          </p>
          <ul className="text-sm text-red-700 space-y-1">
            {fields.map(field => 
              field.validation.errors.map((error, index) => (
                <li key={`${field.name}-error-${index}`} className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                  <span><strong>{field.name}:</strong> {error}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {totalWarnings > 0 && (
        <div>
          <p className="text-sm font-medium text-yellow-800 mb-1">
            {totalWarnings} Warning{totalWarnings > 1 ? 's' : ''}:
          </p>
          <ul className="text-sm text-yellow-700 space-y-1">
            {fields.map(field => 
              field.validation.warnings.map((warning, index) => (
                <li key={`${field.name}-warning-${index}`} className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                  <span><strong>{field.name}:</strong> {warning}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}