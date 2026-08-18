const API = "https://eventgate-fxp8.onrender.com/api";

const form = document.getElementById("eventForm");
const message = document.getElementById("message");
const logoutBtn = document.getElementById("logoutBtn");

const token = localStorage.getItem("token");

let user = null;

try {
    user = JSON.parse(localStorage.getItem("user"));
} catch (err) {
    user = null;
}


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
// ADMIN ACCESS PROTECTION
// =========================
// Redirecting alone does not stop the script, so the throw
// prevents the rest of the page from running and firing
// unauthorised API requests.

if (!token) {
    window.location.replace("login.html");
    throw new Error("Not authenticated");
}

if (!user || user.role !== "admin") {
    window.location.replace("index.html");
    throw new Error("Not authorised");
}


// =========================
// LOGOUT
// =========================

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.replace("login.html");
    });
}


// =========================
// CREATE EVENT
// =========================

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const eventData = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        location: document.getElementById("location").value,
        date: document.getElementById("date").value,
        time: document.getElementById("time").value,
        price: Number(document.getElementById("price").value),
        availableTickets: Number(
            document.getElementById("availableTickets").value
        ),
        image: document.getElementById("image").value
    };

    try {
        const response = await fetch(`${API}/events`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify(eventData)
        });

        const data = await response.json();

        if (response.ok) {
            message.style.color = "green";
            message.innerText = "Event created successfully!";

            form.reset();

            loadAdminEvents();
            loadAdminStats();

        } else {
            message.style.color = "red";
            message.innerText = data.message || "Unable to create event.";
        }

    } catch (error) {
        console.error(error);

        message.style.color = "red";
        message.innerText = "Something went wrong.";
    }
});


// =========================
// MANAGE EVENTS
// =========================

const adminEvents = document.getElementById("adminEvents");

async function loadAdminEvents() {
    try {
        const response = await fetch(`${API}/events`);

        const events = await response.json();

        if (!response.ok || !Array.isArray(events)) {
            adminEvents.innerHTML = "<p>Unable to load events.</p>";
            return;
        }

        adminEvents.innerHTML = "";

        if (events.length === 0) {
            adminEvents.innerHTML = "<p>No events found.</p>";
            return;
        }

        events.forEach(event => {
            const eventCard = document.createElement("div");

            eventCard.classList.add("admin-event-card");

            eventCard.innerHTML = `
                <img
                    src="${event.image || "https://picsum.photos/500/300"}"
                    alt="${event.title}"
                    class="admin-event-image"
                >

                <div class="admin-event-content">

                    <h3>${event.title}</h3>

                    <p>
                        <i class="fa-solid fa-location-dot"></i>
                        ${event.location}
                    </p>

                    <p>
                        <i class="fa-regular fa-calendar"></i>
                        ${new Date(event.date).toLocaleDateString()}
                    </p>

                    <p>
                        <i class="fa-regular fa-clock"></i>
                        ${event.time}
                    </p>

                    <p>
                        <i class="fa-solid fa-tag"></i>
                        ₦${Number(event.price).toLocaleString()}
                    </p>

                    <p>
                        <i class="fa-solid fa-ticket"></i>
                        ${event.availableTickets} tickets available
                    </p>

                    <div class="event-actions">

                        <button class="edit-btn" data-id="${event._id}">
                            Edit
                        </button>

                        <button class="delete-btn" data-id="${event._id}">
                            Delete
                        </button>

                    </div>

                </div>
            `;

            adminEvents.appendChild(eventCard);
        });

    } catch (error) {
        console.error(error);

        adminEvents.innerHTML = "<p>Unable to load events.</p>";
    }
}

loadAdminEvents();

// =========================
// DELETE AND EDIT HANDLERS
// =========================

adminEvents.addEventListener("click", async (e) => {

    // ----- DELETE -----
    if (e.target.classList.contains("delete-btn")) {

        const eventId = e.target.dataset.id;

        const confirmDelete = confirm(
            "Are you sure you want to delete this event?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await fetch(`${API}/events/${eventId}`, {
                method: "DELETE",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                alert("Event deleted successfully!");

                loadAdminEvents();
                loadAdminStats();

            } else {
                alert(data.message || "Unable to delete event.");
            }

        } catch (error) {
            console.error(error);

            alert("Something went wrong.");
        }

        return;
    }


    // ----- EDIT -----
    if (e.target.classList.contains("edit-btn")) {

        const eventId = e.target.dataset.id;

        try {
            const response = await fetch(`${API}/events`);

            const events = await response.json();

            if (!Array.isArray(events)) {
                alert("Unable to load event.");
                return;
            }

            const event = events.find(item => item._id === eventId);

            if (!event) {
                alert("Event not found.");
                return;
            }

            document.getElementById("editSection").style.display = "block";

            document.getElementById("editId").value = event._id;
            document.getElementById("editTitle").value = event.title;
            document.getElementById("editDescription").value = event.description;
            document.getElementById("editLocation").value = event.location;

            // Convert to a local date string so the date does not
            // shift by a day in timezones ahead of UTC.
            const d = new Date(event.date);

            document.getElementById("editDate").value =
                new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                    .toISOString()
                    .split("T")[0];

            document.getElementById("editTime").value = event.time;
            document.getElementById("editPrice").value = event.price;
            document.getElementById("editAvailableTickets").value =
                event.availableTickets;
            document.getElementById("editImage").value = event.image || "";

            document.getElementById("editSection").scrollIntoView({
                behavior: "smooth"
            });

        } catch (error) {
            console.error(error);

            alert("Unable to load event.");
        }
    }
});


