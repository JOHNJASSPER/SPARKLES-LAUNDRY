document.addEventListener('DOMContentLoaded', () => {
    // Check authentication status and update navbar
    updateNavbar();

    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');

        // Animate Bars (Hamburger to X)
        const bars = mobileMenuBtn.querySelectorAll('.bar');
        mobileMenuBtn.classList.toggle('active');
        // Add minimal rotation/transform logic in CSS for the 'active' class on the button itself if desired
        // For simplicity, just toggling the menu visibility here
    });

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        });
    });

    // Scroll Animations (Intersection Observer)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Unobserve after animating once
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in, .fade-in-left');
    animatedElements.forEach(el => observer.observe(el));

    // Smooth Scrolling for Anchor Links (polyfill for older browsers, though CSS smooth-scroll handles most)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Update navbar based on authentication status
function updateNavbar() {
    const navMenu = document.querySelector('.nav-menu');
    const isAuthenticated = localStorage.getItem('token');
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

    // Find the last nav item (Book Now button)
    const lastNavItem = navMenu.querySelector('.nav-item:last-child');

    if (isAuthenticated && user) {
        // User is logged in - show Dashboard and Logout
        lastNavItem.innerHTML = `
            <a href="/dashboard" class="nav-link">Dashboard</a>
        `;

        // Add logout button
        const logoutItem = document.createElement('li');
        logoutItem.className = 'nav-item';
        logoutItem.innerHTML = `<a href="#" class="nav-link" id="logout-btn">Logout</a>`;
        navMenu.appendChild(logoutItem);

        // Add logout handler
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        });
    } else {
        // User is not logged in - show Login button
        const loginItem = document.createElement('li');
        loginItem.className = 'nav-item';
        loginItem.innerHTML = `<a href="/login" class="nav-link">Login</a>`;
        navMenu.appendChild(loginItem);
    }
}
