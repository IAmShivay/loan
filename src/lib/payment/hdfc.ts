import crypto from 'crypto';
import { logInfo, logError } from '@/lib/logger';

/**
 * HDFC Payment Gateway Integration
 *
 * This integration is specifically designed for collecting service charges from students
 * applying for education loans. It handles:
 *
 * - Service charge collection (₹99 per application)
 * - Payment verification and callback handling
 * - Transaction status tracking
 *
 * Note: This is NOT a payout system. It only collects payments from students.
 * Future payout functionality will be added separately.
 */

export interface HDFCPaymentConfig {
  merchantId: string;
  accessCode: string;
  workingKey: string;
  redirectUrl: string;
  cancelUrl: string;
  rsaKeyUrl: string;
  apiEndpoint: string;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryZip?: string;
  deliveryCountry?: string;
  merchantParam1?: string;
  merchantParam2?: string;
  merchantParam3?: string;
  merchantParam4?: string;
  merchantParam5?: string;
}

export interface PaymentResponse {
  orderId: string;
  trackingId: string;
  bankRefNo: string;
  orderStatus: 'Success' | 'Failure' | 'Aborted' | 'Invalid';
  failureMessage?: string;
  paymentMode: string;
  cardName?: string;
  statusCode: string;
  statusMessage: string;
  currency: string;
  amount: string;
  billingName: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry: string;
  billingTel: string;
  billingEmail: string;
  deliveryName?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryZip?: string;
  deliveryCountry?: string;
  deliveryTel?: string;
  merchantParam1?: string;
  merchantParam2?: string;
  merchantParam3?: string;
  merchantParam4?: string;
  merchantParam5?: string;
  vault?: string;
  offerType?: string;
  offerCode?: string;
  discountValue?: string;
  merAmount?: string;
  eci?: string;
  retry?: string;
  responseCode?: string;
  billingNotes?: string;
  transDate?: string;
  binCountry?: string;
}

export class HDFCPaymentGateway {
  private config: HDFCPaymentConfig;

  constructor(config: HDFCPaymentConfig) {
    this.config = config;
  }

  /**
   * Encrypt data using AES-128-CBC
   */
  private encrypt(plainText: string): string {
    try {
      const key = crypto.createHash('md5').update(this.config.workingKey).digest();
      const iv = Buffer.alloc(16, 0); // Initialize with zeros
      const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
      
      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return encrypted;
    } catch (error) {
      logError('HDFC Payment encryption failed', error);
      throw new Error('Payment encryption failed');
    }
  }

  /**
   * Decrypt data using AES-128-CBC
   */
  private decrypt(encryptedText: string): string {
    try {
      const key = crypto.createHash('md5').update(this.config.workingKey).digest();
      const iv = Buffer.alloc(16, 0); // Initialize with zeros
      const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
      
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logError('HDFC Payment decryption failed', error);
      throw new Error('Payment decryption failed');
    }
  }

