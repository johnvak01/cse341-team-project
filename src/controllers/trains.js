import {
    getAllTrains as findAllTrains,
    getTrainById as findTrainById,
} from "../models/trains.js";

export const trainsPage = (req, res) => {
    res.render("trains", { title: "Trains" });
};

export async function getAllTrains(req, res) {
    try {
        const trains = await findAllTrains();

        return res.status(200).json(trains);
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

