const express = require("express");
const router = express.Router();

const {
    bookTicket,
    getMyTickets,
    verifyTicket,
    checkInTicket
} = require("../controllers/ticketController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");


// Book a ticket
router.post(
    "/book",
    protect,
    bookTicket
);


// Get my tickets
router.get(
    "/my-tickets",
    protect,
    getMyTickets
);


// Verify ticket - Admin only
router.get(
    "/verify/:ticketId",
    protect,
    adminOnly,
    verifyTicket
);

// Check in ticket - Admin only
router.patch(
    "/check-in/:ticketId",
    protect,
    adminOnly,
    checkInTicket
);


module.exports = router;