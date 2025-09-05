'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Bell, Mail, Clock, Shield, MessageSquare } from 'lucide-react';

interface NotificationPreferences {
  user_id: string;
  welcome_emails: boolean;
  lesson_reminders: boolean;
  password_reset_emails: boolean;
  custom_emails: boolean;
  reminder_timing_minutes: number;
}

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/notification-preferences');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch preferences');
      }

      setPreferences(result.preferences);
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save preferences');
      }

      toast.success('Notification preferences updated successfully');
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error(error.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [key]: value
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Manage your email notification settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load notification preferences.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which email notifications you'd like to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Welcome Emails */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="welcome-emails" className="text-base font-medium">
                Welcome Emails
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive welcome emails when you sign up or join new features
              </p>
            </div>
          </div>
          <Switch
            id="welcome-emails"
            checked={preferences.welcome_emails}
            onCheckedChange={(checked) => updatePreference('welcome_emails', checked)}
          />
        </div>

        {/* Lesson Reminders */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="lesson-reminders" className="text-base font-medium">
                Lesson Reminders
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified before your scheduled lessons
              </p>
            </div>
          </div>
          <Switch
            id="lesson-reminders"
            checked={preferences.lesson_reminders}
            onCheckedChange={(checked) => updatePreference('lesson_reminders', checked)}
          />
        </div>

        {/* Reminder Timing */}
        {preferences.lesson_reminders && (
          <div className="ml-7 space-y-2">
            <Label htmlFor="reminder-timing" className="text-sm font-medium">
              Reminder Timing
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="reminder-timing"
                type="number"
                min="5"
                max="1440"
                value={preferences.reminder_timing_minutes}
                onChange={(e) => updatePreference('reminder_timing_minutes', parseInt(e.target.value) || 15)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">minutes before lesson</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Between 5 minutes and 24 hours (1440 minutes)
            </p>
          </div>
        )}

        {/* Password Reset Emails */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="password-reset-emails" className="text-base font-medium">
                Password Reset Emails
              </Label>
              <p className="text-sm text-muted-foreground">
                Security emails for password recovery (recommended)
              </p>
            </div>
          </div>
          <Switch
            id="password-reset-emails"
            checked={preferences.password_reset_emails}
            onCheckedChange={(checked) => updatePreference('password_reset_emails', checked)}
          />
        </div>

        {/* Custom Emails */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="custom-emails" className="text-base font-medium">
                Custom Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive updates, announcements, and other communications
              </p>
            </div>
          </div>
          <Switch
            id="custom-emails"
            checked={preferences.custom_emails}
            onCheckedChange={(checked) => updatePreference('custom_emails', checked)}
          />
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button 
            onClick={savePreferences} 
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}