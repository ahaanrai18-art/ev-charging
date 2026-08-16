const stationDetails = document.getElementById("station-details");

// Helper to refresh Lucide icons
function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
        lucide.createIcons();
    }
}

// Get ID from URL
const params = new URLSearchParams(window.location.search);
const stationId = params.get("id");

if (!stationId) {
    stationDetails.innerHTML = `
        <div class="empty-state">
            <i data-lucide="alert-triangle" class="empty-icon"></i>
            <p style="margin-top: 10px;">No station specified.</p>
            <a href="index.html" class="btn-secondary mt-20"><i data-lucide="arrow-left"></i> Browse Stations</a>
        </div>`;
    refreshIcons();
} else {
    fetch(`${API_BASE_URL}/stations/${stationId}`)
        .then(res => {
            if (!res.ok) throw new Error("Station not found");
            return res.json();
        })
        .then(station => {
            const isAvailable = station.availability === "Available";
            const badgeClass = isAvailable ? "badge-available" : "badge-busy";

            stationDetails.innerHTML = `
                <div class="detail-card">
                    <div class="station-header">
                        <h2>${station.name}</h2>
                        <span class="badge ${badgeClass}">${station.availability}</span>
                    </div>

                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Location</label>
                            <p><i data-lucide="map-pin"></i> ${station.location}</p>
                        </div>
                        <div class="detail-item">
                            <label>Address</label>
                            <p><i data-lucide="navigation"></i> ${station.address}</p>
                        </div>
                        <div class="detail-item">
                            <label>Charging Type</label>
                            <p><i data-lucide="zap"></i> ${station.chargingType}</p>
                        </div>
                        <div class="detail-item">
                            <label>Operating Hours</label>
                            <p><i data-lucide="clock"></i> ${station.operatingHours}</p>
                        </div>
                        <div class="detail-item">
                            <label>Support Contact</label>
                            <p><i data-lucide="phone"></i> ${station.contact}</p>
                        </div>
                    </div>

                    <div class="card-actions mt-20">
                        <a href="index.html" class="btn-secondary"><i data-lucide="arrow-left"></i> Back to List</a>
                        <button class="btn-primary" 
                                onclick="openBookingModal(${station.id})" 
                                ${!isAvailable ? 'disabled title="Station currently unavailable"' : ''}>
                            <i data-lucide="zap"></i> Book Charging Slot Now
                        </button>
                    </div>
                </div>
            `;
            refreshIcons();
        })
        .catch(error => {
            stationDetails.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="x-circle" class="empty-icon"></i>
                    <p style="margin-top: 10px;">Unable to load station details.</p>
                    <a href="index.html" class="btn-secondary mt-20"><i data-lucide="arrow-left"></i> Back to Stations</a>
                </div>`;
            refreshIcons();
            console.error(error);
        });
}
