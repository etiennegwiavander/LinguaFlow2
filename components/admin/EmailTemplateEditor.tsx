"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Save,
  Eye,
  Code,
  Type,
  AlertCircle,
  CheckCircle,
  Plus,
  X,
  History,
  RotateCcw,
  Wand2,
  FileText,
  Mail
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  placeholders: string[];
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

interface TemplateHistory {
  id: string;
  version: number;
  subject: string;
  html_content: string;
  text_content?: string;
  placeholders: string[];
  created_at: string;
  created_by: {
    id: string;
    email: string;
    name: string;
  };
}

interface ValidationError {
  field: string;
  message: string;
  line?: number;
  column?: number;
}

interface PreviewData {
  subject: string;
  htmlContent: string;
  textContent?: string;
  sampleData: Record<string, any>;
  unresolvedPlaceholders: string[];
  warnings: string[];
}

const TEMPLATE_TYPES = [
  { value: 'welcome', label: 'Welcome Email', description: 'Sent when users sign up' },
  { value: 'lesson_reminder', label: 'Lesson Reminder', description: 'Sent before scheduled lessons' },
  { value: 'password_reset', label: 'Password Reset', description: 'Sent for password recovery' },
  { value: 'custom', label: 'Custom Template', description: 'Custom email template' }
];

const AVAILABLE_PLACEHOLDERS = {
  welcome: [
    { key: 'user_name', description: 'User\'s full name', required: true },
    { key: 'user_email', description: 'User\'s email address', required: true },
    { key: 'platform_name', description: 'Platform name', required: false },
    { key: 'login_url', description: 'Login page URL', required: false },
    { key: 'support_email', description: 'Support contact email', required: false }
  ],
  lesson_reminder: [
    { key: 'user_name', description: 'User\'s full name', required: true },
    { key: 'lesson_title', description: 'Lesson title', required: true },
    { key: 'lesson_date', description: 'Lesson date', required: true },
    { key: 'lesson_time', description: 'Lesson time', required: true },
    { key: 'lesson_url', description: 'Lesson access URL', required: false },
    { key: 'tutor_name', description: 'Tutor\'s name', required: false }
  ],
  password_reset: [
    { key: 'user_name', description: 'User\'s full name', required: true },
    { key: 'reset_url', description: 'Password reset URL', required: true },
    { key: 'expiry_time', description: 'Link expiry time', required: false },
    { key: 'support_email', description: 'Support contact email', required: false }
  ],
  custom: [
    { key: 'user_name', description: 'User\'s full name', required: false },
    { key: 'user_email', description: 'User\'s email address', required: false },
    { key: 'platform_name', description: 'Platform name', required: false }
  ]
};

const SAMPLE_DATA = {
  user_name: 'John Doe',
  user_email: 'john.doe@example.com',
  platform_name: 'LinguaFlow',
  login_url: 'https://linguaflow.com/login',
  support_email: 'support@linguaflow.com',
  lesson_title: 'Advanced English Conversation',
  lesson_date: 'March 15, 2024',
  lesson_time: '2:00 PM EST',
  lesson_url: 'https://linguaflow.com/lesson/123',
  tutor_name: 'Sarah Johnson',
  reset_url: 'https://linguaflow.com/reset-password?token=abc123',
  expiry_time: '24 hours'
};

interface EmailTemplateEditorProps {
  template?: EmailTemplate;
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Partial<EmailTemplate>) => Promise<void>;
  isCreating?: boolean;
}

