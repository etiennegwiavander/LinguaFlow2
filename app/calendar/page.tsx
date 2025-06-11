"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MainLayout from "@/components/main-layout";
import { Calendar, RefreshCcw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { googleCalendarService, CalendarEvent } from "@/lib/google-calendar";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    email?: string;
    last_sync?: string;
    expires_at?: string;
  }>({ connected: false });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
    if (isConnected) {
      loadCalendarEvents();
    }
  }, [isConnected]);

  // Handle OAuth callback results
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const authStatus = searchParams.get('google_auth_status');
      
      if (authStatus === 'success') {
        console.log('✅ OAuth success detected, processing tokens...');
        
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const expiresAt = searchParams.get('expires_at');
        const scope = searchParams.get('scope');
        const userEmail = searchParams.get('email');

        if (accessToken && refreshToken && expiresAt) {
          try {
            await googleCalendarService.storeTokens({
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: expiresAt,
              scope: scope || 'https://www.googleapis.com/auth/calendar.readonly',
              email: userEmail || undefined,
            });

            toast.success('Google Calendar connected successfully!');
            
            // Update connection status and sync calendar
            await checkConnectionStatus();
            await handleSync();
            
          } catch (error: any) {
            console.error('❌ Failed to store tokens:', error);
            toast.error(error.message || 'Failed to complete Google Calendar connection');
          }
        } else {
          toast.error('Invalid OAuth response - missing required tokens');
        }

        // Clean up URL parameters
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('google_auth_status');
        newUrl.searchParams.delete('access_token');
        newUrl.searchParams.delete('refresh_token');
        newUrl.searchParams.delete('expires_at');
        newUrl.searchParams.delete('scope');
        newUrl.searchParams.delete('email');
        router.replace(newUrl.pathname);
        
      } else if (authStatus === 'error') {
        const error = searchParams.get('error');
        console.error('❌ OAuth error detected:', error);
        toast.error(`Google Calendar connection failed: ${error || 'Unknown error'}`);
        
        // Clean up URL parameters
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('google_auth_status');
        newUrl.searchParams.delete('error');
        router.replace(newUrl.pathname);
      }
    };

    handleOAuthCallback();
  }, [searchParams, router]);

  const checkConnectionStatus = async () => {
    try {
      const status = await googleCalendarService.getConnectionStatus();
      setConnectionStatus(status);
      setIsConnected(status.connected);
      if (status.email) {
        setEmail(status.email);
      }
    } catch (error) {
      console.error('Failed to check connection status:', error);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      const calendarEvents = await googleCalendarService.getCalendarEvents();
      setEvents(calendarEvents);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load calendar events');
    }
  };

  const handleConnect = async () => {
    if (!email.trim()) {
      toast.error('Please enter your Google Calendar email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await googleCalendarService.initiateOAuth(email);
      // The OAuth flow will handle the rest via URL parameters
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate Google Calendar connection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await googleCalendarService.syncCalendar();
      await checkConnectionStatus();
      await loadCalendarEvents();
      toast.success(`Successfully synced ${result.events_count} calendar events`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? This will remove all synced events.')) {
      return;
    }

    try {
      await googleCalendarService.disconnect();
      setIsConnected(false);
      setConnectionStatus({ connected: false });
      setEvents([]);
      setEmail("");
      toast.success('Google Calendar disconnected successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect Google Calendar');
    }
  };

  const getStatusIcon = () => {
    if (isConnected) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusText = () => {
    if (isConnected) {
      return "Connected";
    }
    return "Not Connected";
  };

  const getStatusColor = () => {
    if (isConnected) {
      return "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    }
    return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Calendar Sync</h1>
        </div>

        {/* Connection Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Google Calendar Integration
            </CardTitle>
            <CardDescription>
              Sync your lessons with Google Calendar to manage your schedule efficiently.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Input Section */}
            {!isConnected && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="calendar-email">Google Calendar Email</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="calendar-email"
                      type="email"
                      placeholder="Enter your Google Calendar email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleConnect}
                      disabled={!email.trim() || isLoading}
                    >
                      {isLoading ? "Connecting..." : "Connect Calendar"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter the email address associated with the Google Calendar you want to sync.
                  </p>
                </div>
              </div>
            )}

            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon()}
                <div>
                  <p className="font-medium">Connection Status</p>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor()}>
                      {getStatusText()}
                    </Badge>
                    {isConnected && connectionStatus.email && (
                      <span className="text-sm text-muted-foreground">
                        ({connectionStatus.email})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {isConnected && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center"
                  >
                    <RefreshCcw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? "Syncing..." : "Sync Now"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </Button>
                </div>
              )}
            </div>

            {/* Connection Details */}
            {isConnected && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {connectionStatus.last_sync && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Last Synced</p>
                        <p className="text-muted-foreground">
                          {format(new Date(connectionStatus.last_sync), "PPp")}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {connectionStatus.expires_at && (
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Token Expires</p>
                        <p className="text-muted-foreground">
                          {format(new Date(connectionStatus.expires_at), "PPp")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar Events */}
        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle>Synced Calendar Events</CardTitle>
              <CardDescription>
                Recent events from your Google Calendar ({events.length} events)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No calendar events found</p>
                  <Button 
                    variant="outline" 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="mt-4"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Sync Calendar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.slice(0, 10).map((event) => (
                    <div key={event.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{event.summary}</h3>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span>
                            {format(new Date(event.start_time), "PPp")}
                          </span>
                          {event.location && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <span>{event.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {events.length > 10 && (
                    <div className="text-center pt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing 10 of {events.length} events
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}