import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const toggleToSignup = document.getElementById('toggle-to-signup');
    const toggleToLogin = document.getElementById('toggle-to-login');

    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');

    // --- Toggle Forms ---
    toggleToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        toggleToSignup.style.display = 'none';
        signupForm.style.display = 'block';
        toggleToLogin.style.display = 'inline';
        loginError.textContent = '';
    });

    toggleToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        toggleToLogin.style.display = 'none';
        loginForm.style.display = 'block';
        toggleToSignup.style.display = 'inline';
        signupError.textContent = '';
    });

    // --- Sign Up ---
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        signupError.textContent = '';

        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            signupError.textContent = error.message;
        } else if (data.user) {
            // Since email confirmation is off, log them in right away
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) {
                signupError.textContent = signInError.message;
            } else {
                window.location.href = 'index.html';
            }
        }
    });

    // --- Login ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        loginError.textContent = '';

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            loginError.textContent = error.message;
        } else {
            window.location.href = 'index.html';
        }
    });

    // Auto-redirect if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            window.location.href = 'index.html';
        }
    });
});
