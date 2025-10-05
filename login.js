// Login Authentication System
class AuthManager {
    constructor() {
        this.validCredentials = [
            { username: 'admin', password: 'password123', role: 'admin' },
            { username: 'user', password: 'password123', role: 'user' },
            { username: 'doctor', password: 'password123', role: 'doctor' },
            { username: 'patient', password: 'password123', role: 'patient' }
        ];
        this.sessionKey = 'healthtracker_session';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingSession();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');

        // Form submission
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Password toggle
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = togglePassword.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });

        // Enter key support
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });

        // Input validation
        const inputs = document.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.clearError();
                this.validateInput(input);
            });
        });
    }

    validateInput(input) {
        const value = input.value.trim();
        
        if (value.length === 0) {
            input.style.borderColor = '#e74c3c';
            return false;
        } else {
            input.style.borderColor = '#2ecc71';
            return true;
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const rememberMe = document.getElementById('rememberMe').checked;
        const loginBtn = document.getElementById('loginBtn');

        // Clear previous errors
        this.clearError();

        // Validate inputs
        if (!username || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        // Simulate API call delay
        await this.delay(1500);

        // Authenticate user
        const user = this.authenticateUser(username, password);
        
        if (user) {
            this.createSession(user, rememberMe);
            
            // Reset wellness score by clearing symptoms data
            this.resetWellnessData();
            
            this.showSuccess('Login successful! Redirecting...');
            
            // Redirect after success message
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            this.setLoadingState(false);
            this.showError('Invalid username or password');
            this.shakeForm();
        }
    }

    authenticateUser(username, password) {
        return this.validCredentials.find(cred => 
            cred.username === username && cred.password === password
        );
    }

    createSession(user, rememberMe) {
        const sessionData = {
            username: user.username,
            role: user.role,
            loginTime: new Date().toISOString(),
            rememberMe: rememberMe,
            sessionId: this.generateSessionId()
        };

        // Store session
        if (rememberMe) {
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        }
    }

    checkExistingSession() {
        const session = this.getSession();
        if (session) {
            // User is already logged in, redirect to main app
            window.location.href = 'index.html';
        }
    }

    getSession() {
        const localSession = localStorage.getItem(this.sessionKey);
        const sessionSession = sessionStorage.getItem(this.sessionKey);
        
        if (localSession) {
            return JSON.parse(localSession);
        } else if (sessionSession) {
            return JSON.parse(sessionSession);
        }
        
        return null;
    }

    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    setLoadingState(loading) {
        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn.querySelector('span') || loginBtn;
        
        if (loading) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
            if (!loginBtn.querySelector('span')) {
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Signing In...</span>';
            } else {
                btnText.textContent = 'Signing In...';
            }
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i>Sign In';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        errorText.textContent = message;
        errorDiv.style.display = 'flex';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.clearError();
        }, 5000);
    }

    showSuccess(message) {
        // Remove existing error
        this.clearError();
        
        // Create success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        const form = document.getElementById('loginForm');
        form.appendChild(successDiv);
    }

    clearError() {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.style.display = 'none';
    }

    shakeForm() {
        const loginCard = document.querySelector('.login-card');
        loginCard.style.animation = 'shake 0.5s ease-in-out';
        
        setTimeout(() => {
            loginCard.style.animation = '';
        }, 500);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    resetWellnessData() {
        // Clear symptoms data to reset wellness score
        localStorage.removeItem('healthtracker_symptoms');
        
        // Also clear any other health data that might affect the score
        localStorage.removeItem('healthtracker_insights');
        localStorage.removeItem('healthtracker_patterns');
    }

    // Static method to check authentication from other pages
    static isAuthenticated() {
        const sessionKey = 'healthtracker_session';
        const localSession = localStorage.getItem(sessionKey);
        const sessionSession = sessionStorage.getItem(sessionKey);
        
        return !!(localSession || sessionSession);
    }

    // Static method to get current user
    static getCurrentUser() {
        const sessionKey = 'healthtracker_session';
        const localSession = localStorage.getItem(sessionKey);
        const sessionSession = sessionStorage.getItem(sessionKey);
        
        if (localSession) {
            return JSON.parse(localSession);
        } else if (sessionSession) {
            return JSON.parse(sessionSession);
        }
        
        return null;
    }

    // Static method to logout
    static logout() {
        const sessionKey = 'healthtracker_session';
        localStorage.removeItem(sessionKey);
        sessionStorage.removeItem(sessionKey);
        window.location.href = 'login.html';
    }
}

// Initialize authentication when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});

// Demo credentials auto-fill (for testing convenience)
document.addEventListener('DOMContentLoaded', () => {
    const demoInfo = document.querySelector('.demo-info');
    if (demoInfo) {
        demoInfo.addEventListener('click', (e) => {
            if (e.target.tagName === 'CODE') {
                const text = e.target.textContent;
                if (text === 'admin' || text === 'user') {
                    document.getElementById('username').value = text;
                } else if (text === 'password123') {
                    document.getElementById('password').value = text;
                }
            }
        });
    }
});

// Export for use in other files
window.AuthManager = AuthManager;