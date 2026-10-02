const regionFilter = document.getElementById('region-filter');
const seasonFilter = document.getElementById('season-filter');
const normalizeFilterValue = (value) => String(value || '').trim().toLowerCase();

const populateFilterOptions = (select, values, label) => {
    const defaultOption = document.createElement('option');
    defaultOption.value = 'all';
    defaultOption.textContent = label;
    select.replaceChildren(defaultOption);

    [...new Set(values.map(normalizeFilterValue).filter(Boolean))].sort().forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value.charAt(0).toUpperCase() + value.slice(1);
        select.appendChild(option);
    });
};

const renderTrips = (trips) => {
    const tripsList = document.getElementById('trips-list');
    const template = document.getElementById('trip-card-template');
    const fragment = document.createDocumentFragment();

    trips.forEach((trip) => {
        const card = template.content.cloneNode(true);
        const wrapper = card.querySelector('.route-card');
        if (trip.region) wrapper.classList.add(trip.region);

        card.querySelector('.route-name').textContent = trip.name || '';
        card.querySelector('.route-region').textContent = trip.region || '';
        card.querySelector('.start-station').textContent = trip.startStation || '';
        card.querySelector('.end-station').textContent = trip.endStation || '';
        card.querySelector('.trip-duration').textContent = trip.duration || '';
        card.querySelector('.trip-distance').textContent = trip.distance ?? '';
        card.querySelector('.route-description').textContent = trip.description || '';

        const seasonBadge = card.querySelector('.season-badge');
        seasonBadge.textContent = trip.bestSeason ? `Best in ${trip.bestSeason}` : '';
        if (trip.bestSeason) seasonBadge.classList.add(`season-${trip.bestSeason}`);

        const highlightsList = card.querySelector('.highlights-list');
        (Array.isArray(trip.highlights) ? trip.highlights : []).forEach((highlight) => {
            const tag = document.createElement('span');
            tag.className = 'highlight-tag';
            tag.textContent = highlight;
            highlightsList.appendChild(tag);
        });

        card.querySelector('.view-details-btn').href = `/trips/${encodeURIComponent(trip.id)}`;
        fragment.appendChild(card);
    });

    tripsList.replaceChildren(fragment);
};

const applyFilters = () => {
    const cards = document.querySelectorAll('#trips-list .route-card');
    const selectedRegion = normalizeFilterValue(regionFilter.value);
    const selectedSeason = normalizeFilterValue(seasonFilter.value);
    let visibleCount = 0;

    cards.forEach((card) => {
        const cardRegion = normalizeFilterValue(card.querySelector('.route-region').textContent);
        const bestSeason = normalizeFilterValue(card.querySelector('.season-badge').textContent);
        const matchesRegion = selectedRegion === 'all' || cardRegion === selectedRegion;
        const matchesSeason = selectedSeason === 'all' || bestSeason.includes(selectedSeason);
        card.hidden = !(matchesRegion && matchesSeason);
        if (!card.hidden) visibleCount += 1;
    });

    document.getElementById('trips-empty')?.remove();
    if (cards.length > 0 && visibleCount === 0) {
        const emptyState = document.createElement('p');
        emptyState.id = 'trips-empty';
        emptyState.className = 'trips-empty';
        emptyState.textContent = 'No trips match the selected filters.';
        document.getElementById('trips-list').appendChild(emptyState);
    }
};

const loadTrips = async () => {
    const tripsList = document.getElementById('trips-list');
    try {
        const response = await fetch('/api/trips');
        if (!response.ok) throw new Error(`Trip request failed (${response.status})`);

        const payload = await response.json();
        const trips = Array.isArray(payload) ? payload : payload.trips || [];
        populateFilterOptions(regionFilter, trips.map((trip) => trip.region), 'All Regions');
        populateFilterOptions(seasonFilter, trips.map((trip) => trip.bestSeason), 'Any Season');
        renderTrips(trips);

        const query = new URLSearchParams(window.location.search);
        const queryRegion = normalizeFilterValue(query.get('region'));
        const querySeason = normalizeFilterValue(query.get('season'));
        if ([...regionFilter.options].some((option) => option.value === queryRegion)) {
            regionFilter.value = queryRegion;
        }
        if ([...seasonFilter.options].some((option) => option.value === querySeason)) {
            seasonFilter.value = querySeason;
        }
        applyFilters();
    } catch (error) {
        console.error('Unable to load trips:', error);
        const errorMessage = document.createElement('p');
        errorMessage.className = 'error';
        errorMessage.textContent = 'Failed to render trips.';
        tripsList.replaceChildren(errorMessage);
    }
};

regionFilter.addEventListener('change', applyFilters);
seasonFilter.addEventListener('change', applyFilters);
loadTrips();