"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Send, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  History,
  Mail,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { emailTestService, TestEmailRequest, TestEmailStatus } from "@/lib/email-test-service";

interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  placeholders: string[];
  is_active: boolean;
}

interface TestResult {
  testId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  message?: string;
  previewHtml?: string;
}

interface EmailTestingInterfaceProps {
  className?: string;
}

export default function EmailTestingInterface({ className }: EmailTestingInterfaceProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [testParameters, setTestParameters] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{ subject: string; htmlContent: string; textContent: string } | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testHistory, setTestHistory] = useState<TestEmailStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Load email templates on component mount
  useEffect(() => {
    loadTemplates();
    loadTestHistory();
  }, []);

  // Load available email templates
  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/email/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      } else {
        toast.error('Failed to load email templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Error loading templates');
    } finally {
      setIsLoading(false);
    }
  };

  // Load test history
  const loadTestHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const history = await emailTestService.getTestHistory(1, 10);
      setTestHistory(history.tests);
    } catch (error) {
      console.error('Error loading test history:', error);
      toast.error('Failed to load test history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      // Initialize test parameters with empty values
      const initialParams: Record<string, string> = {};
      template.placeholders.forEach(placeholder => {
        initialParams[placeholder] = getSampleValue(placeholder);
      });
      setTestParameters(initialParams);
      setPreview(null);
      setTestResult(null);
      setValidationErrors([]);
      setValidationWarnings([]);
    }
  };

  // Get sample values for common placeholders
  const getSampleValue = (placeholder: string): string => {
    const sampleValues: Record<string, string> = {
      'user_name': 'John Doe',
      'user_email': 'john.doe@example.com',
      'lesson_title': 'Introduction to Spanish',
      'lesson_date': new Date().toLocaleDateString(),
      'lesson_time': '2:00 PM',
      'teacher_name': 'Maria Garcia',
      'reset_link': 'https://example.com/reset-password?token=sample-token',
      'verification_code': '123456',
      'company_name': 'LinguaFlow',
      'support_email': 'support@linguaflow.com'
    };
    return sampleValues[placeholder] || `[${placeholder}]`;
  };

  // Handle parameter change
  const handleParameterChange = (key: string, value: string) => {
    setTestParameters(prev => ({
      ...prev,
      [key]: value
    }));
    // Clear preview when parameters change
    setPreview(null);
  };

  // Validate test parameters
  const validateParameters = useCallback(async () => {
    if (!selectedTemplate) return;

    try {
      const validation = await emailTestService.validateTestParameters(
        selectedTemplate.id,
        testParameters
      );
      setValidationErrors(validation.errors);
      setValidationWarnings(validation.warnings);
      return validation.isValid;
    } catch (error) {
      console.error('Error validating parameters:', error);
      setValidationErrors(['Validation error occurred']);
      return false;
    }
  }, [selectedTemplate, testParameters]);

  // Generate preview
  const generatePreview = async () => {
    if (!selectedTemplate) return;

    try {
      setIsLoading(true);
      const isValid = await validateParameters();
      if (!isValid) {
        toast.error('Please fix validation errors before generating preview');
        return;
      }

      const previewData = await emailTestService.generatePreview(
        selectedTemplate.id,
        testParameters
      );
      setPreview(previewData);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  // Send test email
  const sendTestEmail = async () => {
    if (!selectedTemplate || !recipientEmail) {
      toast.error('Please select a template and enter recipient email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsSending(true);
      const isValid = await validateParameters();
      if (!isValid) {
        toast.error('Please fix validation errors before sending');
        return;
      }

      const request: TestEmailRequest = {
        templateId: selectedTemplate.id,
        recipientEmail,
        testParameters
      };

      const result = await emailTestService.sendTestEmail(request);
      setTestResult(result);

      if (result.status === 'sent') {
        toast.success('Test email sent successfully!');
        // Refresh test history
        loadTestHistory();
        // Start polling for status updates
        pollTestStatus(result.testId);
      } else {
        toast.error(result.message || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setIsSending(false);
    }
  };

  // Poll test status for updates
  const pollTestStatus = async (testId: string) => {
    const maxAttempts = 10;
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await emailTestService.getTestStatus(testId);
        setTestResult(prev => prev ? { ...prev, status: status.status } : null);

        if (status.status === 'delivered') {
          toast.success('Test email delivered successfully!');
          loadTestHistory();
          return;
        } else if (status.status === 'failed') {
          toast.error(`Test email failed: ${status.errorMessage}`);
          loadTestHistory();
          return;
        }

        attempts++;
        if (attempts < maxAttempts && (status.status === 'pending' || status.status === 'sent')) {
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (error) {
        console.error('Error polling test status:', error);
      }
    };

    poll();
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          {status}
        </Badge>;
      case 'failed':
        return <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>;
      case 'pending':
        return <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Testing Interface
          </CardTitle>
          <CardDescription>
            Test email templates with custom parameters and track delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="compose" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="compose">Compose Test</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="history">Test History</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-4">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="template-select">Email Template</Label>
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an email template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <span>{template.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {template.type}
                          </Badge>
                          {!template.is_active && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recipient Email */}
              <div className="space-y-2">
                <Label htmlFor="recipient-email">Recipient Email</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  placeholder="test@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>

              {/* Test Parameters */}
              {selectedTemplate && selectedTemplate.placeholders.length > 0 && (
                <div className="space-y-4">
                  <Label>Test Parameters</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTemplate.placeholders.map((placeholder) => (
                      <div key={placeholder} className="space-y-2">
                        <Label htmlFor={`param-${placeholder}`} className="text-sm">
                          {placeholder.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                        <Input
                          id={`param-${placeholder}`}
                          placeholder={`Enter ${placeholder}`}
                          value={testParameters[placeholder] || ''}
                          onChange={(e) => handleParameterChange(placeholder, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation Messages */}
              {validationErrors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Validation Errors
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationWarnings.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Warnings
                  </div>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {validationWarnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={generatePreview}
                  disabled={!selectedTemplate || isLoading}
                  variant="outline"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Generate Preview
                </Button>
                <Button
                  onClick={sendTestEmail}
                  disabled={!selectedTemplate || !recipientEmail || isSending || validationErrors.length > 0}
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Test Email
                </Button>
              </div>

              {/* Test Result */}
              {testResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Test Result</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        {getStatusBadge(testResult.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Test ID:</span>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {testResult.testId}
                        </code>
                      </div>
                      {testResult.message && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium">Message:</span>
                          <span className="text-sm">{testResult.message}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {preview ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Email Preview</CardTitle>
                    <CardDescription>
                      Preview of the email with your test parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="font-medium">Subject:</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded mt-1">{preview.subject}</p>
                    </div>
                    <div>
                      <Label className="font-medium">HTML Content:</Label>
                      <div 
                        className="border rounded p-4 mt-1 bg-white"
                        dangerouslySetInnerHTML={{ __html: preview.htmlContent }}
                      />
                    </div>
                    {preview.textContent && (
                      <div>
                        <Label className="font-medium">Text Content:</Label>
                        <pre className="text-sm bg-gray-50 p-2 rounded mt-1 whitespace-pre-wrap">
                          {preview.textContent}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center text-gray-500">
                      <Eye className="w-8 h-8 mx-auto mb-2" />
                      <p>Generate a preview to see your email content</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Recent Test History</h3>
                <Button onClick={loadTestHistory} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : testHistory.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent At</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testHistory.map((test) => (
                          <TableRow key={test.testId}>
                            <TableCell className="font-medium">
                              {test.recipientEmail}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {test.subject}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(test.status)}
                            </TableCell>
                            <TableCell>
                              {test.sentAt ? new Date(test.sentAt).toLocaleString() : '-'}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Test Details</DialogTitle>
                                    <DialogDescription>
                                      Detailed information about this test email
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="font-medium">Test ID:</Label>
                                        <p className="text-sm">{test.testId}</p>
                                      </div>
                                      <div>
                                        <Label className="font-medium">Status:</Label>
                                        <div className="mt-1">{getStatusBadge(test.status)}</div>
                                      </div>
                                      <div>
                                        <Label className="font-medium">Recipient:</Label>
                                        <p className="text-sm">{test.recipientEmail}</p>
                                      </div>
                                      <div>
                                        <Label className="font-medium">Sent At:</Label>
                                        <p className="text-sm">
                                          {test.sentAt ? new Date(test.sentAt).toLocaleString() : '-'}
                                        </p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="font-medium">Subject:</Label>
                                      <p className="text-sm bg-gray-50 p-2 rounded mt-1">{test.subject}</p>
                                    </div>
                                    {test.errorMessage && (
                                      <div>
                                        <Label className="font-medium text-red-600">Error Message:</Label>
                                        <p className="text-sm text-red-600 bg-red-50 p-2 rounded mt-1">
                                          {test.errorMessage}
                                        </p>
                                      </div>
                                    )}
                                    {test.retryAttempts && test.retryAttempts > 0 && (
                                      <div>
                                        <Label className="font-medium">Retry Attempts:</Label>
                                        <p className="text-sm">{test.retryAttempts}</p>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center text-gray-500">
                      <History className="w-8 h-8 mx-auto mb-2" />
                      <p>No test history available</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}