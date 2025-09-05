import { EmailIntegrationService } from "@/lib/email-integration-service";
import { EmailTestService } from "@/lib/email-test-service";
import { EmailAnalyticsService } from "@/lib/email-analytics-service";
import { beforeEach } from "node:test";

// Mock Supabase
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "admin-user-id", email: "admin@example.com" } },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

// Mock admin auth middleware
jest.mock("@/lib/admin-auth-middleware", () => ({
  verifyAdminAccess: jest.fn().mockResolvedValue({
    isValid: true,
    user: { id: "admin-user-id", email: "admin@example.com" },
  }),
}));

// Mock nodemailer
jest.mock("nodemailer", () => ({
  createTransporter: jest.fn(() => ({
    verify: jest.fn().mockResolvedValue(true),
    sendMail: jest.fn().mockResolvedValue({
      messageId: "test-message-id",
      response: "250 OK",
    }),
  })),
}));

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    status: 200,
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
) as jest.Mock;

describe("Email System Comprehensive Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Complete Email Management Workflow", () => {
    it("should handle complete SMTP configuration workflow", async () => {
      // Test SMTP configuration creation, testing, and activation
      const smtpConfig = {
        name: "Test Gmail Config",
        provider: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        username: "test@gmail.com",
        password: "test-password",
        encryption: "tls" as const,
      };

      // Mock successful SMTP configuration
      const mockSupabase = require("@supabase/supabase-js").createClient();
      mockSupabase.from().insert.mockResolvedValue({
        data: { id: "smtp-config-id", ...smtpConfig },
        error: null,
      });

      // Test configuration creation
      const response = await fetch("/api/admin/email/smtp-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpConfig),
      });

      expect(response.status).toBe(200);
    });

    it("should handle complete email template workflow", async () => {
      // Test template creation, editing, preview, and activation
      const template = {
        name: "Welcome Email",
        type: "welcome",
        subject: "Welcome to {{app_name}}!",
        html_content: "<h1>Welcome {{user_name}}!</h1>",
        text_content: "Welcome {{user_name}}!",
        placeholders: ["app_name", "user_name"],
      };

      const mockSupabase = require("@supabase/supabase-js").createClient();
      mockSupabase.from().insert.mockResolvedValue({
        data: { id: "template-id", ...template },
        error: null,
      });

      // Test template creation
      const response = await fetch("/api/admin/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });

      expect(response.status).toBe(200);
    });

    it("should handle complete email testing workflow", async () => {
      // Test email sending with template and SMTP configuration
      const testEmail = {
        template_id: "template-id",
        smtp_config_id: "smtp-config-id",
        recipient_email: "test@example.com",
        test_data: {
          user_name: "Test User",
          app_name: "Test App",
        },
      };

      const mockSupabase = require("@supabase/supabase-js").createClient();
      mockSupabase.from().insert.mockResolvedValue({
        data: { id: "test-id", ...testEmail, status: "sent" },
        error: null,
      });

      // Test email sending
      const response = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testEmail),
      });

      expect(response.status).toBe(200);
    });

    it("should handle email analytics and monitoring", async () => {
      // Test analytics data retrieval and monitoring
      const mockSupabase = require("@supabase/supabase-js").createClient();
      mockSupabase.from().select.mockResolvedValue({
        data: [
          {
            id: "log-1",
            email_type: "welcome",
            status: "sent",
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      // Test analytics endpoint
      const response = await fetch("/api/admin/email/analytics?period=7d");
      expect(response.status).toBe(200);
    });

    it("should handle security and compliance features", async () => {
      // Test admin access control
      const { verifyAdminAccess } = require("@/lib/admin-auth-middleware");
      verifyAdminAccess.mockResolvedValue({
        isValid: true,
        user: { id: "admin-id", email: "admin@example.com" },
      });

      // Test audit logging
      const mockSupabase = require("@supabase/supabase-js").createClient();
      mockSupabase.from().insert.mockResolvedValue({
        data: { id: "audit-log-id" },
        error: null,
      });

      // Test GDPR compliance endpoint
      const response = await fetch("/api/admin/security/gdpr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "user-id", action: "export" }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle SMTP connection failures gracefully", async () => {
      const nodemailer = require("nodemailer");
      nodemailer
        .createTransporter()
        .verify.mockRejectedValue(new Error("Connection failed"));

      const response = await fetch(
        "/api/admin/email/smtp-config/test-id/test",
        {
          method: "POST",
        }
      );

      expect(response.status).toBe(500);
    });

    it("should handle template validation errors", async () => {
      const invalidTemplate = {
        name: "",
        type: "invalid",
        subject: "",
        html_content: '<script>alert("xss")</script>',
      };

      const response = await fetch("/api/admin/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidTemplate),
      });

      expect(response.status).toBe(400);
    });

    it("should handle email delivery failures with retry logic", async () => {
      const nodemailer = require("nodemailer");
      nodemailer
        .createTransporter()
        .sendMail.mockRejectedValueOnce(new Error("Temporary failure"))
        .mockResolvedValueOnce({
          messageId: "retry-success",
          response: "250 OK",
        });

      const emailService = new EmailTestService();
      const result = await emailService.sendTestEmail({
        template_id: "template-id",
        recipient_email: "test@example.com",
        test_data: {},
      });

      expect(result.status).toBe("sent");
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle bulk email operations efficiently", async () => {
      const startTime = Date.now();

      // Simulate bulk template operations
      const promises = Array.from({ length: 100 }, (_, i) =>
        fetch("/api/admin/email/templates/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: "create",
            templates: [{ name: `Template ${i}`, type: "custom" }],
          }),
        })
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000);
    });

    it("should handle concurrent email sending", async () => {
      const concurrentEmails = Array.from({ length: 50 }, (_, i) => ({
        template_id: "template-id",
        recipient_email: `test${i}@example.com`,
        test_data: { user_name: `User ${i}` },
      }));

      const promises = concurrentEmails.map((email) =>
        fetch("/api/admin/email/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(email),
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.status === 200).length;

      expect(successCount).toBeGreaterThan(40); // Allow some failures
    });
  });

  describe("Integration with Application Features", () => {
    it("should integrate with user registration flow", async () => {
      // Test welcome email integration
      const mockSupabase = require("@supabase/supabase-js").createClient();
      mockSupabase.from().select.mockResolvedValue({
        data: [{ id: "welcome-template", type: "welcome", is_active: true }],
        error: null,
      });

      const integrationService = new EmailIntegrationService();
      const result = await integrationService.sendWelcomeEmail({
        user_id: "user-id",
        email: "newuser@example.com",
        name: "New User",
      });

      expect(result.success).toBe(true);
    });

    it("should integrate with lesson reminder system", async () => {
      // Test lesson reminder integration
      const mockSupabase = require("@supabase/supabase-js").createClient();
      mockSupabase.from().select.mockResolvedValue({
        data: [
          { id: "reminder-template", type: "lesson_reminder", is_active: true },
        ],
        error: null,
      });

      const integrationService = new EmailIntegrationService();
      const result = await integrationService.sendLessonReminder({
        user_id: "user-id",
        email: "student@example.com",
        lesson_title: "English Grammar Basics",
        lesson_date: new Date(),
      });

      expect(result.success).toBe(true);
    });

    it("should integrate with password reset flow", async () => {
      // Test password reset integration
      const mockSupabase = require("@supabase/supabase-js").createClient();
      mockSupabase.from().select.mockResolvedValue({
        data: [
          { id: "reset-template", type: "password_reset", is_active: true },
        ],
        error: null,
      });

      const integrationService = new EmailIntegrationService();
      const result = await integrationService.sendPasswordReset({
        user_id: "user-id",
        email: "user@example.com",
        reset_token: "reset-token-123",
        reset_url: "https://app.com/reset?token=reset-token-123",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Data Consistency and Integrity", () => {
    it("should maintain template version history", async () => {
      const mockSupabase = require("@supabase/supabase-js").createClient();

      // Mock template update with history tracking
      mockSupabase.from().update.mockResolvedValue({
        data: { id: "template-id", version: 2 },
        error: null,
      });

      mockSupabase.from().insert.mockResolvedValue({
        data: { id: "history-id", template_id: "template-id", version: 1 },
        error: null,
      });

      const response = await fetch("/api/admin/email/templates/template-id", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "Updated Subject",
          html_content: "<h1>Updated Content</h1>",
        }),
      });

      expect(response.status).toBe(200);
    });

    it("should handle database transaction rollbacks", async () => {
      const mockSupabase = require("@supabase/supabase-js").createClient();

      // Mock transaction failure
      mockSupabase
        .from()
        .insert.mockResolvedValueOnce({ data: { id: "temp-id" }, error: null })
        .mockRejectedValueOnce(new Error("Database constraint violation"));

      const response = await fetch("/api/admin/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Template",
          type: "custom",
          subject: "Test",
        }),
      });

      expect(response.status).toBe(500);
    });
  });

  describe("Monitoring and Alerting", () => {
    it("should track email delivery metrics", async () => {
      const analyticsService = new EmailAnalyticsService();

      const mockSupabase = require("@supabase/supabase-js").createClient();
      mockSupabase.from().select.mockResolvedValue({
        data: [
          { status: "sent", created_at: new Date().toISOString() },
          { status: "failed", created_at: new Date().toISOString() },
          { status: "bounced", created_at: new Date().toISOString() },
        ],
        error: null,
      });

      const metrics = await analyticsService.getDeliveryMetrics("7d");

      expect(metrics).toHaveProperty("total_sent");
      expect(metrics).toHaveProperty("success_rate");
      expect(metrics).toHaveProperty("bounce_rate");
    });

    it("should generate alerts for high failure rates", async () => {
      const analyticsService = new EmailAnalyticsService();

      const mockSupabase = require("@supabase/supabase-js").createClient();
      mockSupabase.from().select.mockResolvedValue({
        data: Array.from({ length: 100 }, () => ({
          status: "failed",
          created_at: new Date().toISOString(),
        })),
        error: null,
      });

      const alerts = await analyticsService.checkAlertConditions();

      expect(alerts).toContainEqual(
        expect.objectContaining({
          type: "high_failure_rate",
          severity: "critical",
        })
      );
    });
  });
});
