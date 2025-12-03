// assets/pages/announcements.js

const AnnouncementsPage = {
    isAdmin: Auth.isAdmin(),

    init: function() {
        this.loadAnnouncements();

        if (this.isAdmin) {
            $('#create-announcement-btn').removeClass('hidden').on('click', () => $('#create-modal').removeClass('hidden'));
            $('#close-modal-btn').on('click', () => $('#create-modal').addClass('hidden'));
            $('#announcement-form').on('submit', this.handleCreateAnnouncement.bind(this));
        }
    },

    loadAnnouncements: async function() {
        const list = $('#announcement-list').empty();
        list.html('<div class="h-20 bg-white rounded-lg shadow animate-pulse"></div><div class="h-20 bg-white rounded-lg shadow animate-pulse"></div>'); // Show skeleton

        try {
            // FIX: Use the base endpoint '/api/announcements' for ALL requests.
            // The server will handle filtering based on the token/query parameter.
            const endpoint = "/api/announcements"; 
            
            // If the user is NOT admin, send a flag to request only published announcements.
            // If the user IS admin, they get all (published: undefined) by default.
            const params = this.isAdmin ? {} : { published: true };
            
            // Use 'Api' (lowercase 'a') for consistency
            const response = await Api.get(endpoint, params);
            
            // Assuming response contains the announcement array directly or under a 'data' key
            this.renderAnnouncements(response.data || response); 

        } catch (error) {
            UI.showToast("Failed to load announcements.", 'error');
            list.html('<p class="text-center text-red-500 mt-8">Error loading announcements.</p>');
        }
    },

    renderAnnouncements: function(announcements) {
        const list = $('#announcement-list').empty();

        if (announcements.length === 0) {
            list.html('<p class="text-center text-gray-500 mt-8">No announcements available.</p>');
            return;
        }
        
        // Loop through and render cards
        announcements.forEach(announcement => {
            const audioUrl = announcement.audio_url; // Adjust path as needed
            
            const card = `
                <div class="announcement-card bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <i class="fas fa-volume-up text-blue-600 text-2xl"></i>
                    <div class="flex-grow">
                        <h3 class="font-bold text-lg text-gray-800">${announcement.title}</h3>
                        <p class="text-xs text-gray-500">Published: ${new Date(announcement.created_at).toLocaleDateString()}</p>
                    </div>
                    
                    <audio controls class="w-full sm:w-1/2">
                        <source src="${audioUrl}" type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>

                    ${this.isAdmin ? `
                        <div class="flex space-x-2">
                            <button onclick="AnnouncementsPage.deleteAnnouncement('${announcement.id}')" class="text-red-500 hover:text-red-700 text-sm"><i class="fas fa-trash"></i></button>
                        </div>
                    ` : ''}
                </div>
            `;
            list.append(card);
        });
    },

    handleCreateAnnouncement: async function(e) {
        e.preventDefault();
        const btn = $('#announcement-submit-btn');
        btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Uploading...');

        try {
            const formData = new FormData();
            formData.append('title', $('#announcement-title').val());
            formData.append('audio', $('#audio-upload')[0].files[0]); // File key 'audio'
            formData.append('published', $('#announcement-published').is(':checked'));

            // Use the generic upload function
            // Use 'Api' (lowercase 'a') for consistency
            await Api.upload("/api/announcements", formData); 

            UI.showToast("Announcement created and published successfully! Notification broadcasted.", 'success');
            $('#create-modal').addClass('hidden');
            $('#announcement-form')[0].reset();
            this.loadAnnouncements(); // Reload the list

        } catch (error) {
            const msg = error.responseJSON?.message || "Failed to create announcement. Check file size/type.";
            UI.showToast(msg, 'error');
        } finally {
            btn.prop('disabled', false).html('Publish');
        }
    },

    deleteAnnouncement: async function(id) {
        if (!confirm("Are you sure you want to delete this announcement?")) return;
        try {
            // Use 'Api' (lowercase 'a') for consistency
            await Api.delete(`/api/announcements/${id}`);
            UI.showToast("Announcement deleted.", 'success');
            this.loadAnnouncements(); // Reload the list
        } catch (error) {
            UI.showToast("Failed to delete announcement.", 'error');
        }
    }
};