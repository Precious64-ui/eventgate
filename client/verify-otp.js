const form = document.getElementById("verifyForm");
const message = document.getElementById("message");
const resendButton = document.getElementById("resendOTP");


// =========================
// GET EMAIL FROM URL
// =========================

const params = new URLSearchParams(window.location.search);

const email = params.get("email");


// =========================
// CHECK EMAIL
// =========================

if (!email) {

    message.style.color = "#dc2626";

    message.innerText =
        "No email address was provided. Please register again.";

    form.style.display = "none";

    if (resendButton) {
        resendButton.style.display = "none";
    }
}


// =========================
// VERIFY OTP
// =========================

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const otp =
        document.getElementById("otp").value.trim();


    // Check OTP length

    if (otp.length !== 6) {

        message.style.color = "#dc2626";

        message.innerText =
            "Please enter the 6-digit verification code.";

        return;
    }


    // Loading message

    message.style.color = "#64748b";

    message.innerText =
        "Verifying your email...";


    try {

        const response = await fetch(
            "https://eventgate-fxp8.onrender.com/api/users/verify-otp",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    otp: otp
                })
            }
        );


        const data = await response.json();


        // =========================
        // SUCCESS
        // =========================

        if (response.ok) {

            message.style.color = "#166534";

            message.innerText =
                "Email verified successfully! Redirecting to login...";


            setTimeout(() => {

                window.location.href = "login.html";

            }, 1500);


        } else {

            message.style.color = "#dc2626";

            message.innerText =
                data.message ||
                "Invalid verification code.";

        }


    } catch (error) {

        console.error(
            "OTP verification error:",
            error
        );

        message.style.color = "#dc2626";

        message.innerText =
            "Unable to connect to the server. Please try again.";

    }

});


// =========================
// RESEND OTP
// =========================

if (resendButton) {

    resendButton.addEventListener("click", async () => {

        // Disable button immediately

        resendButton.disabled = true;

        resendButton.innerText =
            "Sending...";


        message.style.color = "#64748b";

        message.innerText =
            "Sending a new verification code...";


        try {

            const response = await fetch(
                "https://eventgate-fxp8.onrender.com/api/users/resend-otp",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                    email: email
                  })
                }
            );


            const data = await response.json();


            if (response.ok) {

                message.style.color = "#166534";

                message.innerText =
                    "A new verification code has been sent to your email.";


                // 60 second cooldown

                let seconds = 60;

                resendButton.innerText =
                    `Resend code in ${seconds}s`;


                const countdown =
                    setInterval(() => {

                        seconds--;

                        resendButton.innerText =
                            `Resend code in ${seconds}s`;


                        if (seconds <= 0) {

                            clearInterval(countdown);

                            resendButton.disabled = false;

                            resendButton.innerText =
                                "Resend verification code";

                        }

                    }, 1000);


            } else {

                message.style.color = "#dc2626";

                message.innerText =
                    data.message ||
                    "Unable to resend verification code.";

                resendButton.disabled = false;

                resendButton.innerText =
                    "Resend verification code";

            }


        } catch (error) {

            console.error(
                "Resend OTP error:",
                error
            );

            message.style.color = "#dc2626";

            message.innerText =
                "Unable to connect to the server.";

            resendButton.disabled = false;

            resendButton.innerText =
                "Resend verification code";

        }

    });

}