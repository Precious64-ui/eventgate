const ticketContainer = document.getElementById("ticketContainer");
const logoutBtn = document.getElementById("logoutBtn");

const token = localStorage.getItem("token");

// =========================
// MOBILE MENU
// =========================

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {

    menuToggle.addEventListener("click", () => {

        menuToggle.classList.toggle("active");
        navLinks.classList.toggle("active");

    });

    navLinks.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

            menuToggle.classList.remove("active");
            navLinks.classList.remove("active");

        });

    });

}


// =========================
// LOGIN CHECK
// =========================

if (!token) {
    window.location.href = "login.html";
}


// =========================
// LOGOUT
// =========================

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "login.html";

    });

}


// =========================
// LOAD MY TICKETS
// =========================

async function loadTickets() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/tickets/my-tickets",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        if (!response.ok) {

            throw new Error(
                "Unable to load tickets"
            );

        }


        const tickets = await response.json();


        ticketContainer.innerHTML = "";


        // =========================
        // NO TICKETS
        // =========================

        if (tickets.length === 0) {

            ticketContainer.innerHTML = `
                <div class="no-tickets">

                    <h3>
                        <i class="fa-solid fa-ticket"></i>
                        No Tickets Yet
                    </h3>

                    <p>
                        You haven't booked any tickets yet.
                    </p>

                    <a href="index.html">
                        Browse Events
                    </a>

                </div>
            `;

            return;
        }


        // =========================
        // DISPLAY TICKETS
        // =========================

        tickets.forEach(ticket => {

            const card =
                document.createElement("div");

            card.classList.add("ticket-card");


            const event =
                ticket.event;


            card.innerHTML = `

                <!-- TICKET HEADER -->

                <div class="ticket-top">

                    <h3>
                        <i class="fa-solid fa-ticket"></i>
                        ${event.title}
                    </h3>

                    <p>
                        <i class="fa-solid fa-hashtag"></i>
                        <strong>Ticket ID:</strong>
                        ${ticket.ticketId || "Not available"}
                    </p>

                </div>


                <!-- TICKET BODY -->

                <div class="ticket-body">


                    <!-- EVENT INFORMATION -->

                    <div class="ticket-info">

                        <p>
                            <i class="fa-solid fa-location-dot"></i>
                            ${event.location}
                        </p>

                        <p>
                            <i class="fa-regular fa-calendar"></i>
                            ${new Date(event.date)
                                .toLocaleDateString()}
                        </p>

                        <p>
                            <i class="fa-regular fa-clock"></i>
                            ${event.time}
                        </p>

                        <p>
                            <i class="fa-solid fa-ticket"></i>
                            Quantity:
                            ${ticket.quantity}
                        </p>

                    </div>


                    <div class="ticket-divider"></div>


                    <!-- QR CODE / BOOKING INFORMATION -->

                    <div class="ticket-info">

                        <p>
                            <i class="fa-solid fa-qrcode"></i>
                            <strong>Ticket QR Code</strong>
                        </p>


                        ${ticket.ticketId ? `

                            <div class="ticket-qr">

                                <img
                                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(ticket.ticketId)}"
                                    alt="Ticket QR Code"
                                >

                                <small>
                                    Scan to verify ticket
                                </small>

                            </div>

                        ` : `

                            <div class="ticket-qr unavailable">

                                <p>
                                    QR code unavailable
                                </p>

                            </div>

                        `}


                        <p>
                            <i class="fa-regular fa-calendar-check"></i>
                            Booked on:
                            ${new Date(ticket.createdAt)
                                .toLocaleDateString()}
                        </p>

                    </div>


                    <div class="ticket-divider"></div>


                    <!-- TOTAL / STATUS -->

                    <div class="ticket-bottom">

                        <div class="ticket-total">

                            <i class="fa-solid fa-naira-sign"></i>
                            ${Number(ticket.totalPrice)
                                .toLocaleString()}

                        </div>


                        <div class="ticket-status">

                            <i class="fa-solid fa-circle-check"></i>
                            CONFIRMED

                        </div>

                    </div>


                    <!-- DOWNLOAD -->

                    <button
                        class="download-ticket-btn"
                        data-ticket-id="${ticket.ticketId}"
                    >

                        <i class="fa-solid fa-download"></i>
                        Download Ticket

                    </button>


                </div>
            `;


            ticketContainer.appendChild(card);

        });


    } catch (error) {

        console.error(error);

        ticketContainer.innerHTML = `

            <div class="no-tickets">

                <h3>
                    Unable to load tickets
                </h3>

                <p>
                    Please try again later.
                </p>

            </div>

        `;

    }

}


// =========================
// START
// =========================

loadTickets();


// =========================
// DOWNLOAD TICKET
// =========================

ticketContainer.addEventListener("click", (e) => {

    const button =
        e.target.closest(".download-ticket-btn");

    if (!button) {
        return;
    }


    const ticketId =
        button.dataset.ticketId;


    const ticket =
        button.closest(".ticket-card");


    if (!ticket) {
        return;
    }


    const ticketText = `
EVENTGATE TICKET
==============================

Ticket ID: ${ticketId}

${ticket.innerText}

==============================
Please present this ticket when
entering the event.
    `;


    const blob =
        new Blob(
            [ticketText],
            { type: "text/plain" }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        `EventGate-Ticket-${ticketId}.txt`;


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

});