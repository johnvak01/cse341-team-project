import {
    getAllSchedules as findAllSchedules,
    getPaginatedSchedules as findPaginatedSchedules,
    getScheduleById as findScheduleById,
    getSchedulesByTripId as findSchedulesByTripId,
} from "../models/schedules.js";
import { getTripById as findTripById } from "../models/trips.js";

// --------------------------
/***HELPER Function***/
// --------------------------

// Validate month is integer between 1-12
export function validateMonth(req, res, next) {
    if (req.query.month === undefined) {
        return next();
    }

    const month = Number(req.query.month);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
        return res.status(400).json({
            error: "month must be an integer from 1 through 12",
        });
    }

    req.month = month;
    return next();
}

//

// ----------------------------
/***CONTROLLER FUNCTIONS***/
// ----------------------------

export const timetablePage = (req, res) => {
    res.render("timetable", { title: "Timetable" });
};

const pagingParams = ["page", "limit", "sort", "order"];
const allowedSortFields = ["departureTime", "arrivalTime", "tripId", "id"];

// Returns the number if value is a whole number from min to max, otherwise null
const parseWholeNumber = (value, defaultValue, min, max) => {
    if (value === undefined) {
        return defaultValue;
    }
    const number = Number(value);
    if (!Number.isInteger(number) || number < min || number > max) {
        return null;
    }
    return number;
};

// GET all schedules. Without paging params it returns the plain array, so existing callers keep working.
export async function getAllSchedules(req, res) {
    try {
        const wantsPaging = pagingParams.some((param) => req.query[param] !== undefined);
        if (wantsPaging) {
            return getPaginatedSchedules(req, res);
        }

        const schedules = await findAllSchedules();
        return res.status(200).json(schedules);
    } catch (error) {
        console.error("Error fetching schedules:", error);
        return res.status(500).json({ error: "Failed to fetch schedules" });
    }
}

// GET one page of schedules, with metadata about the page
async function getPaginatedSchedules(req, res) {
    const page = parseWholeNumber(req.query.page, 1, 1, Number.MAX_SAFE_INTEGER);
    const limit = parseWholeNumber(req.query.limit, 10, 1, 50);
    const sort = req.query.sort ?? "departureTime";
    const order = req.query.order ?? "asc";

    const errors = [];
    if (page === null) {
        errors.push({ field: "page", message: "page must be a whole number of 1 or more." });
    }
    if (limit === null) {
        errors.push({ field: "limit", message: "limit must be a whole number from 1 to 50." });
    }
    if (!allowedSortFields.includes(sort)) {
        errors.push({ field: "sort", message: `sort must be one of: ${allowedSortFields.join(", ")}.` });
    }
    if (order !== "asc" && order !== "desc") {
        errors.push({ field: "order", message: "order must be asc or desc." });
    }
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const { schedules, totalItems } = await findPaginatedSchedules({
        page,
        limit,
        sort,
        order: order === "desc" ? -1 : 1,
    });

    return res.status(200).json({
        data: schedules,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            hasNextPage: page * limit < totalItems,
            hasPreviousPage: page > 1,
        },
    });
}

// GET one schedule by id
export async function getScheduleById(req, res) {
    try {
        const { id } = req.params;
        const scheduleId = Number(id);
        if (!Number.isSafeInteger(scheduleId)) {
            return res.status(400).json({ error: "Schedule ID must be an integer" });
        }

        const schedule = await findScheduleById(scheduleId);

        if (!schedule) {
            return res.status(404).json({ error: "Schedule not found" });
        }

        return res.status(200).json(schedule);
    } catch (error) {
        console.error("Error fetching schedule:", error);
        return res.status(500).json({ error: "Failed to fetch schedule" });
    }
}

// GET all schedules for a specific trip
export async function getSchedulesByTripId(req, res) {
    try {
        const { tripId } = req.params;
        const trip = await findTripById(tripId);
        if (!trip) {
            return res.status(404).json({ error: `Trip ${tripId} not found` });
        }
        const schedules = await findSchedulesByTripId(tripId);
        return res.status(200).json(schedules);
    } catch (error) {
        console.error("Error fetching schedules for trip:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

// GET all schedules for a specific trip during a specific month
export async function getSchedulesByTripAndMonth(req, res) {
    try {
        const { tripId } = req.params;
        const month = req.month;
        const trip = await findTripById(tripId);
        if (!trip) {
            return res.status(404).json({ error: `Trip ${tripId} not found` });
        }
        const schedules = await findSchedulesByTripId(tripId, month);
        if (schedules.length === 0) {
            return res.status(404).json({
                error: `No schedules available for the selected month.`,
            });
        }
        return res.status(200).json(schedules);
    } catch (error) {
        console.error("Error fetching schedules for trip and month:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
