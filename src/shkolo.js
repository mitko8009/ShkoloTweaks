const manifest = chrome.runtime.getManifest()
const version = manifest.version_name || manifest.version
const pageurl = window.location.href

const today = new Date();
const year = today.getFullYear();

// Define jQuery
let script = document.createElement("script")
script.src = chrome.runtime.getURL("lib/jquery.min.js")
script.type = "text/javascript"
script.onload = initializePupilId
document.getElementsByTagName("head")[0].appendChild(script)

// User Details
var pupil_id = chrome.storage.local.get("pupil_id", (res) => { pupil_id = res.pupil_id })
var school_name = null

function initializePupilId() {
    try {
        const pupil_element = $("body > div.page-container > div.page-content-wrapper > div > div > div > a")
        pupil_id = pupil_element.length ? pupil_element.attr("href").split("/").pop() : null
        if (!pupil_id) chrome.storage.local.set({ disablePupilIDFeatures: true })
        else chrome.storage.local.set({ disablePupilIDFeatures: false })
        chrome.storage.local.set({ pupil_id })
    } catch (e) {
        console.warn(`[${manifest.name} v${version}]: Failed to get pupil_id from localStorage. This may result in some features not working properly or complitely disabled. If you think this is a bug, please report it on GitHub with the flollowing information: ${e}`)
        chrome.storage.local.set({ disablePupilIDFeatures: true })
    }
}

function main() {
    stat_tracking() // Track stats

    try {
        $("#sc-name-lbl").html($("#sc-name-lbl").html() + ` | ${manifest.name} v` + version);
        try {
            const $el = $("#sc-name-lbl");
            const $clone = $el.clone();
            $clone.find('i').remove();
            let txt = $clone.text().trim();
            const suffix = `| ${manifest.name} v${version}`;
            if (txt.endsWith(suffix)) txt = txt.slice(0, -suffix.length).trim();
            if (txt.endsWith('|')) txt = txt.slice(0, -1).trim();
            school_name = txt;
        } catch { /* ignore extraction errors */ }
        $(".page-footer-inner")[0].innerHTML += " | " + chrome.i18n.getMessage("FooterDisclaimer");
    } catch { }
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
