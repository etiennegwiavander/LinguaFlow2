"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MainLayout from "@/components/main-layout";
import { Calendar, RefreshCcw, CheckCircle, XCircle, Clock, AlertCircle, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { googleCalendarService, CalendarEvent } from "@/lib/google-calendar";
import { toast } from "sonner";
import { format, addWeeks, parseISO } from "date-fns";

export default function CalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPopupBlockedAlert, setShowPopupBlockedAlert] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    email?: string;
    last_sync?: string;
    expires_at?: string;
  }>({ connected: false });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Handle postMessage from OAuth popup
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Verify origin for security
      const expectedOrigin = window.location.origin;
      if (event.origin !== expectedOrigin) {
        console.warn('Received message from unexpected origin:', event.origin);
        return;
      }

      // Check if this is our OAuth callback message
      if (event.data && event.data.type === 'google-oauth-callback') {
        console.log('📨 Received OAuth callback message:', event.data);
        
        const { status, data, message } = event.data;
        
        if (status === 'success') {
          console.log('✅ OAuth success detected from popup');
          
          try {
            // Store the tokens using the data from the popup
            if (data && data.access_token && data.refresh_token && data.expires_at) {
              await googleCalendarService.storeTokens({
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_at: data.expires_at,
                scope: data.scope || 'https://www.googleapis.com/auth/calendar.readonly',
                email: data.email || undefined
              });
              
              console.log('✅ Tokens stored successfully from popup data');
              
              // Update connection status
              await checkConnectionStatus();
              
              toast.success('Google Calendar connected successfully!');
              
              // Auto-sync after connection
              console.log('🔄 Auto-syncing calendar...');
              await handleSync();
              
            } else {
              console.error('❌ Missing token data in popup message');
              toast.error('Incomplete OAuth data received');
            }
          } catch (error: any) {
            console.error('❌ Failed to process OAuth data from popup:', error);
            toast.error(error.message || 'Failed to complete Google Calendar connection');
          }
        } else {
          console.error('❌ OAuth error from popup:', message);
          toast.error(`Google Calendar connection failed: ${message}`);
        }
      }
    };

    // Add event listener for postMessage
    window.addEventListener('message', handleMessage);
    
    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Handle URL-based OAuth callback (fallback for manual connection)
  useEffect(() => {
    const handleUrlCallback = async () => {
      const authStatus = searchParams.get('google_auth_status');
      
      if (authStatus === 'success') {
        console.log('✅ OAuth success detected in URL (manual connection)');
        
        // For manual connections, we don't have token data in URL
        // Just check connection status and sync
        try {
          await checkConnectionStatus();
          toast.success('Google Calendar connected successfully!');
          
          // Auto-sync after connection
          console.log('🔄 Auto-syncing calendar...');
          await handleSync();
          
        } catch (error: any) {
          console.error('❌ Failed to complete manual connection:', error);
          toast.error(error.message || 'Failed to complete Google Calendar connection');
        }
        
        // Clean up URL parameters
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('google_auth_status');
        newUrl.searchParams.delete('message');
        router.replace(newUrl.pathname);
        
      } else if (authStatus === 'error') {
        const errorMessage = searchParams.get('message') || 'Unknown error occurred';
        console.error('❌ OAuth error detected in URL:', errorMessage);
        toast.error(`Google Calendar connection failed: ${errorMessage}`);
        
        // Clean up URL parameters
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('google_auth_status');
        newUrl.searchParams.delete('message');
        router.replace(newUrl.pathname);
      }
    };

    handleUrlCallback();
  }, [searchParams, router]);

  useEffect(() => {
    checkConnectionStatus();
    if (isConnected) {
      loadCalendarEvents();
    }
  }, [isConnected]);

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
      // Get events for the next 2 weeks starting from now
      const now = new Date();
      const twoWeeksFromNow = addWeeks(now, 2);
      
      const calendarEvents = await googleCalendarService.getCalendarEvents(now, twoWeeksFromNow);
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
    setShowPopupBlockedAlert(false);
    
    try {
      console.log('🚀 Starting OAuth flow...');
      
      // Try to initiate OAuth with popup
      await googleCalendarService.initiateOAuth(email);
      
      console.log('✅ OAuth popup opened, waiting for callback...');
      
    } catch (error: any) {
      console.error('❌ OAuth flow failed:', error);
      
      if (error.message === 'POPUP_BLOCKED') {
        // Show popup blocked alert with manual option
        setShowPopupBlockedAlert(true);
        toast.error('Popup was blocked. Please use the manual connection option below.');
      } else {
        toast.error(error.message || 'Failed to connect Google Calendar');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualConnect = async () => {
    try {
      const authUrl = await googleCalendarService.getOAuthUrl(email);
      // Open in same tab
      window.location.href = authUrl;
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate authorization URL');
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
      setShowPopupBlockedAlert(false);
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
      return "badge-success";
    }
    return "badge-error";
  };

  // Sort events by start time and filter to upcoming events only
  const upcomingEvents = events
    .filter(event => {
      const eventStart = parseISO(event.start_time);
      return eventStart >= new Date(); // Only show future events
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const now = new Date();
  const twoWeeksFromNow = addWeeks(now, 2);

  return (
    <MainLayout>
      <div className="space-y-8 animate-slide-up">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div className="space-y-2">
            <Badge className="badge-cyber">
              <Calendar className="w-3 h-3 mr-1" />
              Calendar Sync
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="gradient-text">Calendar</span> Sync
            </h1>
            <p className="text-muted-foreground">
              Sync your lessons with Google Calendar to manage your schedule efficiently
            </p>
          </div>
        </div>

        {/* Connection Setup Card */}
        <Card className="cyber-card">
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
                      className="flex-1 input-cyber focus-cyber"
                    />
                    <Button
                      onClick={handleConnect}
                      disabled={!email.trim() || isLoading}
                      className="btn-cyber"
                    >
                      {isLoading ? "Connecting..." : "Connect Calendar"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter the email address associated with the Google Calendar you want to sync.
                  </p>
                </div>

                {/* Popup Blocked Alert */}
                {showPopupBlockedAlert && (
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="space-y-3">
                      <p>
                        Your browser blocked the popup window. You can either:
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <strong>Option 1:</strong> Allow popups for this site and try again
                        </p>
                        <p className="text-sm">
                          <strong>Option 2:</strong> Use manual connection (opens in same tab)
                        </p>
                      </div>
                      <Button
                        onClick={handleManualConnect}
                        variant="outline"
                        className="flex items-center btn-ghost-cyber"
                        disabled={!email.trim()}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Connect Manually
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg border-cyber-400/30 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
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
                    className="flex items-center btn-ghost-cyber"
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
              <div className="space-y-4 pt-4 border-t border-cyber-400/20">
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
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle>Upcoming Calendar Events</CardTitle>
              <CardDescription>
                Your upcoming lessons and events ({format(now, "MMM d")} - {format(twoWeeksFromNow, "MMM d, yyyy")}) • {upcomingEvents.length} events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Calendar className="h-12 w-12 text-cyber-400" />
                  </div>
                  <p className="text-muted-foreground mb-2">No upcoming events found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Next 2 weeks: {format(now, "MMMM d")} - {format(twoWeeksFromNow, "MMMM d, yyyy")}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="mt-4 btn-ghost-cyber"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Sync Calendar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event, index) => {
                    const eventDate = parseISO(event.start_time);
                    const isToday = format(eventDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
                    const isTomorrow = format(eventDate, 'yyyy-MM-dd') === format(addWeeks(now, 0).setDate(now.getDate() + 1), 'yyyy-MM-dd');
                    
                    return (
                      <div 
                        key={event.id} 
                        className={`flex items-start space-x-4 p-4 border rounded-lg transition-colors hover-lift animate-scale-in ${
                          isToday ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' : 
                          isTomorrow ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 
                          'border-cyber-400/30 hover:border-cyber-400/50'
                        }`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium">{event.summary}</h3>
                            {isToday && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                Today
                              </Badge>
                            )}
                            {isTomorrow && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                Tomorrow
                              </Badge>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{format(eventDate, "EEE, MMM d")}</span>
                            </span>
                            <span>
                              {format(eventDate, "h:mm a")}
                            </span>
                            {event.location && (
                              <>
                                <Separator orientation="vertical" className="h-4" />
                                <span className="truncate max-w-[200px]">{event.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {events.length > upcomingEvents.length && (
                    <div className="text-center pt-4 border-t border-cyber-400/20">
                      <p className="text-sm text-muted-foreground">
                        Showing {upcomingEvents.length} upcoming events • {events.length} total synced events
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