const saveBtn = document.getElementById('saveBtn');
const shkoloBtn = document.getElementById('shkoloBtn');
const deleteNoteBtn = document.getElementById('deleteNote');
const preset = document.getElementById('preset');
const label_version = document.getElementById('version');

const themeElement = document.getElementById('theme');
const cleanUpSkolo = document.getElementById('cleanUpSkolo');
const blurPfpCheck = document.getElementById('blurPfp');
const roundedCheckbox = document.getElementById('roundedCheckbox');
const scheduleWidgetCheckbox = document.getElementById('scheduleWidget');

const sk_success = document.getElementById('sk_success');

const manifest = chrome.runtime.getManifest()
const version = manifest.version


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
        scheduleWidget: scheduleWidgetCheckbox.checked
    }

    chrome.storage.sync.set(prefs)
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

preset.onclick = () => {
    themeElement.value = "dark"
    cleanUpSkolo.checked = true
    blurPfpCheck.checked = true
    roundedCheckbox.checked = true
    saveBtn.click()
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

            .checkbox:hover, .radio:hover {
                color: #cccccc;
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
    } else {
        document.getElementById('note').remove()
    }
});


chrome.storage.sync.get(["theme", "cleanUp", "blurPfp", "rounded", "scheduleWidget"], function(result){   
    const { theme, cleanUp, blurPfp, rounded, scheduleWidget } = result

    if (theme) { themeElement.value = theme }
    if (cleanUp) { cleanUpSkolo.checked = cleanUp }
    if (blurPfp) { blurPfpCheck.checked = blurPfp }
    if (rounded) { roundedCheckbox.checked = rounded }
    if (scheduleWidget) { scheduleWidgetCheckbox.checked = scheduleWidget }

    updatePopup()
})

label_version.innerHTML = `v${version}`
