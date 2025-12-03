// assets/pages/users-admin.js

const AdminUsersPage = {
    currentPage: 1,
    pageSize: 10,
    currentFilters: { search: '', role: '', status: '' },

    init: function() {
        this.loadUsers();
        $('#apply-user-filters').on('click', () => {
            this.currentPage = 1;
            this.currentFilters.search = $('#user-search').val();
            this.currentFilters.role = $('#filter-role').val();
            this.currentFilters.status = $('#filter-status').val();
            this.loadUsers();
        });
    },

    loadUsers: async function() {
        const body = $('#user-table-body').empty();
        body.html('<tr><td colspan="5" class="text-center py-4 text-gray-500 animate-pulse">Loading users...</td></tr>');
        
        try {
            const queryParams = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                search: this.currentFilters.search,
                role: this.currentFilters.role,
                status: this.currentFilters.status === 'active' ? true : (this.currentFilters.status === 'inactive' ? false : '')
            }).toString();

            // Assuming a dedicated admin endpoint for user listing
            const response = await Api.get(`/api/users?${queryParams}`);
            const users = response.data || response;
            
            this.renderUsers(users);
            this.renderPagination(response.total_pages, response.currentPage);

        } catch (error) {
            UI.showToast("Failed to load user list.", 'error');
            body.html('<tr><td colspan="5" class="text-center py-4 text-red-500">Error loading users.</td></tr>');
        }
    },

    renderUsers: function(users) {
        const body = $('#user-table-body').empty();

        if (users.length === 0) {
            body.html('<tr><td colspan="5" class="text-center py-4 text-gray-500">No users found matching criteria.</td></tr>');
            return;
        }

        users.forEach(user => {
            const statusBadge = user.is_active 
                ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>'
                : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Inactive</span>';
            
            const actionButtons = `
                <div class="flex space-x-2 justify-center">
                    <button onclick="AdminUsersPage.toggleActive('${user.id}', ${user.is_active})" class="text-xs px-3 py-1 rounded ${user.is_active ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white">
                        ${user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onclick="AdminUsersPage.toggleRole('${user.id}', '${user.role}')" class="text-xs px-3 py-1 rounded ${user.role === 'user' ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gray-500 hover:bg-gray-600'} text-white">
                        ${user.role === 'user' ? 'Promote to Admin' : 'Demote to User'}
                    </button>
                    <a href="profile.html?id=${user.id}" class="text-blue-600 hover:text-blue-800 text-sm py-1"><i class="fas fa-eye"></i></a>
                </div>
            `;
            
            body.append(`
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.full_name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">${user.role.toUpperCase()}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${actionButtons}</td>
                </tr>
            `);
        });
    },

    renderPagination: function(totalPages, currentPage) {
        // Simple pagination logic, reused from events.js, but targeting the admin table
        const controls = $('#user-pagination-controls').empty();
        
        if (totalPages <= 1) return;

        const createButton = (text, page, isActive) => {
            return `<button data-page="${page}" class="user-pagination-btn px-4 py-2 border rounded-lg ${isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'}">${text}</button>`;
        };

        // Previous button
        if (currentPage > 1) controls.append(createButton("Previous", currentPage - 1, false));

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            controls.append(createButton(i, i, i === currentPage));
        }

        // Next button
        if (currentPage < totalPages) controls.append(createButton("Next", currentPage + 1, false));

        // Bind click handler
        $('.user-pagination-btn').on('click', function() {
            const page = parseInt($(this).data('page'));
            if (page !== AdminUsersPage.currentPage) {
                AdminUsersPage.currentPage = page;
                AdminUsersPage.loadUsers();
            }
        });
    },

    toggleActive: async function(userId, currentStatus) {
        const newStatus = !currentStatus;
        const action = newStatus ? 'Activate' : 'Deactivate';
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            // Assuming API endpoint: PATCH /api/users/:id/status
            await Api.patch(`/api/users/${userId}/status`, { is_active: newStatus });
            UI.showToast(`User successfully ${action.toLowerCase()}d.`, 'success');
            this.loadUsers(); // Reload list
        } catch (error) {
            UI.showToast(`Failed to ${action.toLowerCase()} user.`, 'error');
        }
    },
    
    toggleRole: async function(userId, currentRole) {
        const newRole = currentRole === 'user' ? 'admin' : 'user';
        const action = newRole === 'admin' ? 'Promote' : 'Demote';
        if (!confirm(`Are you sure you want to ${action} this user to ${newRole.toUpperCase()}?`)) return;

        try {
            // Assuming API endpoint: PATCH /api/users/:id/role
            await Api.patch(`/api/users/${userId}/role`, { role: newRole });
            UI.showToast(`User successfully ${action.toLowerCase()}d to ${newRole.toUpperCase()}.`, 'success');
            this.loadUsers(); // Reload list
        } catch (error) {
            UI.showToast(`Failed to ${action.toLowerCase()} user role.`, 'error');
        }
    }
};