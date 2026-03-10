const SibApiV3Sdk = require('sib-api-v3-sdk');

/**
 * Send OTP verification email for signup using Brevo.
 *
 * @param {string} email - Recipient email
 * @param {string} otp - One-time password
 * @returns {Promise<{success: boolean, error?: string}>}
 */
module.exports = async (email, otp) => {
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (!brevoApiKey) {
    console.warn('⚠️ Brevo API key not configured.');
    return { success: false, error: 'No email service configured' };
  }

  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = brevoApiKey;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = "Verify Your Account - Secure File Sharing";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #3f51b5; margin-bottom: 20px; text-align: center;">Verify Your Account</h2>
      <p>Thank you for registering. To complete your registration, please enter the following verification code:</p>
      <div style="text-align: center; margin: 30px 0;">
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background-color: #f0f0f0; padding: 15px 20px; border-radius: 8px; display: inline-block; color: #333;">${otp}</div>
      </div>
      <p>This code will expire in 10 minutes. If you did not request this verification, please ignore this email.</p>
    </div>
  `;
  sendSmtpEmail.sender = { "name": "Secure File Sharing", "email": "sayalimakar9@gmail.com" };
  sendSmtpEmail.to = [{ "email": email.trim() }];

  try {
    console.log(`📧 Attempting to send OTP email via Brevo...`);
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ OTP email sent via Brevo! ID:', data.messageId);
    return { success: true, info: data };
  } catch (err) {
    console.error('❌ Brevo failed:', err.message);
    return { success: false, error: err.message };
  }
};
