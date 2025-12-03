const validatePassword = (password) => {
    const minLength = 12;
    let score = 0;
    let errors = [];

    if (password.length < minLength)
        errors.push(`Must be at least ${minLength} characters long.`);

    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score < 3)
        errors.push("Must contain at least 3 of: uppercase, lowercase, numbers, symbols.");

    return { isValid: errors.length === 0, errors };
};

$('#signup-form').submit(async function(e) {
    e.preventDefault();

    const fullName = $('#fullName').val();
    const email = $('#email').val();
    const password = $('#password').val();
    const btn = $('#signup-btn');

    const validation = validatePassword(password);
    if (!validation.isValid) {
        UI.showToast("Password invalid: " + validation.errors.join(" | "), "error");
        return;
    }

    btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Registering...');

    try {
        await Api.post("/api/auth/signup", { fullName, email, password });

        UI.showToast("Registration successful!", "success");
        setTimeout(() => window.location.href = 'index.html', 1500);
    } catch (err) {
        UI.showToast(err.responseJSON?.message || "Registration failed.", "error");
    } finally {
        btn.prop("disabled", false).html('<i class="fas fa-user-plus mr-2"></i> Sign Up');
    }
});
