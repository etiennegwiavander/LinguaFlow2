"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Shield, Clock, Mail } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface AccountDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDeletion: (reason?: string) => Promise<void>;
  isLoading: boolean;
}

export default function AccountDeletionDialog({
  open,
  onOpenChange,
  onConfirmDeletion,
  isLoading
}: AccountDeletionDialogProps) {
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<'warning' | 'confirmation'>('warning');

  const handleNext = () => {
    setStep('confirmation');
  };

  const handleBack = () => {
    setStep('warning');
  };

  const handleConfirm = async () => {
    await onConfirmDeletion(reason.trim() || undefined);
    setStep('warning');
    setReason("");
  };

  const handleCancel = () => {
    setStep('warning');
    setReason("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        {step === 'warning' ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center text-destructive">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Delete Account
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Are you sure you want to delete your account? This action will have serious consequences.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 my-4">
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-destructive mb-3 flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    What happens when you delete your account:
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <Clock className="mr-2 h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span>Your account will be <strong>temporarily hidden</strong> and scheduled for permanent deletion in 30 days</span>
                    </li>
                    <li className="flex items-start">
                      <Mail className="mr-2 h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>You'll receive a <strong>recovery email</strong> with instructions to restore your account within 30 days</span>
                    </li>
                    <li className="flex items-start">
                      <AlertTriangle className="mr-2 h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <span>After 30 days, <strong>all your data will be permanently deleted</strong> including:</span>
                    </li>
                  </ul>
                  <div className="ml-6 mt-2 space-y-1 text-sm text-muted-foreground">
                    <div>• All student profiles and their learning data</div>
                    <div>• Generated lesson plans and teaching materials</div>
                    <div>• Calendar sync settings and events</div>
                    <div>• Account settings and preferences</div>
                    <div>• All associated files and documents</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                    Recovery Options
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    You can recover your account anytime within 30 days by clicking the recovery link in the email we'll send you. 
                    Your data will be fully restored as if nothing happened.
                  </p>
                </CardContent>
              </Card>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancel}>
                Cancel
              </AlertDialogCancel>
              <Button 
                variant="destructive" 
                onClick={handleNext}
                className="bg-destructive hover:bg-destructive/90"
              >
                Continue to Delete
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center text-destructive">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Final Confirmation
              </AlertDialogTitle>
              <AlertDialogDescription>
                Please confirm that you want to schedule your account for deletion.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 my-4">
              <div className="space-y-2">
                <Label htmlFor="deletion-reason">
                  Reason for deletion (optional)
                </Label>
                <Textarea
                  id="deletion-reason"
                  placeholder="Help us improve by telling us why you're leaving..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[100px] resize-y"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {reason.length}/500 characters
                </p>
              </div>

              <Separator />

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">
                  By confirming, you acknowledge that:
                </p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Your account will be scheduled for permanent deletion in 30 days</li>
                  <li>• You will receive a recovery email with restoration instructions</li>
                  <li>• You can cancel this deletion anytime within 30 days</li>
                  <li>• After 30 days, all data will be permanently and irreversibly deleted</li>
                  <li>• This action complies with GDPR and data protection regulations</li>
                </ul>
              </div>
            </div>

            <AlertDialogFooter>
              <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                Back
              </Button>
              <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                disabled={isLoading}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling Deletion...
                  </>
                ) : (
                  'Delete Account'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}