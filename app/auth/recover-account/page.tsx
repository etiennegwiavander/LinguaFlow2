"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertTriangle, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

function RecoverAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid recovery link. Please check your email for the correct link.');
      return;
    }

    recoverAccount(token);
  }, [searchParams]);

  const recoverAccount = async (token: string) => {
    setIsRecovering(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/recover-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recovery_token: token }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus('success');
        setMessage('Your account has been successfully recovered! You can now sign in normally.');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/auth/login?recovered=true');
        }, 3000);
      } else if (result.error?.includes('expired') || result.error?.includes('not found')) {
        setStatus('expired');
        setMessage('This recovery link has expired or is no longer valid. The 30-day recovery window may have passed.');
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to recover account. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Recovery error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again or contact support.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleRetry = () => {
    const token = searchParams.get('token');
    if (token) {
      setStatus('loading');
      recoverAccount(token);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'error':
      case 'expired':
        return <AlertTriangle className="w-8 h-8 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Recovering Your Account...';
      case 'success':
        return 'Account Recovered Successfully!';
      case 'expired':
        return 'Recovery Link Expired';
      case 'error':
        return 'Recovery Failed';
      default:
        return 'Account Recovery';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            {getStatusIcon()}
          </div>
          <CardTitle className={`text-2xl font-bold ${getStatusColor()}`}>
            {getStatusTitle()}
          </CardTitle>
          <CardDescription className="text-base">
            {status === 'loading' && 'Please wait while we restore your account...'}
            {status === 'success' && 'Welcome back! Your account and all data have been fully restored.'}
            {status === 'expired' && 'This recovery link is no longer valid.'}
            {status === 'error' && 'We encountered an issue while recovering your account.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {message && (
            <Alert className={
              status === 'success' ? 'border-green-200 bg-green-50 dark:bg-green-900/20' :
              status === 'expired' ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/20' :
              'border-red-200 bg-red-50 dark:bg-red-900/20'
            }>
              <AlertDescription className={
                status === 'success' ? 'text-green-800 dark:text-green-200' :
                status === 'expired' ? 'text-orange-800 dark:text-orange-200' :
                'text-red-800 dark:text-red-200'
              }>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'success' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                What's Been Restored:
              </h3>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>✓ All student profiles and learning data</li>
                <li>✓ Generated lesson plans and materials</li>
                <li>✓ Calendar sync settings</li>
                <li>✓ Account preferences and settings</li>
                <li>✓ All uploaded files and documents</li>
              </ul>
            </div>
          )}

          {status === 'expired' && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                What You Can Do:
              </h3>
              <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                <li>• Create a new account with the same email address</li>
                <li>• Contact support if you believe this is an error</li>
                <li>• Check if you have other recovery emails</li>
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {status === 'loading' && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">
                  {isRecovering ? 'Restoring your account...' : 'Processing...'}
                </span>
              </div>
            )}

            {status === 'success' && (
              <>
                <Button asChild className="flex-1">
                  <Link href="/auth/login">
                    Sign In to Your Account
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go to Homepage
                  </Link>
                </Button>
              </>
            )}

            {(status === 'error' || status === 'expired') && (
              <>
                {status === 'error' && (
                  <Button onClick={handleRetry} variant="outline" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/auth/signup">
                    Create New Account
                  </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go to Homepage
                  </Link>
                </Button>
              </>
            )}
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
export
 default function RecoverAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold text-blue-600">
              Loading...
            </CardTitle>
            <CardDescription className="text-base">
              Please wait while we load the recovery page...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <RecoverAccountContent />
    </Suspense>
  );
}