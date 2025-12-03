// assets/pages/promo-detail.js - CORRECTED FOR DATA WRAPPER



const PromoDetailPage = {

    promoId: null,



    init: function() {

        const urlParams = new URLSearchParams(window.location.search);

        this.promoId = urlParams.get('id');



        if (!this.promoId) {

            UI.showToast("No video specified.", 'error');

            return;

        }



        this.loadPromoDetail();

    },



    loadPromoDetail: async function() {

        try {

            const response = await Api.get(`/api/promos/${this.promoId}`);

            

            // 🎯 CRITICAL FIX: Extract the actual data object from the response wrapper.

            // This fixes the 'undefined' error and allows access to title, video_url, etc.

            const promoData = response.data || response;

            

            this.renderPromo(promoData);

        } catch (error) {

            UI.showToast("Failed to load video details.", 'error');

            console.error("Promo Detail load error:", error);

        }

    },



    renderPromo: function(promo) {

        // --- All property access is now on the clean promo object ---

        

        // 1. Update Titles

        $('#promo-title').text(promo.title || 'Untitled Promo');

        $('#detail-title').text(promo.title || 'Untitled Promo');

        $('#promo-description').text(promo.description || 'No description provided.');



        // 2. Video Player Setup

        // Check for common URL fields

        let rawVideoUrl = promo.video_url || promo.video || promo.url || promo.file_url;



        if (!rawVideoUrl) {

            $('#video-container').html('<div class="bg-gray-200 h-64 flex items-center justify-center rounded text-red-500">Video file not found in database.</div>');

            return;

        }



        // Construct the full URL if it's a relative path (e.g., just the filename)

        const videoUrl = (rawVideoUrl.startsWith('http') || rawVideoUrl.startsWith('/'))

            ? rawVideoUrl

            : `http://localhost:4000/uploads/promos/${rawVideoUrl}`;



        let videoHtml = `

            <video id="promo-video-player" controls preload="metadata" poster="${promo.metadata?.thumbnail_url || ''}" class="w-full h-auto rounded-lg shadow-lg" crossorigin="anonymous">

                <source src="${videoUrl}" type="video/mp4">

                <p>Your browser doesn't support HTML5 video. Here is a <a href="${videoUrl}">link to the video</a> instead.</p>

        `;

        

        // 3. Captions Track

        if (promo.caption_url) { 

            // Handle full vs relative path for captions

            const captionSrc = (promo.caption_url.startsWith('http')) 

                ? promo.caption_url 

                : `http://localhost:4000/uploads/promos/captions/${promo.caption_url}`;

                

            videoHtml += `<track kind="captions" src="${captionSrc}" srclang="en" label="English" default>`;

        } else if (promo.caption_text) {

             // Fallback for raw text transcript

             $('#promo-transcript').text(promo.caption_text);

             $('#transcript-section').removeClass('hidden');

        }



        videoHtml += `</video>`;



        $('#video-container').html(videoHtml);

    }

};