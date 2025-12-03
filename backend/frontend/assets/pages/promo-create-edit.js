// assets/pages/promo-create-edit.js - Fixes 400 Validation Error

$(document).ready(function() {
    // Ensure auth check
    if (!Auth.isAdmin()) {
        window.location.href = 'promos.html';
        return;
    }

    $('#promo-form').on('submit', async function(e) {
        e.preventDefault();
        const btn = $('#promo-submit-btn');
        
        // --- START FIX: Basic Frontend Validation ---
        const title = $('#promo-title-input').val().trim();
        const videoFile = $('#video-upload')[0].files[0]; 
        
        if (!title) {
            UI.showToast("Title is required.", 'warning');
            return;
        }
        if (!videoFile) {
            UI.showToast("Video file is required.", 'warning');
            return;
        }
        // --- END FIX ---
        
        btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Initializing Upload...');
        $('#upload-progress').removeClass('hidden');

        try {
            const formData = new FormData();
            
            // 1. Ensure trimmed values for text fields
            formData.append('title', title);
            formData.append('description', $('#promo-description-input').val().trim());
            
            // 2. Append file object
            formData.append('video', videoFile); 
            
            // 3. Caption text
            formData.append('caption_text', $('#caption-text').val().trim()); 
            
            // 4. FIX: Send boolean as 1 or 0 (a standard workaround for FormData boolean validation issues)
            const publishedStatus = $('#promo-published').is(':checked') ? 1 : 0;
            formData.append('published', publishedStatus); 

            // Use global API_BASE_URL if defined in api.js
            const baseUrl = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'http://localhost:4000';

            await $.ajax({
                url: `${baseUrl}/api/promos`,
                type: 'POST',
                data: formData,
                processData: false, 
                contentType: false, 
                headers: {
                    "Authorization": `Bearer ${Auth.getToken()}`
                },
                xhr: function() {
                    const xhr = new window.XMLHttpRequest();
                    xhr.upload.addEventListener("progress", function(evt) {
                        if (evt.lengthComputable) {
                            const percentComplete = (evt.loaded / evt.total) * 100;
                            $('#progress-bar').css('width', percentComplete + '%');
                            btn.html(`<i class="fas fa-spinner fa-spin mr-2"></i> Uploading (${Math.round(percentComplete)}%)`);
                        }
                    }, false);
                    return xhr;
                }
            });

            UI.showToast("Promo video uploaded and created successfully!", 'success');
            setTimeout(() => window.location.href = 'promos.html', 1500);

        } catch (error) {
            let msg = "Video upload failed. Check file size, type, and required fields.";
            if (error.responseJSON && error.responseJSON.message) {
                // This line will now display the backend's explicit validation message
                msg = error.responseJSON.message; 
            }
            UI.showToast(msg, 'error');
            $('#progress-bar').css('width', '0%');
        } finally {
            btn.prop('disabled', false).html('<i class="fas fa-upload mr-2"></i> Upload & Publish');
            $('#upload-progress').addClass('hidden');
        }
    });
});