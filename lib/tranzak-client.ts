// Tranzak Payment Gateway Client
// Documentation: https://developers.tranzak.net

interface TranzakConfig {
  apiKey: string;
  appId: string;
  baseUrl: string;
  environment: 'sandbox' | 'production';
}

interface TranzakPaymentRequest {
  amount: number;
  currency: 'XAF' | 'USD';
  description: string;
  return_url: string;
  cancel_url: string;
  customer_email: string;
  customer_name: string;
  metadata?: Record<string, any>;
}

interface TranzakPaymentResponse {
  success: boolean;
  data?: {
    request_id: string;
    payment_url: string;
    amount: number;
    currency: string;
    status: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface TranzakWebhookPayload {
  event: 'payment.success' | 'payment.failed' | 'payment.pending';
  data: {
    request_id: string;
    transaction_id: string;
    amount: number;
    currency: string;
    status: string;
    payment_method: string;
    customer_email: string;
    metadata?: Record<string, any>;
  };
}

class TranzakClient {
  private config: TranzakConfig;

  constructor() {
    this.config = {
      apiKey: process.env.TRANZAK_API_KEY || '',
      appId: process.env.TRANZAK_APP_ID || '',
      baseUrl: process.env.TRANZAK_BASE_URL || 'https://api.tranzak.net/v1',
      environment: (process.env.TRANZAK_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    };

    if (!this.config.apiKey || !this.config.appId) {
      throw new Error('Tranzak API credentials not configured');
    }
  }

  /**
   * Create a payment request
   */
  async createPayment(request: TranzakPaymentRequest): Promise<TranzakPaymentResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-App-Id': this.config.appId,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'PAYMENT_ERROR',
            message: data.error?.message || 'Failed to create payment',
          },
        };
      }

      return {
        success: true,
        data: {
          request_id: data.request_id,
          payment_url: data.payment_url,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
        },
      };
    } catch (error) {
      console.error('Tranzak payment creation error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(requestId: string): Promise<TranzakPaymentResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/payments/${requestId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-App-Id': this.config.appId,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'VERIFICATION_ERROR',
            message: data.error?.message || 'Failed to verify payment',
          },
        };
      }

      return {
        success: true,
        data: {
          request_id: data.request_id,
          payment_url: data.payment_url,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
        },
      };
    } catch (error) {
      console.error('Tranzak payment verification error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Implement webhook signature verification
    // This will use HMAC-SHA256 with the webhook secret
    const crypto = require('crypto');
    const webhookSecret = process.env.TRANZAK_WEBHOOK_SECRET || '';
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Parse webhook payload
   */
  parseWebhook(payload: string): TranzakWebhookPayload | null {
    try {
      return JSON.parse(payload) as TranzakWebhookPayload;
    } catch (error) {
      console.error('Failed to parse webhook payload:', error);
      return null;
    }
  }
}

// Export singleton instance
export const tranzakClient = new TranzakClient();

// Export types
export type {
  TranzakConfig,
  TranzakPaymentRequest,
  TranzakPaymentResponse,
  TranzakWebhookPayload,
};
