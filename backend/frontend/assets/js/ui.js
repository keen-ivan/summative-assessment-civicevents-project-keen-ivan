// assets/js/ui.js (Consolidated and Corrected)

const UI = {
    /**
     * Initialization Functions
     */
    initNav: function() {
        // This function sets up the navigation bar elements (e.g., user name, logout)
        // AND calls updateNotificationCount().
        const user = Auth.getUser();
        const navLinks = $('#main-nav-links');
        const userNameDisplay = $('#user-name-display');

        if (user) {
            userNameDisplay.text(user.full_name || 'Profile');
            
            // Conditional Admin Link Injection (Ensure this logic is present)
            if (user.role === 'admin') {
                 // Check if the link already exists before appending (to prevent duplication on re-init)
                if ($('#admin-dashboard-link').length === 0) {
                     const adminLink = '<a id="admin-dashboard-link" href="dashboard.html" class="text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent">Admin Dashboard</a>';
                     navLinks.append(adminLink);
                }
            } else {
                 // Remove admin link if user is not admin (in case of re-init)
                 $('#admin-dashboard-link').remove();
            }

            // Call the notification update function here
            UI.updateNotificationCount(); 

        } else {
            // Not logged in (though this file is usually loaded after login check)
            userNameDisplay.text('Guest');
        }

        // Bind logout handler
        $('#logout-btn').on('click', Auth.logout);
    },

    /**
     * Notification Functions (Added in Phase 11)
     */
    // In assets/js/ui.js, inside the updateNotificationCount function:

    updateNotificationCount: function() {
        
        // ❌ OLD (Caused crash): const countEndpoint = '/api/notifications/unread-count'; 

        // ✅ NEW: Use the base list endpoint and pass the action as a query parameter.
        // This usually routes to a list controller that can check for the 'unreadCount' flag.
        const countEndpoint = '/api/notifications'; 
        
        // Pass a query parameter called 'unreadCount' set to true
        const params = {
            unreadCount: true
        };

        // Use API.get with the parameters
        Api.get(countEndpoint, params)
            .done(function(response) {
                // Adjust this line based on what the server returns (e.g., response.count, response.data.count)
                const count = response.count || response.data?.count || 0; 
                
                $('#notification-badge').text(count);
                if (count > 0) {
                    $('#notification-badge').removeClass('hidden');
                } else {
                    $('#notification-badge').addClass('hidden');
                }
            })
            .fail(function(xhr) {
                console.error("Failed to fetch notification count:", xhr);
                $('#notification-badge').addClass('hidden'); 
            });
    },
    
    // ...

    /**
     * Toast/Alert Functions
     */
    showToast: function(message, type = 'info', duration = 3000) {
        // Ensure the container exists
        let container = $('#toast-container');
        if (container.length === 0) {
            $('body').append('<div id="toast-container" class="fixed bottom-5 right-5 z-[100] space-y-2"></div>');
            container = $('#toast-container');
        }

        const bgColor = type === 'success' ? 'bg-green-500' : 
                        type === 'error' ? 'bg-red-500' : 
                        'bg-blue-500';
        const icon = type === 'success' ? 'fas fa-check-circle' : 
                     type === 'error' ? 'fas fa-times-circle' : 
                     'fas fa-info-circle';

        const toast = $(`
            <div class="toast-item p-4 text-white ${bgColor} rounded-lg shadow-xl flex items-center space-x-3 opacity-0 transition-opacity duration-300 min-w-[200px]">
                <i class="${icon}"></i>
                <span>${message}</span>
            </div>
        `);

        container.append(toast);

        // Fade in
        setTimeout(() => toast.css('opacity', 1), 10);

        // Fade out and remove
        setTimeout(() => {
            toast.css('opacity', 0);
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};