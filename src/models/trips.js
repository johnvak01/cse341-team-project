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


export const getPaginatedTrips = async ({filter = {}, page, limit, sort, order }) => {
    const skip = (page - 1) * limit;
    const sortOptions = {[sort]: order};

    const [trips, totalTrips] = await Promise.all([
        Trip.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
        Trip.countDocuments(filter)
    ]);

    return {trips, totalTrips};
};