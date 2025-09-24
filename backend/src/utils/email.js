import nodemailer from 'nodemailer';

// Check if email credentials are configured
const isEmailConfigured = () => {
	return process.env.EMAIL_HOST &&
		process.env.EMAIL_USER &&
		process.env.EMAIL_PASS;
};

// Create transporter only if email is configured
let transporter = null;
if (isEmailConfigured()) {
	try {
		transporter = nodemailer.createTransport({
			host: process.env.EMAIL_HOST,
			port: process.env.EMAIL_PORT,
			secure: false, // true for 465, false for other ports
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		});
	} catch (error) {
		console.warn('Failed to create email transporter:', error.message);
		transporter = null;
	}
}

const sendVerificationEmail = async (email, token) => {
	// Skip email sending if not configured
	if (!isEmailConfigured() || !transporter) {
		console.log('Email not configured, skipping verification email for:', email);
		return;
	}

	try {
		const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: email,
			subject: 'Verify Your Email - KeyStack',
			html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to KeyStack!</h2>
          <p>Thank you for registering. Please click the button below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            If you didn't create an account with KeyStack, please ignore this email.
          </p>
        </div>
      `
		};

		await transporter.sendMail(mailOptions);
		console.log('Verification email sent successfully to:', email);
	} catch (error) {
		// Log error but don't throw - fail silently
		console.warn('Failed to send verification email to', email, ':', error.message);
	}
};

export {
	sendVerificationEmail
};
