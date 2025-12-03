// assets/pages/promos.js

const PromosPage = {
    isAdmin: Auth.isAdmin(),

    init: function() {
        this.loadPromos();
        if (this.isAdmin) {
            $('#create-promo-btn').removeClass('hidden').on('click', () => {
                window.location.href = 'promo-create-edit.html';
            });
        }
    },

    loadPromos: async function() {
        const grid = $('#promos-grid').empty();
        grid.html('<div class="h-64 bg-white rounded-lg shadow animate-pulse"></div><div class="h-64 bg-white rounded-lg shadow animate-pulse hidden md:block"></div><div class="h-64 bg-white rounded-lg shadow animate-pulse hidden lg:block"></div>');

        try {
            const endpoint = "/api/promos"; 
            const params = this.isAdmin ? {} : { published: true }; // Filter for users
            const promos = await Api.get(endpoint, params);
            
            this.renderPromos(promos.data || promos);

        } catch (error) {
            UI.showToast("Failed to load promos.", 'error');
            grid.html('<p class="col-span-full text-center text-red-500 mt-8">Error loading promotional videos.</p>');
        }
    },

    renderPromos: function(promos) {
        const grid = $('#promos-grid').empty();

        if (promos.length === 0) {
            grid.html('<p class="col-span-full text-center text-gray-500 mt-8">No promotional videos available.</p>');
            return;
        }

        promos.forEach(promo => {
            // 🎯 FIX: Use the thumbnail URL directly (backend provides full URL)
            const thumbnailUrl = promo.metadata?.thumbnail_url 
                ? promo.metadata.thumbnail_url 
                : 'https://via.placeholder.com/400x250?text=Video+Thumbnail';
            
            const card = `
                <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden flex flex-col">
                    <div class="relative h-48 w-full">
                        <img src="${thumbnailUrl}" alt="${promo.title}" class="w-full h-full object-cover">
                        <a href="promo-detail.html?id=${promo.id}" class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition">
                            <i class="fas fa-play text-white text-4xl p-4 bg-blue-600 rounded-full"></i>
                        </a>
                    </div>
                    <div class="p-4 flex-grow flex flex-col">
                        <h3 class="text-xl font-bold mb-1 text-gray-800">${promo.title}</h3>
                        <p class="text-gray-600 text-sm flex-grow">${(promo.description || '').substring(0, 80)}...</p>
                        ${this.isAdmin ? `
                            <div class="mt-3 flex justify-end space-x-2 pt-2 border-t">
                                <button onclick="PromosPage.togglePublish('${promo.id}', ${promo.published})" class="text-xs px-2 py-1 rounded ${promo.published ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}">${promo.published ? 'Unpublish' : 'Publish'}</button>
                                <button onclick="PromosPage.deletePromo('${promo.id}')" class="text-red-500 hover:text-red-700 text-sm"><i class="fas fa-trash"></i></button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            grid.append(card);
        });
    },
    
    // ... togglePublish and deletePromo remain the same ...
    togglePublish: async function(id, isPublished) {
        const action = isPublished ? 'unpublish' : 'publish';
        const endpoint = `/api/promos/${id}/${action}`;
        try {
            await Api.patch(endpoint);
            UI.showToast(`Promo successfully ${action}ed!`, 'success');
            this.loadPromos();
        } catch (error) {
            UI.showToast(`Failed to ${action} promo.`, 'error');
        }
    },

    deletePromo: async function(id) {
        if (!confirm("Are you sure you want to delete this promotional video?")) return;
        try {
            await Api.delete(`/api/promos/${id}`);
            UI.showToast("Promo deleted.", 'success');
            this.loadPromos(); 
        } catch (error) {
            UI.showToast("Failed to delete promo.", 'error');
        }
    }
};