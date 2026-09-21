import Trip from "../models/schemas/trips.js";

export async function getAllTrips() {
    return Trip.find({}).lean();
}

export async function getTripById (id) {
    return Trip.findOne({id}).lean();
}

export async function getTripFilters() {
    const [regions, seasons] = await Promise.all([
        Trip.distinct("region"),
        Trip.distinct("bestSeason"),
    ]);

    return { regions, seasons };
}