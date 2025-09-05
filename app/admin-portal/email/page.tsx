"use client";

import { useSearchParams } from "next/navigation";
import { Server, FileText, TestTube, BarChart3, Home } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SMTPConfigurationManager from "@/components/admin/SMTPConfigurationManager";
import EmailTemplateManager from "@/components/admin/EmailTemplateManager";
import EmailTestingInterface from "@/components/admin/EmailTestingInterface";
import EmailAnalyticsDashboard from "@/components/admin/EmailAnalyticsDashboard";
import EmailManagementDashboard from "@/components/admin/EmailManagementDashboard";

export default function EmailManagementPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'dashboard';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Email Management</h1>
        <p className="text-muted-foreground">
          Configure SMTP settings, manage email templates, test email delivery, and monitor email analytics.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Email Templates</span>
          </TabsTrigger>
          <TabsTrigger value="smtp" className="flex items-center space-x-2">
            <Server className="h-4 w-4" />
            <span>SMTP Configuration</span>
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center space-x-2">
            <TestTube className="h-4 w-4" />
            <span>Email Testing</span>
          </TabsTrigger>
        </TabsList>

        {/* Email Management Dashboard */}
        <TabsContent value="dashboard">
          <EmailManagementDashboard />
        </TabsContent>

        {/* Email Analytics */}
        <TabsContent value="analytics">
          <EmailAnalyticsDashboard />
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="templates">
          <EmailTemplateManager />
        </TabsContent>

        {/* SMTP Configuration */}
        <TabsContent value="smtp">
          <div className="bg-card rounded-lg border p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">SMTP Configuration</h2>
              <p className="text-muted-foreground">
                Configure SMTP settings for sending emails from the platform
              </p>
            </div>
            <SMTPConfigurationManager />
          </div>
        </TabsContent>

        {/* Email Testing */}
        <TabsContent value="testing">
          <EmailTestingInterface />
        </TabsContent>
      </Tabs>
    </div>
  );
}