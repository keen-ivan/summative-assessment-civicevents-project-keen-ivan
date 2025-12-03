// assets/pages/service-request.js

$(document).ready(function() {
    $('#service-request-form').on('submit', async function(e) {
        e.preventDefault();
        const btn = $('#submit-request-btn');
        btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Submitting...');

        try {
            const formData = new FormData();
            formData.append('category', $('#category').val());
            formData.append('subject', $('#subject').val());
            formData.append('description', $('#description').val());
            formData.append('location', $('#location').val());
            
            // Check for file attachment
            const file = $('#attachment')[0].files[0];
            if (file) {
                formData.append('attachment', file); // Backend expects key 'attachment'
            }

            // Use the generic upload function since we may have a file
            const result = await Api.upload("/api/service-requests", formData); 

            UI.showToast(`Request submitted! Tracking ID: ${result.tracking_id || result.id}`, 'success');
            $('#service-request-form')[0].reset(); // Clear form on success

        } catch (error) {
            let msg = "Failed to submit request. Check your input and file size.";
            if (error.responseJSON && error.responseJSON.message) {
                msg = error.responseJSON.message;
            }
            UI.showToast(msg, 'error');
        } finally {
            btn.prop('disabled', false).html('<i class="fas fa-paper-plane mr-2"></i> Submit Request');
        }
    });
});