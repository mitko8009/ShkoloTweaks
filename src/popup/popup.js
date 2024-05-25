const manifest = chrome.runtime.getManifest()
const version = manifest.version

const saveBtn = document.getElementById('saveBtn');
const shkoloBtn = document.getElementById('shkoloBtn');
const label_version = document.getElementById('version');

const themeElement = document.getElementById('theme');

const ScheduleTitle = document.getElementById('ScheduleTitle');
const ScheduleContent = document.getElementById('ScheduleContent');

const label_theme = document.getElementById('themeLabel');
const label_cleanUp = document.getElementById('cleanUpLabel');
const label_blur = document.getElementById('blurLabel');
const label_rounded = document.getElementById('roundedLabel');
const label_scheduleWidget = document.getElementById('scLabel');


// i18n
label_theme.innerHTML = chrome.i18n.getMessage("themeLabel")
saveBtn.innerHTML = chrome.i18n.getMessage("applyBtn")
shkoloBtn.innerHTML = chrome.i18n.getMessage("shkoloBtn")

label_cleanUp.innerHTML += chrome.i18n.getMessage("cleanUpLabel")
label_blur.innerHTML += chrome.i18n.getMessage("blurLabel")
label_rounded.innerHTML += chrome.i18n.getMessage("roundedLabel")
label_scheduleWidget.innerHTML += chrome.i18n.getMessage("scLabel")

var darkValue = themeElement.appendChild(document.createElement("option"))
darkValue.value = "dark"
darkValue.innerHTML = chrome.i18n.getMessage("darkTheme")

var lightValue = themeElement.appendChild(document.createElement("option"))
lightValue.value = "light"
lightValue.innerHTML = chrome.i18n.getMessage("lightTheme")
// End i18n

const cleanUpShkolo = document.getElementById('cleanUpShkolo');
const blurPfpCheck = document.getElementById('blurPfp');
const roundedCheckbox = document.getElementById('roundedCheckbox');
const scheduleWidgetCheckbox = document.getElementById('scheduleWidget');

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
        cleanUp: cleanUpShkolo.checked,
        blurPfp: blurPfpCheck.checked,
        rounded: roundedCheckbox.checked,
        scheduleWidget: scheduleWidgetCheckbox.checked
    }

    chrome.storage.sync.set(prefs)
    console.log("Saved", prefs)
    updatePopup()
    refreshPage()
}

function refreshPage() {
    console.log("Refreshing page")
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
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

chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const url = new URL(tabs[0].url)

    if (url.hostname.includes("shkolo.bg")) {
        document.getElementById("shkoloBtn").remove()
    }
});


chrome.storage.sync.get(["theme", "cleanUp", "blurPfp", "rounded", "scheduleWidget"], (result) => {   
    const { theme, cleanUp, blurPfp, rounded, scheduleWidget } = result

    if (theme) { themeElement.value = theme }
    if (cleanUp) { cleanUpShkolo.checked = cleanUp }
    if (blurPfp) { blurPfpCheck.checked = blurPfp }
    if (rounded) { roundedCheckbox.checked = rounded }
    if (scheduleWidget) { scheduleWidgetCheckbox.checked = scheduleWidget }

    updatePopup()
})

label_version.innerHTML = `v${version}`


setTimeout(() => {
    fetch("https://shkolotweaks.xyz/extension/config.json")
        .then(response => response.json())
        .then(data => {
            if (version !== data.version) {
                label_version.innerHTML = `v${version} (${chrome.i18n.getMessage("outdatedVersion")})`
            } else {
                label_version.innerHTML = `v${version} (${chrome.i18n.getMessage("latestVersion")})`
            }
        })
}, 5000)
