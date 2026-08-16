const form = document.getElementById("forgotForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document
        .getElementById("email")
        .value
        .trim()
        .toLowerCase();

    message.style.color = "#64748b";
    message.innerText = "Sending reset code...";

    try {

        const response = await fetch(
            "http://localhost:5000/api/users/forgot-password",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email
                })
            }
        );

        const data = await response.json();

        if (response.ok) {

            // Save email for OTP verification
            localStorage.setItem(
                "resetEmail",
                email
            );

            message.style.color = "#166534";

            message.innerText =
                "Reset code sent! Redirecting...";

            setTimeout(() => {

                window.location.href =
                    "verify-reset-otp.html";

            }, 1500);

        } else {

            message.style.color = "#dc2626";

            message.innerText =
                data.message ||
                "Unable to send reset code.";

        }

    } catch (error) {

        console.error(
            "Forgot password error:",
            error
        );

        message.style.color = "#dc2626";

        message.innerText =
            "Unable to connect to the server.";

    }

});