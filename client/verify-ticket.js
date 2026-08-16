const form = document.getElementById("verifyForm");
const ticketIdInput = document.getElementById("ticketId");
const verifyResult = document.getElementById("verifyResult");
const logoutBtn = document.getElementById("logoutBtn");

const token = localStorage.getItem("token");

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
    menuToggle.classList.toggle("active");
    navLinks.classList.toggle("active");
});


// =========================
// CHECK LOGIN
// =========================

if (!token) {
    window.location.href = "login.html";
}


// =========================
// LOGOUT
// =========================

logoutBtn.addEventListener("click", () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "login.html";

});


// =========================
// VERIFY TICKET
// =========================

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const ticketId =
        ticketIdInput.value.trim().toUpperCase();

    if (!ticketId) {
        return;
    }

    verifyResult.innerHTML = `
        <div class="verify-loading">
            🔍 Checking ticket...
        </div>
    `;


    try {

        const response = await fetch(
            `https://eventgate-fxp8.onrender.com/api/tickets/verify/${encodeURIComponent(ticketId)}`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        const data = await response.json();


        // =========================
        // INVALID / ALREADY USED
        // =========================

        if (!response.ok) {

            verifyResult.innerHTML = `
                <div class="verify-error">

                    <h3>❌ Ticket Cannot Be Used</h3>

                    <p>
                        ${data.message || "Ticket not found."}
                    </p>

                </div>
            `;

            return;
        }


        // =========================
        // VALID TICKET
        // =========================

        const ticket = data.ticket;
        const event = ticket.event;


        verifyResult.innerHTML = `

            <div class="verify-success">

                <h3>✅ Ticket Verified</h3>

                <p class="valid-message">
                    This ticket is valid and has not been used.
                </p>


                <div class="verified-ticket">

                    <p>
                        <strong>Ticket ID:</strong>
                        ${ticket.ticketId}
                    </p>

                    <p>
                        <strong>Event:</strong>
                        ${event.title}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${event.location}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${new Date(event.date)
                            .toLocaleDateString()}
                    </p>

                    <p>
                        <strong>Time:</strong>
                        ${event.time}
                    </p>

                    <p>
                        <strong>Quantity:</strong>
                        ${ticket.quantity}
                    </p>

                    <p>
                        <strong>Total:</strong>
                        ₦${Number(ticket.totalPrice)
                            .toLocaleString()}
                    </p>

                </div>


                <button
                    id="checkInBtn"
                    class="check-in-btn"
                    data-ticket-id="${ticket.ticketId}"
                >
                    ✅ Check In Ticket
                </button>

            </div>
        `;

    } catch (error) {

        console.error(error);

        verifyResult.innerHTML = `
            <div class="verify-error">

                <h3>❌ Verification Failed</h3>

                <p>
                    Unable to connect to the server.
                </p>

            </div>
        `;

    }

});


// =========================
// CHECK IN TICKET
// =========================

verifyResult.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("check-in-btn")) {
        return;
    }


    const button = e.target;

    const ticketId =
        button.dataset.ticketId;


    button.disabled = true;

    button.innerText =
        "Checking in...";


    try {

        const response = await fetch(
            `https://eventgate-fxp8.onrender.com/api/tickets/check-in/${encodeURIComponent(ticketId)}`,
            {
                method: "PATCH",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        const data =
            await response.json();


        // Check-in failed

        if (!response.ok) {

            button.disabled = false;

            button.innerText =
                "✅ Check In Ticket";

            alert(
                data.message ||
                "Unable to check in ticket."
            );

            return;
        }


        // Check-in successful

        verifyResult.innerHTML = `

            <div class="verify-success">

                <h3>🎉 Ticket Checked In</h3>

                <p class="valid-message">
                    This ticket has been successfully
                    checked in.
                </p>


                <div class="verified-ticket">

                    <p>
                        <strong>Ticket ID:</strong>
                        ${data.ticket.ticketId}
                    </p>

                    <p>
                        <strong>Event:</strong>
                        ${data.ticket.event.title}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${data.ticket.event.location}
                    </p>

                    <p>
                        <strong>Quantity:</strong>
                        ${data.ticket.quantity}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        CHECKED IN
                    </p>

                </div>

            </div>

        `;

    } catch (error) {

        console.error(error);

        button.disabled = false;

        button.innerText =
            "✅ Check In Ticket";

        alert(
            "Unable to connect to the server."
        );

    }

});