"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, TestTube, CheckCircle, XCircle, AlertCircle, Eye, EyeOff, Mail } from "lucide-react";
import { EmailErrorBoundary } from './EmailErrorBoundary';
import { EmailOperationLoading, SMTPConfigLoading } from './EmailLoadingStates';
import { EmailErrorMessage, EmailErrorSummary } from './EmailErrorMessages';
import { NotificationContainer, EmailConfirmationDialogs, type Notification } from './EmailNotifications';
import { ValidatedFormField, emailValidationRules, FormValidationSummary } from './EmailFormValidation';
import { TooltipHelp, ContextualHelp, fieldHelp } from './EmailHelpSystem';
import { useSMTPConfigHandling } from '@/hooks/useEmailErrorHandling';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getProviderDefaults, getProviderHelpText, SMTPProvider } from "@/lib/smtp-validation";

interface SMTPConfig {
  id: string;
  provider: SMTPProvider;
  host: string;
  port: number;
  username: string;
  encryption: 'tls' | 'ssl' | 'none';
  is_active: boolean;
  last_tested?: string;
  test_status?: 'success' | 'failed' | 'pending';
  created_at: string;
  updated_at: string;
}

interface SMTPConfigForm {
  provider: SMTPProvider;
  host: string;
  port: string;
  username: string;
  password: string;
  encryption: 'tls' | 'ssl' | 'none';
  is_active: boolean;
}

