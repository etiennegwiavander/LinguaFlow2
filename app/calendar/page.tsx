"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MainLayout from "@/components/main-layout";
import { Calendar, RefreshCcw, CheckCircle, XCircle, Clock, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { googleCalendarService, CalendarEvent } from "@/lib/google-calendar";
import { toast } from "sonner";
import { format, addWeeks, parseISO } from "date-fns";

function CalendarPageContent() {
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
    webhook_status?: {
      active: boolean;
      channel_id?: string;
      expiration?: string;
      hours_until_expiration?: number;
    };
  }>({ connected: false });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Handle OAuth return from same-tab redirect
  useEffect(() => {
    const handleOAuthReturn = async () => {
      try {
        const result = await googleCalendarService.handleOAuthReturn();
        
        if (result.success) {
          await checkConnectionStatus();
          toast.success(result.message || 'Google Calendar connected successfully!');
          
          // Auto-sync after connection
          if (result.shouldSync) {
            // Call sync directly instead of using handleSync to avoid dependency issues
            try {
              const syncResult = await googleCalendarService.syncCalendar();
              await checkConnectionStatus();
              await loadCalendarEvents();
              toast.success(`Successfully synced ${syncResult.events_count} calendar events`);
            } catch (syncError: any) {
              toast.error(syncError.message || 'Failed to sync calendar');
            }
          }
        } else if (result.message) {
          toast.error(result.message);
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to handle OAuth return');
      }
    };

    handleOAuthReturn();
  }, []); // Remove handleSync dependency

  useEffect(() => {
    checkConnectionStatus();
    if (isConnected) {
      loadCalendarEvents();
    }
  }, [isConnected]);

  // Real-time updates for ongoing events
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const status = await googleCalendarService.getConnectionStatus();
      setConnectionStatus(status);
      setIsConnected(status.connected);
      if (status.email) {
        setEmail(status.email);
      }
    } catch (error) {
      // Error handling without console.error
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
    
    try {
      // Initiate OAuth with same-tab redirect
      await googleCalendarService.initiateOAuth(email);
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect Google Calendar');
      setIsLoading(false);
    }
  };



  const handleSync = useCallback(async () => {
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
  }, [checkConnectionStatus, loadCalendarEvents]);

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
      return "badge-success";
    }
    return "badge-error";
  };

  const getWebhookStatusBadge = () => {
    const webhookStatus = connectionStatus.webhook_status;
    
    if (!webhookStatus) {
      return (
        <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-600 dark:text-yellow-400">
          <Zap className="w-3 h-3 mr-1" />
          Standard Sync
        </Badge>
      );
    }
    
    if (!webhookStatus.active) {
      return (
        <Badge variant="outline" className="text-xs border-red-400 text-red-600 dark:text-red-400">
          <XCircle className="w-3 h-3 mr-1" />
          Real-time Sync Expired
        </Badge>
      );
    }
    
    if (webhookStatus.hours_until_expiration && webhookStatus.hours_until_expiration < 24) {
      return (
        <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-600 dark:text-yellow-400">
          <Clock className="w-3 h-3 mr-1" />
          Real-time Sync Renewing Soon
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-xs border-green-400 text-green-600 dark:text-green-400">
        <Zap className="w-3 h-3 mr-1" />
        Real-time Sync Active
      </Badge>
    );
  };

  // Helper function to determine event status and visibility
  const getEventStatus = (event: CalendarEvent) => {
    const eventStart = parseISO(event.start_time);
    const eventEnd = parseISO(event.end_time);
    
    // Calculate 3/4 point of the event duration
    const eventDuration = eventEnd.getTime() - eventStart.getTime();
    const threeQuarterPoint = new Date(eventStart.getTime() + (eventDuration * 0.75));
    
    if (currentTime < eventStart) {
      return { status: 'upcoming', visible: true };
    } else if (currentTime >= eventStart && currentTime < threeQuarterPoint) {
      return { status: 'ongoing', visible: true };
    } else {
      return { status: 'completed', visible: false };
    }
  };

  // Filter and sort events - include upcoming and ongoing events
  const upcomingEvents = events
    .map(event => ({
      ...event,
      eventStatus: getEventStatus(event)
    }))
    .filter(event => event.eventStatus.visible)
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
                    {isConnected && connectionStatus.webhook_status && (
                      <div className="ml-2">
                        {getWebhookStatusBadge()}
                      </div>
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

                {/* Webhook Status */}
                {connectionStatus.webhook_status && (
                  <div className="p-4 border rounded-lg border-cyber-400/30 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-cyber-400" />
                      Real-time Sync Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="font-medium">
                          {connectionStatus.webhook_status.active ? (
                            <span className="text-green-500">Active</span>
                          ) : (
                            <span className="text-red-500">Inactive</span>
                          )}
                        </p>
                      </div>
                      {connectionStatus.webhook_status.expiration && (
                        <div>
                          <p className="text-xs text-muted-foreground">Expires</p>
                          <p className="font-medium">
                            {format(new Date(connectionStatus.webhook_status.expiration), "PPp")}
                            {connectionStatus.webhook_status.hours_until_expiration !== undefined && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({Math.round(connectionStatus.webhook_status.hours_until_expiration)} hours)
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Real-time sync automatically updates your calendar when changes are made in Google Calendar.
                    </p>
                  </div>
                )}
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
                    const eventEnd = parseISO(event.end_time);
                    const isToday = format(eventDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
                    const isTomorrow = format(eventDate, 'yyyy-MM-dd') === format(addWeeks(now, 0).setDate(now.getDate() + 1), 'yyyy-MM-dd');
                    const isOngoing = event.eventStatus.status === 'ongoing';
                    
                    return (
                      <div 
                        key={event.id} 
                        className={`flex items-start space-x-4 p-4 border rounded-lg transition-colors hover-lift animate-scale-in ${
                          isOngoing ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20' :
                          isToday ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' : 
                          isTomorrow ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 
                          'border-cyber-400/30 hover:border-cyber-400/50'
                        }`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium">{event.summary}</h3>
                            {isToday && !isOngoing && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                Today
                              </Badge>
                            )}
                            {isTomorrow && !isOngoing && (
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
                              {format(eventDate, "h:mm a")} - {format(eventEnd, "h:mm a")}
                            </span>
                            {event.location && (
                              <>
                                <Separator orientation="vertical" className="h-4" />
                                <span className="truncate max-w-[200px]">{event.location}</span>
                              </>
                            )}
                          </div>
                          
                          {/* Ongoing badge at the bottom */}
                          {isOngoing && (
                            <div className="mt-3 pt-2 border-t border-orange-200 dark:border-orange-800">
                              <Badge className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                  <span>Ongoing...</span>
                                </div>
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {events.length > upcomingEvents.length && (
                    <div className="text-center pt-4 border-t border-cyber-400/20">
                      <p className="text-sm text-muted-foreground">
                        Showing {upcomingEvents.length} visible events • {events.length} total synced events
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

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <Calendar className="h-8 w-8 animate-spin text-cyber-400 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        </div>
      </MainLayout>
    }>
      <CalendarPageContent />
    </Suspense>
  );
}