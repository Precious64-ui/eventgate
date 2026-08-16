const form = document.getElementById("verifyResetForm");
const message = document.getElementById("message");

// Get email saved from forgot-password page
const email = localStorage.getItem("resetEmail");


// Check email
if (!email) {

    message.style.color = "#dc2626";

    message.innerText =
        "No email found. Please request a new reset code.";

    form.style.display = "none";
}


// =========================
// VERIFY RESET OTP
// =========================

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const otp = document
        .getElementById("otp")
        .value
        .trim();


    if (otp.length !== 6) {

        message.style.color = "#dc2626";

        message.innerText =
            "Please enter the 6-digit reset code.";

        return;
    }


    message.style.color = "#64748b";

    message.innerText =
        "Verifying reset code...";


    try {

        const response = await fetch(
            "https://eventgate-fxp8.onrender.com/api/users/verify-reset-otp",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    otp
                })
            }
        );


        const data = await response.json();


        if (response.ok) {

    message.style.color = "#166534";

    message.innerText =
        "Code verified! Redirecting...";

    // Save the email and OTP
    localStorage.setItem("resetEmail", email);
    localStorage.setItem("resetOTP", otp);

    setTimeout(() => {

        window.location.href = "reset-password.html";

    }, 1200);

} else {

    message.style.color = "#dc2626";

    message.innerText =
        data.message || "Invalid reset code.";

}


    } catch (error) {

        console.error(
            "Reset OTP error:",
            error
        );

        message.style.color = "#dc2626";

        message.innerText =
            "Unable to connect to the server. Please try again.";

    }

});