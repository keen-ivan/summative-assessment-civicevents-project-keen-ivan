const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const EventFormPage = {
    eventId: null,
    isEditMode: false,
    originalImageUrl: null, // To store the existing image URL during edit

    init: function() {
        // 1. Check for Edit Mode
        const urlParams = new URLSearchParams(window.location.search);
        this.eventId = urlParams.get('id');
        this.isEditMode = !!this.eventId;

        // Check for admin status before proceeding
        if (!Auth.isAdmin()) {
            UI.showToast("Access denied. Only administrators can create or edit events.", 'error');
            setTimeout(() => window.location.href = 'events.html', 1500);
            return;
        }

        if (this.isEditMode) {
            $('#form-title').text('Edit Event');
            $('#header-title').text('Edit Event Details');
            $('#submit-btn').html('<i class="fas fa-edit mr-2"></i> Update Event');
            this.loadEventForEdit();
        } else {
            $('#submit-btn').html('<i class="fas fa-save mr-2"></i> Save Event');
        }

        // 2. Setup Listeners
        this.setupImagePreview();
        $('#event-form').submit(this.handleFormSubmission.bind(this));
    },

    loadEventForEdit: async function() {
        try {
            const event = await Api.get(`/api/events/${this.eventId}`);
            
            // Populate form fields
            $('#title').val(event.title);
            $('#location').val(event.location);
            $('#description').val(event.description);
            $('#published').prop('checked', event.published);
            
            // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
            $('#starts_at').val(this.formatDateToLocal(event.starts_at));
            $('#ends_at').val(this.formatDateToLocal(event.ends_at));
            
            // Set image preview if metadata exists
            if (event.metadata?.image_url) {
                this.originalImageUrl = event.metadata.image_url;
                // NOTE: Hardcoded localhost URL. Consider using a dynamic base URL if deployed.
                const imageUrl = `http://localhost:4000/uploads/events/${this.originalImageUrl}`; 
                $('#image-preview').attr('src', imageUrl);
            }

        } catch (error) {
            UI.showToast("Failed to load event for editing.", 'error');
            setTimeout(() => window.location.href = 'events.html', 2000);
        }
    },

    formatDateToLocal: function(isoString) {
        // Helper function to convert ISO string (assumed to be UTC or with Z) to 
        // the format required by datetime-local input (YYYY-MM-DDThh:mm)
        if (!isoString) return '';
        const date = new Date(isoString);
        
        try {
            // Adjusts to local timezone before formatting
            const formatted = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            return formatted;
        } catch {
            return '';
        }
    },

    setupImagePreview: function() {
        $('#image-upload').on('change', function(e) {
            const file = e.target.files[0];
            const preview = $('#image-preview');
            const errorElement = $('#image-error');

            errorElement.addClass('hidden');
            
            if (file) {
                // 1. Client-side Validation (Size)
                if (file.size > MAX_IMAGE_SIZE_BYTES) {
                    errorElement.text(`Image size cannot exceed ${MAX_IMAGE_SIZE_MB}MB.`).removeClass('hidden');
                    // Clear the input
                    $('#image-upload').val(''); 
                    preview.attr('src', 'https://placehold.co/200x128/ccc/333?text=Size+Error');
                    return;
                }

                // 2. Show Preview
                const reader = new FileReader();
                reader.onload = function(event) {
                    preview.attr('src', event.target.result);
                };
                reader.readAsDataURL(file);
            } else {
                // Reset to placeholder if no file is selected
                 preview.attr('src', 'https://placehold.co/200x128/ccc/333?text=Image+Preview');
            }
        });
    },

    handleFormSubmission: async function(e) {
        e.preventDefault();
        $('#submit-btn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Processing...');
        
        const file = $('#image-upload')[0].files[0]; // Check for file early
        
        // 1. Gather all non-file data
        let eventData = {
            title: $('#title').val(),
            location: $('#location').val(),
            description: $('#description').val(),
            starts_at: $('#starts_at').val(),
            ends_at: $('#ends_at').val(),
            published: $('#published').is(':checked'),
        };
        
        // 🛑 FIX: Only include original_image_url if we are editing AND NOT uploading a new file.
        // If a file is uploaded, the backend knows to replace the existing image.
        if (!file && this.isEditMode && this.originalImageUrl) {
            eventData.original_image_url = this.originalImageUrl; 
        }

        // 2. Client-side Time Validation
        if (new Date(eventData.starts_at) >= new Date(eventData.ends_at)) {
             UI.showToast("Start time must be before end time.", 'error');
             this.resetButton();
             return;
        }

        try {
            let result;
            
            if (file) {
                // Scenario A: File Upload Required (Create or Edit with new image)
                const formData = new FormData();
                formData.append('image', file); // The backend expects key 'image'
                
                // Append all other fields as individual parts
                for (const key in eventData) {
                    // Note: eventData is now cleaned and only contains original_image_url 
                    // if no file was uploaded (Scenario B), but since we are in Scenario A here,
                    // original_image_url will not be present.
                    formData.append(key, eventData[key]);
                }

                if (this.isEditMode) {
                    // PUT/PATCH for update with new image
                    result = await Api.upload(`/api/events/${this.eventId}`, formData);
                } else {
                    // POST for create with new image
                    result = await Api.upload("/api/events", formData);
                }

            } else {
                 // Scenario B: No File Upload (Simple JSON POST/PUT/PATCH)
                if (this.isEditMode) {
                    // PUT/PATCH for update (keeping original image)
                    result = await Api.put(`/api/events/${this.eventId}`, eventData);
                } else {
                     // POST for create (without image)
                    result = await Api.post("/api/events", eventData);
                }
            }

            // Success Handling
            UI.showToast(`Event successfully ${this.isEditMode ? 'updated' : 'created'}!`, 'success');
            setTimeout(() => {
                // Navigate to the detail page of the new/updated event
                window.location.href = `event-detail.html?id=${result.id || this.eventId}`;
            }, 1000);

        } catch (error) {
            const msg = error.responseJSON?.message || "Operation failed due to a server error.";
            UI.showToast(msg, 'error');
        } finally {
            this.resetButton();
        }
    },

    resetButton: function() {
        $('#submit-btn').prop('disabled', false).html(`<i class="fas fa-save mr-2"></i> ${this.isEditMode ? 'Update Event' : 'Save Event'}`);
    }
};

// Auto-initialize
$(document).ready(function() {
    EventFormPage.init();
});