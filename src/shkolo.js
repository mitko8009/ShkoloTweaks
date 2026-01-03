const manifest = chrome.runtime.getManifest()
const version = manifest.version_name || manifest.version
const pageurl = window.location.href

const today = new Date();
const year = today.getFullYear();

// User Details
var pupil_id = null
var school_name = null
try {
    const allLocalStorage = {};
    // Only accept pupil IDs that start with the last two digits of the current school year.
    const schoolYearCutoff = new Date(year, 7, 1);
    const effectiveYear = today < schoolYearCutoff ? year - 1 : year;
    const yearPrefix = String(effectiveYear).slice(-2);
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        allLocalStorage[key] = value;
        try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === "object" && parsed.hasOwnProperty("pupil_id")) {
                const candidate = parsed["pupil_id"];
                const candidateStr = candidate != null ? String(candidate) : "";
                if (candidateStr.startsWith(yearPrefix)) {
                    pupil_id = candidateStr;
                    break;
                }
            }
        } catch (e) { }
    }
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
        try {
            const $el = $("#sc-name-lbl");
            const $clone = $el.clone();
            $clone.find('i').remove();
            let txt = $clone.text().trim();
            const suffix = `| ${manifest.name} v${version}`;
            if (txt.endsWith(suffix)) txt = txt.slice(0, -suffix.length).trim();
            if (txt.endsWith('|')) txt = txt.slice(0, -1).trim();
            school_name = txt;
            if (typeof console !== 'undefined' && console.debug) console.debug(`[${manifest.name}] detected school name:`, school_name);
        } catch (inner) { /* ignore extraction errors */ }
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
