const API_BASE_URL = "http://localhost:8080/api";

const stationList = document.getElementById("station-list");
const searchInput = document.getElementById("searchInput");
const chargingTypeFilter = document.getElementById("chargingTypeFilter");
const availabilityFilter = document.getElementById("availabilityFilter");
const myBookingsBtn = document.getElementById("myBookingsBtn");
const bookingBadge = document.getElementById("bookingBadge");

let allStations = [];

// Helper to refresh Lucide icons after DOM insertion
function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
        lucide.createIcons();
    }
}

// Initialize Page
document.addEventListener("DOMContentLoaded", () => {
    fetchStations();
    updateBookingBadge();
    
    // Set default date input min date to today
    const dateInput = document.getElementById("bookingDate");
    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.min = today;
        dateInput.value = today;
    }

    // Attach event listeners
    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (chargingTypeFilter) chargingTypeFilter.addEventListener("change", applyFilters);
    if (availabilityFilter) availabilityFilter.addEventListener("change", applyFilters);
    if (myBookingsBtn) myBookingsBtn.addEventListener("click", openMyBookingsModal);
    
    refreshIcons();
});

// Fetch all charging stations from API
function fetchStations() {
    fetch(`${API_BASE_URL}/stations`)
        .then(res => {
            if (!res.ok) throw new Error("Failed to load stations");
            return res.json();
        })
        .then(stations => {
            allStations = stations;
            displayStations(allStations);
        })
        .catch(err => {
            console.error("Error fetching stations:", err);
            stationList.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="alert-triangle" class="empty-icon"></i>
                    <p style="margin-top: 10px;">Unable to connect to charging station server.</p>
                </div>`;
            refreshIcons();
        });
}

// Display station cards
function displayStations(stations) {
    stationList.innerHTML = "";

    if (!stations || stations.length === 0) {
        stationList.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i data-lucide="search-x" class="empty-icon"></i>
                <p style="margin-top: 10px;">No charging stations match your filters.</p>
            </div>`;
        refreshIcons();
        return;
    }

    stations.forEach(station => {
        const card = document.createElement("div");
        card.className = "station-card";

        const isAvailable = station.availability === "Available";
        const badgeClass = isAvailable ? "badge-available" : "badge-busy";

        card.innerHTML = `
            <div>
                <div class="station-header">
                    <h2>${station.name}</h2>
                    <span class="badge ${badgeClass}">${station.availability}</span>
                </div>
                <div class="station-info">
                    <p><i data-lucide="map-pin"></i> ${station.address || station.location}</p>
                    <p><i data-lucide="zap"></i> ${station.chargingType}</p>
                    <p><i data-lucide="clock"></i> ${station.operatingHours}</p>
                    <p><i data-lucide="phone"></i> ${station.contact}</p>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn-secondary" onclick="viewDetails(${station.id})">
                    Details
                </button>
                <button class="btn-primary" 
                        onclick="openBookingModal(${station.id})" 
                        ${!isAvailable ? 'disabled title="Station currently unavailable"' : ''}>
                    <i data-lucide="zap"></i> Book Now
                </button>
            </div>
        `;

        stationList.appendChild(card);
    });

    refreshIcons();
}

// Navigate to station details page
function viewDetails(id) {
    window.location.href = `station.html?id=${id}`;
}

// Apply Search & Filters
function applyFilters() {
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedChargingType = chargingTypeFilter ? chargingTypeFilter.value : "All";
    const selectedAvailability = availabilityFilter ? availabilityFilter.value : "All";

    const filtered = allStations.filter(station => {
        const matchesSearch =
            station.name.toLowerCase().includes(searchText) ||
            station.location.toLowerCase().includes(searchText) ||
            (station.address && station.address.toLowerCase().includes(searchText));

        const matchesType =
            selectedChargingType === "All" ||
            station.chargingType === selectedChargingType;

        const matchesAvailability =
            selectedAvailability === "All" ||
            station.availability === selectedAvailability;

        return matchesSearch && matchesType && matchesAvailability;
    });

    displayStations(filtered);
}

// Open Booking Modal for a specific station ID
function openBookingModal(stationId) {
    const station = allStations.find(s => s.id === stationId);
    if (!station) {
        // Fetch station if not in cache
        fetch(`${API_BASE_URL}/stations/${stationId}`)
            .then(res => res.json())
            .then(st => setupModalWithStation(st))
            .catch(err => console.error(err));
    } else {
        setupModalWithStation(station);
    }
}

function setupModalWithStation(station) {
    if (station.availability !== "Available") {
        alert("This station is currently unavailable for booking.");
        return;
    }

    document.getElementById("modalStationTitle").textContent = `Book Slot - ${station.name}`;
    document.getElementById("bookStationId").value = station.id;
    document.getElementById("bookChargingType").value = station.chargingType;
    document.getElementById("bookingFormError").classList.add("hidden");

    const modal = document.getElementById("bookingModal");
    if (modal) modal.classList.add("active");
    refreshIcons();
}

function closeBookingModal() {
    const modal = document.getElementById("bookingModal");
    if (modal) modal.classList.remove("active");
    const form = document.getElementById("bookingForm");
    if (form) form.reset();
    
    // reset date
    const dateInput = document.getElementById("bookingDate");
    if (dateInput) {
        dateInput.value = new Date().toISOString().split("T")[0];
    }
}

// Submit Booking Form to Backend
function handleBookingSubmit(event) {
    event.preventDefault();

    const submitBtn = document.getElementById("submitBookingBtn");
    const errorDiv = document.getElementById("bookingFormError");

    const payload = {
        userName: document.getElementById("userName").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim(),
        stationId: document.getElementById("bookStationId").value,
        vehicleModel: document.getElementById("vehicleModel").value.trim(),
        vehicleNumber: document.getElementById("vehicleNumber").value.trim(),
        bookingDate: document.getElementById("bookingDate").value,
        bookingTime: document.getElementById("bookingTime").value,
        chargingType: document.getElementById("bookChargingType").value
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader-2"></i> Processing...`;
    refreshIcons();
    errorDiv.classList.add("hidden");

    fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || "Failed to create booking");
        }
        return data;
    })
    .then(data => {
        closeBookingModal();
        showConfirmationReceipt(data.booking);
        updateBookingBadge();
    })
    .catch(err => {
        errorDiv.textContent = err.message;
        errorDiv.classList.remove("hidden");
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="check-circle"></i> Confirm & Book Slot`;
        refreshIcons();
    });
}

// Toast notification helper
function showToast(message, type = "success") {
    let toast = document.getElementById("toast-notification");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-notification";
        document.body.appendChild(toast);
    }
    toast.className = `toast toast-${type} active`;
    toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : (type === 'danger' ? 'trash-2' : 'info')}"></i> ${message}`;
    refreshIcons();
    setTimeout(() => {
        toast.classList.remove("active");
    }, 3200);
}

// Show Booking Confirmation Receipt Modal
function showConfirmationReceipt(booking) {
    const receiptContent = document.getElementById("receiptContent");
    if (receiptContent) {
        receiptContent.innerHTML = `
            <div class="receipt-row">
                <span><i data-lucide="hash"></i> Booking Reference:</span>
                <span>#EV-${booking.id}</span>
            </div>
            <div class="receipt-row">
                <span><i data-lucide="map-pin"></i> Station:</span>
                <span>${booking.stationName}</span>
            </div>
            <div class="receipt-row">
                <span><i data-lucide="user"></i> Customer:</span>
                <span>${booking.userName}</span>
            </div>
            <div class="receipt-row">
                <span><i data-lucide="car"></i> Vehicle:</span>
                <span>${booking.vehicleModel} (${booking.vehicleNumber})</span>
            </div>
            <div class="receipt-row">
                <span><i data-lucide="calendar"></i> Date & Time:</span>
                <span>${booking.bookingDate} at ${booking.bookingTime}</span>
            </div>
            <div class="receipt-row">
                <span><i data-lucide="zap"></i> Charging Type:</span>
                <span>${booking.chargingType}</span>
            </div>
            <div class="receipt-row">
                <span><i data-lucide="check-circle"></i> Status:</span>
                <span style="color: var(--primary);">Confirmed</span>
            </div>
        `;

        // Update footer action buttons on confirmation modal
        const receiptActions = document.querySelector("#confirmationModal .card-actions");
        if (receiptActions) {
            receiptActions.innerHTML = `
                <button class="btn-danger" onclick="cancelBookingFromReceipt(${booking.id})">
                    <i data-lucide="trash-2"></i> Cancel Reservation
                </button>
                <button class="btn-secondary" onclick="closeConfirmationModal()">Close</button>
                <button class="btn-primary" onclick="closeConfirmationModal(); openMyBookingsModal();">
                    <i data-lucide="calendar"></i> My Bookings
                </button>
            `;
        }
    }

    const modal = document.getElementById("confirmationModal");
    if (modal) modal.classList.add("active");
    refreshIcons();
}

function closeConfirmationModal() {
    const modal = document.getElementById("confirmationModal");
    if (modal) modal.classList.remove("active");
}

// Cancel Booking directly from Confirmation Receipt Modal
function cancelBookingFromReceipt(id) {
    cancelBooking(id, false, () => {
        closeConfirmationModal();
    });
}

// Open My Bookings Modal
function openMyBookingsModal() {
    const modal = document.getElementById("myBookingsModal");
    if (modal) modal.classList.add("active");
    loadMyBookings();
}

function closeMyBookingsModal() {
    const modal = document.getElementById("myBookingsModal");
    if (modal) modal.classList.remove("active");
}

// Fetch all bookings from Backend
function loadMyBookings() {
    const listContainer = document.getElementById("myBookingsList");
    if (!listContainer) return;

    listContainer.innerHTML = `<p class="text-center" style="color: var(--text-muted); padding: 20px;">Loading bookings...</p>`;

    fetch(`${API_BASE_URL}/bookings`)
        .then(res => res.json())
        .then(bookings => {
            if (!bookings || bookings.length === 0) {
                listContainer.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="calendar-x" class="empty-icon"></i>
                        <p style="margin-top: 8px;">No active bookings found.</p>
                    </div>`;
                refreshIcons();
                return;
            }

            listContainer.innerHTML = "";
            bookings.forEach(b => {
                const div = document.createElement("div");
                div.className = "booking-item";
                div.id = `booking-item-${b.id}`;
                div.innerHTML = `
                    <div class="booking-info">
                        <h4>${b.stationName} <span class="badge badge-available">#EV-${b.id}</span></h4>
                        <p><i data-lucide="calendar"></i> ${b.bookingDate} at ${b.bookingTime} &bull; <i data-lucide="zap"></i> ${b.chargingType}</p>
                        <p><i data-lucide="user"></i> ${b.userName} (${b.vehicleModel} - ${b.vehicleNumber})</p>
                    </div>
                    <button class="btn-danger" id="cancel-btn-${b.id}" onclick="cancelBooking(${b.id})">
                        <i data-lucide="trash-2"></i> Cancel
                    </button>
                `;
                listContainer.appendChild(div);
            });
            refreshIcons();
        })
        .catch(err => {
            console.error("Error loading bookings:", err);
            listContainer.innerHTML = `<p class="text-center" style="color: var(--danger); padding: 20px;">Failed to load bookings.</p>`;
        });
}

// Cancel Booking Function
function cancelBooking(id, confirmFirst = true, callback = null) {
    if (confirmFirst && !confirm("Are you sure you want to cancel this booking reservation?")) {
        return;
    }

    const cancelBtn = document.getElementById(`cancel-btn-${id}`);
    if (cancelBtn) {
        cancelBtn.disabled = true;
        cancelBtn.innerHTML = `<i data-lucide="loader-2"></i> Cancelling...`;
        refreshIcons();
    }

    fetch(`${API_BASE_URL}/bookings/${id}`, {
        method: "DELETE"
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to cancel booking");
        return data;
    })
    .then(data => {
        showToast(`Booking #EV-${id} cancelled successfully`, "danger");
        updateBookingBadge();
        loadMyBookings();
        if (callback && typeof callback === "function") callback();
    })
    .catch(err => {
        console.error("Error cancelling booking:", err);
        showToast(err.message || "Failed to cancel booking", "danger");
        if (cancelBtn) {
            cancelBtn.disabled = false;
            cancelBtn.innerHTML = `<i data-lucide="trash-2"></i> Cancel`;
            refreshIcons();
        }
    });
}

// Update Booking Badge Count
function updateBookingBadge() {
    if (!bookingBadge) return;
    fetch(`${API_BASE_URL}/bookings`)
        .then(res => res.json())
        .then(bookings => {
            if (bookings && bookings.length > 0) {
                bookingBadge.textContent = bookings.length;
                bookingBadge.classList.remove("hidden");
            } else {
                bookingBadge.classList.add("hidden");
            }
        })
        .catch(() => {});
}
