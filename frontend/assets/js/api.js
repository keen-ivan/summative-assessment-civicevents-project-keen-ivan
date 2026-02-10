// assets/js/api.js

// 1. CONFIGURATION: Based on your Postman JSON, the port is 5000.
// If your terminal says 4000, change this number to 4000.
const API_URL = "https://civic-events-project-keen-ivan.onrender.com";


const Api = {
    request: function (endpoint, method = "GET", data = null, isFileUpload = false) {
        // 2. AUTHENTICATION: Get token directly from storage
        const token = localStorage.getItem("authToken");

        const headers = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        // 3. CONTENT TYPE: Critical for 400 Bad Request errors
        if (!isFileUpload && method !== "GET") {
            headers["Content-Type"] = "application/json";
        }

        const config = {
            url: `${API_BASE_URL}${endpoint}`,
            method: method,
            headers: headers,
        };

        // 4. DATA HANDLING: Stringify JSON automatically unless it's a file
        if (data) {
            config.data = isFileUpload ? data : JSON.stringify(data);
        }

        if (isFileUpload) {
            config.processData = false;
            config.contentType = false;
        }

        return $.ajax(config).fail((xhr) => {
            console.error(`API Error (${endpoint}):`, xhr.responseJSON || xhr.statusText);
            
            // 5. GLOBAL ERROR HANDLING
            if (xhr.status === 401) {
                // Token expired or invalid
                localStorage.removeItem("authToken");
                localStorage.removeItem("user");
                window.location.href = "index.html";
            }
        });
    },

    // Shortcuts
    get: (endpoint) => Api.request(endpoint, "GET"),
    post: (endpoint, data) => Api.request(endpoint, "POST", data),
    put: (endpoint, data) => Api.request(endpoint, "PUT", data),
    patch: (endpoint, data) => Api.request(endpoint, "PATCH", data),
    delete: (endpoint) => Api.request(endpoint, "DELETE"),
    upload: (endpoint, formData) => Api.request(endpoint, "POST", formData, true)
};