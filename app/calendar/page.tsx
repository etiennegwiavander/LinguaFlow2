"use client";

import { useState } from "react";
import MainLayout from "@/components/main-layout";
import { Calendar, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalendarPage() {
  const [email, setEmail] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error("Google Client ID is not configured");
      }

      // Define the OAuth parameters
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${window.location.origin}/auth/google-callback`,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        access_type: 'offline',
        prompt: 'consent'
      });

      // Construct the authorization URL
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      // Open the authorization URL in a popup window
      const width = 600;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        authUrl,
        'Google Calendar Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for the OAuth callback
      window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_OAUTH_CALLBACK') {
          setIsConnected(true);
          setIsLoading(false);
        }
      });

    } catch (error) {
      console.error("Failed to connect calendar:", error);
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement calendar sync using the stored access token
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSynced(new Date());
    } catch (error) {
      console.error("Failed to sync calendar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Calendar Sync</h1>
        </div>

        {/* Calendar section */}
        <section aria-labelledby="calendar-heading">
          <div className="mb-6 flex items-center">
            <h2 className="text-xl font-semibold flex items-center" id="calendar-heading">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Google Calendar Integration
            </h2>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Calendar</CardTitle>
              <CardDescription>
                Sync your lessons with Google Calendar to manage your schedule efficiently.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Google Calendar Email</Label>
                <div className="flex space-x-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your Google Calendar email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isConnected || isLoading}
                  />
                  <Button
                    onClick={handleConnect}
                    disabled={!email || isConnected || isLoading}
                  >
                    {isLoading ? "Connecting..." : "Connect Calendar"}
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Calendar Status</p>
                    <p className="text-sm text-muted-foreground">
                      {isConnected ? "Connected" : "Not Connected"}
                    </p>
                  </div>
                  {isConnected && (
                    <Button
                      variant="outline"
                      onClick={handleSync}
                      disabled={isLoading}
                      className="flex items-center"
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Sync Now
                    </Button>
                  )}
                </div>

                {lastSynced && (
                  <div>
                    <p className="font-medium">Last Synced</p>
                    <p className="text-sm text-muted-foreground">
                      {lastSynced.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
}