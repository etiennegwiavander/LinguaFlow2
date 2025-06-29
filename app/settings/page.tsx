"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/main-layout";
import { Bell, Shield, User, Upload, Trash2, Languages, Check, Loader2, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { languages } from "@/lib/sample-data";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AccountDeletionDialog from "@/components/settings/AccountDeletionDialog";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isDeletionDialogOpen, setIsDeletionDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('tutors')
          .select('name, email, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setName(data.name || "");
          setEmail(data.email || "");
          setAvatarUrl(data.avatar_url);
        }
      } catch (error: any) {
        toast.error(error.message);
      }
    };

    fetchProfile();
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tutors')
        .update({
          name,
          email
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || !event.target.files[0]) return;

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    setLoading(true);
    try {
      // Upload image
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('tutors')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success('Profile picture updated successfully');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeletion = async (reason?: string) => {
    if (!user) return;

    setIsDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Get user's IP and user agent for logging
      const userAgent = navigator.userAgent;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/schedule-account-deletion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
          user_agent: userAgent
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule account deletion');
      }

      const result = await response.json();
      
      if (result.success) {
        // Sign out the user
        await supabase.auth.signOut();
        
        // Redirect to a confirmation page
        router.push('/auth/deletion-scheduled');
        
        toast.success('Account scheduled for deletion. Check your email for recovery options.');
      } else {
        throw new Error(result.error || 'Failed to schedule account deletion');
      }
    } catch (error: any) {
      console.error('Account deletion error:', error);
      toast.error(error.message || 'Failed to schedule account deletion. Please try again.');
    } finally {
      setIsDeletingAccount(false);
      setIsDeletionDialogOpen(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <MainLayout>
      <div className="space-y-8 animate-slide-up">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div className="space-y-2">
            <Badge className="badge-cyber">
              <User className="w-3 h-3 mr-1" />
              Settings
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="gradient-text">Account</span> Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:w-auto cyber-card border-cyber-400/30 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
            <TabsTrigger 
              value="account" 
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyber-400/20 data-[state=active]:to-neon-400/20 data-[state=active]:text-cyber-400 data-[state=active]:shadow-glow"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyber-400/20 data-[state=active]:to-neon-400/20 data-[state=active]:text-cyber-400 data-[state=active]:shadow-glow"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger 
              value="privacy" 
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyber-400/20 data-[state=active]:to-neon-400/20 data-[state=active]:text-cyber-400 data-[state=active]:shadow-glow"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="account" className="space-y-6">
            <Card className="cyber-card border-cyber-400/30 overflow-hidden">
              <CardHeader className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-400/10 to-neon-400/10 opacity-50"></div>
                <div className="relative z-10">
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5 text-cyber-400" />
                    Profile Picture
                  </CardTitle>
                  <CardDescription>
                    Update your profile picture
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20 ring-2 ring-cyber-400/30 hover:ring-cyber-400/50 transition-all duration-300">
                    <AvatarImage src={avatarUrl || undefined} alt={name} />
                    <AvatarFallback className="bg-gradient-to-br from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 font-semibold">
                      {getInitials(name || email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <div className="flex items-center space-x-2 btn-ghost-cyber px-3 py-2 rounded-md hover:bg-cyber-400/10 transition-colors duration-300">
                        <Upload className="h-4 w-4 text-cyber-400" />
                        <span>Upload new picture</span>
                      </div>
                    </Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={loading}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      JPG, PNG or GIF. Max size of 2MB.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card border-cyber-400/30 overflow-hidden">
              <CardHeader className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-400/10 to-neon-400/10 opacity-50"></div>
                <div className="relative z-10">
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5 text-cyber-400" />
                    Account Information
                  </CardTitle>
                  <CardDescription>
                    Update your account details
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      className="input-cyber focus-cyber"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="input-cyber focus-cyber"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 border-t border-cyber-400/20 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-4">
                <Button 
                  variant="outline" 
                  className="btn-ghost-cyber"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleProfileUpdate} 
                  disabled={loading || saveSuccess}
                  className="btn-cyber"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                  ) : null}
                  {loading ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>

            <Card className="cyber-card border-cyber-400/30 overflow-hidden">
              <CardHeader className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-400/10 to-neon-400/10 opacity-50"></div>
                <div className="relative z-10">
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-cyber-400" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input 
                    id="current-password" 
                    type="password" 
                    className="input-cyber focus-cyber"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    className="input-cyber focus-cyber"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    className="input-cyber focus-cyber"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 border-t border-cyber-400/20 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-4">
                <Button 
                  variant="outline"
                  className="btn-ghost-cyber"
                >
                  Cancel
                </Button>
                <Button className="btn-cyber">
                  Update Password
                </Button>
              </CardFooter>
            </Card>

            <Card className="cyber-card border-cyber-400/30 overflow-hidden">
              <CardHeader className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-400/10 to-neon-400/10 opacity-50"></div>
                <div className="relative z-10">
                  <CardTitle className="flex items-center">
                    <Languages className="mr-2 h-5 w-5 text-cyber-400" />
                    Primary Teaching Language
                  </CardTitle>
                  <CardDescription>
                    Select your main language for teaching
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="primary-language">Teaching Language</Label>
                  <Select 
                    defaultValue={selectedLanguage} 
                    onValueChange={setSelectedLanguage}
                  >
                    <SelectTrigger className="input-cyber focus-cyber">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent className="glass-effect border-cyber-400/30">
                      {languages.map((language) => (
                        <SelectItem key={language.code} value={language.code}>
                          <span className="mr-2">{language.flag}</span>
                          {language.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 border-t border-cyber-400/20 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-4">
                <Button 
                  variant="outline"
                  className="btn-ghost-cyber"
                >
                  Cancel
                </Button>
                <Button className="btn-cyber">
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <Card className="cyber-card border-cyber-400/30 overflow-hidden">
              <CardHeader className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-400/10 to-neon-400/10 opacity-50"></div>
                <div className="relative z-10">
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2 h-5 w-5 text-cyber-400" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Control how you receive notifications
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-cyber-400/20 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm hover:border-cyber-400/40 transition-all duration-300">
                    <div>
                      <h3 className="text-sm font-medium">Email Notifications for New Lessons</h3>
                      <p className="text-xs text-muted-foreground">
                        Receive email notifications when new lessons are scheduled
                      </p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-cyber-400 data-[state=checked]:border-cyber-400" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-cyber-400/20 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm hover:border-cyber-400/40 transition-all duration-300">
                    <div>
                      <h3 className="text-sm font-medium">In-app Notifications</h3>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications within the application
                      </p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-cyber-400 data-[state=checked]:border-cyber-400" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-cyber-400/20 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm hover:border-cyber-400/40 transition-all duration-300">
                    <div>
                      <h3 className="text-sm font-medium">Calendar Sync Notifications</h3>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications about calendar sync status
                      </p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-cyber-400 data-[state=checked]:border-cyber-400" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-cyber-400/20 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm hover:border-cyber-400/40 transition-all duration-300">
                    <div>
                      <h3 className="text-sm font-medium">Marketing Communications</h3>
                      <p className="text-xs text-muted-foreground">
                        Receive updates about new features and promotions
                      </p>
                    </div>
                    <Switch className="data-[state=checked]:bg-cyber-400 data-[state=checked]:border-cyber-400" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 border-t border-cyber-400/20 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-4">
                <Button 
                  variant="outline"
                  className="btn-ghost-cyber"
                >
                  Reset to Defaults
                </Button>
                <Button className="btn-cyber">
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacy" className="space-y-6">
            <Card className="cyber-card border-cyber-400/30 overflow-hidden">
              <CardHeader className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-400/10 to-neon-400/10 opacity-50"></div>
                <div className="relative z-10">
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-cyber-400" />
                    Privacy Settings
                  </CardTitle>
                  <CardDescription>
                    Control your privacy and data settings
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-cyber-400/20 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm hover:border-cyber-400/40 transition-all duration-300">
                    <div>
                      <h3 className="text-sm font-medium">Public Profile</h3>
                      <p className="text-xs text-muted-foreground">
                        Make your tutor profile visible to potential students
                      </p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-cyber-400 data-[state=checked]:border-cyber-400" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-cyber-400/20 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm hover:border-cyber-400/40 transition-all duration-300">
                    <div>
                      <h3 className="text-sm font-medium">Two-Factor Authentication</h3>
                      <p className="text-xs text-muted-foreground">
                        Enable additional security for your account
                      </p>
                    </div>
                    <Switch className="data-[state=checked]:bg-cyber-400 data-[state=checked]:border-cyber-400" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-cyber-400/20 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm hover:border-cyber-400/40 transition-all duration-300">
                    <div>
                      <h3 className="text-sm font-medium">Data Collection</h3>
                      <p className="text-xs text-muted-foreground">
                        Allow anonymous usage data collection to improve the platform
                      </p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-cyber-400 data-[state=checked]:border-cyber-400" />
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <h3 className="font-medium text-red-800 dark:text-red-300">
                        Account Deletion
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button 
                        variant="destructive" 
                        className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => setIsDeletionDialogOpen(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 border-t border-cyber-400/20 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-4">
                <Button 
                  variant="outline"
                  className="btn-ghost-cyber"
                >
                  Cancel
                </Button>
                <Button className="btn-cyber">
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <AccountDeletionDialog
          open={isDeletionDialogOpen}
          onOpenChange={setIsDeletionDialogOpen}
          onConfirmDeletion={handleAccountDeletion}
          isLoading={isDeletingAccount}
        />
      </div>
    </MainLayout>
  );
}