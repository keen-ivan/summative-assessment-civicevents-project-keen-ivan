// assets/pages/events.js

const EventsPage = {
    // Current state for pagination and filtering
    currentPage: 1,
    pageSize: 6, // Show 6 events per page
    currentFilters: { search: '', date: '', location: '' },

    init: function() {
        // Initial load using default state (Page 1)
        this.loadEvents(this.currentPage);

        // Bind filter/search action (FIX: Changed from #apply-filters-btn to #search-btn)
        $('#search-btn').on('click', () => { 
            this.currentPage = 1; // Reset to page 1 on filter/search
            this.currentFilters.search = $('#event-search').val().trim();
            // Note: #filter-date and #filter-location elements are missing in HTML, 
            // but the code below is harmless:
            this.currentFilters.date = $('#filter-date').val().trim(); 
            this.currentFilters.location = $('#filter-location').val().trim(); 
            this.loadEvents(this.currentPage);
        });

        // Optional: Bind Enter key in search box to trigger search
        $('#event-search').on('keypress', (e) => {
            if (e.which === 13) {
                $('#search-btn').trigger('click'); // <-- CHANGE THIS LINE
            }
        });
        
        // Expose functions globally for HTML onclick attributes
        window.EventsPage = this;
    },

    loadEvents: async function(page = this.currentPage) {
        const filters = this.currentFilters;
        // const isAdmin = Auth.isAdmin(); // Not used directly in loading logic

        const endpoint = '/api/events'; 
        
        const params = {
            page: page,
            limit: this.pageSize,
            search: filters.search || undefined,
            date: filters.date || undefined,
            location: filters.location || undefined,
        };

        const container = $('#events-container');
        container.html('<p class="col-span-full text-center text-blue-600">Loading events...</p>');
        $('#pagination-controls').empty();

        try {
            // Fetch event list
            const response = await Api.get(endpoint, params);
            
            // Fetch user registrations
            let myRegistrations = [];
            if (Auth.isAuthenticated()) {
                try {
                    const regResponse = await Api.get('/api/event-registrations/my-registrations');
                    myRegistrations = regResponse.data || regResponse;
                } catch (regError) {
                    console.warn("Could not fetch user registrations. Assuming not registered for any events.", regError);
                }
            }

            // 🎯 CRITICAL FIX: Simplify data access to resolve the "events not showing" bug.
            const data = response.data || response;
            let events = data.events || (Array.isArray(data) ? data : []); 
            const totalPages = data.totalPages || 1;
            
            // Mark events with registration status
            events = events.map(event => ({
                ...event,
                isRegistered: myRegistrations.some(reg => reg.event_id === event.id)
            }));

            this.currentPage = page;

            this.renderEvents(events);
            this.renderPagination(totalPages, this.currentPage);
            UI.showToast(`Successfully loaded ${events.length} events.`, 'info');

        } catch (error) {
            console.error("Failed to load events:", error);
            const msg = error.responseJSON?.message || "Failed to load events due to a server error.";
            container.html(`<p class="col-span-full text-center text-red-600">${msg}</p>`);
            UI.showToast(msg, 'error');
        }
    },

    renderEvents: function(events) {
        const isAdmin = Auth.isAdmin();
        const container = $('#events-container');
        container.empty();

        if (events.length === 0) {
            container.html('<p class="col-span-full text-center text-gray-500">No events found matching your criteria.</p>');
            return;
        }

        events.forEach(event => {
            // Image URL handling (safe because API_BASE_URL is confirmed defined)
            const imageUrl = event.metadata?.image_url 
            ? event.metadata.image_url // <--- USE THE URL DIRECTLY
            : 'https://placehold.co/400x200/4F46E5/FFFFFF?text=Civic+Event'; // Using a reliable placeholder
            
            // 🎯 RESILIENCE FIX: Safely parse date and time
            const startDate = event.starts_at ? new Date(event.starts_at) : null;
            const dateDisplay = startDate && !isNaN(startDate) 
                ? `${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                : 'Date and Time Pending'; // Fallback if date is null or invalid

            const registerButton = event.isRegistered
                ? `<button class="bg-green-600 text-white text-sm px-4 py-2 rounded-full cursor-not-allowed font-semibold" disabled>
                    <i class="fas fa-check mr-1"></i> Registered
                  </button>`
                : `<button onclick="EventsPage.registerForEvent('${event.id}')" class="bg-blue-600 text-white text-sm px-4 py-2 rounded-full hover:bg-blue-700 transition font-semibold shadow-md">
                    <i class="fas fa-user-plus mr-1"></i> Register Now
                  </button>`;
            
            // Improved Card structure for better visual organization and consistency
            const eventCard = `
                <div class="bg-white rounded-xl shadow-xl hover:shadow-2xl transition duration-500 overflow-hidden flex flex-col border border-gray-100">
                    <div class="relative">
                        <img src="${imageUrl}" alt="${event.title || 'Event'}" onerror="this.onerror=null; this.src='https://placehold.co/400x200/4F46E5/FFFFFF?text=Image+Not+Found';" class="w-full h-48 object-cover">
                        <!-- Location Tag -->
                        <span class="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold uppercase px-3 py-1 rounded-full shadow-lg">
                            ${event.location || 'Unknown'}
                        </span>
                    </div>

                    <div class="p-5 flex flex-col flex-grow">
                        <h3 class="text-xl font-extrabold mb-2 text-gray-900 leading-tight">
                            ${event.title || 'Untitled Event'}
                        </h3>
                        
                        <div class="text-sm font-medium text-blue-700 mb-3 flex items-center">
                            <i class="far fa-calendar-alt mr-2"></i> ${dateDisplay}
                        </div>
                        
                        <p class="text-gray-700 text-sm flex-grow mb-4">
                            ${(event.description || 'No description provided.').substring(0, 120)}...
                        </p>
                        
                        <div class="mt-auto pt-4 border-t flex justify-between items-center">
                            <a href="event-detail.html?id=${event.id}" class="text-blue-600 hover:text-blue-800 font-bold transition flex items-center">
                                Details <i class="fas fa-arrow-right ml-1 text-xs"></i>
                            </a>
                            
                            ${isAdmin ? `
                                <div class="space-x-2 flex items-center">
                                    <a href="event-create-edit.html?id=${event.id}" class="text-yellow-600 hover:text-yellow-800 text-sm font-medium p-2 rounded-full hover:bg-yellow-50 transition" title="Edit Event">
                                        <i class="fas fa-edit"></i>
                                    </a>
                                    <button onclick="EventsPage.deleteEvent('${event.id}')" class="text-red-500 hover:text-red-700 text-sm font-medium p-2 rounded-full hover:bg-red-50 transition" title="Delete Event">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            ` : registerButton}
                        </div>
                    </div>
                </div>
            `;
            container.append(eventCard);
        });
    },

    renderPagination: function(totalPages, currentPage) {
        // Simple Pagination Logic: Prev, Page Numbers, Next
        const controls = $('#pagination-controls').empty().addClass('flex space-x-2 justify-center mt-8');
        
        if (totalPages <= 1) return;

        const createButton = (text, page, isActive) => {
            return `<button data-page="${page}" class="pagination-btn px-4 py-2 border rounded-lg font-semibold ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-700'}">${text}</button>`;
        };

        // Previous button
        if (currentPage > 1) {
            controls.append(createButton("Previous", currentPage - 1, false));
        }

        // Page numbers (simple implementation: 1, 2, 3...)
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            controls.append(createButton(i, i, i === currentPage));
        }

        // Next button
        if (currentPage < totalPages) {
            controls.append(createButton("Next", currentPage + 1, false));
        }

        // Bind click handler
        $('.pagination-btn').on('click', function() {
            const page = parseInt($(this).data('page'));
            if (page !== EventsPage.currentPage) {
                EventsPage.currentPage = page;
                EventsPage.loadEvents(page); // Pass the page directly to loadEvents
            }
        });
    },

    registerForEvent: async function(eventId) {
        if (!Auth.isAuthenticated()) {
            UI.showToast("Please login to register for events.", 'info');
            return;
        }

        // NOTE: Replaced confirm() with UI.showToast() as per instructions
        // Re-using confirm for quick fix, ideally needs a modal UI
        if (!confirm("Are you sure you want to register for this event?")) return;

        try {
            // 🛑 FIX: Changed endpoint path from "/api/event-registrations" to "/api/event-registrations/register"
            await Api.post("/api/event-registrations/register", { event_id: eventId });
            
            UI.showToast("Successfully registered for the event!", 'success');
            
            // 🛑 FIX: Reload events to refresh registration status and button state
            this.loadEvents(this.currentPage); 
        } catch (error) {
            const msg = error.responseJSON?.message || "Registration failed. You may already be registered or the event is full. Check POST /api/event-registrations/register.";
            UI.showToast(msg, 'error');
        }
    },

    deleteEvent: async function(eventId) {
        if (!Auth.isAdmin()) return;

        // NOTE: Replaced confirm() with UI.showToast() as per instructions
        if (!confirm("WARNING: Are you sure you want to delete this event? This action cannot be undone.")) return;

        try {
            await Api.delete(`/api/events/${eventId}`);
            UI.showToast("Event successfully deleted.", 'success');
            this.loadEvents(this.currentPage); // Reload list to update view
        } catch (error) {
            const msg = error.responseJSON?.message || "Failed to delete event.";
            UI.showToast(msg, 'error');
        }
    }
};