const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// =========================
// DEMO MODE
// =========================
// For your capstone deployment, keep this true.
// No real email service is required.
//
// When you eventually have a verified email service,
// change this to false and add a real email provider.

const DEMO_MODE =
    process.env.DEMO_MODE !== "false";


// =========================
// GENERATE OTP
// =========================

const generateOTP = () => {

    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();

};


// =========================
// REGISTER USER
// =========================

const registerUser = async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;


        // Basic validation
        if (!name || !email || !password) {

            return res.status(400).json({

                message:
                    "Please provide name, email and password."

            });

        }


        if (password.length < 6) {

            return res.status(400).json({

                message:
                    "Password must be at least 6 characters."

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        // Check existing user
        const existingUser =
            await User.findOne({

                email: normalizedEmail

            });


        // =========================
        // EXISTING USER
        // =========================

        if (existingUser) {

            // Existing but not verified
            if (!existingUser.isVerified) {

                const otp = generateOTP();


                existingUser.verificationOTP =
                    otp;

                existingUser.verificationOTPExpires =
                    new Date(
                        Date.now() +
                        10 * 60 * 1000
                    );


                await existingUser.save();


                console.log(
                    `Demo verification OTP for ${normalizedEmail}: ${otp}`
                );


                return res.status(200).json({

                    message:
                        `Your account is not verified. Your verification code is: ${otp}`,

                    demoMode: true,

                    demoOTP: otp

                });

            }


            // Existing and verified
            return res.status(400).json({

                message:
                    "Email already exists"

            });

        }


        // =========================
        // HASH PASSWORD
        // =========================

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        // =========================
        // GENERATE OTP
        // =========================

        const otp =
            generateOTP();


        const otpExpires =
            new Date(
                Date.now() +
                10 * 60 * 1000
            );


        // =========================
        // CREATE USER
        // =========================

        const user =
            await User.create({

                name,

                email:
                    normalizedEmail,

                password:
                    hashedPassword,

                isVerified:
                    false,

                verificationOTP:
                    otp,

                verificationOTPExpires:
                    otpExpires

            });


        console.log(
            `Demo verification OTP for ${normalizedEmail}: ${otp}`
        );


        // =========================
        // RESPONSE
        // =========================

        return res.status(201).json({

            message:
                `Registration successful. Your verification code is: ${otp}`,

            user: {

                id:
                    user._id,

                name:
                    user.name,

                email:
                    user.email

            },

            demoMode:
                true,

            demoOTP:
                otp

        });


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );


        return res.status(500).json({

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

        const {
            email,
            otp
        } = req.body;


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

                email:
                    normalizedEmail

            });


        if (!user) {

            return res.status(404).json({

                message:
                    "User not found"

            });

        }


        if (user.isVerified) {

            return res.status(400).json({

                message:
                    "Email is already verified"

            });

        }


        if (user.verificationOTP !== otp) {

            return res.status(400).json({

                message:
                    "Invalid verification code"

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


        // Verify account
        user.isVerified = true;

        user.verificationOTP = undefined;

        user.verificationOTPExpires =
            undefined;


        await user.save();


        return res.status(200).json({

            message:
                "Email verified successfully. You can now login."

        });


    } catch (error) {

        console.error(
            "OTP verification error:",
            error
        );


        return res.status(500).json({

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

        const {
            email
        } = req.body;


        if (!email) {

            return res.status(400).json({

                message:
                    "Email is required."

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        const user =
            await User.findOne({

                email:
                    normalizedEmail

            });


        if (!user) {

            return res.status(404).json({

                message:
                    "User not found"

            });

        }


        if (user.isVerified) {

            return res.status(400).json({

                message:
                    "Email is already verified."

            });

        }


        const otp =
            generateOTP();


        user.verificationOTP =
            otp;

        user.verificationOTPExpires =
            new Date(
                Date.now() +
                10 * 60 * 1000
            );


        await user.save();


        console.log(
            `New demo verification OTP for ${normalizedEmail}: ${otp}`
        );


        return res.status(200).json({

            message:
                `Your new verification code is: ${otp}`,

            demoMode:
                true,

            demoOTP:
                otp

        });


    } catch (error) {

        console.error(
            "Resend OTP error:",
            error
        );


        return res.status(500).json({

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

        const {
            email,
            password
        } = req.body;


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

                email:
                    normalizedEmail

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


        if (!user.isVerified) {

            return res.status(403).json({

                message:
                    "Please verify your email before logging in."

            });

        }


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
                    id:
                        user._id,

                    role:
                        user.role

                },

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        "1d"
                }

            );


        return res.status(200).json({

            message:
                "Login successful",

            token,

            user: {

                id:
                    user._id,

                name:
                    user.name,

                email:
                    user.email,

                role:
                    user.role

            }

        });


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        return res.status(500).json({

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

        const {
            email
        } = req.body;


        if (!email) {

            return res.status(400).json({

                message:
                    "Email is required."

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        const user =
            await User.findOne({

                email:
                    normalizedEmail

            });


        if (!user) {

            return res.status(404).json({

                message:
                    "No account found with this email"

            });

        }


        const otp =
            generateOTP();


        user.resetOTP =
            otp;

        user.resetOTPExpires =
            new Date(
                Date.now() +
                10 * 60 * 1000
            );


        await user.save();


        console.log(
            `Demo password reset OTP for ${normalizedEmail}: ${otp}`
        );


        return res.status(200).json({

            message:
                `Password reset code generated. Your reset code is: ${otp}`,

            demoMode:
                true,

            demoOTP:
                otp

        });


    } catch (error) {

        console.error(
            "Forgot password error:",
            error
        );


        return res.status(500).json({

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

        const {
            email,
            otp
        } = req.body;


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

                email:
                    normalizedEmail

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


        return res.status(200).json({

            message:
                "Reset code verified successfully"

        });


    } catch (error) {

        console.error(
            "Verify reset OTP error:",
            error
        );


        return res.status(500).json({

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


        if (
            !email ||
            !otp ||
            !newPassword
        ) {

            return res.status(400).json({

                message:
                    "Email, reset code and new password are required."

            });

        }


        if (newPassword.length < 6) {

            return res.status(400).json({

                message:
                    "Password must be at least 6 characters."

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        const user =
            await User.findOne({

                email:
                    normalizedEmail

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


        return res.status(200).json({

            message:
                "Password reset successfully. You can now login."

        });


    } catch (error) {

        console.error(
            "Reset password error:",
            error
        );


        return res.status(500).json({

            message:
                "Something went wrong. Please try again."

        });

    }

};


// =========================
// TEST EMAIL
// =========================
// No real email service is used in demo mode.

const testEmail = async (req, res) => {

    return res.status(200).json({

        message:
            "EventGate demo mode is active. Real email delivery is disabled.",

        demoMode:
            true

    });

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