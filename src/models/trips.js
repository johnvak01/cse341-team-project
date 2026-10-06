import Trip from "../models/schemas/trips.js";

export async function getAllTrips() {
    return Trip.find({}).lean();
}

export async function getTripById(id) {
    return Trip.findOne({ id }).lean();
}

export async function getTripsByTrainId(trainId) {
    return Trip.find({ trainId }).lean();
}

export async function getTripFilters() {
    const [regions, seasons] = await Promise.all([
        Trip.distinct("region"),
        Trip.distinct("bestSeason"),
    ]);

    return { regions, seasons };
}

export async function updateTrip(id, updateData) {
    return Trip.updateOne({ id }, { $set: updateData }, { runValidators: true });
}

export async function deleteTrip (id) {
    return Trip.deleteOne({id:id})
}
