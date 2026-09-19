const createScheduleCard = (schedule) => {
    const card = document.createElement("div");
    card.className = "schedule-card";

    const days = (schedule.daysOfWeek || [])
        .map((day) => `<span class="day-badge">${day.substring(0, 3)}</span>`)
        .join("");

    card.innerHTML = `
		<div class="schedule-times">
			<div class="time-block">
				<span class="time-label">Departs</span>
				<span class="time-value">${schedule.departureTime}</span>
			</div>
			<span class="time-arrow">→</span>
			<div class="time-block">
				<span class="time-label">Arrives</span>
				<span class="time-value">${schedule.arrivalTime}</span>
			</div>
		</div>
		<div class="schedule-days">${days}</div>
		<a href="/trips/booking/${schedule.id}" class="book-btn">Book Now</a>
	`;

    return card;
};

const loadSchedules = async (
    tripId,
    monthSelect,
    scheduleGrid,
    scheduleStatus
) => {
    const selectedMonth = monthSelect.value;
    const endpoint = selectedMonth
        ? `/api/trips/${tripId}/schedules?month=${selectedMonth}`
        : `/api/trips/${tripId}/schedules`;

    scheduleStatus.textContent = "Loading schedules...";
    scheduleGrid.replaceChildren();

    try {
        const response = await fetch(endpoint);

        if (response.status === 404 && selectedMonth) {
            scheduleStatus.textContent =
                "No schedules are available for the selected month.";
            return;
        }

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const schedules = await response.json();

        if (!Array.isArray(schedules) || schedules.length === 0) {
            scheduleStatus.textContent =
                "No schedules are available for the selected month.";
            return;
        }

        scheduleStatus.textContent = "";
        schedules.forEach((schedule) => {
            scheduleGrid.appendChild(createScheduleCard(schedule));
        });
    } catch (error) {
        console.error("Failed to load schedules:", error);
        scheduleStatus.textContent = "Unable to load schedules right now.";
    }
};

const initializeScheduleList = () => {
    const details = document.querySelector(".route-detail");
    const monthSelect = document.getElementById("monthSelect");
    const scheduleGrid = document.getElementById("scheduleGrid");
    const scheduleStatus = document.getElementById("scheduleStatus");

    if (!details || !monthSelect || !scheduleGrid || !scheduleStatus) {
        return;
    }

    const tripId = details.dataset.tripId;
    monthSelect.addEventListener("change", () => {
        loadSchedules(tripId, monthSelect, scheduleGrid, scheduleStatus);
    });
    loadSchedules(tripId, monthSelect, scheduleGrid, scheduleStatus);
};

document.addEventListener("DOMContentLoaded", initializeScheduleList);
