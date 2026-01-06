// Tranzak Payment Gateway Client
// Documentation: https://docs.developer.tranzak.me

interface TranzakConfig {
  apiKey: string;
  appId: string;
  baseUrl: string;
  environment: 'sandbox' | 'production';
}

interface TranzakPaymentRequest {
  amount: number;
  currencyCode: string; // Changed from 'currency' to 'currencyCode'
  description: string;
  returnUrl: string; // Changed from 'return_url' to 'returnUrl'
  mchTransactionRef?: string; // Optional merchant transaction reference
}

interface TranzakPaymentResponse {
  success: boolean;
  data?: {
    requestId: string; // Changed from 'request_id' to 'requestId'
    links: {
      paymentUrl: string; // Nested in 'links' object
    };
    amount: number;
    currencyCode: string;
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
      baseUrl: process.env.TRANZAK_BASE_URL || 'https://sandbox.dsapi.tranzak.me',
      environment: (process.env.TRANZAK_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    };
  }

  /**
   * Check if credentials are configured
   */
  private checkCredentials(): void {
    if (!this.config.apiKey || !this.config.appId) {
      throw new Error('Tranzak API credentials not configured. Please set TRANZAK_API_KEY and TRANZAK_APP_ID in your environment variables.');
    }
  }

  /**
   * Create a payment request
   */
  async createPayment(request: TranzakPaymentRequest): Promise<TranzakPaymentResponse> {
    try {
      // Check credentials before making request
      this.checkCredentials();

      console.log('Creating Tranzak payment with request:', request);
      
      const response = await fetch(`${this.config.baseUrl}/xp021/v1/request-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-App-Id': this.config.appId,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      console.log('Tranzak API response:', { status: response.status, data });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.errorCode?.toString() || 'PAYMENT_ERROR',
            message: data.errorMsg || data.message || 'Failed to create payment',
          },
        };
      }

      // Check if response indicates success
      if (!data.success) {
        return {
          success: false,
          error: {
            code: data.errorCode?.toString() || 'PAYMENT_ERROR',
            message: data.errorMsg || 'Payment request failed',
          },
        };
      }

      return {
        success: true,
        data: {
          requestId: data.data.requestId,
          links: {
            paymentUrl: data.data.links.paymentUrl,
          },
          amount: data.data.amount,
          currencyCode: data.data.currencyCode,
          status: data.data.status,
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
      // Check credentials before making request
      this.checkCredentials();
      
      const response = await fetch(`${this.config.baseUrl}/xp021/v1/request-payment/${requestId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-App-Id': this.config.appId,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: {
            code: data.errorCode?.toString() || 'VERIFICATION_ERROR',
            message: data.errorMsg || 'Failed to verify payment',
          },
        };
      }

      return {
        success: true,
        data: {
          requestId: data.data.requestId,
          links: {
            paymentUrl: data.data.links.paymentUrl,
          },
          amount: data.data.amount,
          currencyCode: data.data.currencyCode,
          status: data.data.status,
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
