// assets/js/auth.js

const Auth = {
    // Keys must match what api.js expects
    TOKEN_KEY: 'authToken',
    USER_KEY: 'user',

    // Save session after login/signup
    setSession: function(token, user) {
        localStorage.setItem(Auth.TOKEN_KEY, token);
        localStorage.setItem(Auth.USER_KEY, JSON.stringify(user));
    },

    getToken: function() {
        return localStorage.getItem(Auth.TOKEN_KEY);
    },

    getUser: function() {
        const userJson = localStorage.getItem(Auth.USER_KEY);
        if (userJson && userJson !== "undefined") {
            try {
                return JSON.parse(userJson);
            } catch (e) {
                console.error("Auth Error: Corrupt user data.");
                Auth.logout();
                return null;
            }
        }
        return null;
    },

    // Authentication Checks
    isAuthenticated: function() {
        return !!Auth.getToken();
    },

    isAdmin: function() {
        const user = Auth.getUser();
        return user && user.role === 'admin';
    },

    // Navigation Guards
    requireLogin: function() {
        if (!Auth.isAuthenticated()) {
            window.location.href = 'index.html';
        }
    },

    requireAdmin: function() {
        Auth.requireLogin();
        if (!Auth.isAdmin()) {
            window.location.href = 'events.html';
        }
    },

    logout: function() {
        localStorage.removeItem(Auth.TOKEN_KEY);
        localStorage.removeItem(Auth.USER_KEY);
        window.location.href = 'index.html';
    }
};