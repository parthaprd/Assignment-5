// ---- Login Logic ----
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMessage');

    // Check credentials
    if (usernameInput === 'admin' && passwordInput === 'admin123') {
        // Hide error just in case
        errorMsg.classList.add('hidden');

        // Redirect to issues page
        window.location.href = 'issue.html';
    } else {
        // Show error message
        errorMsg.classList.remove('hidden');
    }
});
