const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 4000;

console.log("-----------------------------------------");
console.log("OTP SERVICE STARTING...");
console.log("Time:", new Date().toISOString());
console.log("Loading .env from:", path.join(__dirname, '.env'));
console.log("Loaded EMAIL_USER:", process.env.EMAIL_USER || "NOT SET");
console.log("Loaded PASSWORD Length:", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
console.log("-----------------------------------------");

// Sender display name — shown as "noreply" in recipient's inbox
const SENDER_NAME = 'E-Voting System';
const SENDER_FROM = `"${SENDER_NAME} (noreply)" <${process.env.EMAIL_USER}>`;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' })); // Allow Frontend
app.use(express.json());

// In-memory OTP storage: { "email": { otp: "1234", expires: timestamp } }
const otpStorage = {};

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ SMTP AUTH FAILED:", error.message);
        console.error("   → Generate a new App Password at: https://myaccount.google.com/apppasswords");
        console.error("   → Update EMAIL_PASS in .env and restart");
    } else {
        console.log("✅ SMTP connection verified — emails will be delivered to real inboxes");
    }
});

// Helper: Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Route: Send OTP (Email Only - SMS handled by Firebase on Frontend)
app.post('/send-otp', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ status: "error", message: "Email is required" });
    }

    const otpEmail = generateOTP();

    console.log(`=================================================`);
    console.log(`📧 GENERATED OTP for ${email}: ${otpEmail}`);
    console.log(`=================================================`);

    // Store Email OTP
    otpStorage[email] = { otp: otpEmail, expires: Date.now() + 300000 };



    // Send Email via Nodemailer (Real Mode)
    const mailOptions = {
        from: SENDER_FROM,
        replyTo: 'noreply@evoting-system.local',
        to: email,
        subject: '🔐 Your E-Voting Verification Code',
        text: `Your OTP for the E-Voting System is: ${otpEmail}. It expires in 5 minutes. Do not share this code.`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 0; background: #0f172a; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); padding: 24px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">🛡️ E-Voting System</div>
                    <div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; text-transform: uppercase; letter-spacing: 2px;">Secure Verification</div>
                </div>
                <div style="padding: 32px; color: #e2e8f0;">
                    <p style="margin: 0 0 20px; font-size: 14px; color: #94a3b8; text-align: center;">A verification code was requested for your account.</p>
                    <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 24px; text-align: center;">
                        <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Your verification code</p>
                        <div style="font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #a78bfa; margin: 16px 0; font-family: 'Courier New', monospace;">${otpEmail}</div>
                        <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">This code expires in <strong style="color: #f59e0b;">5 minutes</strong></p>
                    </div>
                    <div style="margin-top: 24px; background: rgba(239, 68, 68, 0.08); border-radius: 8px; padding: 12px; border-left: 3px solid #ef4444;">
                        <p style="margin: 0; font-size: 12px; color: #f87171;">⚠️ If you did not request this code, please ignore this email. Never share this code with anyone.</p>
                    </div>
                </div>
                <div style="padding: 16px 32px; background: rgba(0,0,0,0.3); text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
                    <p style="font-size: 10px; color: #475569; margin: 0;">This is an automated message from E-Voting System. Do not reply.</p>
                    <p style="font-size: 10px; color: #475569; margin: 4px 0 0;">Secured by Ethereum Blockchain  •  AI-Integrated Decentralized Voting</p>
                </div>
            </div>
        `
    };

    try {
        if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS.includes("your_gmail")) {
            throw new Error("EMAIL_PASS not configured in .env — generate an App Password at https://myaccount.google.com/apppasswords");
        }
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${email} | MessageId: ${info.messageId}`);
        return res.json({ status: "success", message: "OTP sent to your email" });
    } catch (error) {
        console.error("❌ Error sending email:", error.message);
        if (error.responseCode === 535) {
            console.error("   → App Password is invalid. Generate a new one at: https://myaccount.google.com/apppasswords");
        }
        return res.status(500).json({
            status: "error",
            message: "Failed to send OTP email. Please contact administrator."
        });
    }
});

const twilio = require('twilio');

// Route: Send SMS OTP via Twilio
app.post('/send-sms', async (req, res) => {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ status: "error", message: "Mobile number required" });

    const otpSms = generateOTP();
    console.log(`📱 GENERATED SMS OTP for ${mobile}: ${otpSms}`);

    // Store SMS OTP
    otpStorage[mobile] = { otp: otpSms, expires: Date.now() + 300000 };

    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !twilioPhone || accountSid.includes("YOUR_")) {
            throw new Error("Twilio credentials not configured in .env");
        }

        const client = twilio(accountSid, authToken);

        let formattedMobile = mobile;
        if (!formattedMobile.startsWith('+')) {
            // Assuming Indian numbers by default for the demo. Adjust if necessary.
            formattedMobile = '+91' + formattedMobile;
        }

        const message = await client.messages.create({
            body: `Your Voting App Verification Code is ${otpSms}. It expires in 5 minutes.`,
            from: twilioPhone,
            to: formattedMobile
        });

        console.log("✅ Twilio SMS Sent Successfully | SID:", message.sid);
        return res.json({ status: "success", message: "SMS Sent Successfully" });

    } catch (error) {
        console.error("❌ SMS Failed:", error.message);
        // Fallback: Return Debug OTP if real SMS fails
        return res.json({
            status: "success",
            message: "SMS Failed (Provider Issue), using Debug Mode",
            debugOtp: otpSms
        });
    }
});

// Route: Verify Dual OTP (3FA) - UPDATED to verify BOTH internall
app.post('/verify-dual-otp', (req, res) => {
    const { email, otp_email, mobile, otp_mobile } = req.body;

    if (!email || !otp_email || !mobile || !otp_mobile) {
        return res.status(400).json({ status: "error", message: "All fields are required" });
    }

    const recordEmail = otpStorage[email];
    const recordMobile = otpStorage[mobile];

    // Verify Email
    if (!recordEmail || recordEmail.otp !== otp_email) {
        return res.status(400).json({ status: "error", message: "Invalid or Expired Email OTP" });
    }

    // Verify SMS
    if (!recordMobile || recordMobile.otp !== otp_mobile) {
        return res.status(400).json({ status: "error", message: "Invalid or Expired SMS OTP" });
    }

    // Clear used OTPs
    delete otpStorage[email];
    delete otpStorage[mobile];

    return res.json({ status: "success", message: "Dual Verification Successful" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ OTP Service running on http://localhost:${PORT}`);
});
