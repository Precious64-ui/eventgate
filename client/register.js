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

    // =========================
    // FRONTEND VALIDATION
    // =========================

    if (!name || !email || !password) {
        message.style.color = "#dc2626";
        message.innerText = "Please fill in all fields.";
        return;
    }

    if (password.length < 6) {
        message.style.color = "#dc2626";
        message.innerText =
            "Password must be at least 6 characters.";
        return;
    }

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

        console.log("Registration response:", data);

        // =========================
        // SUCCESS
        // =========================

        if (response.ok) {

            message.style.color = "#166534";

            // =========================
            // DEMO MODE
            // =========================

            if (data.demoMode && data.demoOTP) {

                message.innerHTML = `
                    <strong>Account created successfully!</strong>

                    <br><br>

                    Your verification code is:

                    <div style="
                        margin: 15px 0;
                        padding: 15px;
                        background: #f0fdf4;
                        border: 1px solid #86efac;
                        border-radius: 10px;
                        font-size: 28px;
                        font-weight: bold;
                        letter-spacing: 6px;
                        color: #166534;
                    ">
                        ${data.demoOTP}
                    </div>

                    <small>
                        Demo mode: no email is required.
                        This code expires in 10 minutes.
                    </small>
                `;

            } else {

                // Real email mode
                message.innerText =
                    "Account created! A verification code has been sent to your email.";

            }

            // =========================
            // SAVE EMAIL
            // =========================

            sessionStorage.setItem(
                "verificationEmail",
                email
            );

            // =========================
            // SAVE DEMO OTP
            // =========================

            if (data.demoOTP) {

                sessionStorage.setItem(
                    "demoOTP",
                    data.demoOTP
                );

            }

            form.reset();

            // =========================
            // GO TO OTP PAGE
            // =========================

            setTimeout(() => {

                window.location.href =
                    `verify-otp.html?email=${encodeURIComponent(email)}`;

            }, 2500);

        } else {

            // =========================
            // REGISTRATION ERROR
            // =========================

            message.style.color = "#dc2626";

            message.innerText =
                data.message || "Registration failed.";

        }

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        message.style.color = "#dc2626";

        message.innerText =
            "Unable to connect to the server. Please try again.";

    }

});