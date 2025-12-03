const EventDetailPage = {
    eventId: null,
    isAdmin: Auth.isAdmin(),
    isRegistered: false, // State tracking for the user

    init: function() {
        // Get Event ID from URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.eventId = urlParams.get('id');

        if (!this.eventId) {
            // NOTE: Replaced confirm() with UI.showToast() as per instructions
            UI.showToast("No event specified.", 'error');
            // Redirect or show error message
            return;
        }

        this.loadEventData();
        this.setupFeedbackForm();
    },

    loadEventData: async function() {
        let adminDataResult = null;
        let eventResponse = null;
        let feedbackResponse = null;
        
        try {
            // 1. Fetch Core Event Detail
            eventResponse = await Api.get(`/api/events/${this.eventId}`);
            // Handle response data wrapper if present
            const eventData = eventResponse.data || eventResponse;
            await this.renderEventDetail(eventData); 
        } catch (error) {
            UI.showToast("Failed to load core event details.", 'error');
            console.error("Detail load error (Event Detail):", error);
            return; 
        }

        try {
            // 2. Fetch Feedback (Isolate optional call)
            feedbackResponse = await Api.get(`/api/event-feedback/event/${this.eventId}`); 
            this.renderFeedback(feedbackResponse.data || feedbackResponse);
        } catch (error) {
            console.warn("Feedback load warning:", error);
            this.renderFeedback([]); 
        }

        // 3. Fetch role-specific data concurrently
        // 🛑 FIX: Use the correct endpoint for user registrations (with module prefix)
        const registrationPromise = Api.get(`/api/event-registrations/my-registrations`);
        const promises = [registrationPromise];

        if (this.isAdmin) {
            promises.push(Api.get(`/api/event-registrations/event/${this.eventId}/attendees`));
        }
        
        const settledResults = await Promise.allSettled(promises);
        const myRegistrationsResult = settledResults[0];

        if (myRegistrationsResult.status === 'fulfilled') {
            const myRegistrations = myRegistrationsResult.value.data || myRegistrationsResult.value;
             // Check if user is registered
            this.isRegistered = (Array.isArray(myRegistrations) ? myRegistrations : []).some(reg => reg.event_id === this.eventId);
        } else {
             console.error("Failed to load user registrations:", myRegistrationsResult.reason);
             this.isRegistered = false;
        }
        
        if (this.isAdmin && settledResults.length > 1) {
            const adminDataResultSettled = settledResults[1];
            if (adminDataResultSettled.status === 'fulfilled') {
                 adminDataResult = adminDataResultSettled.value;
                 this.renderRegistrants(adminDataResult.data || adminDataResult);
            } else {
                 this.renderRegistrants([]);
            }
        }

        // Pass the correct data object to renderActions
        const eventData = eventResponse.data || eventResponse;
        this.renderActions(eventData);

        $('#detail-loader').addClass('hidden');
        $('#event-content').removeClass('hidden');
    },

    renderEventDetail: async function(event) {
        $('#event-title').text(event.title);
        $('#event-detail-title').text(event.title);
        $('#event-location').text(`Location: ${event.location || 'Not Specified'}`);
        
        const start = new Date(event.starts_at);
        const end = new Date(event.ends_at);
        $('#event-datetime').text(`${start.toLocaleDateString()} ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);

        $('#event-description').html((event.description || 'No description provided.').replace(/\n/g, '<br>'));

        const imageUrl = event.metadata?.image_url 
            ? event.metadata.image_url 
            : 'https://placehold.co/1200x400/333/fff?text=Event+Image';

        $('#event-image').attr('src', imageUrl);

        if (event.location && event.location !== 'Not Specified') {
              const mapHtml = `<a href="https://maps.google.com/?q=${encodeURIComponent(event.location)}" target="_blank" class="text-blue-600 hover:underline flex items-center">
                                  <i class="fas fa-map-marker-alt mr-2"></i> View on Map
                                </a>`;
              $('#event-map-link').html(mapHtml);
        } else {
             $('#event-map-link').empty();
        }
    },

    renderActions: function(event) {
        const actionsContainer = $('#event-actions').empty();

        if (this.isAdmin) {
            actionsContainer.append(`
                <a href="event-create-edit.html?id=${this.eventId}" class="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition">
                    <i class="fas fa-edit"></i> Edit
                </a>
                <button onclick="EventDetailPage.deleteEvent('${this.eventId}')" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `);
            $('#registrants-panel').removeClass('hidden');
        } else {
            if (this.isRegistered) {
                actionsContainer.append(`
                    <button id="cancel-registration-btn" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                        Cancel Registration
                    </button>
                `);
                $('#cancel-registration-btn').on('click', () => this.cancelRegistration());
            } else if (event.published) {
                actionsContainer.append(`
                    <button id="register-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                        Register for Event
                    </button>
                `);
                $('#register-btn').on('click', () => this.registerForEvent());
            }
        }
    },

    registerForEvent: async function() {
        try {
            // 🛑 FIX: Changed endpoint from /api/event-registrations to /api/event-registrations/register
            await Api.post("/api/event-registrations/register", { event_id: this.eventId });
            UI.showToast("Successfully registered!", 'success');
            this.isRegistered = true;
            this.loadEventData(); 
        } catch (error) {
            const msg = error.responseJSON?.message || "Registration failed.";
            UI.showToast(msg, 'error');
        }
    },

    cancelRegistration: async function() {
        if (!confirm("Are you sure you want to cancel your registration?")) return; 
        try {
            // 🛑 FIX: Use the correct POST endpoint for cancellation as defined in backend routes
            // OLD ERROR CAUSE: await Api.delete(`/api/event-registrations/${this.eventId}`);
            await Api.post("/api/event-registrations/cancel", { event_id: this.eventId });
            
            UI.showToast("Registration cancelled.", 'success');
            this.isRegistered = false;
            this.loadEventData(); 
        } catch (error) {
            const msg = error.responseJSON?.message || "Cancellation failed.";
            UI.showToast(msg, 'error');
        }
    },

    deleteEvent: async function() {
        if (!confirm("WARNING: Delete this event?")) return;
        try {
            await Api.delete(`/api/events/${this.eventId}`);
            UI.showToast("Event deleted.", 'success');
            setTimeout(() => window.location.href = 'events.html', 1000);
        } catch (error) {
            UI.showToast("Failed to delete event.", 'error');
        }
    },

    renderRegistrants: function(registrants) {
        const list = $('#registrants-list').empty();
        
        if (!Array.isArray(registrants)) {
            $('#registrants-count').text(0);
            $('#no-registrants').removeClass('hidden');
            return;
        }
        
        $('#registrants-count').text(registrants.length);

        if (registrants.length === 0) {
            $('#no-registrants').removeClass('hidden');
            return;
        }

        registrants.forEach(reg => {
            list.append(`
                <li class="p-2 border-b last:border-b-0 text-sm flex justify-between items-center">
                    ${reg.user.full_name} (${reg.user.email})
                    <a href="profile.html?id=${reg.user.id}" class="text-xs text-blue-500 hover:underline">View Profile</a>
                </li>
            `);
        });
    },

    setupFeedbackForm: function() {
        const userId = Auth.getUser()?.id;
        for (let i = 1; i <= 5; i++) {
            $('#rating-stars').append(`<i class="far fa-star cursor-pointer hover:text-yellow-500" data-rating="${i}"></i>`);
        }

        $('#rating-stars i').on('click', function() {
            const rating = $(this).data('rating');
            $('#feedback-rating').val(rating);
            $('#rating-stars i').each(function(index, element) {
                $(element).removeClass('fas far').addClass(index < rating ? 'fas text-yellow-500' : 'far text-gray-400');
            });
        });

        $('#feedback-form').submit(async function(e) {
            e.preventDefault();
            const rating = $('#feedback-rating').val();
            const comment = $('#feedback-comment').val();
            
            if (!rating) {
                UI.showToast("Please select a rating.", 'error');
                return;
            }

            try {
                await Api.post("/api/event-feedback", { event_id: EventDetailPage.eventId, rating: parseInt(rating), comment });
                UI.showToast("Feedback submitted!", 'success');
                $('#add-feedback-section').addClass('hidden'); 
                EventDetailPage.loadEventData(); 
            } catch (error) {
                const msg = error.responseJSON?.message || "Feedback failed.";
                UI.showToast(msg, 'error');
            }
        });
    },

    renderFeedback: function(feedbacks) {
        const list = $('#feedback-list').empty();
        const userId = Auth.getUser()?.id;
        let totalRating = 0;
        let userHasSubmitted = false;
        
        const feedbackArray = Array.isArray(feedbacks) ? feedbacks : [];

        if (feedbackArray.length === 0) {
            $('#no-feedback').removeClass('hidden');
        } else {
            $('#no-feedback').addClass('hidden');
            
            feedbackArray.forEach(f => {
                totalRating += f.rating;
                if (f.user_id === userId) {
                    userHasSubmitted = true;
                }

                let stars = '';
                for (let i = 1; i <= 5; i++) {
                    stars += `<i class="fa-star ${i <= f.rating ? 'fas text-yellow-500' : 'far text-gray-300'} text-sm"></i>`;
                }

                list.append(`
                    <div class="border p-4 rounded-lg bg-white shadow-sm">
                        <div class="flex items-center mb-2">
                            <span class="font-semibold text-gray-800">${f.user.full_name || 'Anonymous User'}</span>
                            <span class="ml-auto">${stars}</span>
                        </div>
                        <p class="text-sm text-gray-600">${f.comment}</p>
                    </div>
                `);
            });

            const avgRating = (totalRating / feedbackArray.length).toFixed(1);
            $('#average-rating').text(avgRating);
            
            $('#avg-rating-stars').empty();
            const fullStars = Math.round(avgRating);
            for (let i = 1; i <= 5; i++) {
                $('#avg-rating-stars').append(`<i class="fa-star ${i <= fullStars ? 'fas' : 'far'}"></i>`);
            }
        }

        if (!this.isAdmin && this.isRegistered && !userHasSubmitted) {
            $('#add-feedback-section').removeClass('hidden');
            $('#feedback-already-submitted').addClass('hidden');
        } else if (userHasSubmitted) {
            $('#add-feedback-section').removeClass('hidden');
            $('#feedback-form').addClass('hidden');
            $('#feedback-already-submitted').removeClass('hidden').text("You have already submitted feedback for this event.");
        } else {
             $('#add-feedback-section').addClass('hidden');
        }
    }
};