"use client";

import { useState } from "react";
import { Settings, Database, Server, Shield, Key, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  
  // System settings
  const [systemSettings, setSystemSettings] = useState({
    apiRateLimit: "100",
    maxUploadSize: "10",
    enableMaintenanceMode: false,
    debugMode: false
  });
  
  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: "60",
    maxLoginAttempts: "5",
    requireStrongPasswords: true,
    twoFactorAuth: false
  });
  
  // Database settings
  const [databaseSettings, setDatabaseSettings] = useState({
    backupFrequency: "daily",
    maxConnections: "20",
    queryTimeout: "30",
    logSlowQueries: true
  });

  const handleSystemSettingChange = (key: string, value: string | boolean) => {
    setSystemSettings({
      ...systemSettings,
      [key]: value
    });
  };

  const handleSecuritySettingChange = (key: string, value: string | boolean) => {
    setSecuritySettings({
      ...securitySettings,
      [key]: value
    });
  };

  const handleDatabaseSettingChange = (key: string, value: string | boolean) => {
    setDatabaseSettings({
      ...databaseSettings,
      [key]: value
    });
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">
          Configure system-wide settings for the LinguaFlow platform
        </p>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>System</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Database</span>
          </TabsTrigger>
        </TabsList>

        {/* System Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2 text-primary" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure general system settings and performance parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="apiRateLimit">API Rate Limit (requests per minute)</Label>
                  <Input
                    id="apiRateLimit"
                    type="number"
                    value={systemSettings.apiRateLimit}
                    onChange={(e) => handleSystemSettingChange('apiRateLimit', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum number of API requests allowed per minute per user
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxUploadSize">Maximum Upload Size (MB)</Label>
                  <Input
                    id="maxUploadSize"
                    type="number"
                    value={systemSettings.maxUploadSize}
                    onChange={(e) => handleSystemSettingChange('maxUploadSize', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum file size for uploads in megabytes
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableMaintenanceMode" className="text-base">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable maintenance mode to prevent users from accessing the platform
                    </p>
                  </div>
                  <Switch
                    id="enableMaintenanceMode"
                    checked={systemSettings.enableMaintenanceMode}
                    onCheckedChange={(checked) => handleSystemSettingChange('enableMaintenanceMode', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="debugMode" className="text-base">Debug Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable detailed error messages and logging for troubleshooting
                    </p>
                  </div>
                  <Switch
                    id="debugMode"
                    checked={systemSettings.debugMode}
                    onCheckedChange={(checked) => handleSystemSettingChange('debugMode', checked)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security parameters and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => handleSecuritySettingChange('sessionTimeout', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Time in minutes before an inactive session expires
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Maximum Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => handleSecuritySettingChange('maxLoginAttempts', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Number of failed login attempts before account lockout
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireStrongPasswords" className="text-base">Require Strong Passwords</Label>
                    <p className="text-sm text-muted-foreground">
                      Enforce password complexity requirements for all users
                    </p>
                  </div>
                  <Switch
                    id="requireStrongPasswords"
                    checked={securitySettings.requireStrongPasswords}
                    onCheckedChange={(checked) => handleSecuritySettingChange('requireStrongPasswords', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twoFactorAuth" className="text-base">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require two-factor authentication for admin users
                    </p>
                  </div>
                  <Switch
                    id="twoFactorAuth"
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => handleSecuritySettingChange('twoFactorAuth', checked)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="regenerateApiKey" className="text-base">Admin API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="regenerateApiKey"
                    type="password"
                    value="••••••••••••••••••••••••••••••"
                    readOnly
                  />
                  <Button variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  API key for admin-only endpoints. Regenerate if compromised.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Database Settings */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-primary" />
                Database Settings
              </CardTitle>
              <CardDescription>
                Configure database connection and backup parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select
                    value={databaseSettings.backupFrequency}
                    onValueChange={(value) => handleDatabaseSettingChange('backupFrequency', value)}
                  >
                    <SelectTrigger id="backupFrequency">
                      <SelectValue placeholder="Select backup frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    How often to perform database backups
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxConnections">Maximum Connections</Label>
                  <Input
                    id="maxConnections"
                    type="number"
                    value={databaseSettings.maxConnections}
                    onChange={(e) => handleDatabaseSettingChange('maxConnections', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum number of concurrent database connections
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="queryTimeout">Query Timeout (seconds)</Label>
                  <Input
                    id="queryTimeout"
                    type="number"
                    value={databaseSettings.queryTimeout}
                    onChange={(e) => handleDatabaseSettingChange('queryTimeout', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum time in seconds before a query times out
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="logSlowQueries" className="text-base">Log Slow Queries</Label>
                    <p className="text-sm text-muted-foreground">
                      Log queries that take longer than the specified threshold
                    </p>
                  </div>
                  <Switch
                    id="logSlowQueries"
                    checked={databaseSettings.logSlowQueries}
                    onCheckedChange={(checked) => handleDatabaseSettingChange('logSlowQueries', checked)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  Run Manual Backup
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Create an immediate backup of the database
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}