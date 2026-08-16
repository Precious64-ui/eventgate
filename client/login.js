const form = document.getElementById("loginForm");
const message = document.getElementById("loginMessage");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const togglePassword =
    document.getElementById("togglePassword");


// =========================
// SHOW / HIDE PASSWORD
// =========================

if (togglePassword) {

    togglePassword.addEventListener("click", () => {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            togglePassword.innerHTML =
                '<i class="fas fa-eye-slash"></i>';

        } else {

            passwordInput.type = "password";

            togglePassword.innerHTML =
                '<i class="fas fa-eye"></i>';
        }

    });

}


// =========================
// LOGIN
// =========================

form.addEventListener("submit", async (e) => {

    e.preventDefault();


    const email =
        emailInput.value.trim().toLowerCase();

    const password =
        passwordInput.value;


    // Clear previous message

    message.innerText = "";

    message.style.color = "";


    // Basic validation

    if (!email || !password) {

        message.style.color = "#dc2626";

        message.innerText =
            "Please enter your email and password.";

        return;
    }


    // Loading state

    const loginButton =
        form.querySelector(".login-btn");

    const originalButton =
        loginButton.innerHTML;


    loginButton.disabled = true;

    loginButton.innerHTML = `
        <span>Logging in...</span>
        <i class="fas fa-spinner fa-spin"></i>
    `;


    try {

        const response = await fetch(
            "http://localhost:5000/api/users/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })
            }
        );


        const data = await response.json();


        // =========================
        // SUCCESS
        // =========================

        if (response.ok) {

            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );


            message.style.color = "#166534";

            message.innerText =
                "Login successful! Redirecting...";


            setTimeout(() => {

                window.location.href =
                    "index.html";

            }, 1000);


        }

        // =========================
        // UNVERIFIED ACCOUNT
        // =========================

        else if (response.status === 403) {

            message.style.color = "#dc2626";

            message.innerText =
                data.message ||
                "Please verify your email before logging in.";

        }

        // =========================
        // OTHER ERRORS
        // =========================

        else {

            message.style.color = "#dc2626";

            message.innerText =
                data.message ||
                "Invalid email or password.";

        }


    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        message.style.color = "#dc2626";

        message.innerText =
            "Unable to connect to the server. Please try again.";

    }


    // Restore button

    loginButton.disabled = false;

    loginButton.innerHTML =
        originalButton;

});