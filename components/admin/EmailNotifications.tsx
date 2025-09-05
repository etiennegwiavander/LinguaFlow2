'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  X, 
  Mail, 
  Settings, 
  TestTube,
  Trash2,
  Save
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(notification.id), 300);
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.id, onDismiss]);

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-800',
      textColor: 'text-green-700'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-700'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-800',
      textColor: 'text-yellow-700'
    },
    error: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-800',
      textColor: 'text-red-700'
    }
  };

  const config = typeConfig[notification.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-in-out transform',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className={cn(
        'p-4 rounded-lg border shadow-sm',
        config.bgColor,
        config.borderColor
      )}>
        <div className="flex items-start">
          <Icon className={cn('h-5 w-5 mt-0.5 mr-3 flex-shrink-0', config.iconColor)} />
          <div className="flex-1 min-w-0">
            <h4 className={cn('text-sm font-semibold', config.titleColor)}>
              {notification.title}
            </h4>
            <p className={cn('text-sm mt-1', config.textColor)}>
              {notification.message}
            </p>
            {notification.action && (
              <Button
                variant="ghost"
                size="sm"
                onClick={notification.action.onClick}
                className={cn('mt-2 h-8 px-2', config.textColor)}
              >
                {notification.action.label}
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(notification.id)}
            className={cn('h-6 w-6 p-0 ml-2', config.iconColor)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function NotificationContainer({ 
  notifications, 
  onDismiss, 
  position = 'top-right' 
}: NotificationContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div className={cn(
      'fixed z-50 w-96 max-w-sm space-y-2',
      positionClasses[position]
    )}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

// Confirmation Dialog Components
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  icon?: React.ComponentType<{ className?: string }>;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon: Icon
}: ConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {Icon && <Icon className="h-5 w-5" />}
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Pre-configured confirmation dialogs for common email operations
interface EmailConfirmationDialogsProps {
  deleteTemplate: {
    isOpen: boolean;
    templateName?: string;
    onConfirm: () => void;
    onClose: () => void;
  };
  deleteSMTPConfig: {
    isOpen: boolean;
    configName?: string;
    onConfirm: () => void;
    onClose: () => void;
  };
  sendTestEmail: {
    isOpen: boolean;
    recipientEmail?: string;
    onConfirm: () => void;
    onClose: () => void;
  };
  saveTemplate: {
    isOpen: boolean;
    hasUnsavedChanges?: boolean;
    onConfirm: () => void;
    onClose: () => void;
  };
}

export function EmailConfirmationDialogs({
  deleteTemplate,
  deleteSMTPConfig,
  sendTestEmail,
  saveTemplate
}: EmailConfirmationDialogsProps) {
  return (
    <>
      <ConfirmationDialog
        isOpen={deleteTemplate.isOpen}
        onClose={deleteTemplate.onClose}
        onConfirm={deleteTemplate.onConfirm}
        title="Delete Email Template"
        description={`Are you sure you want to delete the template "${deleteTemplate.templateName}"? This action cannot be undone.`}
        confirmText="Delete Template"
        variant="destructive"
        icon={Trash2}
      />

      <ConfirmationDialog
        isOpen={deleteSMTPConfig.isOpen}
        onClose={deleteSMTPConfig.onClose}
        onConfirm={deleteSMTPConfig.onConfirm}
        title="Delete SMTP Configuration"
        description={`Are you sure you want to delete the SMTP configuration "${deleteSMTPConfig.configName}"? This will affect email delivery if it's currently active.`}
        confirmText="Delete Configuration"
        variant="destructive"
        icon={Settings}
      />

      <ConfirmationDialog
        isOpen={sendTestEmail.isOpen}
        onClose={sendTestEmail.onClose}
        onConfirm={sendTestEmail.onConfirm}
        title="Send Test Email"
        description={`Send a test email to ${sendTestEmail.recipientEmail}? This will use your current SMTP configuration and template settings.`}
        confirmText="Send Test Email"
        icon={TestTube}
      />

      <ConfirmationDialog
        isOpen={saveTemplate.isOpen}
        onClose={saveTemplate.onClose}
        onConfirm={saveTemplate.onConfirm}
        title="Save Template Changes"
        description={saveTemplate.hasUnsavedChanges 
          ? "You have unsaved changes. Do you want to save them before continuing?"
          : "Save the current template changes?"
        }
        confirmText="Save Changes"
        icon={Save}
      />
    </>
  );
}

// Success notification creators for common operations
export const emailNotifications = {
  smtpConfigSaved: (providerName: string): Notification => ({
    id: `smtp-saved-${Date.now()}`,
    type: 'success',
    title: 'SMTP Configuration Saved',
    message: `${providerName} SMTP settings have been successfully saved and tested.`,
    duration: 5000
  }),

  templateSaved: (templateName: string): Notification => ({
    id: `template-saved-${Date.now()}`,
    type: 'success',
    title: 'Template Saved',
    message: `Email template "${templateName}" has been saved successfully.`,
    duration: 4000
  }),

  testEmailSent: (recipientEmail: string): Notification => ({
    id: `test-sent-${Date.now()}`,
    type: 'success',
    title: 'Test Email Sent',
    message: `Test email has been sent to ${recipientEmail}. Check the recipient's inbox.`,
    duration: 6000
  }),

  configurationDeleted: (itemName: string): Notification => ({
    id: `deleted-${Date.now()}`,
    type: 'info',
    title: 'Configuration Deleted',
    message: `${itemName} has been removed from your email settings.`,
    duration: 4000
  }),

  smtpTestSuccess: (providerName: string): Notification => ({
    id: `smtp-test-${Date.now()}`,
    type: 'success',
    title: 'Connection Successful',
    message: `Successfully connected to ${providerName} SMTP server.`,
    duration: 4000
  }),

  templateActivated: (templateName: string): Notification => ({
    id: `template-activated-${Date.now()}`,
    type: 'success',
    title: 'Template Activated',
    message: `Email template "${templateName}" is now active and will be used for new emails.`,
    duration: 5000
  }),

  bulkOperationComplete: (count: number, operation: string): Notification => ({
    id: `bulk-${Date.now()}`,
    type: 'success',
    title: 'Bulk Operation Complete',
    message: `Successfully ${operation} ${count} item${count > 1 ? 's' : ''}.`,
    duration: 4000
  })
};