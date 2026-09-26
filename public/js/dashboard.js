const hookDashboardBookings = async () => {
    const listEl = document.getElementById('dashboard-bookings-list');
    const templateEl = document.getElementById('dashboard-booking-card-template');
    const loadingEl = document.getElementById('dashboard-loading');
    const errorEl = document.getElementById('dashboard-error');
    const emptyEl = document.getElementById('dashboard-empty');

    if (!listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/bookings/me');
        if (!response.ok) {
            throw new Error(`Failed to load bookings (${response.status})`);
        }

        const payload = await response.json();
        const bookings = Array.isArray(payload) ? payload : payload.bookings || [];
        const fragment = document.createDocumentFragment();

        bookings.forEach((booking) => {
            const card = templateEl.content.cloneNode(true);
            const passengers = Array.isArray(booking.passengers) ? booking.passengers : [];
            const bookedOn = booking.createdAt || booking.bookingDate;

            card.querySelector('[data-field="tripId"]').textContent = booking.tripId || 'Unknown trip';
            card.querySelector('[data-field="ticket"]').textContent = `Ticket: ${booking.ticketClass || 'Unknown'}`;
            card.querySelector('[data-field="selectedDay"]').textContent = booking.selectedDay || 'Unknown';
            card.querySelector('[data-field="passengers"]').textContent = passengers.length;
            card.querySelector('[data-field="confirmationId"]').textContent = booking.id || 'Unknown';
            card.querySelector('[data-field="bookingDate"]').textContent = bookedOn
                ? new Date(bookedOn).toLocaleDateString()
                : 'Unknown';

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (emptyEl) {
            emptyEl.hidden = bookings.length !== 0;
        }
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load your bookings right now. Please try again in a moment.';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    hookDashboardBookings();
});
