// Authentication page handlers
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    if (authHelpers.isAuthenticated()) {
        // Redirect to dashboard if on login/register page
        if (window.location.pathname === '/login' || window.location.pathname === '/register') {
            window.location.href = '/dashboard';
            return;
        }
    }

    // Login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register form handler
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Google login/signup buttons
    const googleLoginBtn = document.getElementById('google-login-btn');
    const googleSignupBtn = document.getElementById('google-signup-btn');

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleAuth);
    }

    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', handleGoogleAuth);
    }
});

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('login-btn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoader = loginBtn.querySelector('.btn-loader');
    const errorMessage = document.getElementById('error-message');

    // Show loading state
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    loginBtn.disabled = true;
    errorMessage.style.display = 'none';

    try {
        const response = await api.auth.login({ email, password });

        if (response.success) {
            // Save token and user data
            authHelpers.saveAuth(response.token, response.user);

            // Redirect to dashboard
            window.location.href = '/dashboard';
        }
    } catch (error) {
        // Show error message
        errorMessage.textContent = error.message || 'Login failed. Please try again.';
        errorMessage.style.display = 'block';

        // Reset button state
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
        loginBtn.disabled = false;
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const registerBtn = document.getElementById('register-btn');
    const btnText = registerBtn.querySelector('.btn-text');
    const btnLoader = registerBtn.querySelector('.btn-loader');
    const errorMessage = document.getElementById('error-message');

    // Show loading state
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    registerBtn.disabled = true;
    errorMessage.style.display = 'none';

    try {
        const response = await api.auth.register({ name, email, password });

        if (response.success) {
            // Save token and user data
            authHelpers.saveAuth(response.token, response.user);

            // Redirect to dashboard
            window.location.href = '/dashboard';
        }
    } catch (error) {
        // Show error message
        errorMessage.textContent = error.message || 'Registration failed. Please try again.';
        errorMessage.style.display = 'block';

        // Reset button state
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
        registerBtn.disabled = false;
    }
}

// Handle Google OAuth
async function handleGoogleAuth() {
    const errorMessage = document.getElementById('error-message');

    // For now, show a message that Google OAuth needs to be configured
    errorMessage.textContent = 'Google OAuth is not yet configured. Please use email/password registration.';
    errorMessage.style.display = 'block';

    // In production, you would:
    // 1. Initialize Firebase Auth
    // 2. Trigger Google Sign-In popup
    // 3. Get the ID token
    // 4. Send to backend for verification
    // 5. Save token and redirect

    /* Example implementation:
    try {
        const result = await firebase.auth().signInWithPopup(googleProvider);
        const idToken = await result.user.getIdToken();
        
        const response = await api.auth.googleAuth({
            idToken,
            email: result.user.email,
            name: result.user.displayName,
            googleId: result.user.uid
        });
        
        if (response.success) {
            authHelpers.saveAuth(response.token, response.user);
            window.location.href = '/dashboard';
        }
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
    */
}
