import {
    getAllTrains as findAllTrains,
    getTrainById as findTrainById,
} from "../models/trains.js";
import { getTripsByTrainId as findTripsByTrainId } from "../models/trips.js";

export const trainsPage = (req, res) => {
    res.render("trains", { title: "Trains" });
};

export const trainDetailsPage = (req, res) => {
    const { id } = req.params;

    res.render("train-details", { title: "Train Details", trainId: id });
};

export async function getAllTrains(req, res) {
    try {
        const trains = await findAllTrains();

        return res.status(200).json({ trains });
    } catch (error) {
        console.error("Error fetching trains:", error);

        return res.status(500).json({
            error: "Failed to fetch trains",
        });
    }
}

export async function getTrainById(req, res) {
    try {
        const { id } = req.params;

        const train = await findTrainById(id);

        if (!train) {
            return res.status(404).json({
                error: "Train not found",
            });
        }

        return res.status(200).json(train);
    } catch (error) {
        console.error("Error fetching train:", error);

        return res.status(500).json({
            error: "Failed to fetch train",
        });
    }
}

export async function getTripsByTrain(req, res) {
    try {
        const { id } = req.params;

        const train = await findTrainById(id);

        if (!train) {
            return res.status(404).json({
                error: "Train not found",
            });
        }

        const trips = await findTripsByTrainId(id);

        return res.status(200).json({ trips });
    } catch (error) {
        console.error("Error fetching trips for train:", error);

        return res.status(500).json({
            error: "Failed to fetch trips for train",
        });
    }
}
