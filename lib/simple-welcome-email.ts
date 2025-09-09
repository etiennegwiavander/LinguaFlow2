/**
 * Simple Welcome Email Service
 * A lightweight solution for sending welcome emails without the complex email management system
 */

import { supabase } from "./supabase";

export interface WelcomeEmailData {
  firstName?: string;
  lastName?: string;
  userId?: string;
}

export class SimpleWelcomeEmailService {
  /**
   * Send a welcome email using a simple approach
   * This bypasses the complex email management system and uses a direct approach
   */
  static async sendWelcomeEmail(
    userEmail: string,
    userData: WelcomeEmailData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("📧 Attempting to send welcome email to:", userEmail);

      // Try to call the Supabase Edge Function directly
      const { data, error } = await supabase.functions.invoke(
        "send-welcome-email",
        {
          body: {
            email: userEmail,
            firstName: userData.firstName || "New User",
            lastName: userData.lastName || "",
            userId: userData.userId,
          },
        }
      );

      if (error) {
        console.error("Welcome email error:", error);

        // Log the attempt in welcome_emails table for tracking
        await this.logWelcomeEmailAttempt(userEmail, "failed", error.message);

        return {
          success: false,
          error: `Failed to send welcome email: ${error.message}`,
        };
      }

      console.log("✅ Welcome email sent successfully");

      // Log successful send
      await this.logWelcomeEmailAttempt(userEmail, "sent");

      return { success: true };
    } catch (error: any) {
      console.error("Welcome email service error:", error);

      // Log the failed attempt
      await this.logWelcomeEmailAttempt(userEmail, "failed", error.message);

      return {
        success: false,
        error: `Welcome email service error: ${error.message}`,
      };
    }
  }

  /**
   * Log welcome email attempts for tracking
   */
  private static async logWelcomeEmailAttempt(
    email: string,
    status: "sent" | "failed" | "pending",
    errorMessage?: string
  ) {
    try {
      await supabase.from("welcome_emails").upsert(
        {
          email,
          user_type: "tutor",
          subject: "Welcome to LinguaFlow",
          content: errorMessage || "Welcome email sent successfully",
          status,
          sent_at: status === "sent" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "email",
        }
      );
    } catch (logError) {
      console.warn("Failed to log welcome email attempt:", logError);
    }
  }

  /**
   * Check if welcome email was sent for a user
   */
  static async wasWelcomeEmailSent(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("welcome_emails")
        .select("status")
        .eq("email", email)
        .eq("status", "sent")
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  /**
   * Retry failed welcome emails
   */
  static async retryFailedWelcomeEmails(): Promise<{
    processed: number;
    successful: number;
  }> {
    try {
      const { data: failedEmails, error } = await supabase
        .from("welcome_emails")
        .select("email")
        .eq("status", "failed")
        .limit(10);

      if (error || !failedEmails) {
        return { processed: 0, successful: 0 };
      }

      let successful = 0;

      for (const record of failedEmails) {
        const result = await this.sendWelcomeEmail(record.email, {});
        if (result.success) {
          successful++;
        }
      }

      return { processed: failedEmails.length, successful };
    } catch (error) {
      console.error("Error retrying failed welcome emails:", error);
      return { processed: 0, successful: 0 };
    }
  }
}
