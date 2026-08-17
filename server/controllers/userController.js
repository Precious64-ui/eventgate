const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);


// =========================
// SEND EMAIL
// =========================

const sendEmail = async ({
    to,
    subject,
    html
}) => {

    const { data, error } =
        await resend.emails.send({

            from:
                "EventGate <onboarding@resend.dev>",

            to: [to],

            subject,

            html

        });

    if (error) {

        console.error(
            "Resend email error:",
            error
        );

        throw new Error(
            error.message
        );

    }

    return data;
};


// =========================
// REGISTER USER
// =========================

const registerUser = async (req, res) => {

    try {

        const { name, email, password } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please provide name, email and password."
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        // Check if user already exists
        const existingUser =
            await User.findOne({
                email: normalizedEmail
            });

        if (existingUser) {

            // Allow unverified user to request a new OTP
            if (!existingUser.isVerified) {

                const otp = Math.floor(
                    100000 + Math.random() * 900000
                ).toString();

                existingUser.verificationOTP = otp;

                existingUser.verificationOTPExpires =
                    new Date(
                        Date.now() + 10 * 60 * 1000
                    );

                await existingUser.save();

                await sendEmail({

    to: normalizedEmail,

    subject:
        "Your EventGate Verification Code",

    html: `
        <div style="
            font-family: Arial, sans-serif;
            max-width: 500px;
            margin: auto;
            padding: 30px;
            text-align: center;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
        ">

            <h2 style="color: #1e3a8a;">
                Welcome to EventGate
            </h2>

            <p>
                Your email verification code is:
            </p>

            <h1 style="
                letter-spacing: 8px;
                color: #1e3a8a;
            ">
                ${otp}
            </h1>

            <p>
                This code will expire in
                <strong>10 minutes</strong>.
            </p>

            <p style="color: #64748b;">
                If you didn't create an EventGate account,
                you can ignore this email.
            </p>

        </div>
    `
});

                return res.status(200).json({
                    message:
                        "Your account is not verified. A new verification code has been sent to your email."
                });
            }

            return res.status(400).json({
                message: "Email already exists"
            });
        }


        // Hash password
        const hashedPassword =
            await bcrypt.hash(password, 10);


        // Generate 6-digit OTP
        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();


        // OTP expires in 10 minutes
        const otpExpires =
            new Date(
                Date.now() + 10 * 60 * 1000
            );


        // Create user
        const user = await User.create({

            name,

            email: normalizedEmail,

            password: hashedPassword,

            isVerified: false,

            verificationOTP: otp,

            verificationOTPExpires: otpExpires

        });


        // Send verification email
        await sendEmail({

    to: normalizedEmail,

    subject:
        "Verify Your EventGate Account",

    html: `
        <div style="
            font-family: Arial, sans-serif;
            max-width: 500px;
            margin: auto;
            padding: 30px;
            text-align: center;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
        ">

            <h2 style="color: #1e3a8a;">
                Welcome to EventGate!
            </h2>

            <p>
                Hi <strong>${name}</strong>,
            </p>

            <p>
                Thank you for creating your EventGate account.
                Use the verification code below to verify your email.
            </p>

            <div style="
                margin: 25px 0;
                padding: 18px;
                background: #f8fafc;
                border-radius: 10px;
            ">

                <h1 style="
                    margin: 0;
                    letter-spacing: 8px;
                    color: #1e3a8a;
                ">
                    ${otp}
                </h1>

            </div>

            <p>
                This code expires in
                <strong>10 minutes</strong>.
            </p>

            <p style="
                color: #64748b;
                font-size: 13px;
            ">
                If you didn't create this account,
                you can safely ignore this email.
            </p>

            <hr style="
                border: none;
                border-top: 1px solid #e5e7eb;
                margin: 25px 0;
            ">

            <p style="
                color: #94a3b8;
                font-size: 12px;
            ">
                © ${new Date().getFullYear()} EventGate
            </p>

        </div>
    `
});


        res.status(201).json({

            message:
                "Registration successful. A verification code has been sent to your email.",

            user: {

                id: user._id,

                name: user.name,

                email: user.email

            }

        });

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        res.status(500).json({

            message:
                "Registration failed. Please try again."

        });

    }

};


// =========================
// VERIFY EMAIL OTP
// =========================

