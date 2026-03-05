const { Resend } = require('resend');

/**
 * Send share OTP email to recipient using Resend (HTTP API - works on Render)
 * @param {string} email - Recipient email
 * @param {string} otp - One-time password
 * @param {Object} fileInfo - Information about the shared file
 * @param {string} shareLink - Link to access the shared file
 * @returns {Promise} - Result of sending the email
 */
module.exports = async (email, otp, fileInfo, shareLink) => {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error('❌ Resend API key not configured!');
    console.error('Please set RESEND_API_KEY environment variable');
    return {
      success: false,
      error: 'Resend API key not configured',
      details: 'Set RESEND_API_KEY in Environment Variables'
    };
  }

  const resend = new Resend(resendApiKey);
  // Use Resend's default sender (works without domain verification)
  const fromEmail = 'onboarding@resend.dev';

  console.log('📧 Attempting to send share OTP email via Resend...');
  console.log('From:', fromEmail);
  console.log('To:', email);
  console.log('Share link:', shareLink);

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: 'File Shared With You - Access Verification',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; font-size: 16px; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3f51b5; margin-bottom: 20px; text-align: center;">Secure File Share</h2>
          
          <p>A file has been shared with you:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 0;"><strong>File name:</strong> ${fileInfo.fileName}</p>
            <p style="margin: 8px 0 0;"><strong>Shared by:</strong> ${fileInfo.ownerName}</p>
            ${fileInfo.fileSize ? `<p style="margin: 8px 0 0;"><strong>Size:</strong> ${fileInfo.fileSize}</p>` : ''}
          </div>
          
          <p>To access this file, you'll need to verify with the following code:</p>
          <div style="text-align: center; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background-color: #f0f0f0; padding: 15px 20px; border-radius: 8px; display: inline-block; color: #333;">${otp}</div>
          </div>
          
          <p>Please click the link below to access the file and enter this verification code:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${shareLink}" style="background-color: #3f51b5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Access Shared File</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            &bull; This verification code is valid for one-time use only.<br>
            &bull; If you didn't request this file, you can safely ignore this email.<br>
            &bull; For security reasons, the link and code will expire after a certain period.
          </p>
        </div>
      `,
    });

    console.log('✅ Share OTP email sent successfully via Resend!');
    console.log('Response:', JSON.stringify(data));
    return { success: true, info: data };
  } catch (error) {
    console.error('❌ Error sending share OTP email via Resend:');
    console.error('Error details:', JSON.stringify(error));

    return {
      success: false,
      error: error.message || 'Unknown error',
      details: 'Check backend logs for detailed error information'
    };
  }
};