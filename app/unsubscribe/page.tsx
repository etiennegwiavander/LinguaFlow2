'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Mail, Settings } from 'lucide-react';

interface UnsubscribePreferences {
  userId: string;
  email: string;
  welcomeEmails: boolean;
  lessonReminders: boolean;
  marketingEmails: boolean;
  systemNotifications: boolean;
  allEmails: boolean;
}

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UnsubscribePreferences | null>(null);
  const [token] = useState(searchParams.get('token'));
  const [email] = useState(searchParams.get('email'));
  const [emailType] = useState(searchParams.get('type'));

  useEffect(() => {
    if (token) {
      processUnsubscribe();
    } else {
      setError('Invalid unsubscribe link');
      setLoading(false);
    }
  }, [token]);

  const processUnsubscribe = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          emailType
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setPreferences(data.preferences);
      } else {
        setError(data.message || 'Failed to process unsubscribe request');
      }
    } catch (err) {
      console.error('Error processing unsubscribe:', err);
      setError('An error occurred while processing your request');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<UnsubscribePreferences>) => {
    if (!preferences) return;

    try {
      setProcessing(true);

      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: preferences.userId,
          ...newPreferences
        }),
      });

      if (response.ok) {
        setPreferences({ ...preferences, ...newPreferences });
        // Show success message briefly
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        successMessage.textContent = 'Preferences updated successfully';
        document.body.appendChild(successMessage);
        setTimeout(() => {
          document.body.removeChild(successMessage);
        }, 3000);
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update preferences');
    } finally {
      setProcessing(false);
    }
  };

  const handlePreferenceChange = (key: keyof UnsubscribePreferences, value: boolean) => {
    if (!preferences) return;

    const updates: Partial<UnsubscribePreferences> = { [key]: value };

    // If subscribing to any email type, ensure allEmails is false
    if (value && key !== 'allEmails') {
      updates.allEmails = false;
    }

    // If unsubscribing from all individual types, set allEmails to true
    if (!value && key !== 'allEmails') {
      const otherPrefs = {
        welcomeEmails: key === 'welcomeEmails' ? false : preferences.welcomeEmails,
        lessonReminders: key === 'lessonReminders' ? false : preferences.lessonReminders,
        marketingEmails: key === 'marketingEmails' ? false : preferences.marketingEmails,
        systemNotifications: key === 'systemNotifications' ? false : preferences.systemNotifications,
      };

      if (!Object.values(otherPrefs).some(Boolean)) {
        updates.allEmails = true;
      }
    }

    // If setting allEmails to true, unsubscribe from all individual types
    if (key === 'allEmails' && value) {
      updates.welcomeEmails = false;
      updates.lessonReminders = false;
      updates.marketingEmails = false;
      updates.systemNotifications = false;
    }

    updatePreferences(updates);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Processing your unsubscribe request...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-700">Unsubscribe Failed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  If you continue to have issues, please contact our support team for assistance.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {success && (
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-green-700">
                {emailType ? `Unsubscribed from ${emailType} emails` : 'Successfully Unsubscribed'}
              </CardTitle>
              <CardDescription>
                {email && `We've updated the email preferences for ${email}`}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {preferences && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>Email Preferences</CardTitle>
              </div>
              <CardDescription>
                Manage which types of emails you'd like to receive. You can change these settings at any time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="welcomeEmails"
                    checked={preferences.welcomeEmails}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('welcomeEmails', checked as boolean)
                    }
                    disabled={processing || preferences.allEmails}
                  />
                  <div className="flex-1">
                    <label htmlFor="welcomeEmails" className="text-sm font-medium cursor-pointer">
                      Welcome Emails
                    </label>
                    <p className="text-xs text-gray-500">
                      Account setup and getting started information
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="lessonReminders"
                    checked={preferences.lessonReminders}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('lessonReminders', checked as boolean)
                    }
                    disabled={processing || preferences.allEmails}
                  />
                  <div className="flex-1">
                    <label htmlFor="lessonReminders" className="text-sm font-medium cursor-pointer">
                      Lesson Reminders
                    </label>
                    <p className="text-xs text-gray-500">
                      Notifications about upcoming lessons and study sessions
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="marketingEmails"
                    checked={preferences.marketingEmails}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('marketingEmails', checked as boolean)
                    }
                    disabled={processing || preferences.allEmails}
                  />
                  <div className="flex-1">
                    <label htmlFor="marketingEmails" className="text-sm font-medium cursor-pointer">
                      Marketing Emails
                    </label>
                    <p className="text-xs text-gray-500">
                      Product updates, tips, and promotional content
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="systemNotifications"
                    checked={preferences.systemNotifications}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('systemNotifications', checked as boolean)
                    }
                    disabled={processing || preferences.allEmails}
                  />
                  <div className="flex-1">
                    <label htmlFor="systemNotifications" className="text-sm font-medium cursor-pointer">
                      System Notifications
                    </label>
                    <p className="text-xs text-gray-500">
                      Important account and security notifications
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="allEmails"
                      checked={preferences.allEmails}
                      onCheckedChange={(checked) => 
                        handlePreferenceChange('allEmails', checked as boolean)
                      }
                      disabled={processing}
                    />
                    <div className="flex-1">
                      <label htmlFor="allEmails" className="text-sm font-medium cursor-pointer text-red-600">
                        Unsubscribe from all emails
                      </label>
                      <p className="text-xs text-gray-500">
                        You will not receive any emails from us (except critical security notifications)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {processing && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">Updating preferences...</span>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Need to update your preferences later?</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      You can always manage your email preferences by logging into your account and visiting the settings page.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => window.location.href = '/settings/notifications'}
                  variant="outline"
                  className="flex-1"
                >
                  Manage in Account
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                >
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}