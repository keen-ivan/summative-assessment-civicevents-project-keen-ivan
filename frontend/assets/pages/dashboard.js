// assets/pages/dashboard.js

const DashboardPage = {
    init: function() {
        this.loadDashboardData();
        // ✅ Re-enable the user stats/activity feed using the correct endpoint.
        this.loadActivityFeed();
    },

    loadDashboardData: async function() {
        try {
            // FIX: Add cache-buster to force fresh 200 OK response from the server.
            const cacheBuster = `?t=${new Date().getTime()}`;
            const endpoint = `/api/dashboard/admin${cacheBuster}`;
            
            const response = await Api.get(endpoint); 
            
            // FIX: Use response.data to access the actual stats payload.
            const stats = response.data || response; 

            this.renderStatCards(stats);
            this.renderCharts(stats); 
            
            // Log the received data to help debug the incorrect numbers
            console.log("Admin Stats received:", stats);
        } catch (error) {
            UI.showToast("Failed to load dashboard statistics. Check token validity or backend model.", 'error');
            console.error("Dashboard data load error:", error);
            $('#stats-grid').empty().html('<p class="col-span-full text-center text-red-500 mt-4">Failed to load statistics.</p>');
        }
    },

    loadActivityFeed: async function() {
        try {
            // ✅ Correct endpoint: Use the one defined in your backend for user data.
            const endpoint = `/api/dashboard/me?t=${new Date().getTime()}`;
            const response = await Api.get(endpoint); 
            
            // FIX: Use response.data to access the activity payload.
            const activityData = response.data || response;
            
            // Assuming activityData contains an array property named 'recentActivity' or similar.
            // You might need to adjust 'activityData.recentActivity' based on what your model returns.
            this.renderActivityFeed(activityData.recentActivity || activityData);
        } catch (error) {
            UI.showToast("Failed to load activity feed.", 'error');
            console.error("Activity Feed error:", error);
            $('#activity-feed').html('<p class="text-gray-500 text-sm">Error loading activity feed.</p>');
        }
    },
    
    renderStatCards: function(stats) {
        const grid = $('#stats-grid').empty();
        
        const totalEvents = stats.totalEvents ?? 0;
        const usersCount = stats.usersCount ?? 0;
        const registrationsCount = stats.registrationsCount ?? 0;
        const pendingRequests = stats.pendingRequests ?? 0;
        
        const cardData = [
            { title: "Total Events", value: totalEvents, icon: 'fas fa-calendar-check', color: 'bg-blue-100 text-blue-800' },
            { title: "Total Users", value: usersCount, icon: 'fas fa-users', color: 'bg-green-100 text-green-800' },
            { title: "Event Registrations", value: registrationsCount, icon: 'fas fa-user-check', color: 'bg-indigo-100 text-indigo-800' },
            { title: "Pending Requests", value: pendingRequests, icon: 'fas fa-question-circle', color: 'bg-yellow-100 text-yellow-800' },
        ];

        cardData.forEach(card => {
            const cardHtml = `
                <div class="bg-white p-5 rounded-lg shadow flex items-center justify-between transition hover:shadow-lg">
                    <div>
                        <p class="text-sm font-medium text-gray-500">${card.title}</p>
                        <p class="text-3xl font-bold ${card.color.split(' ')[1]}">${card.value}</p>
                    </div>
                    <div class="p-3 rounded-full ${card.color}">
                        <i class="${card.icon} text-xl"></i>
                    </div>
                </div>
            `;
            grid.append(cardHtml);
        });
    },

    renderActivityFeed: function(activities) {
        const list = $('#activity-feed').empty();
        
        if (!Array.isArray(activities) || activities.length === 0) {
            list.html('<p class="text-gray-500 text-sm">No recent activity.</p>');
            return;
        }

        activities.slice(0, 5).forEach(activity => {
            // Note: You may need to adjust 'type', 'message', and 'resource_id' 
            // based on the data structure returned by your Dashboard.getUserStats model.
            const icon = activity.type === 'event_registration' ? 'fas fa-user-plus' : 'fas fa-bell'; 
            const link = activity.resource_id ? `event-detail.html?id=${activity.resource_id}` : '#';

            list.append(`
                <li class="border-b pb-3 flex items-start space-x-3">
                    <i class="${icon} text-blue-500 pt-1"></i>
                    <div class="flex-grow">
                        <p class="text-sm font-medium text-gray-800">${activity.message}</p>
                        ${activity.resource_id ? `<a href="${link}" class="text-xs text-blue-500 hover:underline">View Details</a>` : ''}
                        <p class="text-xs text-gray-400 mt-1">${(new Date(activity.created_at)).toLocaleTimeString()}</p>
                    </div>
                </li>
            `);
        });
    },

    renderCharts: function(stats) {
        // ... (Chart rendering logic)
        const regCtx = document.getElementById('registrations-chart').getContext('2d');
        if (window.registrationsChart) window.registrationsChart.destroy();

        window.registrationsChart = new Chart(regCtx, {
            type: 'line',
            data: {
                labels: stats.registrationsOverTime?.map(d => d.month) || ['Jan', 'Feb', 'Mar', 'Apr'],
                datasets: [{
                    label: 'New Registrations',
                    data: stats.registrationsOverTime?.map(d => d.count) || [10, 25, 15, 40],
                    borderColor: 'rgb(59, 130, 246)',
                    tension: 0.1
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
        
        const roleCtx = document.getElementById('user-role-chart').getContext('2d');
        if (window.userRoleChart) window.userRoleChart.destroy();

        window.userRoleChart = new Chart(roleCtx, {
            type: 'doughnut',
            data: {
                labels: ['Admin', 'Normal User'],
                datasets: [{
                    label: 'User Roles',
                    data: [stats.userRoleDistribution?.admin ?? 5, stats.userRoleDistribution?.user ?? 95],
                    backgroundColor: ['rgb(251, 191, 36)', 'rgb(59, 130, 246)'],
                    hoverOffset: 4
                }]
            },
            options: { responsive: true }
        });
    }
};