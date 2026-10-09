
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


const searchInput = document.getElementById('search-input');
const regionFilter = document.getElementById('region-filter');
const seasonFilter = document.getElementById('season-filter');

const fillSelectOptions = (select, values) => {
    values.forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value.charAt(0).toUpperCase() + value.slice(1);
        select.appendChild(option);
    });
};

const loadFilterOptions = async () => {

    try{

        const response = await fetch('/api/trips/filters');
        if (!response.ok) throw new Error(`Filter request failed (${response.status})`);

        const { regions, seasons } = await response.json();

        fillSelectOptions(regionFilter, regions);
        fillSelectOptions(seasonFilter, seasons);

    }catch (error){
        console.error('Unable to load filter options:', error);
    }
};

const state = {page: 1, region: 'all', season: 'all', q: ''};

const buildQuery = () => {
    const params = new URLSearchParams();
    if (state.region && state.region !== 'all') params.set('region', state.region);
    if (state.season && state.season !== 'all') params.set('season', state.season);
    const q = state.q.trim();
    if (q) params.set('q', q);
    if (state.page > 1) params.set('page', state.page);

    return params.toString();
}


const loadTrips = async () => {
    const tripsList = document.getElementById('trips-list');

    try {
        const response = await fetch(`/api/trips?${buildQuery()}`);
        if (!response.ok) throw new Error(`Trip request failed (${response.status})`);

        /*
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

    */

        const { data, pagination } = await response.json();

        if (data.length === 0) {
            const empty = document.createElement('p');
            empty.textContent = 'No trips found';
            tripsList.replaceChildren(empty);
        }else {
            renderTrips(data);
        }

        renderPagination(pagination);

    }catch (error) {
        console.error('Unable to load trips:', error);
        const errorMessage = document.createElement('p');
        errorMessage.className = 'error';
        errorMessage.textContent = 'Failed to render trips.';
        tripsList.replaceChildren(errorMessage);
        document.getElementById('pagination').replaceChildren();
    }
};

// Builds [1, '...', 4, 5, 6, '...', 20]
const getPageItems = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = [...new Set([1, total, current - 1, current, current + 1])]
        .filter((p) => p >= 1 && p <= total)
        .sort((a, b) => a - b);

    const items = [];
    pages.forEach((p, i) => {
        if (i > 0 && p - pages[i - 1] > 1) items.push('...');
        items.push(p);
    });
    return items;
};

const renderPagination = ({ page, totalPages, hasPrevPage, hasNextPage }) => {
    const nav = document.getElementById('pagination');
    nav.replaceChildren();
    if (totalPages <= 1) return;

    const addButton = (label, targetPage, disabled = false, isCurrent = false) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.disabled = disabled;
        if (isCurrent) btn.setAttribute('aria-current', 'page');
        btn.addEventListener('click', async () => {
            state.page = targetPage;
            await loadTrips();
            document.getElementById('trips-list').scrollIntoView({ behavior: 'smooth' });
        });
        nav.appendChild(btn);
    };

    addButton('Previous', page - 1, !hasPrevPage);
    getPageItems(page, totalPages).forEach((item) => {
        if (item === '...') {
            const gap = document.createElement('span');
            gap.textContent = '…';
            nav.appendChild(gap);
        } else {
            addButton(String(item), item, item === page, item === page);
        }
    });
    addButton('Next', page + 1, !hasNextPage);
};

regionFilter.addEventListener('change', async () => {
    state.region = regionFilter.value;
    state.page = 1;
    await loadTrips();
});

seasonFilter.addEventListener('change', async () => {
    state.season = seasonFilter.value;
    state.page = 1;
    await loadTrips();
});

searchInput.addEventListener('keydown', async () => {
    if (event.key === 'Enter') {
        state.q = searchInput.value;
        state.page = 1;
        await loadTrips();
    }
});

loadFilterOptions();
loadTrips();