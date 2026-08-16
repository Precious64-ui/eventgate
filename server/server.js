// =========================
// LOAD ENVIRONMENT VARIABLES FIRST
// =========================

const dotenv = require("dotenv");

dotenv.config();


// =========================
// DNS CONFIGURATION
// =========================

const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "8.8.4.4"
]);


// =========================
// IMPORT DEPENDENCIES
// =========================

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

const ticketRoutes = require("./routes/ticketRoutes");
const eventRoutes = require("./routes/eventRoutes");
const userRoutes = require("./routes/userRoutes");


// =========================
// CONNECT DATABASE
// =========================

connectDB();


// =========================
// CREATE APP
// =========================

const app = express();


// =========================
// MIDDLEWARE
// =========================

app.use(cors());

app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "../client")));


// =========================
// ROUTES
// =========================

app.use("/api/users", userRoutes);

app.use("/api/events", eventRoutes);

app.use("/api/tickets", ticketRoutes);


// =========================
// TEST ROUTE
// =========================

app.get("/", (req, res) => {

    res.send("Welcome to the EventGate API!");

});


// =========================
// START SERVER
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `Server is running on http://localhost:${PORT}`
    );

});