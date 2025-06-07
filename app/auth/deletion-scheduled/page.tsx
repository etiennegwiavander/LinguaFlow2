"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Mail, Clock, Shield, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function DeletionScheduledPage() {
  useEffect(() => {
    // Prevent back navigation to authenticated pages
    window.history.replaceState(null, '', '/auth/deletion-scheduled');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Account Deletion Scheduled</CardTitle>
          <CardDescription className="text-base">
            Your account has been scheduled for deletion. You have 30 days to recover it if you change your mind.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  Deletion Process Started
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Your account is now temporarily hidden and will be permanently deleted in 30 days.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center">
              <Mail className="w-5 h-5 mr-2 text-blue-600" />
              Check Your Email
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                We've sent you a detailed email with:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                <li>Account recovery instructions</li>
                <li>Timeline of the deletion process</li>
                <li>Direct recovery link for easy access</li>
                <li>Information about what data will be deleted</li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-600" />
              Your Data is Protected
            </h3>
            <div className="grid gap-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">30-Day Recovery Window</p>
                  <p className="text-muted-foreground">You can restore your account anytime within 30 days</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Complete Data Restoration</p>
                  <p className="text-muted-foreground">All your students, lessons, and settings will be restored</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">GDPR Compliant</p>
                  <p className="text-muted-foreground">This process follows all data protection regulations</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">What Happens Next?</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Your account is immediately hidden from the system</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-muted-foreground text-muted rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>You receive recovery instructions via email</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-muted-foreground text-muted rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>After 30 days, all data is permanently deleted</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Homepage
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/auth/login">
                Create New Account
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need help? Contact us at{" "}
              <a href="mailto:support@linguaflow.com" className="text-primary hover:underline">
                support@linguaflow.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}