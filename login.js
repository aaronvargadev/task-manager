import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check if the user is already logged in
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
            // If logged in, redirect to the main application dashboard
            window.location.href = 'dashboard.html';
            return; // Stop further execution of this script
        }
    } catch (error) {
        console.error('Error checking session:', error.message);
        // Don't redirect, just let the user try to log in manually.
    }
});

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
        authMessage.textContent = 'Signup successful! Logging in...';
        authMessage.className = 'auth-success';
        
        // Sign in the user immediately after successful signup
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
            authMessage.textContent = `Login after signup failed: ${signInError.message}`;
            authMessage.className = 'auth-error';
        } else {
            signupForm.reset();
            window.location.href = 'dashboard.html';
        }
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
