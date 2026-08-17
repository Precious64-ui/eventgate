const crypto = require("crypto");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// =========================
// DEMO MODE
// =========================
// When DEMO_MODE is "true", the OTP is included in the API response
// so the flow can be demonstrated without an email provider.
// This is INSECURE and defaults to OFF.
// Normally the OTP is written to the server logs only.

const DEMO_MODE = process.env.DEMO_MODE === "true";

const OTP_VALIDITY_MS = 10 * 60 * 1000;


// =========================
// HELPERS
// =========================

const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

const otpExpiry = () => {
    return new Date(Date.now() + OTP_VALIDITY_MS);
};

const withDemoOTP = (payload, otp) => {
    if (DEMO_MODE) {
        return { ...payload, demoMode: true, demoOTP: otp };
    }
    return payload;
};


// =========================
// REGISTER USER
// =========================

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please provide name, email and password."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser && !existingUser.isVerified) {
            const otp = generateOTP();

            existingUser.verificationOTP = otp;
            existingUser.verificationOTPExpires = otpExpiry();

            await existingUser.save();

            console.log(`Verification OTP for ${normalizedEmail}: ${otp}`);

            return res.status(200).json(
                withDemoOTP({
                    message: "This account is not yet verified. A new verification code has been issued."
                }, otp)
            );
        }

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const otp = generateOTP();

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            isVerified: false,
            verificationOTP: otp,
            verificationOTPExpires: otpExpiry()
        });

        console.log(`Verification OTP for ${normalizedEmail}: ${otp}`);

        return res.status(201).json(
            withDemoOTP({
                message: "Registration successful. Please enter the verification code to activate your account.",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                }
            }, otp)
        );

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Registration failed. Please try again."
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
                message: "Email and verification code are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({
                message: "Email is already verified"
            });
        }

        if (!user.verificationOTPExpires || user.verificationOTPExpires < new Date()) {
            return res.status(400).json({
                message: "Verification code has expired. Please request a new code."
            });
        }

        if (!user.verificationOTP || String(user.verificationOTP) !== String(otp).trim()) {
            return res.status(400).json({
                message: "Invalid verification code"
            });
        }

        user.isVerified = true;
        user.verificationOTP = undefined;
        user.verificationOTPExpires = undefined;

        await user.save();

        return res.status(200).json({
            message: "Email verified successfully. You can now login."
        });

    } catch (error) {
        console.error("OTP verification error:", error);

        return res.status(500).json({
            message: "Verification failed. Please try again."
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
            return res.status(400).json({ message: "Email is required." });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({
                message: "Email is already verified."
            });
        }

        const otp = generateOTP();

        user.verificationOTP = otp;
        user.verificationOTPExpires = otpExpiry();

        await user.save();

        console.log(`New verification OTP for ${normalizedEmail}: ${otp}`);

        return res.status(200).json(
            withDemoOTP({
                message: "A new verification code has been issued."
            }, otp)
        );

    } catch (error) {
        console.error("Resend OTP error:", error);

        return res.status(500).json({
            message: "Unable to resend verification code. Please try again."
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
                message: "Email and password are required."
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing from environment variables.");

            return res.status(500).json({
                message: "Server configuration error. Please try again later."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email before logging in."
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Login failed. Please try again."
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
            return res.status(400).json({ message: "Email is required." });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });

        // Always respond the same way, whether or not the account exists,
        // so the endpoint cannot be used to discover registered emails.
        if (!user) {
            console.log(`Password reset requested for unknown email: ${normalizedEmail}`);

            return res.status(200).json({
                message: "If an account exists for that email, a reset code has been sent."
            });
        }

        const otp = generateOTP();

        user.resetOTP = otp;
        user.resetOTPExpires = otpExpiry();

        await user.save();

        console.log(`Password reset OTP for ${normalizedEmail}: ${otp}`);

        return res.status(200).json(
            withDemoOTP({
                message: "If an account exists for that email, a reset code has been sent."
            }, otp)
        );

    } catch (error) {
        console.error("Forgot password error:", error);

        return res.status(500).json({
            message: "Something went wrong. Please try again."
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
                message: "Email and reset code are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user || !user.resetOTP) {
            return res.status(400).json({ message: "Invalid reset code" });
        }

        if (!user.resetOTPExpires || user.resetOTPExpires < new Date()) {
            return res.status(400).json({
                message: "Reset code has expired. Please request a new code."
            });
        }

        if (String(user.resetOTP) !== String(otp).trim()) {
            return res.status(400).json({ message: "Invalid reset code" });
        }

        return res.status(200).json({
            message: "Reset code verified successfully"
        });

    } catch (error) {
        console.error("Verify reset OTP error:", error);

        return res.status(500).json({
            message: "Something went wrong. Please try again."
        });
    }
};


// =========================
// RESET PASSWORD
// =========================

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                message: "Email, reset code and new password are required."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user || !user.resetOTP) {
            return res.status(400).json({ message: "Invalid reset code" });
        }

        if (!user.resetOTPExpires || user.resetOTPExpires < new Date()) {
            return res.status(400).json({
                message: "Reset code has expired. Please request a new code."
            });
        }

        if (String(user.resetOTP) !== String(otp).trim()) {
            return res.status(400).json({ message: "Invalid reset code" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetOTP = undefined;
        user.resetOTPExpires = undefined;

        await user.save();

        return res.status(200).json({
            message: "Password reset successfully. You can now login."
        });

    } catch (error) {
        console.error("Reset password error:", error);

        return res.status(500).json({
            message: "Something went wrong. Please try again."
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
    resetPassword
};