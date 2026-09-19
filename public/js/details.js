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

const renderStationInfo = (station) => {
    const facilities = (station.facilities || [])
        .map((facility) => `<span class="facility-badge">${facility.replace(/_/g, " ")}</span>`)
        .join("");

    return `
		<h2 id="stationPopupName" class="station-popup-name">${station.name}</h2>
		${station.prefecture ? `<p class="station-popup-meta">${station.prefecture}</p>` : ""}
		${station.description ? `<p class="station-popup-description">${station.description}</p>` : ""}
		${facilities ? `<div class="station-popup-facilities">${facilities}</div>` : ""}
	`;
};

const openStationPopup = async (stationId, popup, popupBody) => {
    popupBody.innerHTML = "<p>Loading station information...</p>";
    popup.hidden = false;

    try {
        const response = await fetch(`/api/stations/${stationId}`);

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const station = await response.json();
        popupBody.innerHTML = renderStationInfo(station);
    } catch (error) {
        console.error("Failed to load station information:", error);
        popupBody.innerHTML = "<p>Unable to load station information right now.</p>";
    }
};

const closeStationPopup = (popup) => {
    popup.hidden = true;
};

const initializeStationPopup = () => {
    const popup = document.getElementById("stationPopup");
    const popupBody = document.getElementById("stationPopupBody");
    const infoButtons = document.querySelectorAll(".station-info-btn");

    if (!popup || !popupBody || infoButtons.length === 0) {
        return;
    }

    infoButtons.forEach((button) => {
        button.addEventListener("click", () => {
            openStationPopup(button.dataset.stationId, popup, popupBody);
        });
    });

    popup.querySelectorAll("[data-close-popup]").forEach((element) => {
        element.addEventListener("click", () => closeStationPopup(popup));
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !popup.hidden) {
            closeStationPopup(popup);
        }
    });
};

document.addEventListener("DOMContentLoaded", () => {
    initializeScheduleList();
    initializeStationPopup();
});
