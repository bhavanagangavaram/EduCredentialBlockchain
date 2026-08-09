require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const SENDER_FROM = `"E-Voting System (noreply)" <${process.env.EMAIL_USER}>`;

const mailOptions = {
    from: SENDER_FROM,
    replyTo: 'noreply@evoting-system.local',
    to: process.env.EMAIL_USER, // Send to self
    subject: '🛡️ E-Voting System — Email Test',
    text: 'If you receive this, your email configuration is working correctly!',
    html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 0; background: #0f172a; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); padding: 24px; text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #ffffff;">🛡️ E-Voting System</div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; text-transform: uppercase; letter-spacing: 2px;">Configuration Test</div>
            </div>
            <div style="padding: 32px; text-align: center; color: #e2e8f0;">
                <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                <h2 style="margin: 0 0 8px; color: #34d399;">Email Working!</h2>
                <p style="margin: 0; font-size: 14px; color: #94a3b8;">Your OTP email service is properly configured.</p>
                <p style="margin: 12px 0 0; font-size: 12px; color: #64748b;">Sent at: ${new Date().toISOString()}</p>
            </div>
            <div style="padding: 16px 32px; background: rgba(0,0,0,0.3); text-align: center;">
                <p style="font-size: 10px; color: #475569; margin: 0;">This is an automated test from E-Voting System.</p>
            </div>
        </div>
    `
};

console.log(`Sending test email from "${SENDER_FROM}" to ${process.env.EMAIL_USER}...`);

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log('❌ Error:', error.message);
        if (error.responseCode === 535) {
            console.log('   → App Password is invalid. Generate a new one at: https://myaccount.google.com/apppasswords');
        }
    } else {
        console.log('✅ Email sent: ' + info.response);
        console.log('   Check your inbox — sender should show as "E-Voting System (noreply)"');
    }
});
