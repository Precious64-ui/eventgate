const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
    {
        ticketId: {
            type: String,
            unique: true,
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        totalPrice: {
            type: Number,
            required: true
        },

        checkedIn: {
            type: Boolean,
            default: false
        },

        checkedInAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Ticket", ticketSchema);