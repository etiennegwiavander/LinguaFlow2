'use client';

import React, { useState } from 'react';
import { 
  HelpCircle, 
  Info, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight,
  Book,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TooltipHelpProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function TooltipHelp({ content, children, side = 'top', className }: TooltipHelpProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('inline-flex items-center', className)}>
            {children}
            <HelpCircle className="h-4 w-4 ml-1 text-gray-400 hover:text-gray-600 cursor-help" />
          </div>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface HelpSectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  className?: string;
}

export function HelpSection({ 
  title, 
  children, 
  icon: Icon = Info, 
  defaultOpen = false,
  className 
}: HelpSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start p-3 h-auto text-left hover:bg-blue-50"
        >
          <div className="flex items-center space-x-2 w-full">
            <Icon className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="font-medium text-gray-900 flex-1">{title}</span>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface QuickTipProps {
  type?: 'info' | 'warning' | 'tip';
  children: React.ReactNode;
  className?: string;
}

export function QuickTip({ type = 'info', children, className }: QuickTipProps) {
  const typeConfig = {
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-800'
    },
    tip: {
      icon: Lightbulb,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-800'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      'flex items-start space-x-2 p-3 rounded-lg border',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.iconColor)} />
      <div className={cn('text-sm', config.textColor)}>
        {children}
      </div>
    </div>
  );
}

// Pre-configured help content for email management features
export function SMTPConfigurationHelp() {
  return (
    <div className="space-y-4">
      <HelpSection title="SMTP Provider Setup" icon={Book}>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold mb-1">Gmail Configuration:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Host: smtp.gmail.com</li>
              <li>Port: 587 (TLS) or 465 (SSL)</li>
              <li>Use App Password instead of regular password</li>
              <li>Enable 2-factor authentication first</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">SendGrid Configuration:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Host: smtp.sendgrid.net</li>
              <li>Port: 587</li>
              <li>Username: apikey</li>
              <li>Password: Your SendGrid API key</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-1">AWS SES Configuration:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Host: email-smtp.[region].amazonaws.com</li>
              <li>Port: 587 or 465</li>
              <li>Use SMTP credentials from AWS console</li>
              <li>Verify your domain first</li>
            </ul>
          </div>
        </div>
      </HelpSection>

      <HelpSection title="Common Issues & Solutions" icon={AlertCircle}>
        <div className="space-y-2">
          <div>
            <strong>Authentication Failed:</strong>
            <p>Check username/password and ensure 2FA is configured for Gmail.</p>
          </div>
          <div>
            <strong>Connection Timeout:</strong>
            <p>Verify firewall settings allow outbound connections on SMTP ports.</p>
          </div>
          <div>
            <strong>TLS/SSL Errors:</strong>
            <p>Try switching between TLS (587) and SSL (465) ports.</p>
          </div>
        </div>
      </HelpSection>
    </div>
  );
}

export function EmailTemplateHelp() {
  return (
    <div className="space-y-4">
      <HelpSection title="Template Placeholders" icon={Book}>
        <div className="space-y-3">
          <p>Use placeholders to insert dynamic content into your emails:</p>
          
          <div className="bg-gray-100 p-3 rounded font-mono text-sm">
            <div>{'{{user_name}}'} - User's full name</div>
            <div>{'{{user_email}}'} - User's email address</div>
            <div>{'{{lesson_title}}'} - Lesson title</div>
            <div>{'{{lesson_date}}'} - Lesson date</div>
            <div>{'{{unsubscribe_url}}'} - Unsubscribe link</div>
          </div>

          <QuickTip type="tip">
            Placeholders are case-sensitive and must use the exact format shown above.
          </QuickTip>
        </div>
      </HelpSection>

      <HelpSection title="HTML Best Practices" icon={Lightbulb}>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Use inline CSS for better email client compatibility</li>
          <li>Keep width under 600px for mobile compatibility</li>
          <li>Test with different email clients</li>
          <li>Always include a plain text version</li>
          <li>Use web-safe fonts (Arial, Helvetica, etc.)</li>
        </ul>
      </HelpSection>

      <HelpSection title="Template Testing" icon={Info}>
        <p>Always test your templates before activating them:</p>
        <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
          <li>Use the preview function to check formatting</li>
          <li>Send test emails to different email providers</li>
          <li>Check both HTML and plain text versions</li>
          <li>Verify all placeholders are working correctly</li>
        </ol>
      </HelpSection>
    </div>
  );
}

export function EmailAnalyticsHelp() {
  return (
    <div className="space-y-4">
      <HelpSection title="Understanding Email Metrics" icon={Book}>
        <div className="space-y-3">
          <div>
            <strong>Delivery Rate:</strong>
            <p>Percentage of emails successfully delivered to recipients' inboxes.</p>
          </div>
          <div>
            <strong>Bounce Rate:</strong>
            <p>Percentage of emails that couldn't be delivered. High bounce rates can hurt your sender reputation.</p>
          </div>
          <div>
            <strong>Open Rate:</strong>
            <p>Percentage of delivered emails that were opened by recipients.</p>
          </div>
        </div>
      </HelpSection>

      <HelpSection title="Improving Email Performance" icon={Lightbulb}>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Keep bounce rate below 5% for good deliverability</li>
          <li>Use engaging subject lines to improve open rates</li>
          <li>Regularly clean your email list of invalid addresses</li>
          <li>Monitor for spam complaints and unsubscribes</li>
          <li>Authenticate your domain with SPF, DKIM, and DMARC</li>
        </ul>
      </HelpSection>
    </div>
  );
}

interface ContextualHelpProps {
  section: 'smtp' | 'templates' | 'testing' | 'analytics';
  className?: string;
}

export function ContextualHelp({ section, className }: ContextualHelpProps) {
  const helpComponents = {
    smtp: SMTPConfigurationHelp,
    templates: EmailTemplateHelp,
    testing: () => (
      <QuickTip type="info">
        Test emails help you verify that your templates and SMTP configuration work correctly 
        before sending to real users. Always test with different email providers.
      </QuickTip>
    ),
    analytics: EmailAnalyticsHelp
  };

  const HelpComponent = helpComponents[section];

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg p-4', className)}>
      <div className="flex items-center space-x-2 mb-4">
        <Book className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Help & Documentation</h3>
      </div>
      <HelpComponent />
    </div>
  );
}

// Inline help for specific form fields
export const fieldHelp = {
  smtpHost: "The hostname of your SMTP server (e.g., smtp.gmail.com)",
  smtpPort: "Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)",
  smtpEncryption: "TLS is recommended for security. SSL is also secure but older.",
  templateSubject: "Keep under 50 characters for better mobile display",
  templatePlaceholders: "Use {{variable_name}} format for dynamic content",
  testRecipient: "Enter your own email address to receive the test email"
};