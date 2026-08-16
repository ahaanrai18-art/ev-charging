const express = require("express");
const cors = require("cors");
const path = require("path");
const stations = require("./stations");
const bookings = require("./bookings");

const app = express();

const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "private")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "private", "index.html"));
});

app.get("/api/stations", (req, res) => {
    res.json(stations);
});

app.get("/api/stations/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const station = stations.find(station => station.id === id);

    if (!station) {
        return res.status(404).json({
            message: "Charging station not found"
        });
    }

    res.json(station);
});

let nextBookingId = bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1;

// GET all bookings
app.get("/api/bookings", (req, res) => {
    res.json(bookings);
});

// POST new booking
app.post("/api/bookings", (req, res) => {
    const {
        userName,
        phone,
        email,
        stationId,
        vehicleNumber,
        vehicleModel,
        bookingDate,
        bookingTime,
        chargingType
    } = req.body;

    if (
        !userName ||
        !phone ||
        !email ||
        !stationId ||
        !vehicleNumber ||
        !vehicleModel ||
        !bookingDate ||
        !bookingTime ||
        !chargingType
    ) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const station = stations.find(
        station => station.id === parseInt(stationId)
    );

    if (!station) {
        return res.status(404).json({
            message: "Charging station not found"
        });
    }

    if (station.availability !== "Available") {
        return res.status(400).json({
            message: "Charging station is currently unavailable"
        });
    }

    const newBooking = {
        id: nextBookingId++,
        userName,
        phone,
        email,
        stationId: parseInt(stationId),
        stationName: station.name,
        stationLocation: station.location,
        vehicleNumber,
        vehicleModel,
        bookingDate,
        bookingTime,
        chargingType,
        status: "Confirmed",
        createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);

    res.status(201).json({
        message: "Booking created successfully",
        booking: newBooking
    });
});

// GET booking by id
app.get("/api/bookings/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const booking = bookings.find(
        booking => booking.id === id
    );

    if (!booking) {
        return res.status(404).json({
            message: "Booking not found"
        });
    }

    res.json(booking);
});

// PUT update booking
app.put("/api/bookings/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const booking = bookings.find(
        booking => booking.id === id
    );

    if (!booking) {
        return res.status(404).json({
            message: "Booking not found"
        });
    }

    const {
        userName,
        phone,
        email,
        vehicleNumber,
        vehicleModel,
        bookingDate,
        bookingTime,
        chargingType
    } = req.body;

    if (
        !userName ||
        !phone ||
        !email ||
        !vehicleNumber ||
        !vehicleModel ||
        !bookingDate ||
        !bookingTime ||
        !chargingType
    ) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    booking.userName = userName;
    booking.phone = phone;
    booking.email = email;
    booking.vehicleNumber = vehicleNumber;
    booking.vehicleModel = vehicleModel;
    booking.bookingDate = bookingDate;
    booking.bookingTime = bookingTime;
    booking.chargingType = chargingType;

    res.json({
        message: "Booking updated successfully",
        booking: booking
    });
});

// DELETE cancel booking
app.delete("/api/bookings/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({
            message: "Invalid booking ID"
        });
    }
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) {
        return res.status(404).json({
            message: "Booking not found"
        });
    }
    const cancelled = bookings.splice(index, 1)[0];
    res.json({
        message: "Booking cancelled successfully",
        booking: cancelled
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});