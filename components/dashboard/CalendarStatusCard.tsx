import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, RefreshCcw, CheckCircle, XCircle, Clock, Zap } from "lucide-react";
import { googleCalendarService } from "@/lib/google-calendar";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";

export default function CalendarStatusCard() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    email?: string;
    last_sync?: string;
    webhook_status?: {
      active: boolean;
      expiration?: string;
      hours_until_expiration?: number;
    };
  }>({ connected: false });

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const status = await googleCalendarService.getConnectionStatus();
      setConnectionStatus(status);
      setIsConnected(status.connected);
    } catch (error) {
      // Error handling without console.error
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await googleCalendarService.syncCalendar();
      await checkConnectionStatus();
      toast.success(`Successfully synced ${result.events_count} calendar events`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync calendar');
    } finally {
      setIsSyncing(false);
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

  return (
    <Card className="cyber-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-primary" />
          Calendar Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <div className="flex items-center">
                <Badge className={getStatusColor()}>
                  {getStatusText()}
                </Badge>
                {isConnected && connectionStatus.webhook_status && (
                  <div className="ml-2">
                    {getWebhookStatusBadge()}
                  </div>
                )}
              </div>
            </div>
            
            {isConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="h-8 text-xs btn-ghost-cyber"
              >
                <RefreshCcw className={`mr-1 h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? "Syncing" : "Sync"}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 text-xs btn-ghost-cyber"
              >
                <Link href="/calendar">Connect</Link>
              </Button>
            )}
          </div>
          
          {isConnected && connectionStatus.last_sync && (
            <div className="text-xs text-muted-foreground">
              Last synced: {format(new Date(connectionStatus.last_sync), "MMM d, h:mm a")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}