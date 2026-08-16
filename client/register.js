const form = document.getElementById("registerForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Clear previous message
    message.innerText = "";
    message.style.color = "";

    try {
        const response = await fetch(
            "https://eventgate-fxp8.onrender.com/api/users/register",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (response.ok) {

            message.style.color = "#166534";
            message.innerText =
                "Account created! A verification code has been sent to your email.";

            form.reset();

            // Go to OTP verification page
            setTimeout(() => {
                window.location.href =
                    `verify-otp.html?email=${encodeURIComponent(email)}`;
            }, 1500);

        } else {

            message.style.color = "#dc2626";
            message.innerText =
                data.message || "Registration failed.";

        }

    } catch (error) {

        console.error("Registration error:", error);

        message.style.color = "#dc2626";
        message.innerText =
            "Unable to connect to the server. Please try again.";

    }
});