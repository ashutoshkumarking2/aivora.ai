import { 
    auth, 
    googleProvider, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    signOut, 
    onAuthStateChanged 
} from './firebase-config.js';

let isSignUpMode = false;

// Safe UI Error Mapper
function formatAuthError(errorCode) {
    switch (errorCode) {
        case 'auth/wrong-password':
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
            return 'Incorrect email or password.';
        case 'auth/email-already-in-use':
            return 'An account already exists with this email.';
        case 'auth/popup-closed-by-user':
            return 'Google sign-in was cancelled.';
        default:
            return 'Authentication error. Please try again.';
    }
}

// Auth Observer
onAuthStateChanged(auth, (user) => {
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');

    if (user) {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        
        // Update user details
        document.getElementById('userName').textContent = user.displayName || 'User';
        document.getElementById('userEmail').textContent = user.email || '';
        if (user.photoURL) {
            document.getElementById('userAvatar').src = user.photoURL;
        } else {
            document.getElementById('userAvatar').src = './images/aivoralogo.png';
        }

        if (window.initAivoraApp) window.initAivoraApp(user);
    } else {
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
});

window.handleGoogleSignIn = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (err) {
        showError(formatAuthError(err.code));
    }
};

window.handleAuthSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;

    try {
        if (isSignUpMode) {
            const confirmPass = document.getElementById('authConfirmPassword').value;
            if (password !== confirmPass) {
                showError("Passwords do not match.");
                return;
            }
            await createUserWithEmailAndPassword(auth, email, password);
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (err) {
        showError(formatAuthError(err.code));
    }
};

window.showForgotPassword = async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    if (!email) {
        showError("Please enter your email address first.");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent!");
    } catch (err) {
        showError(formatAuthError(err.code));
    }
};

window.toggleAuthMode = (e) => {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;
    
    document.getElementById('nameFieldGroup').classList.toggle('hidden', !isSignUpMode);
    document.getElementById('confirmPasswordFieldGroup').classList.toggle('hidden', !isSignUpMode);
    document.getElementById('authPrimaryBtn').textContent = isSignUpMode ? 'Create account' : 'Sign in';
    document.getElementById('authSubtitle').textContent = isSignUpMode ? 'Create an account to start with Aivora.' : 'Sign in to continue to your AI workspace.';
    document.getElementById('toggleAuthText').textContent = isSignUpMode ? 'Already have an account?' : "Don't have an account?";
    document.getElementById('toggleAuthLink').textContent = isSignUpMode ? 'Sign in' : 'Create account';
};

window.handleLogout = async () => {
    await signOut(auth);
};

function showError(msg) {
    const errDiv = document.getElementById('authError');
    errDiv.textContent = msg;
    errDiv.classList.remove('hidden');
}

function clearError() {
    const errDiv = document.getElementById('authError');
    errDiv.textContent = '';
    errDiv.classList.add('hidden');
}