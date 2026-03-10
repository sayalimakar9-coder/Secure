const SibApiV3Sdk = require('sib-api-v3-sdk');

/**
 * Send share OTP email to recipient using Brevo.
 *
 * @param {string} email - Recipient email
 * @param {string} otp - One-time password
 * @param {Object} fileInfo - Information about the shared file
 * @param {string} shareLink - Link to access the shared file
 * @returns {Promise<{success: boolean, error?: string}>}
 */
module.exports = async (email, otp, fileInfo, shareLink) => {
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

  sendSmtpEmail.subject = "File Shared With You - Access Verification";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; font-size: 16px; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #3f51b5; margin-bottom: 20px; text-align: center;">Secure File Share</h2>
      <p>A file has been shared with you:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="margin: 0;"><strong>File name:</strong> ${fileInfo.fileName}</p>
        <p style="margin: 8px 0 0;"><strong>Shared by:</strong> ${fileInfo.ownerName}</p>
        ${fileInfo.fileSize ? `<p style="margin: 8px 0 0;"><strong>Size:</strong> ${fileInfo.fileSize}</p>` : ''}
      </div>
      <p>To access this file, use this verification code:</p>
      <div style="text-align: center; margin: 20px 0;">
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background-color: #f0f0f0; padding: 15px 20px; border-radius: 8px; display: inline-block; color: #333;">${otp}</div>
      </div>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${shareLink}" style="background-color: #3f51b5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Access Shared File</a>
      </div>
    </div>
  `;
  sendSmtpEmail.sender = { "name": "Secure File Sharing", "email": "sayalimakar9@gmail.com" };
  sendSmtpEmail.to = [{ "email": email.trim() }];

  try {
    console.log(`📧 Attempting to send share OTP email via Brevo...`);
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Share OTP email sent via Brevo! ID:', data.messageId);
    return { success: true, info: data };
  } catch (err) {
    console.error('❌ Brevo failed:', err.message);
    return { success: false, error: err.message };
  }
};