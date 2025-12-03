// assets/pages/service-requests-admin.js

const AdminServiceRequestsPage = {
    currentPage: 1,
    pageSize: 10,
    currentFilters: { search: '', category: '', status: '' },

    init: function() {
        this.loadRequests();
        
        // Bind filters
        $('#apply-request-filters').on('click', () => {
            this.currentPage = 1;
            this.currentFilters.search = $('#request-search').val();
            this.currentFilters.category = $('#filter-category').val();
            this.currentFilters.status = $('#filter-status').val();
            this.loadRequests();
        });
        
        // Expose function for inline onclick handler
        window.updateRequestStatus = this.updateRequestStatus.bind(this);
    },

    loadRequests: async function() {
        const body = $('#request-table-body').empty();
        body.html('<tr><td colspan="5" class="text-center py-4 text-gray-500 animate-pulse">Loading service requests...</td></tr>');
        
        try {
            const queryParams = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                search: this.currentFilters.search,
                category: this.currentFilters.category,
                status: this.currentFilters.status
            }).toString();

            // Assuming a dedicated admin endpoint for listing all requests
            const response = await Api.get(`/api/service-requests/admin?${queryParams}`);
            const requests = response.data || response;
            
            this.renderRequests(requests);
            this.renderPagination(response.total_pages, response.currentPage);

        } catch (error) {
            UI.showToast("Failed to load service requests.", 'error');
            body.html('<tr><td colspan="5" class="text-center py-4 text-red-500">Error loading requests.</td></tr>');
        }
    },

    getStatusBadge: function(status) {
        const base = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ';
        switch (status) {
            case 'pending':
                return base + 'bg-red-100 text-red-800';
            case 'in_progress':
                return base + 'bg-yellow-100 text-yellow-800';
            case 'resolved':
                return base + 'bg-green-100 text-green-800';
            case 'closed':
                return base + 'bg-gray-100 text-gray-800';
            default:
                return base + 'bg-gray-100 text-gray-800';
        }
    },
    
    // Helper to format category for display (e.g., 'infrastructure' -> 'Infrastructure')
    formatCategory: function(cat) {
        return cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ');
    },

    renderRequests: function(requests) {
        const body = $('#request-table-body').empty();

        if (requests.length === 0) {
            body.html('<tr><td colspan="5" class="text-center py-4 text-gray-500">No service requests found.</td></tr>');
            return;
        }

        requests.forEach(req => {
            const badgeClass = this.getStatusBadge(req.status);
            const formattedCategory = this.formatCategory(req.category);
            const submittedDate = new Date(req.created_at).toLocaleDateString();

            // Status selection dropdown for action
            const statusOptions = ['pending', 'in_progress', 'resolved', 'closed'].map(s => 
                `<option value="${s}" ${s === req.status ? 'selected' : ''}>${this.formatCategory(s)}</option>`
            ).join('');

            const actionControls = `
                <div class="flex flex-col space-y-2 items-center">
                    <select id="status-select-${req.id}" class="p-1 border rounded text-sm w-full">
                        ${statusOptions}
                    </select>
                    <button onclick="updateRequestStatus('${req.id}')" class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition w-full">Update</button>
                    ${req.attachment_url ? `<a href="http://localhost:4000/uploads/requests/${req.attachment_url}" target="_blank" class="text-xs text-indigo-600 hover:underline"><i class="fas fa-image"></i> View Attachment</a>` : ''}
                    <button onclick="alert('Details of request ${req.id}:\\n${req.description}')" class="text-xs text-gray-600 hover:underline">View Detail</button>
                </div>
            `;
            
            body.append(`
                <tr id="request-row-${req.id}">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #${req.id} <br><span class="text-xs text-gray-500">${formattedCategory}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        ${req.subject}<br>
                        <span class="text-xs text-gray-500">By: ${req.user.full_name} (${req.user.email})</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${submittedDate}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="${badgeClass}">${this.formatCategory(req.status)}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ${actionControls}
                    </td>
                </tr>
            `);
        });
    },

    renderPagination: function(totalPages, currentPage) {
        // (Pagination logic reused from AdminUsersPage or events.js)
        // Omitted for brevity, but assumes the implementation exists and links to loadRequests
    },

    updateRequestStatus: async function(requestId) {
        const newStatus = $(`#status-select-${requestId}`).val();
        
        try {
            // Assuming API endpoint: PATCH /api/service-requests/:id
            await Api.patch(`/api/service-requests/${requestId}`, { status: newStatus });
            UI.showToast(`Request #${requestId} updated to ${this.formatCategory(newStatus)}.`, 'success');
            
            // Instantly update the badge without full reload (optimistic update)
            const badge = $(`#request-row-${requestId} .whitespace-nowrap > span:first-child`);
            badge.attr('class', this.getStatusBadge(newStatus)).text(this.formatCategory(newStatus));

        } catch (error) {
            UI.showToast(`Failed to update status for request #${requestId}.`, 'error');
        }
    }
};