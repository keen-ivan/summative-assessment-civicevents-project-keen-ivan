// assets/pages/my-registrations.js

const MyRegistrationsPage = {
    init: function() {
        this.loadRegistrations();
        // Expose the cancel function globally for the onclick attribute in HTML
        window.cancelRegistration = this.cancelRegistration.bind(this);
    },

    loadRegistrations: async function() {
        const list = $('#registration-list').empty();
        list.html('<div class="h-28 bg-white rounded-lg shadow animate-pulse"></div><div class="h-28 bg-white rounded-lg shadow animate-pulse"></div>'); // Show skeleton

        try {
            // 🛑 FIX: Changed endpoint from /api/registrations/my-registrations to /api/event-registrations/my-registrations
            // This matches the backend router prefix 'event-registrations'
            const endpoint = "/api/event-registrations/my-registrations";
            const response = await Api.get(endpoint);
            const registrations = response.data || response;
            
            this.renderRegistrations(registrations);

        } catch (error) {
            UI.showToast("Failed to load your event registrations.", 'error');
            list.html('<p class="text-center text-red-500 mt-8">Error loading registrations.</p>');
        }
    },

    renderRegistrations: function(registrations) {
        const list = $('#registration-list').empty();

        if (registrations.length === 0) {
            list.html('<p class="text-center text-gray-500 mt-8 text-xl p-10 bg-white rounded-lg shadow"><i class="fas fa-check-circle mr-2"></i> You are not currently registered for any upcoming events.</p>');
            return;
        }
        
        registrations.forEach(reg => {
            // Assume each registration object contains the event details (event_id, event_title, starts_at, etc.)
            const event = reg.event || reg; // Use event if nested, otherwise use the registration object itself
            
            // Format dates
            const startDate = new Date(event.starts_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            const card = `
                <div id="reg-card-${reg.id}" class="bg-white p-5 rounded-lg shadow flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
                    
                    <div class="flex-grow">
                        <a href="event-detail.html?id=${event.event_id || event.id}" class="text-xl font-bold text-blue-600 hover:text-blue-800 transition">${event.event_title || event.title}</a>
                        <p class="text-sm text-gray-700 mt-1"><i class="far fa-calendar-alt mr-1"></i> **When:** ${startDate}</p>
                        <p class="text-sm text-gray-700"><i class="fas fa-map-marker-alt mr-1"></i> **Where:** ${event.location}</p>
                    </div>

                    <div class="flex space-x-3 items-center">
                        <span class="text-sm font-medium text-green-600 border border-green-300 bg-green-50 px-3 py-1 rounded-full">
                            REGISTERED
                        </span>
                        <!-- Pass event ID instead of registration ID for the backend logic -->
                        <button onclick="cancelRegistration('${event.id || event.event_id}')" class="cancel-btn bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition text-sm font-semibold">
                            <i class="fas fa-times-circle mr-1"></i> Cancel Registration
                        </button>
                    </div>
                </div>
            `;
            list.append(card);
        });
    },

    cancelRegistration: async function(eventId) {
        if (!confirm("Are you sure you want to cancel your registration for this event?")) return;
        
        // Note: We might not have the registration ID here easily if we passed event ID, 
        // but for UI feedback we can try to find the card. 
        // However, reloading the list is safer to sync state.
        
        try {
            // 🛑 FIX: Use the correct POST endpoint for cancellation as defined in backend routes
            // OLD ERROR CAUSE: await Api.delete(`/api/event-registrations/${registrationId}`);
            // Backend expects: POST /api/event-registrations/cancel with body { event_id: ... }
            await Api.post("/api/event-registrations/cancel", { event_id: eventId });

            UI.showToast("Registration successfully cancelled. You have been unsubscribed from the event.", 'success');
            
            // Reload the list to reflect changes
            this.loadRegistrations();

        } catch (error) {
            const msg = error.responseJSON?.message || "Failed to cancel registration.";
            UI.showToast(msg, 'error');
        }
    }
};