const verifyOTP = async (req, res) => {

    try {

        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message:
                    "Email and verification code are required."
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const user =
            await User.findOne({
                email: normalizedEmail
            });

        if (!user) {

            return res.status(404).json({
                message: "User not found"
            });

        }


        if (user.isVerified) {

            return res.status(400).json({
                message: "Email is already verified"
            });

        }


        if (user.verificationOTP !== otp) {

            return res.status(400).json({
                message: "Invalid verification code"
            });

        }


        if (
            !user.verificationOTPExpires ||
            user.verificationOTPExpires < new Date()
        ) {

            return res.status(400).json({
                message:
                    "Verification code has expired. Please request a new code."
            });

        }


        user.isVerified = true;

        user.verificationOTP = undefined;

        user.verificationOTPExpires = undefined;

        await user.save();


        res.status(200).json({

            message:
                "Email verified successfully. You can now login."

        });

    } catch (error) {

        console.error(
            "OTP verification error:",
            error
        );

        res.status(500).json({

            message:
                "Verification failed. Please try again."

        });

    }

};


// =========================
// RESEND VERIFICATION OTP
// =========================

const resendOTP = async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required."
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const user =
            await User.findOne({
                email: normalizedEmail
            });

        if (!user) {

            return res.status(404).json({
                message: "User not found"
            });

        }


        if (user.isVerified) {

            return res.status(400).json({
                message: "Email is already verified."
            });

        }


        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();


        user.verificationOTP = otp;

        user.verificationOTPExpires =
            new Date(
                Date.now() + 10 * 60 * 1000
            );


        await user.save();


        await sendEmail({

    to: normalizedEmail,

    subject:
        "Your New EventGate Verification Code",

    html: `
        <div style="
            font-family: Arial, sans-serif;
            max-width: 500px;
            margin: auto;
            padding: 30px;
            text-align: center;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
        ">

            <h2 style="color: #1e3a8a;">
                EventGate
            </h2>

            <p>
                Here is your new verification code:
            </p>

            <div style="
                margin: 25px 0;
                padding: 18px;
                background: #f8fafc;
                border-radius: 10px;
            ">

                <h1 style="
                    margin: 0;
                    letter-spacing: 8px;
                    color: #1e3a8a;
                ">
                    ${otp}
                </h1>

            </div>

            <p>
                This code expires in
                <strong>10 minutes</strong>.
            </p>

            <p style="
                color: #64748b;
                font-size: 13px;
            ">
                If you didn't request a new code,
                you can safely ignore this email.
            </p>

        </div>
    `
});


        console.log(
            "New verification OTP sent to:",
            normalizedEmail
        );


        res.status(200).json({

            message:
                "A new verification code has been sent to your email."

        });

    } catch (error) {

        console.error(
            "Resend OTP error:",
            error
        );

        res.status(500).json({

            message:
                "Unable to resend verification code. Please try again."

        });

    }

};


// =========================
// LOGIN USER
// =========================

const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                message:
                    "Email and password are required."
            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        const user =
            await User.findOne({
                email: normalizedEmail
            });


        if (!user) {

            return res.status(400).json({
                message:
                    "Invalid email or password"
            });

        }


        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!isMatch) {

            return res.status(400).json({
                message:
                    "Invalid email or password"
            });

        }


        // Require email verification
        if (!user.isVerified) {

            return res.status(403).json({

                message:
                    "Please verify your email before logging in."

            });

        }


        // Check JWT secret
        if (!process.env.JWT_SECRET) {

            console.error(
                "JWT_SECRET is missing from environment variables."
            );

            return res.status(500).json({

                message:
                    "Server configuration error. Please try again later."

            });

        }


        const token =
            jwt.sign(

                {
                    id: user._id,
                    role: user.role
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "1d"
                }

            );


        res.status(200).json({

            message:
                "Login successful",

            token,

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                role: user.role

            }

        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        res.status(500).json({

            message:
                "Login failed. Please try again."

        });

    }

};


// =========================
// FORGOT PASSWORD
// =========================

const forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required."
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const user =
            await User.findOne({
                email: normalizedEmail
            });


        if (!user) {

            return res.status(404).json({
                message:
                    "No account found with this email"
            });

        }


        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();


        user.resetOTP = otp;

        user.resetOTPExpires =
            new Date(
                Date.now() + 10 * 60 * 1000
            );


        await user.save();


        await sendEmail({

    to: normalizedEmail,

    subject:
        "EventGate Password Reset Code",

    html: `
        <div style="
            font-family: Arial, sans-serif;
            max-width: 500px;
            margin: auto;
            padding: 30px;
            text-align: center;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
        ">

            <h2 style="color: #1e3a8a;">
                Reset Your EventGate Password
            </h2>

            <p>
                We received a request to reset your password.
            </p>

            <p>
                Your password reset code is:
            </p>

            <div style="
                margin: 25px 0;
                padding: 18px;
                background: #f8fafc;
                border-radius: 10px;
            ">

                <h1 style="
                    margin: 0;
                    letter-spacing: 8px;
                    color: #1e3a8a;
                ">
                    ${otp}
                </h1>

            </div>

            <p>
                This code expires in
                <strong>10 minutes</strong>.
            </p>

            <p style="
                color: #64748b;
                font-size: 13px;
            ">
                If you didn't request a password reset,
                you can safely ignore this email.
            </p>

        </div>
    `
});


        res.status(200).json({

            message:
                "Password reset code has been sent to your email"

        });

    } catch (error) {

        console.error(
            "Forgot password error:",
            error
        );

        res.status(500).json({

            message:
                "Something went wrong. Please try again."

        });

    }

};


// =========================
// VERIFY RESET OTP
// =========================

const verifyResetOTP = async (req, res) => {

    try {

        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message:
                    "Email and reset code are required."
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const user =
            await User.findOne({
                email: normalizedEmail
            });


        if (!user) {

            return res.status(404).json({
                message:
                    "User not found"
            });

        }


        if (user.resetOTP !== otp) {

            return res.status(400).json({
                message:
                    "Invalid reset code"
            });

        }


        if (
            !user.resetOTPExpires ||
            user.resetOTPExpires < new Date()
        ) {

            return res.status(400).json({
                message:
                    "Reset code has expired. Please request a new code."
            });

        }


        res.status(200).json({

            message:
                "Reset code verified successfully"

        });

    } catch (error) {

        console.error(
            "Verify reset OTP error:",
            error
        );

        res.status(500).json({

            message:
                "Something went wrong. Please try again."

        });

    }

};


// =========================
// RESET PASSWORD
// =========================

const resetPassword = async (req, res) => {

    try {

        const {
            email,
            otp,
            newPassword
        } = req.body;


        if (!email || !otp || !newPassword) {

            return res.status(400).json({

                message:
                    "Email, reset code and new password are required."

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        const user =
            await User.findOne({
                email: normalizedEmail
            });


        if (!user) {

            return res.status(404).json({
                message:
                    "User not found"
            });

        }


        if (user.resetOTP !== otp) {

            return res.status(400).json({
                message:
                    "Invalid reset code"
            });

        }


        if (
            !user.resetOTPExpires ||
            user.resetOTPExpires < new Date()
        ) {

            return res.status(400).json({

                message:
                    "Reset code has expired. Please request a new code."

            });

        }


        if (newPassword.length < 6) {

            return res.status(400).json({

                message:
                    "Password must be at least 6 characters."

            });

        }


        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );


        user.password =
            hashedPassword;


        user.resetOTP =
            undefined;

        user.resetOTPExpires =
            undefined;


        await user.save();


        res.status(200).json({

            message:
                "Password reset successfully. You can now login."

        });

    } catch (error) {

        console.error(
            "Reset password error:",
            error
        );

        res.status(500).json({

            message:
                "Something went wrong. Please try again."

        });

    }

};


const testEmail = async (req, res) => {
    try {
        const { data, error } = await resend.emails.send({
            from: "EventGate <onboarding@resend.dev>",
            to: ["iwuchukwuprecious64@gmail.com"],
            subject: "EventGate Email Test",
            html: `
                <h2>EventGate Email Test</h2>
                <p>If you're seeing this, Resend is working correctly.</p>
            `
        });

        if (error) {
            console.error("Resend error:", error);

            return res.status(400).json({
                message: error.message
            });
        }

        res.status(200).json({
            message: "Test email sent successfully",
            data
        });

    } catch (error) {
        console.error("Email test error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};

// =========================
// EXPORT
// =========================

module.exports = {
    registerUser,
    verifyOTP,
    resendOTP,
    loginUser,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    testEmail
};