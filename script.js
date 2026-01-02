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
    const authNavItem = document.getElementById('auth-nav-item');
    if (!authNavItem) return;

    const isAuthenticated = localStorage.getItem('token');
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

    if (isAuthenticated && user) {
        // User is logged in
        // Show Dashboard for all logged in users
        authNavItem.innerHTML = `
            <a href="/dashboard" class="nav-link">Dashboard</a>
        `;
    } else {
        // User is not logged in - show Login
        authNavItem.innerHTML = `
            <a href="/login" class="nav-link">Login</a>
        `;
    }
}
