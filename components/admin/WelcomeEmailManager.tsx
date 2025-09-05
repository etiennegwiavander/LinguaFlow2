'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Mail, Send, History, RefreshCw } from 'lucide-react';
import { sendWelcomeEmail, getWelcomeEmailHistory } from '@/lib/welcome-email-service';

interface WelcomeEmail {
  id: string;
  email: string;
  user_type: 'tutor';
  subject: string;
  sent_at: string;
  status: 'sent' | 'failed' | 'pending';
}

export default function WelcomeEmailManager() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailHistory, setEmailHistory] = useState<WelcomeEmail[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleSendEmail = async () => {
    if (!email) {
      toast.error('Email address is required');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendWelcomeEmail({
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined
      });

      if (result.success) {
        toast.success('Welcome email sent to tutor successfully!');
        setEmail('');
        setFirstName('');
        setLastName('');
        // Refresh history
        loadEmailHistory();
      } else {
        toast.error(result.error || 'Failed to send welcome email');
      }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmailHistory = async () => {
    if (!email) return;
    
    setHistoryLoading(true);
    try {
      const { data, error } = await getWelcomeEmailHistory(email);
      
      if (error) {
        toast.error('Failed to load email history');
        return;
      }

      setEmailHistory(data || []);
    } catch (error) {
      toast.error('An error occurred while loading email history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-500">Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTutorBadge = () => {
    return <Badge variant="default" className="bg-blue-500">Tutor</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Send Welcome Email Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Welcome Email
          </CardTitle>
          <CardDescription>
            Send a welcome email to a new user manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>User Type</Label>
              <div className="p-3 border rounded-md bg-muted">
                <Badge variant="default" className="bg-blue-500">Tutor</Badge>
                <span className="ml-2 text-sm text-muted-foreground">
                  LinguaFlow is for one-on-one language tutors
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name (Optional)</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name (Optional)</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSendEmail} 
              disabled={isLoading || !email}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isLoading ? 'Sending...' : 'Send Welcome Email'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={loadEmailHistory}
              disabled={!email || historyLoading}
              className="flex items-center gap-2"
            >
              {historyLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <History className="h-4 w-4" />
              )}
              Load History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email History */}
      {emailHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Email History for {email}
            </CardTitle>
            <CardDescription>
              Previous welcome emails sent to this address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emailHistory.map((emailRecord) => (
                <div 
                  key={emailRecord.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTutorBadge()}
                    {getStatusBadge(emailRecord.status)}
                    <span className="text-sm text-muted-foreground">
                      {new Date(emailRecord.sent_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm font-medium">
                    {emailRecord.subject}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Welcome emails are automatically sent when tutors sign up</p>
          <p>• Use this form to manually send welcome emails for testing or resending</p>
          <p>• Emails include teaching-focused content and dashboard access</p>
          <p>• LinguaFlow is designed specifically for one-on-one language tutors</p>
          <p>• All sent emails are logged in the database for tracking</p>
        </CardContent>
      </Card>
    </div>
  );
}