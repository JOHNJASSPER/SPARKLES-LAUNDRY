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
// TODO: Replace with your Firebase project config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
}

// Handle Google OAuth
async function handleGoogleAuth() {
    const errorMessage = document.getElementById('error-message');

    // Reset error
    if (errorMessage) errorMessage.style.display = 'none';

    try {
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK not loaded');
        }

        // Check if config is set
        if (firebaseConfig.apiKey === "YOUR_API_KEY") {
            throw new Error('Google Login is not configured yet. Please contact admin.');
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;
        const idToken = await user.getIdToken();

        // Send to backend
        const response = await api.auth.googleAuth({
            idToken,
            email: user.email,
            name: user.displayName,
            googleId: user.uid
        });

        if (response.success) {
            authHelpers.saveAuth(response.token, response.user);
            window.location.href = '/dashboard';
        }
    } catch (error) {
        console.error('Google Auth Error:', error);
        if (errorMessage) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        } else {
            alert(error.message);
        }
    }
}
