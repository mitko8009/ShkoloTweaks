const saveBtn = document.getElementById('saveBtn');
const shkoloBtn = document.getElementById('shkoloBtn');
const deleteNoteBtn = document.getElementById('deleteNote');

const themeElement = document.getElementById('theme');

chrome.runtime.onMessage.addListener(data => {
    const {event} = data
    switch (event) {
        case 'UPDATE_POPUP':
            updatePopup()
            break
        default:
            break
    }
})

saveBtn.onclick = () => {
    const prefs = {
        theme: themeElement.value
    }

    chrome.runtime.sendMessage({ event: "onStart", prefs})
}

deleteNoteBtn.onclick = () => {
    const note = document.getElementById('note');

    note.remove()
}

shkoloBtn.onclick = () => {
    chrome.tabs.create({ url: "https://app.shkolo.bg/dashboard" })
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

chrome.storage.local.get(["theme"], function(result){   
    const { theme } = result

    if (theme) {
        themeElement.value = theme
    }

    updatePopup()
})
