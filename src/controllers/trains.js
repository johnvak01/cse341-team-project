import {
    getTrainById as findTrainById,
    getPaginatedTrains as findPaginatedTrains,
} from "../models/trains.js";

export const trainsPage = (req, res) => {
    res.render("trains", { title: "Trains" });
};

const allowedSortFields = ['name', 'operator', 'maxSpeedKmh', 'capacity'];

const parsePositiveInteger = (value, defaultValue) => {
    if (value === undefined) {
        return defaultValue;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        return null;
    }

    return parsed;
};

export async function getAllTrains(req, res) {
    try {
        const page = parsePositiveInteger(req.query.page, 1);
        const requestedLimit = parsePositiveInteger(req.query.limit, 10);

        if (!page || !requestedLimit || requestedLimit > 50) {
            return res.status(400).json({
                errors: [{
                    field: 'pagination',
                    message: 'page and limit must be positive integers, and limit cannot exceed 50.'
                }]
            });
        }

        const limit = requestedLimit;

        if (req.query.sort && !allowedSortFields.includes(req.query.sort)) {
            return res.status(400).json({
                errors: [{ field: 'sort', message: 'sort is not supported.' }]
            });
        }

        const sort = req.query.sort || 'name';
        const order = req.query.order === 'desc' ? -1 : 1;

        const { trains, totalItems } = await findPaginatedTrains({
            filter: {},
            page,
            limit,
            sort,
            order
        });

        return res.status(200).json({
            data: trains,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                hasNextPage: page * limit < totalItems,
                hasPreviousPage: page > 1
            }
        });
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