const saveBtn = document.getElementById('saveBtn');
const shkoloBtn = document.getElementById('shkoloBtn');
const deleteNoteBtn = document.getElementById('deleteNote');

const themeElement = document.getElementById('theme');
const cleanUpSkolo = document.getElementById('cleanUpSkolo');
const blurPfpCheck = document.getElementById('blurPfp');
const roundedCheckbox = document.getElementById('roundedCheckbox');


chrome.runtime.onMessage.addListener(data => {
    console.log("Received message", data)
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
    console.log("Saving preferences")
    const prefs = {
        theme: themeElement.value,
        cleanUp: cleanUpSkolo.checked,
        blurPfp: blurPfpCheck.checked,
        rounded: roundedCheckbox.checked,
    }

    chrome.storage.local.set(prefs)
    console.log("Saved", prefs)
    updatePopup()
    refreshPage()
}

deleteNoteBtn.onclick = () => {
    document.getElementById('note').remove()
}

shkoloBtn.onclick = () => {
    chrome.tabs.create({ url: "https://app.shkolo.bg/dashboard" })
}

function refreshPage() {
    console.log("Refreshing page")
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.reload(tabs[0].id);
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
            }

            .checkbox:hover, .radio:hover {
                color: #404040;
            }
        `
    }
}

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const url = new URL(tabs[0].url)

    if (url.hostname.includes("shkolo.bg")) {
        document.getElementById("shkoloBtn").remove()

        const connectedStatus = document.createElement("span")
        connectedStatus.classList.add("tag", "is-success", "is-light")
        connectedStatus.style.fontSize = "14px"
        connectedStatus.innerHTML = "Connected to Shkolo"
        document.getElementById("header").appendChild(connectedStatus)
    } else {
        document.getElementById('note').remove()
    }
});

chrome.storage.local.get(["theme", "cleanUp", "blurPfp", "rounded"], function(result){   
    const { theme, cleanUp, blurPfp, rounded } = result

    if (theme) { themeElement.value = theme }
    if (cleanUp) { cleanUpSkolo.checked = cleanUp }
    if (blurPfp) { blurPfpCheck.checked = blurPfp }
    if (rounded) { roundedCheckbox.checked = rounded }

    updatePopup()
})
