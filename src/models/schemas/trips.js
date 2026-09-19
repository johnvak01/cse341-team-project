import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    operatingMonths: {
      type: [Number],
      required: true,
      default: [],
    },
    region: {
      type: String,
      required: false,
      trim: true,
    },
    duration: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Trip = mongoose.model("Trip", tripSchema, "trips");

export default Trip;
