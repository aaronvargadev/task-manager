import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const authButton = document.getElementById('auth-button');
    const authSwitchText = document.getElementById('auth-switch-text');
    const passwordInput = document.getElementById('auth-password');
    const authMessage = document.getElementById('auth-message');

    let isLoginMode = true;

    function toggleMode() {
        isLoginMode = !isLoginMode;
        authMessage.textContent = '';
        authMessage.className = '';
        authForm.reset();

        if (isLoginMode) {
            authTitle.textContent = 'Login';
            authButton.textContent = 'Login';
            authSwitchText.innerHTML = 'Don\'t have an account? <a href="#" id="switch-to-signup">Sign Up</a>';
            passwordInput.setAttribute('autocomplete', 'current-password');
        } else {
            authTitle.textContent = 'Sign Up';
            authButton.textContent = 'Sign Up';
            authSwitchText.innerHTML = 'Already have an account? <a href="#" id="switch-to-login">Login</a>';
            passwordInput.setAttribute('autocomplete', 'new-password');
        }
        
        // Re-attach the event listener to the new link
        attachSwitchListener();
    }

    function attachSwitchListener() {
        const switchLink = isLoginMode ? document.getElementById('switch-to-signup') : document.getElementById('switch-to-login');
        if (switchLink) {
            switchLink.addEventListener('click', (e) => {
                e.preventDefault();
                toggleMode();
            });
        }
    }

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = passwordInput.value;

        if (!email || !password) {
            authMessage.textContent = 'Please provide both email and password.';
            authMessage.className = 'auth-error';
            return;
        }

        let response;
        if (isLoginMode) {
            response = await supabase.auth.signInWithPassword({ email, password });
        } else {
            response = await supabase.auth.signUp({ email, password });
        }

        const { error, data } = response;

        if (error) {
            authMessage.textContent = `${isLoginMode ? 'Login' : 'Signup'} failed: ${error.message}`;
            authMessage.className = 'auth-error';
        } else {
            authMessage.textContent = `${isLoginMode ? 'Login' : 'Signup'} successful! Redirecting...`;
            authMessage.className = 'auth-success';
            authForm.reset();
            
            // If it was a signup, Supabase might send a session back directly
            if (!isLoginMode && data.session) {
                 await supabase.auth.setSession(data.session);
            }

            window.location.href = 'index.html';
        }
    });

    // Initial setup
    attachSwitchListener();
});
