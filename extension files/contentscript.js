let overlayDiv;
let passwordInput;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.taskStatus === 'offtask') {
        if (!overlayDiv) {
            createOverlay();
        }
        overlayDiv.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } else {
        if (overlayDiv) {
            overlayDiv.style.display = 'none';
        }
        document.body.style.overflow = 'auto';
    }
});

function createOverlay() {
    overlayDiv = document.createElement('div');
    overlayDiv.style.position = 'fixed';
    overlayDiv.style.top = '0';
    overlayDiv.style.left = '0';
    overlayDiv.style.width = '100%';
    overlayDiv.style.height = '100%';
    overlayDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlayDiv.style.zIndex = '10000';
    overlayDiv.style.color = 'white';
    overlayDiv.style.display = 'flex';
    overlayDiv.style.justifyContent = 'center';
    overlayDiv.style.alignItems = 'center';
    overlayDiv.style.flexDirection = 'column';
    overlayDiv.innerHTML = '<h1>You are off task!</h1>';
    document.body.appendChild(overlayDiv);

    passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Enter password to unlock';
    overlayDiv.appendChild(passwordInput);

    let unlockButton = document.createElement('button');
    unlockButton.innerText = 'Unlock';
    unlockButton.onclick = unlock;
    overlayDiv.appendChild(unlockButton);
}

function unlock() {
    if (passwordInput.value === 'testpassword') {
        overlayDiv.style.display = 'none';
        document.body.style.overflow = 'auto';
    } else {
        alert('Wrong password!');
    }
}

