const trainInfoEl = document.getElementById('train-info');
const trainId = trainInfoEl.dataset.trainId;

const loadTrainInfo = async () => {
    const loadingEl = document.getElementById('train-info-loading');
    const errorEl = document.getElementById('train-info-error');
    const contentEl = document.getElementById('train-info-content');

    try {
        const response = await fetch(`/api/trains/${encodeURIComponent(trainId)}`);
        if (!response.ok) throw new Error(`Train request failed (${response.status})`);

        const train = await response.json();

        contentEl.querySelector('[data-field="name"]').textContent = train.name;
        contentEl.querySelector('[data-field="description"]').textContent = train.description;

        loadingEl.hidden = true;
        contentEl.hidden = false;
    } catch (error) {
        console.error('Unable to load train:', error);
        loadingEl.hidden = true;
        errorEl.hidden = false;
        errorEl.textContent = 'Unable to load this train right now. Please try again in a moment.';
    }
};

const renderTrainTrips = (trips) => {
    const tripsList = document.getElementById('train-trips-list');
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

const loadTrainTrips = async () => {
    const loadingEl = document.getElementById('train-trips-loading');
    const errorEl = document.getElementById('train-trips-error');

    try {
        const response = await fetch(`/api/trains/${encodeURIComponent(trainId)}/trips`);
        if (!response.ok) throw new Error(`Trips request failed (${response.status})`);

        const payload = await response.json();
        renderTrainTrips(payload.trips || []);

        loadingEl.hidden = true;
    } catch (error) {
        console.error('Unable to load trips for train:', error);
        loadingEl.hidden = true;
        errorEl.hidden = false;
        errorEl.textContent = 'Unable to load trips for this train right now. Please try again in a moment.';
    }
};

loadTrainInfo();
loadTrainTrips();
