// Pluggable SMS provider interface for OTP delivery.
//
// Default provider: "stub" (interface-only). It sends NOTHING. In development
// it writes the code to the server console so local testing can proceed.
// The code is NEVER returned in any API response.
//
// Real provider: "http". It POSTs to SMS_API_URL with SMS_API_KEY, both read
// from environment variables. The server REFUSES to use it unless both are
// set. No key, secret, or credential is ever written in code. Local Pakistani
// gateways are the expected choice (typical cost Rs 1–4/SMS at the time this
// foundation was written; confirm with the provider before committing).
//
// To add a provider: implement { async sendOtp({ phone, code, senderId }) }
// and register it in PROVIDERS. Nothing else in the codebase changes.

export class StubSmsProvider {
  constructor() { this.lastSent = null; }
  async sendOtp({ phone, code }) {
    this.lastSent = { phone, code, at: new Date().toISOString() };
    console.log(`[OTP-STUB] code for ${phone} (NOT sent — no SMS provider configured). ` +
      `In production this must go through a real SMS provider account.`);
    console.log(`[OTP-STUB] dev-only code: ${code}`);
    return { sent: false, provider: "stub" };
  }
}

export class HttpSmsProvider {
  constructor({ apiUrl, apiKey, senderId }) {
    if (!apiUrl || !apiKey) {
      throw new Error("SMS_API_URL and SMS_API_KEY must both be set to use the http SMS provider.");
    }
    this.apiUrl = apiUrl; this.apiKey = apiKey; this.senderId = senderId;
  }
  async sendOtp({ phone, code }) {
    // Generic JSON gateway shape; real gateways differ in field names, so
    // adapt this one method to the chosen provider's API when configuring.
    const res = await fetch(this.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        to: phone, from: this.senderId,
        text: `Asif Traders verification code: ${code}. Do not share it.`,
      }),
    });
    if (!res.ok) throw new Error(`SMS provider rejected the request (${res.status}).`);
    return { sent: true, provider: "http" };
  }
}

export function createSmsProvider(config) {
  if (config.smsProvider === "http") {
    return new HttpSmsProvider({ apiUrl: config.smsApiUrl, apiKey: config.smsApiKey, senderId: config.smsSenderId });
  }
  if (config.smsProvider !== "stub") {
    throw new Error(`Unknown SMS_PROVIDER "${config.smsProvider}". Use "stub" or "http".`);
  }
  return new StubSmsProvider();
}
