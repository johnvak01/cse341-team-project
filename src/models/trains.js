import Train from "./schemas/trains.js";

export async function getAllTrains() {
    return Train.find({}).sort({ id: 1 }).lean();
}

export async function getTrainById(id) {
    return Train.findOne({ id }).lean();
}

export async function getPaginatedTrains({
    filter = {},
    page,
    limit,
    sort,
    order,
}) {
    const skip = (page - 1) * limit;
    const sortOptions = { [sort]: order, id: 1 };

    const [trains, totalItems] = await Promise.all([
        Train.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
        Train.countDocuments(filter),
    ]);

    return { trains, totalItems };
}
