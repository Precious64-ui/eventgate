const dotenv = require("dotenv");

dotenv.config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

const ticketRoutes = require("./routes/ticketRoutes");
const eventRoutes = require("./routes/eventRoutes");
const userRoutes = require("./routes/userRoutes");

connectDB();

const app = express();

app.use(cors({
    origin: [
        "https://eventgate-frontend.onrender.com",
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ]
}));

app.use(express.json());

app.use(express.static(path.join(__dirname, "../client")));

app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tickets", ticketRoutes);

app.get("/", (req, res) => {
    res.send("Welcome to the EventGate API!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});