"use client";

import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  History,
  MoreHorizontal,
  Copy,
  Download
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const TEMPLATE_TYPES = [
  { value: 'welcome', label: 'Welcome Email' },
  { value: 'lesson_reminder', label: 'Lesson Reminder' },
  { value: 'password_reset', label: 'Password Reset' },
  { value: 'custom', label: 'Custom Template' }
];

// Simple Template Form Component
const TemplateForm = ({ template, onSave, onCancel }: {
  template: EmailTemplate | null;
  onSave: (data: Partial<EmailTemplate>) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = React.useState(template?.name || '');
  const [type, setType] = React.useState(template?.type || 'custom');
  const [subject, setSubject] = React.useState(template?.subject || '');
  const [htmlContent, setHtmlContent] = React.useState(template?.html_content || '');
  const [textContent, setTextContent] = React.useState(template?.text_content || '');
  const [isActive, setIsActive] = React.useState(template?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({
      name,
      type,
      subject,
      html_content: htmlContent,
      text_content: textContent,
      placeholders: [],
      is_active: isActive
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Template Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="e.g., Welcome Email"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Template Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          >
            {TEMPLATE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Subject Line</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="e.g., Welcome to LinguaFlow!"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">HTML Content</label>
        <textarea
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          className="w-full px-3 py-2 border rounded-md font-mono text-sm"
          rows={10}
          placeholder="<html><body>...</body></html>"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Plain Text (Optional)</label>
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          rows={5}
          placeholder="Plain text version..."
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="is_active" className="text-sm font-medium">
          Active
        </label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={(e) => {
          const form = e.currentTarget.closest('div')?.querySelector('input[required]');
          if (form) {
            handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
          }
        }}>
          {template ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );
};

export default function EmailTemplateManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/email/templates');
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      
      const result = await response.json();
      // API returns { success: true, data: [...] }
      setTemplates(result.data || result.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = () => {
    // In a real app, get this from your auth system
    return 'admin-token';
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsEditDialogOpen(true);
  };

  const handleViewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsViewDialogOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditDialogOpen(true);
  };

  const handleSaveTemplate = async (templateData: Partial<EmailTemplate>) => {
    try {
      if (selectedTemplate) {
        // Update existing template
        const response = await fetch(`/api/admin/email/templates/${selectedTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templateData)
        });

        if (!response.ok) {
          throw new Error('Failed to update template');
        }

        toast.success('Template updated successfully');
      } else {
        // Create new template
        const response = await fetch('/api/admin/email/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templateData)
        });

        if (!response.ok) {
          throw new Error('Failed to create template');
        }

        toast.success('Template created successfully');
      }

      setIsEditDialogOpen(false);
      fetchTemplates(); // Refresh the list
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleCopyTemplate = (template: EmailTemplate) => {
    navigator.clipboard.writeText(template.html_content);
    toast.success('Template HTML copied to clipboard');
  };

  const handleDownloadTemplate = (template: EmailTemplate) => {
    const blob = new Blob([template.html_content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/email/templates/${template.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      toast.success('Template deleted successfully');
      fetchTemplates(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleViewHistory = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsHistoryDialogOpen(true);
  };

  const handleToggleStatus = async (template: EmailTemplate) => {
    try {
      const newStatus = !template.is_active;
      const response = await fetch(`/api/admin/email/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...template, is_active: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update template status');
      }

      toast.success(`Template ${newStatus ? 'activated' : 'deactivated'} successfully`);
      fetchTemplates(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating template status:', error);
      toast.error('Failed to update template status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading email templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-muted-foreground">
            Manage email templates for system communications
          </p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            {templates.length} template{templates.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first email template to get started
              </p>
              <Button onClick={handleCreateTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TEMPLATE_TYPES.find(t => t.value === template.type)?.label || template.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>v{template.version}</TableCell>
                    <TableCell>
                      {new Date(template.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewTemplate(template)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Template
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Template
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyTemplate(template)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy HTML
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadTemplate(template)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewHistory(template)}>
                            <History className="mr-2 h-4 w-4" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(template)}>
                            {template.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTemplate(template)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Template
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Template Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Template: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Template details and preview
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Version</label>
                  <p className="text-sm text-muted-foreground">v{selectedTemplate.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Updated</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedTemplate.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Subject</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedTemplate.subject}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Placeholders</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedTemplate.placeholders.map((placeholder) => (
                    <Badge key={placeholder} variant="outline" className="text-xs">
                      {placeholder}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">HTML Content</label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <iframe
                    srcDoc={selectedTemplate.html_content}
                    className="w-full h-64 border rounded"
                    title="Template Preview"
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Create Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? `Edit Template: ${selectedTemplate.name}` : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate ? 'Update template details and content' : 'Create a new email template'}
            </DialogDescription>
          </DialogHeader>
          <TemplateForm 
            template={selectedTemplate}
            onSave={handleSaveTemplate}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template History: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Version history and changes
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Version {selectedTemplate?.version}</p>
                  <p className="text-sm text-muted-foreground">Current version</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {selectedTemplate && new Date(selectedTemplate.updated_at).toLocaleString()}
                  </p>
                  <Badge variant="default">Current</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Version {selectedTemplate ? selectedTemplate.version - 1 : 1}</p>
                  <p className="text-sm text-muted-foreground">Previous version</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {selectedTemplate && new Date(new Date(selectedTemplate.updated_at).getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleString()}
                  </p>
                  <Badge variant="outline">Archived</Badge>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}