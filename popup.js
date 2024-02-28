const saveBtn = document.getElementById('saveBtn');
const disableBtn = document.getElementById('disableBtn');

const theme = document.getElementById('theme');


saveBtn.onclick = () => {
    chrome.runtime.sendMessage({ event: "onStart"})
}

disableBtn.onclick = () => {
    chrome.onclick.sendMessage({ event: "onStop"})
}