export default function EmailTemplateEditor({
  template,
  isOpen,
  onClose,
  onSave,
  isCreating = false
}: EmailTemplateEditorProps) {
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    placeholders: [] as string[],
    isActive: false
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [templateHistory, setTemplateHistory] = useState<TemplateHistory[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [placeholderSearch, setPlaceholderSearch] = useState('');
  const [showPlaceholderPicker, setShowPlaceholderPicker] = useState(false);

  const htmlEditorRef = useRef<HTMLTextAreaElement>(null);
  const subjectEditorRef = useRef<HTMLInputElement>(null);

  // Initialize form data when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        type: template.type,
        name: template.name,
        subject: template.subject,
        htmlContent: template.html_content,
        textContent: template.text_content || '',
        placeholders: template.placeholders,
        isActive: template.is_active
      });
      // Clear validation errors when loading existing template
      setValidationErrors([]);
    } else if (isCreating) {
      setFormData({
        type: '',
        name: '',
        subject: '',
        htmlContent: '',
        textContent: '',
        placeholders: [],
        isActive: false
      });
      // Clear validation errors for new template
      setValidationErrors([]);
    }
  }, [template, isCreating]);

  // Validate template content
  const validateTemplate = useCallback(() => {
    const errors: ValidationError[] = [];

    // Basic field validation
    if (!formData.name.trim()) {
      errors.push({ field: 'name', message: 'Template name is required' });
    }

    if (!formData.type) {
      errors.push({ field: 'type', message: 'Template type is required' });
    }

    if (!formData.subject.trim()) {
      errors.push({ field: 'subject', message: 'Subject line is required' });
    }

    if (!formData.htmlContent.trim()) {
      errors.push({ field: 'htmlContent', message: 'HTML content is required' });
    }

    // HTML validation
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(formData.htmlContent, 'text/html');
      const parseErrors = doc.querySelectorAll('parsererror');
      if (parseErrors.length > 0) {
        errors.push({
          field: 'htmlContent',
          message: 'Invalid HTML syntax detected'
        });
      }
    } catch (error) {
      errors.push({
        field: 'htmlContent',
        message: 'HTML content contains syntax errors'
      });
    }

    // Placeholder validation
    const htmlPlaceholders = extractPlaceholders(formData.htmlContent);
    const subjectPlaceholders = extractPlaceholders(formData.subject);
    const textPlaceholders = formData.textContent ? extractPlaceholders(formData.textContent) : [];

    const allUsedPlaceholders = Array.from(new Set([...htmlPlaceholders, ...subjectPlaceholders, ...textPlaceholders]));
    const availablePlaceholders = AVAILABLE_PLACEHOLDERS[formData.type as keyof typeof AVAILABLE_PLACEHOLDERS] || [];
    const requiredPlaceholders = availablePlaceholders.filter(p => p.required).map(p => p.key);

    // Check for undefined placeholders
    const undefinedPlaceholders = allUsedPlaceholders.filter(
      placeholder => !availablePlaceholders.some(p => p.key === placeholder)
    );

    if (undefinedPlaceholders.length > 0) {
      errors.push({
        field: 'placeholders',
        message: `Undefined placeholders: ${undefinedPlaceholders.join(', ')}`
      });
    }

    // Check for missing required placeholders
    const missingRequired = requiredPlaceholders.filter(
      placeholder => !allUsedPlaceholders.includes(placeholder)
    );

    if (missingRequired.length > 0) {
      errors.push({
        field: 'placeholders',
        message: `Missing required placeholders: ${missingRequired.join(', ')}`
      });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [formData]);

  // Extract placeholders from text
  const extractPlaceholders = (text: string): string[] => {
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    return matches ? matches.map(match => match.slice(2, -2).trim()) : [];
  };

  // Generate preview
  const generatePreview = useCallback(async () => {
    if (!validateTemplate()) {
      toast.error('Please fix validation errors before previewing');
      return;
    }

    try {
      const htmlPlaceholders = extractPlaceholders(formData.htmlContent);
      const subjectPlaceholders = extractPlaceholders(formData.subject);
      const textPlaceholders = formData.textContent ? extractPlaceholders(formData.textContent) : [];

      const allPlaceholders = Array.from(new Set([...htmlPlaceholders, ...subjectPlaceholders, ...textPlaceholders]));

      let processedSubject = formData.subject;
      let processedHtml = formData.htmlContent;
      let processedText = formData.textContent;

      const unresolvedPlaceholders: string[] = [];
      const warnings: string[] = [];

      // Replace placeholders with sample data
      allPlaceholders.forEach(placeholder => {
        const value = SAMPLE_DATA[placeholder as keyof typeof SAMPLE_DATA];
        if (value) {
          const regex = new RegExp(`\\{\\{\\s*${placeholder}\\s*\\}\\}`, 'g');
          processedSubject = processedSubject.replace(regex, value);
          processedHtml = processedHtml.replace(regex, value);
          if (processedText) {
            processedText = processedText.replace(regex, value);
          }
        } else {
          unresolvedPlaceholders.push(placeholder);
        }
      });

      if (unresolvedPlaceholders.length > 0) {
        warnings.push(`Some placeholders don't have sample data: ${unresolvedPlaceholders.join(', ')}`);
      }

      setPreviewData({
        subject: processedSubject,
        htmlContent: processedHtml,
        textContent: processedText,
        sampleData: SAMPLE_DATA,
        unresolvedPlaceholders,
        warnings
      });

      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    }
  }, [formData, validateTemplate]);

  // Insert placeholder at cursor position
  const insertPlaceholder = (placeholder: string, targetField: 'subject' | 'html' | 'text') => {
    const placeholderText = `{{${placeholder}}}`;

    if (targetField === 'subject' && subjectEditorRef.current) {
      const input = subjectEditorRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue = formData.subject.slice(0, start) + placeholderText + formData.subject.slice(end);

      setFormData({ ...formData, subject: newValue });

      // Set cursor position after placeholder
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + placeholderText.length, start + placeholderText.length);
      }, 0);
    } else if (targetField === 'html' && htmlEditorRef.current) {
      const textarea = htmlEditorRef.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newValue = formData.htmlContent.slice(0, start) + placeholderText + formData.htmlContent.slice(end);

      setFormData({ ...formData, htmlContent: newValue });

      // Set cursor position after placeholder
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholderText.length, start + placeholderText.length);
      }, 0);
    } else if (targetField === 'text') {
      const newValue = formData.textContent + placeholderText;
      setFormData({ ...formData, textContent: newValue });
    }

    setShowPlaceholderPicker(false);
  };

  // Load template history
  const loadTemplateHistory = async () => {
    if (!template?.id) return;

    try {
      const response = await fetch(`/api/admin/email/templates/${template.id}/history`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch template history');
      }

      const data = await response.json();
      setTemplateHistory(data.history || []);
      setShowHistory(true);
    } catch (error) {
      console.error('Error fetching template history:', error);
      toast.error('Failed to load template history');
    }
  };

  // Rollback to version
  const rollbackToVersion = async (version: number) => {
    if (!template?.id) return;

    if (!confirm(`Are you sure you want to rollback to version ${version}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/email/templates/${template.id}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ version })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rollback template');
      }

      toast.success(`Template rolled back to version ${version}`);
      setShowHistory(false);
      onClose();
    } catch (error: any) {
      console.error('Error rolling back template:', error);
      toast.error(error.message || 'Failed to rollback template');
    }
  };

  // Get auth token (placeholder - implement based on your auth system)
  const getAuthToken = () => {
    // In a real implementation, this would get the token from your auth system
    // For now, return a placeholder token
    return 'admin-token';
  };

  // Handle save
  const handleSave = async () => {
    if (!validateTemplate()) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      setSaving(true);

      const templateData = {
        type: formData.type,
        name: formData.name,
        subject: formData.subject,
        html_content: formData.htmlContent,  // Fixed: snake_case for API
        text_content: formData.textContent || undefined,  // Fixed: use undefined instead of null
        placeholders: extractPlaceholders(formData.htmlContent + ' ' + formData.subject + ' ' + (formData.textContent || '')),
        is_active: formData.isActive  // Fixed: snake_case for API
      };

      await onSave(templateData);
      onClose();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  // Run validation when form data changes
  useEffect(() => {
    if (formData.name || formData.subject || formData.htmlContent) {
      validateTemplate();
    }
  }, [formData, validateTemplate]);

  const availablePlaceholders = AVAILABLE_PLACEHOLDERS[formData.type as keyof typeof AVAILABLE_PLACEHOLDERS] || [];
  const filteredPlaceholders = availablePlaceholders.filter(p =>
    p.key.toLowerCase().includes(placeholderSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(placeholderSearch.toLowerCase())
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {isCreating ? 'Create New Email Template' : 'Edit Email Template'}
            </DialogTitle>
            <DialogDescription>
              {isCreating
                ? 'Create a new email template with rich content and dynamic placeholders'
                : 'Modify the email template with advanced editing features'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
                {!isCreating && (
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    History
                  </TabsTrigger>
                )}
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="editor" className="space-y-6 mt-6">
                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <Card className="border-red-200 bg-red-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-red-800 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Validation Errors
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index} className="text-sm text-red-700">
                              <strong>{error.field}:</strong> {error.message}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="templateType">Template Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger className={validationErrors.some(e => e.field === 'type') ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select template type" />
                        </SelectTrigger>
                        <SelectContent>
                          {TEMPLATE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-sm text-muted-foreground">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="templateName">Template Name *</Label>
                      <Input
                        id="templateName"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter template name"
                        className={validationErrors.some(e => e.field === 'name') ? 'border-red-500' : ''}
                      />
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="subject">Subject Line *</Label>
                      <Popover open={showPlaceholderPicker} onOpenChange={setShowPlaceholderPicker}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" disabled={!formData.type}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Placeholder
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <Command>
                            <CommandInput
                              placeholder="Search placeholders..."
                              value={placeholderSearch}
                              onValueChange={setPlaceholderSearch}
                            />
                            <CommandEmpty>No placeholders found.</CommandEmpty>
                            <CommandGroup>
                              {filteredPlaceholders.map((placeholder) => (
                                <CommandItem
                                  key={placeholder.key}
                                  onSelect={() => insertPlaceholder(placeholder.key, 'subject')}
                                  className="flex flex-col items-start"
                                >
                                  <div className="flex items-center gap-2">
                                    <code className="text-sm bg-muted px-1 rounded">
                                      {`{{${placeholder.key}}}`}
                                    </code>
                                    {placeholder.required && (
                                      <Badge variant="destructive" className="text-xs">Required</Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {placeholder.description}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Input
                      ref={subjectEditorRef}
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Enter email subject (use {{placeholder}} for dynamic content)"
                      className={validationErrors.some(e => e.field === 'subject') ? 'border-red-500' : ''}
                    />
                  </div>

                  {/* HTML Content */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="htmlContent">HTML Content *</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertPlaceholder('user_name', 'html')}
                          disabled={!formData.type}
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          Quick Insert
                        </Button>
                        <Button variant="outline" size="sm" onClick={generatePreview}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      ref={htmlEditorRef}
                      id="htmlContent"
                      value={formData.htmlContent}
                      onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                      placeholder="Enter HTML email content with placeholders like {{user_name}}"
                      rows={12}
                      className={`font-mono text-sm ${validationErrors.some(e => e.field === 'htmlContent') ? 'border-red-500' : ''}`}
                    />
                  </div>

                  {/* Plain Text Content */}
                  <div className="space-y-2">
                    <Label htmlFor="textContent">Plain Text Content (Optional)</Label>
                    <Textarea
                      id="textContent"
                      value={formData.textContent}
                      onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                      placeholder="Enter plain text version (auto-generated if left empty)"
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Available Placeholders */}
                  {formData.type && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Available Placeholders for {TEMPLATE_TYPES.find(t => t.value === formData.type)?.label}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                          {availablePlaceholders.map((placeholder) => (
                            <div key={placeholder.key} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <code className="text-sm bg-muted px-1 rounded">
                                  {`{{${placeholder.key}}}`}
                                </code>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {placeholder.description}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {placeholder.required && (
                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => insertPlaceholder(placeholder.key, 'html')}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Template Settings */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Set as active template</Label>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-6">
                  {previewData ? (
                    <div className="space-y-6">
                      {previewData.warnings.length > 0 && (
                        <Card className="border-yellow-200 bg-yellow-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-yellow-800 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Preview Warnings
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1">
                              {previewData.warnings.map((warning, index) => (
                                <li key={index} className="text-sm text-yellow-700">{warning}</li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      <Card>
                        <CardHeader>
                          <CardTitle>Email Preview</CardTitle>
                          <CardDescription>How the email will appear to recipients</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Subject</Label>
                            <div className="mt-1 p-3 bg-muted rounded-md font-medium">
                              {previewData.subject}
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">HTML Content</Label>
                            <div className="mt-1 p-4 bg-white border rounded-md max-h-96 overflow-y-auto">
                              <div dangerouslySetInnerHTML={{ __html: previewData.htmlContent }} />
                            </div>
                          </div>

                          {previewData.textContent && (
                            <div>
                              <Label className="text-sm font-medium">Plain Text Content</Label>
                              <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                                {previewData.textContent}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Preview Available</h3>
                      <p className="text-muted-foreground mb-4">
                        Generate a preview to see how your email will look
                      </p>
                      <Button onClick={generatePreview}>
                        <Eye className="h-4 w-4 mr-2" />
                        Generate Preview
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {!isCreating && (
                  <TabsContent value="history" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Version History</CardTitle>
                        <CardDescription>
                          View and manage previous versions of this template
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {templateHistory.length === 0 ? (
                          <div className="text-center py-8">
                            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No version history available</p>
                            <Button variant="outline" onClick={loadTemplateHistory} className="mt-4">
                              Load History
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {templateHistory.map((version) => (
                              <div key={version.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                  <div className="font-medium">Version {version.version}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {version.subject}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Modified by {version.created_by.email} on {new Date(version.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => rollbackToVersion(version.version)}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Rollback
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </div>
            </Tabs>
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {!isCreating && (
                <Button variant="outline" onClick={loadTemplateHistory}>
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              )}
              <Button variant="outline" onClick={generatePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isCreating ? 'Create Template' : 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Standalone Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Template Preview</DialogTitle>
            <DialogDescription>
              Preview of how the email will appear to recipients
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-6">
              {previewData.warnings.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-yellow-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {previewData.warnings.map((warning, index) => (
                        <li key={index} className="text-sm text-yellow-700">{warning}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md font-medium">
                    {previewData.subject}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">HTML Content</Label>
                  <div className="mt-1 p-4 bg-white border rounded-md">
                    <div dangerouslySetInnerHTML={{ __html: previewData.htmlContent }} />
                  </div>
                </div>

                {previewData.textContent && (
                  <div>
                    <Label className="text-sm font-medium">Plain Text Content</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm whitespace-pre-wrap">
                      {previewData.textContent}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Version History</DialogTitle>
            <DialogDescription>
              View and manage version history for {template?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {templateHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No version history available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {templateHistory.map((version) => (
                  <div key={version.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">Version {version.version}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {version.subject}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Modified by {version.created_by.email} on {new Date(version.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rollbackToVersion(version.version)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Rollback
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistory(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}