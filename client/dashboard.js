const eventContainer = document.getElementById("eventContainer");
const logoutBtn = document.getElementById("logoutBtn");
const adminLink = document.getElementById("adminLink");

const searchInput = document.getElementById("searchInput");
const locationFilter = document.getElementById("locationFilter");

const token = localStorage.getItem("token");

let user = null;

try {
    user = JSON.parse(localStorage.getItem("user"));
} catch (err) {
    user = null;
}

let allEvents = [];

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
    window.location.replace("login.html");
    throw new Error("Not authenticated");
}


// =========================
// ADMIN LINK
// =========================
// Hidden for non-admins. This is presentation only — the real
// protection is the admin guard on admin.html and the backend
// middleware, which reject unauthorised requests regardless.

if (adminLink) {

    if (user && user.role === "admin") {
        adminLink.style.display = "inline-block";
    } else {
        adminLink.style.display = "none";
    }
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
// LOAD EVENTS
// =========================

async function loadEvents() {

    try {

        const response = await fetch(
            "https://eventgate-fxp8.onrender.com/api/events"
        );

        if (!response.ok) {
            throw new Error("Failed to load events");
        }

        allEvents = await response.json();

        populateLocations();

        displayEvents(allEvents);

    } catch (error) {

        console.error(error);

        eventContainer.innerHTML = `
            <p>Unable to load events.</p>
        `;
    }
}


// =========================
// DISPLAY EVENTS
// =========================

function displayEvents(events) {

    eventContainer.innerHTML = "";

    if (events.length === 0) {

        eventContainer.innerHTML = `
            <p>No events match your search.</p>
        `;

        return;
    }


    events.forEach(event => {

        const card = document.createElement("div");

        card.classList.add("card");

        card.innerHTML = `

            <img
                src="${event.image || "https://picsum.photos/500/300"}"
                alt="${event.title}"
            >

            <div class="content">

    <h3>${event.title}</h3>

    <p>
        <i class="fas fa-map-marker-alt"></i>
        ${event.location}
    </p>

    <p>
        <i class="fas fa-calendar-alt"></i>
        ${new Date(event.date).toLocaleDateString()}
    </p>

    <p>
        <i class="fas fa-clock"></i>
        ${event.time}
    </p>

    <p>
        <i class="fas fa-money-bill-wave"></i>
        ₦${Number(event.price).toLocaleString()}
    </p>

    <p>
        <i class="fas fa-ticket-alt"></i>
        ${event.availableTickets} tickets available
    </p>

    <button
        class="book-btn"
        data-id="${event._id}"
    >
        <i class="fas fa-ticket-alt"></i>
        Book Ticket
    </button>

</div>
        `;

        eventContainer.appendChild(card);

    });
}


// =========================
// POPULATE LOCATIONS
// =========================

function populateLocations() {

    const locations = [
        ...new Set(
            allEvents
                .map(event => event.location)
                .filter(location => location)
        )
    ];

    locationFilter.innerHTML = `
        <option value="all">
            All Locations
        </option>
    `;


    locations.forEach(location => {

        const option = document.createElement("option");

        option.value = location;
        option.textContent = location;

        locationFilter.appendChild(option);

    });
}


// =========================
// FILTER EVENTS
// =========================

function filterEvents() {

    const searchText =
        searchInput.value.toLowerCase().trim();

    const selectedLocation =
        locationFilter.value;


    const filteredEvents = allEvents.filter(event => {

        const title =
            (event.title || "").toLowerCase();

        const description =
            (event.description || "").toLowerCase();

        const location =
            (event.location || "").toLowerCase();


        const matchesSearch =
            title.includes(searchText) ||
            description.includes(searchText) ||
            location.includes(searchText);


        const matchesLocation =
            selectedLocation === "all" ||
            event.location === selectedLocation;


        return matchesSearch && matchesLocation;

    });


    displayEvents(filteredEvents);
}


// Search
searchInput.addEventListener(
    "input",
    filterEvents
);


// Location filter
locationFilter.addEventListener(
    "change",
    filterEvents
);


// =========================
// BOOKING MODAL
// =========================

const bookingModal =
    document.getElementById("bookingModal");

const closeModal =
    document.getElementById("closeModal");

const cancelBooking =
    document.getElementById("cancelBooking");

const bookingEventTitle =
    document.getElementById("bookingEventTitle");

const bookingPrice =
    document.getElementById("bookingPrice");

const bookingTotal =
    document.getElementById("bookingTotal");

const ticketQuantity =
    document.getElementById("ticketQuantity");

const decreaseQty =
    document.getElementById("decreaseQty");

const increaseQty =
    document.getElementById("increaseQty");

const confirmBooking =
    document.getElementById("confirmBooking");

const bookingMessage =
    document.getElementById("bookingMessage");


let selectedEventId = null;
let selectedEventPrice = 0;
let selectedEventTickets = 0;
let quantity = 1;


// =========================
// OPEN BOOKING MODAL
// =========================

eventContainer.addEventListener("click", (e) => {

    if (!e.target.classList.contains("book-btn")) {
        return;
    }


    const eventId =
        e.target.dataset.id;


    const event =
        allEvents.find(
            item => item._id === eventId
        );


    if (!event) {

        alert("Event not found.");

        return;
    }


    selectedEventId =
        event._id;

    selectedEventPrice =
        Number(event.price);

    selectedEventTickets =
        Number(event.availableTickets);


    if (selectedEventTickets <= 0) {

        alert("Sorry, this event is sold out.");

        return;
    }


    quantity = 1;


    bookingEventTitle.innerText =
        event.title;


    bookingPrice.innerText =
        `₦${selectedEventPrice.toLocaleString()}`;


    ticketQuantity.innerText =
        quantity;


    updateTotal();


    bookingMessage.innerText = "";


    bookingModal.style.display =
        "flex";

});


// =========================
// UPDATE TOTAL
// =========================

function updateTotal() {

    const total =
        selectedEventPrice * quantity;


    bookingTotal.innerText =
        `₦${total.toLocaleString()}`;
}


// =========================
// INCREASE QUANTITY
// =========================

increaseQty.addEventListener("click", () => {

    if (quantity < selectedEventTickets) {

        quantity++;

        ticketQuantity.innerText =
            quantity;

        updateTotal();

    }

});


// =========================
// DECREASE QUANTITY
// =========================

decreaseQty.addEventListener("click", () => {

    if (quantity > 1) {

        quantity--;

        ticketQuantity.innerText =
            quantity;

        updateTotal();

    }

});


// =========================
// CLOSE MODAL
// =========================

function closeBookingModal() {

    bookingModal.style.display =
        "none";

    bookingMessage.innerText =
        "";

    quantity = 1;

    selectedEventId = null;

    selectedEventPrice = 0;

    selectedEventTickets = 0;
}


closeModal.addEventListener(
    "click",
    closeBookingModal
);


cancelBooking.addEventListener(
    "click",
    closeBookingModal
);


// =========================
// CLOSE WHEN CLICKING OUTSIDE
// =========================

bookingModal.addEventListener("click", (e) => {

    if (e.target === bookingModal) {

        closeBookingModal();

    }

});


// =========================
// CONFIRM BOOKING
// =========================

confirmBooking.addEventListener(
    "click",
    async () => {

        if (!selectedEventId) {
            return;
        }


        confirmBooking.disabled =
            true;


        bookingMessage.style.color =
            "#2563eb";

        bookingMessage.innerText =
            "Booking...";


        try {

            const response =
                await fetch(
                    "https://eventgate-fxp8.onrender.com/api/tickets/book",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            eventId:
                                selectedEventId,

                            quantity:
                                quantity
                        })
                    }
                );


            const data =
                await response.json();


            if (response.ok) {

                bookingMessage.style.color =
                    "green";

                bookingMessage.innerText =
                    "🎉 Ticket booked successfully!";


                setTimeout(() => {

                    closeBookingModal();

                    loadEvents();

                }, 1200);

            } else {

                bookingMessage.style.color =
                    "red";

                bookingMessage.innerText =
                    data.message ||
                    "Unable to book ticket.";

            }

        } catch (error) {

            console.error(error);

            bookingMessage.style.color =
                "red";

            bookingMessage.innerText =
                "Something went wrong.";

        } finally {

            confirmBooking.disabled =
                false;

        }

    }
);


// =========================
// START APP
// =========================

loadEvents();