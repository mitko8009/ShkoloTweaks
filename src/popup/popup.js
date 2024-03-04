const saveBtn = document.getElementById('saveBtn');
const shkoloBtn = document.getElementById('shkoloBtn');
const deleteNoteBtn = document.getElementById('deleteNote');

const themeElement = document.getElementById('theme');
const cleanUpSkolo = document.getElementById('cleanUpSkolo');
const blurPfp = document.getElementById('blurPfp');

chrome.runtime.onMessage.addListener(data => {
    const {event} = data
    switch (event) {
        case 'UPDATE_POPUP':
            updatePopup()
            refreshPage()
            break
        default:
            break
    }
})

saveBtn.onclick = () => {
    const prefs = {
        theme: themeElement.value,
        cleanUp: cleanUpSkolo.checked,
        blurPfp: blurPfp.checked
    }

    chrome.runtime.sendMessage({ event: "onStart", prefs})
}

deleteNoteBtn.onclick = () => {
    document.getElementById('note').remove()
}

shkoloBtn.onclick = () => {
    chrome.tabs.create({ url: "https://app.shkolo.bg/dashboard" })
}

function refreshPage() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
    });
}

function updatePopup() {
    if (themeElement.value == "dark") { // Dark Popup Theme
        document.head.appendChild(document.createElement("style")).innerHTML = `
            html {
                background-color: hsl(0, 0%, 8%);
                color: white;
            }

            #theme {
                background-color: hsl(0, 0%, 8%);
                color: white;
            }

            .title, .label {
                color: white;
            }

            .button {
                background-color: hsl(0, 0%, 8%);
                color: white;
            }

            .button:hover {
                color: hsl(0, 0%, 80%);
            }
        `
    } else if (themeElement.value === "light") { // Light Popup Theme
        document.head.appendChild(document.createElement("style")).innerHTML = `
            html {
                background-color: hsl(0, 0%, 100%);
                color: black;
            }

            #theme {
                background-color: hsl(0, 0%, 100%);
                color: black;
            }

            .title, .label {
                color: black;
            }

            .button {
                background-color: hsl(0, 0%, 100%);
                color: black;
            }

            .button:hover {
                color: hsl(0, 0%, 20%);
        `
    }
}

chrome.storage.local.get(["theme", "cleanUp", "blurPfp"], function(result){   
    const { theme, cleanUp, blurPfp } = result

    if (theme) {
        themeElement.value = theme
    }

    if (cleanUp) {
        cleanUpSkolo.checked = cleanUp
    }

    if (blurPfp) {
        blurPfp.checked = blurPfp
    }

    updatePopup()
})
