const express = require("express");
const router = express.Router();

const {
    registerUser,
    verifyOTP,
    resendOTP,
    loginUser,
    forgotPassword,
    verifyResetOTP,
    resetPassword
} = require("../controllers/userController");

// =========================
// REGISTER
// =========================

router.post("/register", registerUser);


// =========================
// VERIFY EMAIL OTP
// =========================

router.post("/verify-otp", verifyOTP);
// =========================
// RESEND EMAIL OTP
// =========================

router.post("/resend-otp", resendOTP);


// =========================
// LOGIN
// =========================

router.post("/login", loginUser);


// =========================
// FORGOT PASSWORD
// =========================

router.post("/forgot-password", forgotPassword);


// =========================
// VERIFY RESET OTP
// =========================

router.post("/verify-reset-otp", verifyResetOTP);


// =========================
// RESET PASSWORD
// =========================

router.post("/reset-password", resetPassword);


module.exports = router;