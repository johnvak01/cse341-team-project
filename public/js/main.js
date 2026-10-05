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
    const paginationEl = document.getElementById('trains-pagination');
    const prevBtn = document.getElementById('trains-prev-page');
    const nextBtn = document.getElementById('trains-next-page');
    const pageIndicatorEl = document.getElementById('trains-page-indicator');

    if (!listEl || !templateEl) {
        return;
    }

    let currentPage = 1;
    let activeRequest = null;

    const renderTrains = (trains) => {
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
    };

    const loadTrains = async (page) => {
        if (activeRequest) {
            activeRequest.abort();
        }
        activeRequest = new AbortController();
        const { signal } = activeRequest;

        try {
            const response = await fetch(`/api/trains?page=${page}&limit=10`, { cache: 'no-store', signal });
            if (!response.ok) {
                throw new Error(`Failed to load trains (${response.status})`);
            }

            const payload = await response.json();
            const trains = Array.isArray(payload.data) ? payload.data : [];
            const pagination = payload.pagination || {};

            renderTrains(trains);
            currentPage = pagination.page || page;

            if (paginationEl) {
                paginationEl.hidden = false;
            }
            if (pageIndicatorEl) {
                pageIndicatorEl.textContent = `Page ${pagination.page} of ${pagination.totalPages || 1}`;
            }
            if (prevBtn) {
                prevBtn.disabled = !pagination.hasPreviousPage;
            }
            if (nextBtn) {
                nextBtn.disabled = !pagination.hasNextPage;
            }

            if (loadingEl) {
                loadingEl.hidden = true;
            }
            if (errorEl) {
                errorEl.hidden = true;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                return;
            }

            listEl.replaceChildren();
            if (paginationEl) {
                paginationEl.hidden = true;
            }
            if (loadingEl) {
                loadingEl.hidden = true;
            }
            if (errorEl) {
                errorEl.hidden = false;
                errorEl.textContent = 'Unable to load trains right now. Please try again in a moment.';
            }
        }
    };

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                loadTrains(currentPage - 1);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            loadTrains(currentPage + 1);
        });
    }

    loadTrains(currentPage);
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
        const response = await fetch('/api/bookings');
        if (!response.ok) {
            throw new Error(`Failed to load bookings (${response.status})`);
        }

        const payload = await response.json();
        const bookings = Array.isArray(payload) ? payload : payload.bookings || [];
        const fragment = document.createDocumentFragment();

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