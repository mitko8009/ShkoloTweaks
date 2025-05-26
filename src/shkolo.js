const manifest = chrome.runtime.getManifest()
const version = manifest.version
const pageurl = window.location.href

const today = new Date();
const year = today.getFullYear();

// User Details
var pupil_id = null
try {
    pupil_id = JSON.parse(localStorage.getItem("diary_filters_grades_/diary"))["pupil_id"]
    chrome.storage.local.set({ disablePupilIDFeatures: false })
} catch (e) {
    console.warn(`[${manifest.name} v${version}]: Failed to get pupil_id from localStorage. This may result in some features not working properly or complitely disabled. If you think this is a bug, please report it on GitHub with the flollowing information: ${e}`)
    chrome.storage.local.set({ disablePupilIDFeatures: true })
}

// Define jQuery
let script = document.createElement("script")
script.src = chrome.runtime.getURL("lib/jquery.min.js")
script.type = "text/javascript" 
document.getElementsByTagName("head")[0].appendChild(script)

function main() {
    stat_tracking() // Track stats

    try {
        $("#sc-name-lbl").html($("#sc-name-lbl").html() + ` | ${manifest.name} v` + version);
        $(".page-footer-inner")[0].innerHTML += " | " + chrome.i18n.getMessage("FooterDisclaimer");
    } catch {
        console.log("Login page footer fix failed")
    }

}  

let globalResult;
let theme, blur_data, rounded, DEBUG, compatibility_mode // Global Variables
chrome.storage.sync.get(null, (result) => {
    globalResult = result

    theme = result.theme
    blur_data = result.blur_data
    rounded = result.rounded
    DEBUG = result.dev_tools
    compatibility_mode = result.compatibility_mode

    main();

    try {
        const qol = new QoL()
        qol.initialize()
    } catch (error) {
        console.error(`[${manifest.name} v${version}]: Some QoL feature failed to load correctly and the page may not work as expected. Please report this issue on GitHub. ERROR: ${error}`)
    }
});