function SMTPConfigurationManagerContent() {
  const [configs, setConfigs] = useState<SMTPConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SMTPConfig | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<SMTPConfig | null>(null);
  const [testingConfig, setTestingConfig] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Enhanced error handling
  const {
    errors,
    notifications,
    isLoading: operationLoading,
    dismissNotification,
    clearErrors,
    testSMTPConnection,
    saveSMTPConfig
  } = useSMTPConfigHandling();

  const [formData, setFormData] = useState<SMTPConfigForm>({
    provider: 'custom',
    host: '',
    port: '587',
    username: '',
    password: '',
    encryption: 'tls',
    is_active: false,
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/admin/email/smtp-config');
      if (response.ok) {
        const data = await response.json();
        setConfigs(data.data || []);
      } else {
        toast.error('Failed to fetch SMTP configurations');
      }
    } catch (error) {
      toast.error('Error loading SMTP configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (provider: SMTPProvider) => {
    const defaults = getProviderDefaults(provider);
    setFormData({
      ...formData,
      provider,
      ...defaults,
      port: defaults.port?.toString() || formData.port,
    });
  };

  const handleSubmit = async () => {
    try {
      const url = editingConfig
        ? `/api/admin/email/smtp-config/${editingConfig.id}`
        : '/api/admin/email/smtp-config';

      const method = editingConfig ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          port: parseInt(formData.port),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingConfig ? 'Configuration updated' : 'Configuration created');
        if (data.warnings && data.warnings.length > 0) {
          data.warnings.forEach((warning: string) => toast.warning(warning));
        }
        setShowDialog(false);
        setEditingConfig(null);
        resetForm();
        fetchConfigs();
      } else {
        if (data.details && Array.isArray(data.details)) {
          data.details.forEach((error: string) => toast.error(error));
        } else {
          toast.error(data.error || 'Failed to save configuration');
        }
      }
    } catch (error) {
      toast.error('Error saving configuration');
    }
  };

  const handleEdit = (config: SMTPConfig) => {
    setEditingConfig(config);
    setFormData({
      provider: config.provider,
      host: config.host,
      port: config.port.toString(),
      username: config.username,
      password: '***HIDDEN***', // Don't show actual password
      encryption: config.encryption,
      is_active: config.is_active,
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteConfig) return;

    try {
      const response = await fetch(`/api/admin/email/smtp-config/${deleteConfig.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Configuration deleted');
        setDeleteConfig(null);
        fetchConfigs();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete configuration');
      }
    } catch (error) {
      toast.error('Error deleting configuration');
    }
  };

  const handleTest = async (config: SMTPConfig) => {
    setTestingConfig(config.id);
    try {
      const response = await fetch(`/api/admin/email/smtp-config/${config.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: 'connection' }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }

      // Refresh configs to update test status
      fetchConfigs();
    } catch (error) {
      toast.error('Error testing configuration');
    } finally {
      setTestingConfig(null);
    }
  };

  const resetForm = () => {
    setFormData({
      provider: 'custom',
      host: '',
      port: '587',
      username: '',
      password: '',
      encryption: 'tls',
      is_active: false,
    });
    setShowPassword(false);
  };

  const getStatusBadge = (config: SMTPConfig) => {
    if (!config.test_status) {
      return <Badge variant="secondary">Not Tested</Badge>;
    }

    switch (config.test_status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Working</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Testing</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return <SMTPConfigLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Error Summary */}
      {errors.length > 0 && (
        <EmailErrorSummary
          errors={errors}
          onClearErrors={clearErrors}
        />
      )}

      {/* Operation Loading */}
      {operationLoading && (
        <EmailOperationLoading
          operation="smtp-test"
          message="Processing SMTP operation..."
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">SMTP Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure email providers for sending system emails
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Configuration
        </Button>
      </div>

      <div className="grid gap-4">
        {configs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No SMTP Configurations</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add an SMTP configuration to enable email sending
              </p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Configuration
              </Button>
            </CardContent>
          </Card>
        ) : (
          configs.map((config) => (
            <Card key={config.id} className={config.is_active ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-base capitalize">{config.provider}</CardTitle>
                    {config.is_active && <Badge>Active</Badge>}
                    {config.provider === 'resend' ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        HTTP API
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        SMTP
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(config)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(config)}
                      disabled={testingConfig === config.id}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      {testingConfig === config.id ? 'Testing...' : 'Test'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(config)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfig(config)}
                      disabled={config.is_active}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Host</Label>
                    <p className="font-mono">{config.host}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Port</Label>
                    <p className="font-mono">{config.port}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Username</Label>
                    <p className="font-mono truncate">{config.username}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Encryption</Label>
                    <p className="uppercase">{config.encryption}</p>
                  </div>
                </div>
                {config.last_tested && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last tested: {new Date(config.last_tested).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Contextual Help */}
      <ContextualHelp section="smtp" />

      {/* Configuration Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Edit SMTP Configuration' : 'Add SMTP Configuration'}
            </DialogTitle>
            <DialogDescription>
              Configure your email provider settings for sending system emails.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Email Provider</Label>
              <Select
                value={formData.provider}
                onValueChange={handleProviderChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail">Gmail</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="aws-ses">AWS SES</SelectItem>
                  <SelectItem value="resend">Resend</SelectItem>
                  <SelectItem value="custom">Custom SMTP</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getProviderHelpText(formData.provider)}
              </p>
              {formData.provider === 'resend' && (
                <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <strong>HTTP API Mode:</strong> Resend will use their HTTP API instead of SMTP for better reliability and performance.
                    Enter your Resend API key in the Password field.
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">SMTP Host</Label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder="smtp.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="your-email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {formData.provider === 'resend' ? 'API Key' : 'Password'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingConfig ? "Leave blank to keep current" : "Your password or API key"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="encryption">Encryption</Label>
              <Select
                value={formData.encryption}
                onValueChange={(value: 'tls' | 'ssl' | 'none') =>
                  setFormData({ ...formData, encryption: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tls">TLS</SelectItem>
                  <SelectItem value="ssl">SSL</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Set as active configuration</Label>
              </div>
              {formData.is_active && !editingConfig && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Note: Only one configuration can be active at a time. Setting this as active will deactivate any existing active configuration.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDialog(false);
              setEditingConfig(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingConfig ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfig} onOpenChange={() => setDeleteConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SMTP Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this SMTP configuration? This action cannot be undone.
              {deleteConfig?.is_active && (
                <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-sm">
                  This is the active configuration. You cannot delete it while it&apos;s active.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteConfig?.is_active}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function SMTPConfigurationManager() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <EmailErrorBoundary>
      <div className="relative">
        <SMTPConfigurationManagerContent />
        <NotificationContainer
          notifications={notifications}
          onDismiss={handleDismissNotification}
          position="top-right"
        />
      </div>
    </EmailErrorBoundary>
  );
}