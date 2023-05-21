const adminCode = '1234';  // You can set your own code here

const loginForm = document.getElementById('login-form');
const adminWelcome = document.getElementById('admin-welcome');
const codeInput = document.getElementById('code');
const submitButton = document.getElementById('submit');
const logoutLink = document.querySelector('.logout');

submitButton.addEventListener('click', () => {
    if (codeInput.value === adminCode) {
        loginForm.classList.add('hidden');
        adminWelcome.classList.remove('hidden');
    } else {
        alert('Incorrect code. Please try again.');
        codeInput.value = '';
    }
});

logoutLink.addEventListener('click', () => {
    loginForm.classList.remove('hidden');
    adminWelcome.classList.add('hidden');
    codeInput.value = '';
});
