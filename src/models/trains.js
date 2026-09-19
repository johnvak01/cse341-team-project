import Train from "./schemas/trains.js";

export async function getAllTrains() {
    return Train.find({}).sort({ id: 1 }).lean();
}

export async function getTrainById(id) {
    return Train.findOne({ id }).lean();
}
