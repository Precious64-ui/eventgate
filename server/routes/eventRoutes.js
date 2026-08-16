const express = require("express");
const router = express.Router();

const {
    createEvent,
    getEvents,
    getAdminStats,
    getRecentBookings,
    updateEvent,
    deleteEvent
} = require("../controllers/eventController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");


// Create an event - Admin only
router.post(
    "/",
    protect,
    adminOnly,
    createEvent
);


// Get all events
router.get(
    "/",
    getEvents
);


// Admin statistics - Admin only
router.get(
    "/admin-stats",
    protect,
    adminOnly,
    getAdminStats
);


// Recent bookings - Admin only
router.get(
    "/recent-bookings",
    protect,
    adminOnly,
    getRecentBookings
);


// Update an event - Admin only
router.put(
    "/:id",
    protect,
    adminOnly,
    updateEvent
);


// Delete an event - Admin only
router.delete(
    "/:id",
    protect,
    adminOnly,
    deleteEvent
);


module.exports = router;