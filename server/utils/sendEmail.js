const brevo = require("@getbrevo/brevo");

// Sends an OTP email through the Brevo HTTP API.
// Returns true on success, false on failure.
// It never throws, so an email problem cannot break
// registration or password reset.

const sendOTPEmail = async (to, subject, heading, otp, intro) => {

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 10px;">

            <h2 style="color: #0f172a; margin-top: 0;">EventGate</h2>

            <h3 style="color: #1e293b;">${heading}</h3>

            <p style="color: #475569; font-size: 15px;">${intro}</p>

            <div style="background: #f1f5f9; padding: 18px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 30px; letter-spacing: 7px; font-weight: bold; color: #0f172a;">
                    ${otp}
                </span>
            </div>

            <p style="color: #64748b; font-size: 13px;">
                This code expires in 10 minutes. If you did not request it, you can ignore this email.
            </p>

        </div>
    `;

    try {
        if (!process.env.BREVO_API_KEY) {
            console.error("BREVO_API_KEY is not set. Email not sent.");
            return false;
        }

        const apiInstance = new brevo.TransactionalEmailsApi();

        apiInstance.setApiKey(
            brevo.TransactionalEmailsApiApiKeys.apiKey,
            process.env.BREVO_API_KEY
        );

        const message = new brevo.SendSmtpEmail();

        message.subject = subject;
        message.htmlContent = html;

        message.sender = {
            name: "EventGate",
            email: process.env.BREVO_SENDER_EMAIL
        };

        message.to = [{ email: to }];

        await apiInstance.sendTransacEmail(message);

        console.log(`Email sent to ${to}`);
        return true;

    } catch (error) {
        console.error(
            "Email delivery failed:",
            error?.response?.body?.message || error.message
        );
        return false;
    }
};

module.exports = sendOTPEmail;