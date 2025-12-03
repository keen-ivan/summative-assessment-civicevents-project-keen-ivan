// assets/pages/profile.js

const ProfilePage = {
    init: function() {
        this.loadProfileData();
        $('#profile-form').on('submit', this.handleProfileUpdate.bind(this));
        $('#password-form').on('submit', this.handlePasswordUpdate.bind(this));
    },

    loadProfileData: async function() {
    const userId = Auth.getUser()?.id;
    if (!userId) {
        // If Auth.getUser() is null or lacks an ID, redirect to login
        UI.showToast("User not logged in.", 'error');
        Auth.logout();
        return;
    }

    try {
        // ✅ FIX 1: Use the correct backend route /api/users/profile/me (not /api/users/me)
        const user = await Api.get(`/api/users/profile/me`); 

        // Fill the form fields with user data
        $('#user-id').val(user.id);
        $('#full_name').val(user.full_name || '');
        $('#email').val(user.email);
        
        // ✅ FIX 2: Use optional chaining (?.) and nullish coalescing (||) 
        // to prevent TypeError if user.role is missing or null.
        $('#role').val(user.role?.toUpperCase() || 'USER');
        
        // Assuming phone number is stored in a top-level field
        $('#phone').val(user.phone || ''); 

        // Optional: Show a toast on successful load for debugging, or just let the data appear
        // UI.showToast("Profile data loaded.", 'success');

    } catch (error) {
        UI.showToast("Failed to load user profile. Please check your network or try logging in again.", 'error');
        console.error("Profile load error:", error);
        
        // If the load fails (e.g., 401 Unauthorized), force logout
        if (error.status === 401 || error.status === 403) {
             Auth.logout();
        }
    }
},

    handleProfileUpdate: async function(e) {
        e.preventDefault();
        const btn = $('#update-profile-btn');
        btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Updating...');

        
        const updateData = {
            full_name: $('#full_name').val(),
            phone: $('#phone').val()
            // Email/Role are handled by the system
        };

        try {
            // Use PATCH for partial update
            const updatedUser = await Api.patch(`/api/users/profile/me`, updateData); 
            
            // Update the local storage user object with new name/phone
            Auth.setUser(updatedUser); 
            
            UI.showToast("Profile updated successfully!", 'success');
            // Re-initialize nav to show updated name (if visible there)
            UI.initNav(); 

        } catch (error) {
            const msg = error.responseJSON?.message || "Failed to update profile.";
            UI.showToast(msg, 'error');
        } finally {
            btn.prop('disabled', false).html('<i class="fas fa-user-edit mr-2"></i> Update Profile');
        }
    },

    handlePasswordUpdate: async function(e) {
        e.preventDefault();
        const btn = $('#update-password-btn');
        btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Changing...');

        const currentPassword = $('#current_password').val();
        const newPassword = $('#new_password').val();
        const confirmPassword = $('#confirm_password').val();

        if (newPassword !== confirmPassword) {
            UI.showToast("New password and confirmation do not match.", 'error');
            btn.prop('disabled', false).html('<i class="fas fa-lock mr-2"></i> Change Password');
            return;
        }
        if (newPassword.length < 8) { // Basic password policy check
             UI.showToast("New password must be at least 8 characters long.", 'error');
             btn.prop('disabled', false).html('<i class="fas fa-lock mr-2"></i> Change Password');
             return;
        }

        
        const passwordData = {
            current_password: currentPassword,
            new_password: newPassword
        };

        try {
            // Assuming a dedicated endpoint for password change
            await Api.post(`/api/users/change-password`, passwordData); 
            
            UI.showToast("Password successfully changed! Please log in with your new password.", 'success');
            $('#password-form')[0].reset();
            
            // Force logout after successful password change for security
            setTimeout(() => Auth.logout(), 2000); 

        } catch (error) {
            const msg = error.responseJSON?.message || "Password change failed. Check your current password.";
            UI.showToast(msg, 'error');
        } finally {
            // Note: If success, we force logout, so this reset might not be needed.
            if (btn.prop('disabled')) {
                btn.prop('disabled', false).html('<i class="fas fa-lock mr-2"></i> Change Password');
            }
        }
    }
};