const loadingEl = document.getElementById('timetable-loading');
const errorEl = document.getElementById('timetable-error');
const tableEl = document.getElementById('timetable-table');
const rowsEl = document.getElementById('timetable-rows');
const paginationEl = document.getElementById('timetable-pagination');
const prevButton = document.getElementById('timetable-prev');
const nextButton = document.getElementById('timetable-next');
const pageIndicator = document.getElementById('timetable-page-indicator');
const emptyEl = document.getElementById('timetable-empty');
const filtersForm = document.getElementById('timetable-filters');

const PAGE_SIZE = 10;
let currentPage = 1;
let tripNames = {};

const addOptions = (select, items) => {
    items.forEach((item) => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        select.appendChild(option);
    });
};

// /api/trains returns at most 50 per page, so keep asking until there are no more pages
const loadTrainOptions = async () => {
    try {
        let page = 1;
        let hasNextPage = true;
        while (hasNextPage) {
            const response = await fetch(`/api/trains?page=${page}&limit=50&sort=name`);
            if (!response.ok) return;
            const { data, pagination } = await response.json();
            addOptions(filtersForm.elements.trainId, data);
            hasNextPage = pagination.hasNextPage;
            page += 1;
        }
    } catch {
        // The train dropdown just stays at "All trains"
    }
};

// Page and limit, plus every filter that has a value
const buildQuery = (page) => {
    const params = new URLSearchParams({ page, limit: PAGE_SIZE });
    for (const [name, value] of new FormData(filtersForm).entries()) {
        if (value) params.set(name, value);
    }
    return params.toString();
};

// Loaded once so each row can show the trip's name instead of its id
const loadTripNames = async () => {
    try {
        const response = await fetch('/api/trips');
        if (!response.ok) return;
        const trips = await response.json();
        const list = Array.isArray(trips) ? trips : trips.data || [];
        tripNames = Object.fromEntries(list.map((trip) => [trip.id, trip.name]));
        addOptions(filtersForm.elements.tripId, list);
    } catch {
        // Rows fall back to showing the trip id
    }
};

const renderRows = (schedules) => {
    const fragment = document.createDocumentFragment();

    schedules.forEach((schedule) => {
        const row = document.createElement('tr');

        const departs = document.createElement('td');
        departs.textContent = schedule.departureTime;

        const arrives = document.createElement('td');
        arrives.textContent = schedule.arrivalTime;

        const trip = document.createElement('td');
        const tripLink = document.createElement('a');
        tripLink.href = `/trips/${encodeURIComponent(schedule.tripId)}`;
        tripLink.textContent = tripNames[schedule.tripId] || schedule.tripId;
        trip.appendChild(tripLink);

        const days = document.createElement('td');
        days.textContent = (schedule.daysOfWeek || [])
            .map((day) => day.charAt(0).toUpperCase() + day.slice(1, 3))
            .join(', ');

        row.append(departs, arrives, trip, days);
        fragment.appendChild(row);
    });

    rowsEl.replaceChildren(fragment);
};

const loadPage = async (page) => {
    prevButton.disabled = true;
    nextButton.disabled = true;

    try {
        const response = await fetch(`/api/schedules?${buildQuery(page)}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Failed to load schedules (${response.status})`);

        const { data, pagination } = await response.json();
        currentPage = pagination.page;
        renderRows(data);

        pageIndicator.textContent = `Page ${pagination.page} of ${Math.max(pagination.totalPages, 1)}`;
        prevButton.disabled = !pagination.hasPreviousPage;
        nextButton.disabled = !pagination.hasNextPage;

        loadingEl.hidden = true;
        errorEl.hidden = true;
        emptyEl.hidden = data.length > 0;
        tableEl.hidden = data.length === 0;
        paginationEl.hidden = data.length === 0;
    } catch (error) {
        console.error('Unable to load schedules:', error);
        loadingEl.hidden = true;
        tableEl.hidden = true;
        paginationEl.hidden = true;
        errorEl.hidden = false;
        errorEl.textContent = 'Unable to load the timetable right now. Please try again in a moment.';
    }
};

filtersForm.addEventListener('change', () => {
    const { startTime, endTime } = filtersForm.elements;
    if (startTime.value && endTime.value && startTime.value > endTime.value) {
        errorEl.hidden = false;
        errorEl.textContent = '"Departs after" has to be earlier than "Departs before".';
        return;
    }
    loadPage(1);
});
filtersForm.addEventListener('submit', (event) => event.preventDefault());

prevButton.addEventListener('click', () => loadPage(currentPage - 1));
nextButton.addEventListener('click', () => loadPage(currentPage + 1));

const initializeTimetable = async () => {
    await Promise.all([loadTripNames(), loadTrainOptions()]);
    await loadPage(1);
};

initializeTimetable();