// =========================
// UPDATE EVENT
// =========================

const editEventForm = document.getElementById("editEventForm");
const cancelEdit = document.getElementById("cancelEdit");

editEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const eventId = document.getElementById("editId").value;
    const editMessage = document.getElementById("editMessage");

    const updatedEvent = {
        title: document.getElementById("editTitle").value,
        description: document.getElementById("editDescription").value,
        location: document.getElementById("editLocation").value,
        date: document.getElementById("editDate").value,
        time: document.getElementById("editTime").value,
        price: Number(document.getElementById("editPrice").value),
        availableTickets: Number(
            document.getElementById("editAvailableTickets").value
        ),
        image: document.getElementById("editImage").value
    };

    try {
        const response = await fetch(`${API}/events/${eventId}`, {
            method: "PUT",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify(updatedEvent)
        });

        const data = await response.json();

        if (response.ok) {
            editMessage.style.color = "green";
            editMessage.innerText = "Event updated successfully!";

            loadAdminEvents();
            loadAdminStats();

            setTimeout(() => {
                document.getElementById("editSection").style.display = "none";
                editMessage.innerText = "";
            }, 1000);

        } else {
            editMessage.style.color = "red";
            editMessage.innerText = data.message || "Unable to update event.";
        }

    } catch (error) {
        console.error(error);

        editMessage.style.color = "red";
        editMessage.innerText = "Something went wrong.";
    }
});


cancelEdit.addEventListener("click", () => {

    document.getElementById("editSection").style.display = "none";

    editEventForm.reset();

    document.getElementById("editMessage").innerText = "";
});


// =========================
// LOAD ADMIN STATISTICS
// =========================

async function loadAdminStats() {

    try {
        const response = await fetch(`${API}/events/admin-stats`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(data.message);
            return;
        }

        document.getElementById("totalEvents").innerText =
            data.totalEvents;

        document.getElementById("totalTicketsSold").innerText =
            data.totalTicketsSold;

        document.getElementById("totalUsers").innerText =
            data.totalUsers;

        document.getElementById("totalRevenue").innerText =
            `₦${Number(data.totalRevenue).toLocaleString()}`;

    } catch (error) {
        console.error("Unable to load admin statistics:", error);
    }
}

loadAdminStats();


// =========================
// LOAD RECENT BOOKINGS
// =========================

async function loadRecentBookings() {

    const container = document.getElementById("recentBookingsList");

    try {
        const response = await fetch(`${API}/events/recent-bookings`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const bookings = await response.json();

        if (!response.ok || !Array.isArray(bookings)) {
            container.innerHTML = `
                <p class="booking-error">
                    Unable to load recent bookings.
                </p>
            `;
            return;
        }

        if (bookings.length === 0) {
            container.innerHTML = `
                <p class="no-bookings">
                    No bookings yet.
                </p>
            `;
            return;
        }

        container.innerHTML = "";

        bookings.forEach(ticket => {

            const booking = document.createElement("div");

            booking.classList.add("booking-row");

            booking.innerHTML = `

                <div class="booking-user">

                    <strong>
                        ${ticket.user?.name || "Unknown User"}
                    </strong>

                    <span>
                        ${ticket.user?.email || ""}
                    </span>

                </div>


                <div class="booking-event">

                    <strong>
                        ${ticket.event?.title || "Event unavailable"}
                    </strong>

                    <span>
                        ${ticket.quantity} ticket(s)
                    </span>

                </div>


                <div class="booking-amount">

                    <strong>
                        ₦${Number(ticket.totalPrice).toLocaleString()}
                    </strong>

                    <span>
                        ${new Date(ticket.createdAt).toLocaleDateString()}
                    </span>

                </div>

            `;

            container.appendChild(booking);
        });

    } catch (error) {
        console.error(error);

        container.innerHTML = `
            <p class="booking-error">
                Unable to connect to the server.
            </p>
        `;
    }
}

loadRecentBookings();