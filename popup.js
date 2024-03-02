const saveBtn = document.getElementById('saveBtn');
const disableBtn = document.getElementById('disableBtn');

const themeElement = document.getElementById('theme');

saveBtn.onclick = () => {
    const prefs = {
        theme: themeElement.value
    }
    chrome.runtime.sendMessage({ event: "onStart", prefs})
}

chrome.storage.local.get(["theme"], function(result){   
    const { theme } = result

    if (theme) {
        themeElement.value = theme
        console.log(theme)
    }
})