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
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
    authMessage.textContent = '';
});

// --- Sign Up ---
signupButton.addEventListener('click', async () => {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (!email || !password) {
        authMessage.textContent = 'Please provide both email and password.';
        return;
    }

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
        authMessage.textContent = `Signup failed: ${error.message}`;
    } else {
        authMessage.textContent = 'Signup successful! Please check your email to verify your account.';
        signupForm.reset();
    }
});

// --- Login ---
loginButton.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        authMessage.textContent = 'Please provide both email and password.';
        return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        authMessage.textContent = `Login failed: ${error.message}`;
    } else {
        window.location.href = '/'; // Redirect to the main task page
    }
});
