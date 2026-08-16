
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

        const { eventId, quantity } = req.body;


        // Validate quantity

        if (!quantity || quantity < 1) {

            return res.status(400).json({
                message: "Quantity must be at least 1"
            });

        }


        // Find event

        const event = await Event.findById(eventId);


        if (!event) {

            return res.status(404).json({
                message: "Event not found"
            });

        }


        // Check available tickets

        if (event.availableTickets < quantity) {

            return res.status(400).json({
                message: "Not enough tickets available"
            });

        }


        // Calculate total price

        const totalPrice = event.price * quantity;


        // Generate ticket ID

        const ticketId = generateTicketId();


        // Create ticket

        const ticket = await Ticket.create({

            ticketId,

            user: req.user.id,

            event: eventId,

            quantity,

            totalPrice

        });


        // Reduce available tickets

        event.availableTickets -= quantity;

        await event.save();


        // Send response

        res.status(201).json({

            message: "Ticket booked successfully",

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
// GET MY TICKETS
// =========================

const getMyTickets = async (req, res) => {

    try {

        const tickets = await Ticket.find({
            user: req.user.id
        })
        .populate("event")
        .sort({
            createdAt: -1
        });


        res.status(200).json(tickets);


    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: error.message

        });

    }
};


// =========================
// VERIFY TICKET
// =========================

const verifyTicket = async (req, res) => {

    try {

        const ticketId =
            req.params.ticketId;


        const ticket = await Ticket.findOne({
            ticketId
        })
        .populate("event")
        .populate("user", "name email");


        // Ticket doesn't exist

        if (!ticket) {

            return res.status(404).json({

                message:
                    "Invalid ticket. Ticket not found."

            });

        }


        // Ticket already checked in

        if (ticket.checkedIn) {

            return res.status(400).json({

                message:
                    "This ticket has already been checked in.",

                ticket

            });

        }


        // Ticket is valid

        res.status(200).json({

            message:
                "Ticket is valid",

            ticket

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                error.message

        });

    }
};


// =========================
// CHECK IN TICKET
// =========================

const checkInTicket = async (req, res) => {

    try {

        const ticketId =
            req.params.ticketId;


        const ticket = await Ticket.findOne({
            ticketId
        })
        .populate("event")
        .populate("user", "name email");


        // Ticket doesn't exist

        if (!ticket) {

            return res.status(404).json({

                message:
                    "Invalid ticket. Ticket not found."

            });

        }


        // Already checked in

        if (ticket.checkedIn) {

            return res.status(400).json({

                message:
                    "This ticket has already been checked in.",

                ticket

            });

        }


        // Mark ticket as checked in

        ticket.checkedIn = true;

        ticket.checkedInAt = new Date();


        await ticket.save();


        res.status(200).json({

            message:
                "Ticket checked in successfully.",

            ticket

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                error.message

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