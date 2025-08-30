import { supabase } from './supabase.js';

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');
const authMessage = document.getElementById('auth-message');

// --- Toggle Forms ---
showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    authMessage.textContent = '';
    authMessage.className = '';
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
    authMessage.textContent = '';
    authMessage.className = '';
});

// --- Sign Up ---
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (!email || !password) {
        authMessage.textContent = 'Please provide both email and password.';
        authMessage.className = 'auth-error';
        return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        authMessage.textContent = `Signup failed: ${error.message}`;
        authMessage.className = 'auth-error';
    } else {
        // With email confirmation disabled, we can log the user in directly.
        authMessage.textContent = 'Signup successful! Redirecting...';
        authMessage.className = 'auth-success';
        signupForm.reset();
        // Manually set the session to log the user in, then redirect
        await supabase.auth.setSession(data.session);
        window.location.href = 'index.html';
    }
});

// --- Login ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        authMessage.textContent = 'Please provide both email and password.';
        authMessage.className = 'auth-error';
        return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        authMessage.textContent = `Login failed: ${error.message}`;
        authMessage.className = 'auth-error';
    } else {
        loginForm.reset();
        window.location.href = 'index.html'; // Redirect to the main task page
    }
});
