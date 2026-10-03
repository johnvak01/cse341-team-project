import {
    getTrainById as findTrainById,
    getPaginatedTrains as findPaginatedTrains,
    getTrainFilterOptions as findTrainFilterOptions,
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

const parseOptionalString = (value, fieldName, { maxLength } = {}) => {
    if (value === undefined) {
        return { value: null, error: null };
    }

    if (typeof value !== 'string') {
        return { value: null, error: `${fieldName} must be a single string value.` };
    }

    const trimmed = value.trim();

    if (!trimmed || (maxLength && trimmed.length > maxLength)) {
        return {
            value: null,
            error: maxLength
                ? `${fieldName} must be between 1 and ${maxLength} characters.`
                : `${fieldName} must not be empty.`
        };
    }

    return { value: trimmed, error: null };
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

        const q = parseOptionalString(req.query.q, 'q', { maxLength: 100 });
        if (q.error) {
            return res.status(400).json({ errors: [{ field: 'q', message: q.error }] });
        }

        const type = parseOptionalString(req.query.type, 'type');
        if (type.error) {
            return res.status(400).json({ errors: [{ field: 'type', message: type.error }] });
        }

        const powerSource = parseOptionalString(req.query.powerSource, 'powerSource');
        if (powerSource.error) {
            return res.status(400).json({ errors: [{ field: 'powerSource', message: powerSource.error }] });
        }

        const filter = {};
        if (q.value) {
            filter.$text = { $search: q.value };
        }
        if (type.value) {
            filter.type = type.value;
        }
        if (powerSource.value) {
            filter.powerSource = powerSource.value;
        }

        const { trains, totalItems } = await findPaginatedTrains({
            filter,
            page,
            limit,
            sort,
            order
        });

        return res.status(200).json({
            data: trains,
            query: {
                q: q.value,
                type: type.value,
                powerSource: powerSource.value
            },
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

export async function getTrainFilterOptions(req, res) {
    try {
        const options = await findTrainFilterOptions();

        return res.status(200).json(options);
    } catch (error) {
        console.error("Error fetching train filter options:", error);

        return res.status(500).json({
            error: "Failed to fetch train filter options",
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