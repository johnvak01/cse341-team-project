const hookRegionSorter = () => {
    const regionSelect = document.getElementById('region-filter');
    if (regionSelect) {
        regionSelect.addEventListener('change', () => {
            const selectedRegion = regionSelect.value;
            const url = new URL(window.location.href);

            if (selectedRegion && selectedRegion !== 'all') {
                url.searchParams.set('region', selectedRegion);
            } else {
                url.searchParams.delete('region');
            }

            window.location.href = url.toString();
        });
    }
};

const hookSeasonSorter = () => {
    const seasonSelect = document.getElementById('season-filter');
    if (seasonSelect) {
        seasonSelect.addEventListener('change', () => {
            const selectedSeason = seasonSelect.value;
            const url = new URL(window.location.href);

            if (selectedSeason && selectedSeason !== 'all') {
                url.searchParams.set('season', selectedSeason);
            } else {
                url.searchParams.delete('season');
            }

            window.location.href = url.toString();
        });
    }
};

const hookTrainsCatalog = async () => {
    const listEl = document.getElementById('trains-list');
    const templateEl = document.getElementById('train-card-template');
    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');

    if (!listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/trains');
        if (!response.ok) {
            throw new Error(`Failed to load trains (${response.status})`);
        }

        const payload = await response.json();
        const trains = Array.isArray(payload) ? payload : payload.trains || [];
        const fragment = document.createDocumentFragment();

        trains.forEach((train) => {
            const card = templateEl.content.cloneNode(true);
            const imageEl = card.querySelector('[data-field="image"]');

            imageEl.src = train.imageUrl;
            imageEl.alt = train.imageAlt || `${train.name} train`;

            card.querySelector('[data-field="name"]').textContent = train.name;
            card.querySelector('[data-field="operator"]').textContent = train.operator;
            card.querySelector('[data-field="type"]').textContent = train.type;
            card.querySelector('[data-field="speed"]').textContent = `${train.maxSpeedKmh} km/h`;
            card.querySelector('[data-field="seats"]').textContent = `${train.capacity} seats`;
            card.querySelector('[data-field="power"]').textContent = train.powerSource;
            card.querySelector('[data-field="description"]').textContent = train.description;
            card.querySelector('[data-field="best-for"]').textContent = train.bestFor;

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
        if (loadingEl) {
            loadingEl.hidden = true;
        }
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trains right now. Please try again in a moment.';
        }
    }
};

const hookBookingCatalog = async () => {
    const listEl = document.getElementById('bookings-list');
    const templateEl = document.getElementById('booking-card-template');
    const loadingEl = document.getElementById('bookings-loading');
    const errorEl = document.getElementById('bookings-error');

    if (!listEl || !templateEl) {
        console.log("not booking page");
        return;
    }

    listEl.addEventListener('click', async (e) => {
        const article = e.target.closest('.train-card');
        if (!article) return;
        const id = article.dataset.id;
        const editForm = article.querySelector('.booking-edit-form');
        const viewActions = article.querySelector('.booking-view-actions');

        if (e.target.matches('.btn-edit-booking')) {
            editForm.hidden = false;
            viewActions.hidden = true;
            return;
        }

        if (e.target.matches('.btn-cancel-edit')) {
            editForm.hidden = true;
            viewActions.hidden = false;
            return;
        }

        if (e.target.matches('.btn-delete-booking')) {
            if (!confirm('Delete this booking?')) return;
            try {
                const response = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Delete failed');
                article.remove();
            } catch (error) {
                console.error(error);
                alert('Unable to delete this booking right now.');
            }
        }
    });

    listEl.addEventListener('submit', async (e) => {
        if (!e.target.matches('.booking-edit-form')) return;
        e.preventDefault();

        const article = e.target.closest('.train-card');
        const id = article.dataset.id;
        const formData = new FormData(e.target);
        const updates = {
            selectedDay: formData.get('selectedDay'),
            ticketClass: formData.get('ticketClass'),
        };

        try {
            const response = await fetch(`/api/bookings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (!response.ok) throw new Error('Update failed');

            const updated = await response.json();
            article.querySelector('[data-field="selectedDay"]').textContent = updated.selectedDay;
            article.querySelector('[data-field="ticket"]').textContent = `Ticket: ${updated.ticketClass}`;
            e.target.hidden = true;
            article.querySelector('.booking-view-actions').hidden = false;
        } catch (error) {
            console.error(error);
            alert('Unable to update this booking right now.');
        }
    });

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get('page') || 1;
        const limit = urlParams.get('limit') || 10;
        const sort = urlParams.get('sort') || 'createdAt';
        const order = urlParams.get('order') || 'asc';
        let filter = {};
        let ApiUrl = `/api/bookings_paginated?page=${page}&limit=${limit}&sort=${sort}&order=${order}`;

        const response = await fetch(ApiUrl);

        if (!response.ok) {
            throw new Error(`Failed to load bookings (${response.status})`);
        }

        const payload = await response.json();
        const bookings = Array.isArray(payload) ? payload : payload.bookings || [];
        const fragment = document.createDocumentFragment();
        if (bookings.length === 0) {
            const noBookingsEl = document.createElement('p');
            noBookingsEl.textContent = 'No bookings found.';
            fragment.appendChild(noBookingsEl);

        }
        bookings.forEach((booking) => {
            const card = templateEl.content.cloneNode(true);
            const article = card.querySelector('.train-card');
            article.dataset.id = booking.id;

            const passengers = Array.isArray(booking.passengers)
                ? booking.passengers
                : booking.passenger
                    ? [booking.passenger]
                    : [];
            const primaryPassenger = passengers[0] || {};
            const bookedOn = booking.createdAt || booking.bookingDate;

            card.querySelector('[data-field="name"]').textContent =
                `${primaryPassenger.firstName || "Unknown"} ${primaryPassenger.lastName || "Passenger"}`;
            card.querySelector('[data-field="email"]').textContent =
                primaryPassenger.email || "No email provided";
            card.querySelector('[data-field="ticket"]').textContent =
                `Ticket: ${booking.ticketClass || "Unknown"}`;
            card.querySelector('[data-field="tripId"]').textContent =
                booking.tripId || booking.trainId || "Unknown";
            card.querySelector('[data-field="selectedDay"]').textContent =
                booking.selectedDay || "Unknown";
            card.querySelector('[data-field="passengers"]').textContent =
                passengers.length;
            card.querySelector('[data-field="bookingDate"]').textContent = bookedOn
                ? new Date(bookedOn).toLocaleDateString()
                : "Unknown";

            card.querySelector('input[name="selectedDay"]').value = booking.selectedDay || '';
            card.querySelector('input[name="ticketClass"]').value = booking.ticketClass || '';

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
        if (loadingEl) {
            loadingEl.hidden = true;
        }

        // add pagination controls based on response
        const paginationControls = document.getElementById('pagination-controls');

        if (paginationControls) {
            const totalPages = Math.ceil(payload.total / payload.limit);
            paginationControls.innerHTML = '';
            for (let i = 1; i <= totalPages; i++) {
                const pageLink = document.createElement('a');
                pageLink.href = `?page=${i}&limit=${payload.limit}&sort=${sort}&order=${order}`;
                pageLink.textContent = i;
                if (i === parseInt(page)) {
                    pageLink.style.fontWeight = 'bold';
                }
                paginationControls.appendChild(pageLink);
            }
        }
        // add sorting controls based on response
        const sortCategory = document.getElementById('sort-by');
        if (sortCategory) {
            sortCategory.innerHTML = '';
            const sortFields = ['createdAt', 'selectedDay', 'ticketClass', 'tripId'];
            sortFields.forEach(field => {
                const sortOption = document.createElement('option');
                sortOption.textContent = `${field}`;
                sortOption.value = `${field}`;
                if (field == sort) {
                    sortOption.selected = true;
                }
                sortCategory.appendChild(sortOption);
            });
        }

        sortCategory.addEventListener('change', (event) => {
            const target = event.target.value;

            // Check if the user selected a valid URL option (not the placeholder)
            if (target) {
                window.location.href = `?page=${page}&limit=${limit}&sort=${target}&order=${order}`;
            }
        });
        const sortOrder = document.getElementById('sort-order');
        if (sortOrder) {
            sortOrder.innerHTML = '';
            const sortFields = ['asc', 'desc'];
            sortFields.forEach(field => {
                const sortOption = document.createElement('option');
                sortOption.textContent = `${field}`;
                sortOption.value = `${field}`;
                if (field == order) {
                    sortOption.selected = true;
                }
                sortOrder.appendChild(sortOption);
            });
        }

        sortOrder.addEventListener('change', (event) => {
            const target = event.target.value;
            console.log("target: ", target);
            // Check if the user selected a valid URL option (not the placeholder)
            if (target) {
                window.location.href = `?page=${page}&limit=${limit}&sort=${sort}&order=${target}`;
            }
        });

    } catch (error) {
        console.log("error: ", error);
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load bookings right now. Please try again in a moment.';
        }
    }



};



document.addEventListener('DOMContentLoaded', () => {
    hookRegionSorter();
    hookSeasonSorter();
    hookTrainsCatalog();
    hookBookingCatalog();
});