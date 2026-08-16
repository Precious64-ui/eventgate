const form = document.getElementById("resetForm");
const message = document.getElementById("message");


// =========================
// GET SAVED RESET DETAILS
// =========================

const email = localStorage.getItem("resetEmail");
const otp = localStorage.getItem("resetOTP");


// =========================
// CHECK DETAILS
// =========================

if (!email || !otp) {

    message.style.color = "#dc2626";

    message.innerText =
        "Your password reset session has expired. Please request a new reset code.";

    form.style.display = "none";
}


// =========================
// PASSWORD TOGGLE
// =========================

const toggleNewPassword =
    document.getElementById("toggleNewPassword");

const newPassword =
    document.getElementById("newPassword");

toggleNewPassword.addEventListener("click", () => {

    if (newPassword.type === "password") {

        newPassword.type = "text";

        toggleNewPassword.innerHTML =
            '<i class="fas fa-eye-slash"></i>';

    } else {

        newPassword.type = "password";

        toggleNewPassword.innerHTML =
            '<i class="fas fa-eye"></i>';
    }

});


const toggleConfirmPassword =
    document.getElementById("toggleConfirmPassword");

const confirmPassword =
    document.getElementById("confirmPassword");

toggleConfirmPassword.addEventListener("click", () => {

    if (confirmPassword.type === "password") {

        confirmPassword.type = "text";

        toggleConfirmPassword.innerHTML =
            '<i class="fas fa-eye-slash"></i>';

    } else {

        confirmPassword.type = "password";

        toggleConfirmPassword.innerHTML =
            '<i class="fas fa-eye"></i>';
    }

});


// =========================
// RESET PASSWORD
// =========================

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const password =
        newPassword.value;

    const confirm =
        confirmPassword.value;


    // Check password length

    if (password.length < 6) {

        message.style.color = "#dc2626";

        message.innerText =
            "Password must be at least 6 characters.";

        return;
    }


    // Check passwords match

    if (password !== confirm) {

        message.style.color = "#dc2626";

        message.innerText =
            "Passwords do not match.";

        return;
    }


    message.style.color = "#64748b";

    message.innerText =
        "Resetting your password...";


    try {

        const response = await fetch(
            "http://localhost:5000/api/users/reset-password",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    email: email,

                    otp: otp,

                    newPassword: password

                })
            }
        );


        const data = await response.json();


        if (response.ok) {

            message.style.color = "#166534";

            message.innerText =
                "Password reset successfully! Redirecting to login...";


            // Remove reset information

            localStorage.removeItem("resetEmail");

            localStorage.removeItem("resetOTP");


            setTimeout(() => {

                window.location.href =
                    "login.html";

            }, 1800);


        } else {

            message.style.color = "#dc2626";

            message.innerText =
                data.message ||
                "Unable to reset password.";

        }


    } catch (error) {

        console.error(
            "Reset password error:",
            error
        );

        message.style.color = "#dc2626";

        message.innerText =
            "Unable to connect to the server.";

    }

});