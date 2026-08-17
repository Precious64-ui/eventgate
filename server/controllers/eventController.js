const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const User = require("../models/User");

// Create an event
const createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            location,
            date,
            time,
            price,
            availableTickets,
            image
        } = req.body;

        const event = await Event.create({
            title,
            description,
            location,
            date,
            time,
            price,
            availableTickets,
            image
        });

        res.status(201).json({
            message: "Event created successfully",
            event
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Get all events
const getEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });

        res.status(200).json(events);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Get admin dashboard statistics
const getAdminStats = async (req, res) => {
    try {
        const totalEvents = await Event.countDocuments();

        const totalUsers = await User.countDocuments();

        const tickets = await Ticket.find();

        const totalTicketsSold = tickets.reduce(
            (total, ticket) => total + (Number(ticket.quantity) || 0),
            0
        );

        const totalRevenue = tickets.reduce(
            (total, ticket) => total + (Number(ticket.totalPrice) || 0),
            0
        );

        res.status(200).json({
            totalEvents,
            totalUsers,
            totalTicketsSold,
            totalRevenue
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message
        });
    }
};

// Update an event
const updateEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.status(200).json({
            message: "Event updated successfully",
            event
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Delete an event
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.status(200).json({
            message: "Event deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Get recent bookings for admin dashboard
const getRecentBookings = async (req, res) => {
    try {
        const bookings = await Ticket.find()
            .populate("user", "name email")
            .populate("event", "title")
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json(bookings);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    createEvent,
    getEvents,
    getAdminStats,
    getRecentBookings,
    updateEvent,
    deleteEvent
};