//src/models/schemas/trains.js.
import mongoose from "mongoose";
mongoose.set("debug", true);


const bookingSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  passenger: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    }
  },
  trainId: {
    type: String,
    required: true,
    trim: true
  },
  bookingDate: {
    type: String,
    required: true,
    trim: true
  }
}, 
// { collection: "bookings" },
  { timestamps: true, }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;