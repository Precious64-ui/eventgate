const Ticket = require("../models/Ticket");
const Event = require("../models/event");


// =========================
// GENERATE UNIQUE TICKET ID
// =========================

const generateTicketId = () => {
    const random = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    return `EVT-${random}`;
};


// =========================
// BOOK A TICKET
// =========================

const bookTicket = async (req, res) => {
    try {
        const { eventId } = req.body;

        const quantity = Number(req.body.quantity);

        // Validate quantity
        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                message: "Quantity must be a whole number of at least 1"
            });
        }

        // Find event
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        // Atomically reserve the tickets.
        // This only succeeds if enough tickets are still available,
        // which prevents two simultaneous bookings from overselling.
        const reserved = await Event.findOneAndUpdate(
            {
                _id: eventId,
                availableTickets: { $gte: quantity }
            },
            {
                $inc: { availableTickets: -quantity }
            },
            {
                new: true
            }
        );

        if (!reserved) {
            return res.status(400).json({
                message: "Not enough tickets available"
            });
        }

        const totalPrice = reserved.price * quantity;

        try {
            const ticket = await Ticket.create({
                ticketId: generateTicketId(),
                user: req.user.id,
                event: eventId,
                quantity,
                totalPrice
            });

            res.status(201).json({
                message: "Ticket booked successfully",
                ticket
            });

        } catch (createError) {

            // Creating the ticket failed after the seats were reserved,
            // so give them back rather than losing them.
            await Event.findByIdAndUpdate(eventId, {
                $inc: { availableTickets: quantity }
            });

            throw createError;
        }

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message
        });
    }
};


// =========================
// GET MY TICKETS
// =========================

const getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({
            user: req.user.id
        })
            .populate("event")
            .sort({ createdAt: -1 });

        res.status(200).json(tickets);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message
        });
    }
};


// =========================
// FIND A TICKET BY ITS PUBLIC ID
// =========================

const findTicket = (ticketId) => {
    return Ticket.findOne({ ticketId })
        .populate("event")
        .populate("user", "name email");
};


// =========================
// VERIFY TICKET
// =========================

const verifyTicket = async (req, res) => {
    try {
        const ticket = await findTicket(req.params.ticketId);

        if (!ticket) {
            return res.status(404).json({
                message: "Invalid ticket. Ticket not found."
            });
        }

        if (ticket.checkedIn) {
            return res.status(400).json({
                message: "This ticket has already been checked in.",
                ticket
            });
        }

        res.status(200).json({
            message: "Ticket is valid",
            ticket
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message
        });
    }
};


// =========================
// CHECK IN TICKET
// =========================

const checkInTicket = async (req, res) => {
    try {
        const ticket = await findTicket(req.params.ticketId);

        if (!ticket) {
            return res.status(404).json({
                message: "Invalid ticket. Ticket not found."
            });
        }

        if (ticket.checkedIn) {
            return res.status(400).json({
                message: "This ticket has already been checked in.",
                ticket
            });
        }

        ticket.checkedIn = true;
        ticket.checkedInAt = new Date();

        await ticket.save();

        res.status(200).json({
            message: "Ticket checked in successfully.",
            ticket
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message
        });
    }
};


// =========================
// EXPORT
// =========================

module.exports = {
    bookTicket,
    getMyTickets,
    verifyTicket,
    checkInTicket
};