  /**
   * Generate HMAC signature for request verification
   */
  private generateSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.config.workingKey)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify HMAC signature for response validation
   */
  private verifySignature(data: string, signature: string): boolean {
    const expectedSignature = this.generateSignature(data);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Create payment request form data
   */
  public createPaymentRequest(paymentData: PaymentRequest): {
    encRequest: string;
    accessCode: string;
    merchantId: string;
    redirectUrl: string;
    cancelUrl: string;
  } {
    try {
      // Prepare request parameters
      const requestParams = {
        merchant_id: this.config.merchantId,
        order_id: paymentData.orderId,
        amount: paymentData.amount.toFixed(2),
        currency: paymentData.currency,
        redirect_url: this.config.redirectUrl,
        cancel_url: this.config.cancelUrl,
        language: 'EN',
        billing_name: paymentData.customerName,
        billing_address: paymentData.billingAddress,
        billing_city: paymentData.billingCity,
        billing_state: paymentData.billingState,
        billing_zip: paymentData.billingZip,
        billing_country: paymentData.billingCountry,
        billing_tel: paymentData.customerPhone,
        billing_email: paymentData.customerEmail,
        delivery_name: paymentData.customerName,
        delivery_address: paymentData.deliveryAddress || paymentData.billingAddress,
        delivery_city: paymentData.deliveryCity || paymentData.billingCity,
        delivery_state: paymentData.deliveryState || paymentData.billingState,
        delivery_zip: paymentData.deliveryZip || paymentData.billingZip,
        delivery_country: paymentData.deliveryCountry || paymentData.billingCountry,
        delivery_tel: paymentData.customerPhone,
        merchant_param1: paymentData.merchantParam1 || '',
        merchant_param2: paymentData.merchantParam2 || '',
        merchant_param3: paymentData.merchantParam3 || '',
        merchant_param4: paymentData.merchantParam4 || '',
        merchant_param5: paymentData.merchantParam5 || '',
        promo_code: '',
        customer_identifier: paymentData.customerEmail,
      };

      // Convert to query string
      const queryString = Object.entries(requestParams)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

      // Encrypt the request
      const encRequest = this.encrypt(queryString);

      logInfo('HDFC Payment request created', {
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        merchantId: this.config.merchantId
      });

      return {
        encRequest,
        accessCode: this.config.accessCode,
        merchantId: this.config.merchantId,
        redirectUrl: this.config.redirectUrl,
        cancelUrl: this.config.cancelUrl,
      };
    } catch (error) {
      logError('HDFC Payment request creation failed', error, { orderId: paymentData.orderId });
      throw new Error('Failed to create payment request');
    }
  }

  /**
   * Parse payment response
   */
  public parsePaymentResponse(encResponse: string): PaymentResponse {
    try {
      // Decrypt the response
      const decryptedResponse = this.decrypt(encResponse);
      
      // Parse query string to object
      const params = new URLSearchParams(decryptedResponse);
      const responseData: any = {};
      
      for (const [key, value] of params.entries()) {
        responseData[key] = value;
      }

      logInfo('HDFC Payment response parsed', {
        orderId: responseData.order_id,
        orderStatus: responseData.order_status,
        trackingId: responseData.tracking_id
      });

      // Map to standardized response format
      return {
        orderId: responseData.order_id,
        trackingId: responseData.tracking_id,
        bankRefNo: responseData.bank_ref_no,
        orderStatus: responseData.order_status,
        failureMessage: responseData.failure_message,
        paymentMode: responseData.payment_mode,
        cardName: responseData.card_name,
        statusCode: responseData.status_code,
        statusMessage: responseData.status_message,
        currency: responseData.currency,
        amount: responseData.amount,
        billingName: responseData.billing_name,
        billingAddress: responseData.billing_address,
        billingCity: responseData.billing_city,
        billingState: responseData.billing_state,
        billingZip: responseData.billing_zip,
        billingCountry: responseData.billing_country,
        billingTel: responseData.billing_tel,
        billingEmail: responseData.billing_email,
        deliveryName: responseData.delivery_name,
        deliveryAddress: responseData.delivery_address,
        deliveryCity: responseData.delivery_city,
        deliveryState: responseData.delivery_state,
        deliveryZip: responseData.delivery_zip,
        deliveryCountry: responseData.delivery_country,
        deliveryTel: responseData.delivery_tel,
        merchantParam1: responseData.merchant_param1,
        merchantParam2: responseData.merchant_param2,
        merchantParam3: responseData.merchant_param3,
        merchantParam4: responseData.merchant_param4,
        merchantParam5: responseData.merchant_param5,
        vault: responseData.vault,
        offerType: responseData.offer_type,
        offerCode: responseData.offer_code,
        discountValue: responseData.discount_value,
        merAmount: responseData.mer_amount,
        eci: responseData.eci,
        retry: responseData.retry,
        responseCode: responseData.response_code,
        billingNotes: responseData.billing_notes,
        transDate: responseData.trans_date,
        binCountry: responseData.bin_country,
      };
    } catch (error) {
      logError('HDFC Payment response parsing failed', error);
      throw new Error('Failed to parse payment response');
    }
  }

  /**
   * Verify payment status by querying HDFC API
   */
  public async verifyPaymentStatus(orderId: string, trackingId: string): Promise<PaymentResponse> {
    try {
      // Prepare verification request
      const requestParams = {
        merchant_id: this.config.merchantId,
        order_id: orderId,
        tracking_id: trackingId,
      };

      const queryString = Object.entries(requestParams)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

      const encRequest = this.encrypt(queryString);

      // Make API call to HDFC
      const response = await fetch(`${this.config.apiEndpoint}/transaction/orderStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `enc_request=${encodeURIComponent(encRequest)}&access_code=${this.config.accessCode}&command=orderStatusTracker&request_type=JSON&response_type=JSON&version=1.2`,
      });

      if (!response.ok) {
        throw new Error(`HDFC API error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      
      if (responseData.status === 1) {
        // Decrypt and parse the response
        return this.parsePaymentResponse(responseData.enc_response);
      } else {
        throw new Error(`HDFC API error: ${responseData.message}`);
      }
    } catch (error) {
      logError('HDFC Payment verification failed', error, { orderId, trackingId });
      throw new Error('Payment verification failed');
    }
  }
}

// Export singleton instance
export const hdfcPaymentGateway = new HDFCPaymentGateway({
  merchantId: process.env.HDFC_MERCHANT_ID || '',
  accessCode: process.env.HDFC_ACCESS_CODE || '',
  workingKey: process.env.HDFC_WORKING_KEY || '',
  redirectUrl: process.env.HDFC_REDIRECT_URL || `${process.env.NEXTAUTH_URL}/api/payment/hdfc/callback`,
  cancelUrl: process.env.HDFC_CANCEL_URL || `${process.env.NEXTAUTH_URL}/payment/cancelled`,
  rsaKeyUrl: process.env.HDFC_RSA_KEY_URL || '',
  apiEndpoint: process.env.HDFC_API_ENDPOINT || 'https://secure.ccavenue.com/transaction/transaction.do',
});
