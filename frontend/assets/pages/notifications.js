// assets/pages/notifications.js

const NotificationsPage = {
    init: function() {
        this.loadNotifications();
        $('#mark-all-read-btn').on('click', this.markAllAsRead.bind(this));
        // Expose function globally for click handlers
        window.markAsRead = this.markAsRead.bind(this);
    },

    loadNotifications: async function() {
        const list = $('#notification-list').empty();
        list.html('<div class="h-16 bg-white rounded-lg shadow animate-pulse"></div><div class="h-16 bg-white rounded-lg shadow animate-pulse"></div>'); 
        $('#mark-all-read-btn').prop('disabled', true);

        try {
            // Assuming endpoint: GET /api/notifications
            const notifications = await Api.get("/api/notifications");
            
            this.renderNotifications(notifications.data || notifications);

        } catch (error) {
            UI.showToast("Failed to load notifications.", 'error');
            list.html('<p class="text-center text-red-500 mt-8">Error loading notifications.</p>');
        }
    },

    renderNotifications: function(notifications) {
        const list = $('#notification-list').empty();
        let unreadCount = 0;

        if (notifications.length === 0) {
            list.html('<p class="text-center text-gray-500 mt-8 text-xl p-10 bg-white rounded-lg shadow"><i class="far fa-bell mr-2"></i> You have no notifications.</p>');
            return;
        }
        
        notifications.forEach(notif => {
            if (!notif.is_read) {
                unreadCount++;
            }
            
            const timeAgo = this.timeSince(new Date(notif.created_at));
            
            const cardClass = notif.is_read ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white shadow-md hover:shadow-lg border-l-4 border-blue-500';

            const icon = this.getIcon(notif.type); // Example: event_update, system_message, registration_success

            const card = `
                <div id="notif-card-${notif.id}" class="p-4 rounded-lg transition duration-200 flex items-start space-x-3 ${cardClass}">
                    <div class="flex-shrink-0 text-blue-600 pt-1">
                        <i class="${icon} text-xl"></i>
                    </div>
                    <div class="flex-grow">
                        <p class="font-semibold text-gray-900">${notif.title}</p>
                        <p class="text-sm text-gray-700">${notif.message}</p>
                        <p class="text-xs text-gray-500 mt-1">
                            ${timeAgo} ago 
                            ${notif.is_read ? ' • Read' : ' • <span class="text-red-600 font-bold">New</span>'}
                        </p>
                    </div>
                    ${!notif.is_read ? `
                        <button onclick="markAsRead('${notif.id}')" class="flex-shrink-0 text-sm text-gray-500 hover:text-green-600 px-2 py-1 rounded transition mark-read-btn" data-id="${notif.id}">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                </div>
            `;
            list.append(card);
        });
        
        // Enable/Disable Mark All button
        if (unreadCount > 0) {
            $('#mark-all-read-btn').prop('disabled', false);
        } else {
            list.append('<p class="text-center text-gray-500 mt-4">All caught up!</p>');
        }
    },
    
    getIcon: function(type) {
        switch(type) {
            case 'event_update': return 'fas fa-calendar-day';
            case 'registration_success': return 'fas fa-user-check';
            case 'admin_alert': return 'fas fa-exclamation-triangle';
            default: return 'fas fa-info-circle';
        }
    },
    
    timeSince: function(date) {
        // Simple helper function to calculate time difference
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;

        if (interval > 1) return Math.floor(interval) + " years";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes";
        return Math.floor(seconds) + " seconds";
    },

    markAsRead: async function(notificationId) {
        const btn = $(`#notif-card-${notificationId}`).find('.mark-read-btn');
        btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i>');

        try {
            // Assuming endpoint: PATCH /api/notifications/:id/read
            await Api.patch(`/api/notifications/${notificationId}/read`); 
            
            UI.showToast("Notification marked as read.", 'info');

            // Optimistic UI update
            const card = $(`#notif-card-${notificationId}`);
            card.removeClass('bg-white shadow-md hover:shadow-lg border-l-4 border-blue-500').addClass('bg-gray-100 hover:bg-gray-200 border-l-0');
            btn.remove(); // Remove the button
            
            // Update the main UI badge count
            UI.updateNotificationCount();
            
        } catch (error) {
            UI.showToast("Failed to mark as read.", 'error');
            btn.prop('disabled', false).html('<i class="fas fa-check"></i>');
        }
    },
    
    markAllAsRead: async function() {
        const btn = $('#mark-all-read-btn');
        btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Processing...');

        try {
            // Assuming endpoint: POST /api/notifications/mark-all-read
            await Api.post("/api/notifications/mark-all-read"); 
            
            UI.showToast("All notifications marked as read.", 'success');
            
            // Full reload for guaranteed status consistency
            this.loadNotifications(); 
            UI.updateNotificationCount();

        } catch (error) {
            UI.showToast("Failed to mark all as read.", 'error');
            btn.prop('disabled', false).html('<i class="fas fa-check-double mr-1"></i> Mark All As Read');
        }
    }
};