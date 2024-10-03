const manifest = chrome.runtime.getManifest()
const version = manifest.version
const pageurl = window.location.href

// Define jQuery
let script = document.createElement("script")
script.src = chrome.runtime.getURL("lib/jquery.min.js")
script.type = "text/javascript" 
document.getElementsByTagName("head")[0].appendChild(script)

const AddCustomStyle = css => document.head.appendChild(document.createElement("style")).innerHTML = css

function loadCssFile(fileName) {
    fetch(chrome.runtime.getURL(fileName))
    .then(response => response.text())
    .then(data => { AddCustomStyle(data) });
}

function checkTheme() {
    if (theme !== "light") { // Load Any Theme
        loadCssFile(`themes/__mon__/${theme}/style.css`)

        return
    }

    // Placeholder for theme switch button
}

function main() {
    loadCssFile("css/mon/__global.css")

    checkTheme()
}

let globalResult;
let theme, cleanUp, blurPfp, rounded, scheduleWidget // Global Variables
chrome.storage.sync.get(["theme", "cleanUp", "blurPfp", "rounded", "scheduleWidget"], (result) => {
    globalResult = result

    theme = result.theme
    cleanUp = result.cleanUp
    blurPfp = result.blurPfp
    rounded = result.rounded
    scheduleWidget = result.scheduleWidget

    main();
});
