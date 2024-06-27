const manifest = chrome.runtime.getManifest()
const version = manifest.version
const label_version = document.getElementById('version');

const themeElement = document.getElementById("theme-options");
const cleanUpShkolo = document.getElementById('cleanUpShkolo');
const blurPfpCheck = document.getElementById('blurPfp');
const roundedCheckbox = document.getElementById('roundedCheckbox');
const scheduleWidgetCheckbox = document.getElementById('scheduleWidget');
const saveBtn = document.getElementById('saveBtn');

$("#theme-options").hide()

$("#saveBtn").click(() => { saveData(); })

function saveData() {
    const prefs = {
        theme: themeElement.value,
        rounded: $("#rounded").attr("aria-pressed") === "true",
        cleanUp: $("#cleanup").attr("aria-pressed") === "true",
        blurPfp: $("#blurpfp").attr("aria-pressed") === "true",
        scheduleWidget: $("#scWidget").attr("aria-pressed") === "true"
    }

    $("#saveBtn").css("background", "none").css("box-shadow", "0 0 0 0");
    chrome.storage.sync.set(prefs)
    refreshPage()
}

function refreshPage() {
    console.log("Refreshing page")
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.reload(tabs[0].id);
    });
}

$(".option").click(function() { toggleOptionState($(this)); });
function toggleOptionState(option, state=null) {
    if (state === null) {                                   // Toggle State
        const state = option.attr("aria-pressed") === "true";
        state ? option.removeClass("active") : option.addClass("active");
        option.attr("aria-pressed", !state);
        $("#saveBtn").css("background-color", "hsl(0, 0%, 22%)").css("box-shadow", "0 0 0 1px #fff");
    } else {                                                // Set State
        option.attr("aria-pressed", state);
        state ? option.addClass("active") : option.removeClass("active");
    }
}

$("#themePopup").click(() => { $("#theme-options").show().css({opacity: 0}).animate({opacity: 1}, 100); })

$(".theme-option").click(function() {
    themeElement.value = $(this).attr("data-value")
    $("#theme-options").animate({opacity: 0}, 100, function() { $(this).hide(); });
    toggleOptionState($(`#theme_${themeElement.value}`), false)
    saveData()
}) 

chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const url = new URL(tabs[0].url)

    if (url.hostname.includes("shkolo.bg")) {
        $("#shkoloBtn").remove()
    }
});


chrome.storage.sync.get(["theme", "cleanUp", "blurPfp", "rounded", "scheduleWidget"], (result) => {   
    const { theme, cleanUp, blurPfp, rounded, scheduleWidget } = result

    themeElement.value = theme
    toggleOptionState($(`#theme_${theme}`), false)
    toggleOptionState($("#rounded"), rounded)
    toggleOptionState($("#cleanup"), cleanUp)
    toggleOptionState($("#blurpfp"), blurPfp)
    toggleOptionState($("#scWidget"), scheduleWidget)
})

label_version.innerHTML = `v${version}`

setTimeout(() => {
    fetch("https://shkolotweaks.xyz/extension/config.json")
    .then(response => response.json())
    .then(data => {
        if (version < data.version) {
            label_version.innerHTML = `v${version} (${chrome.i18n.getMessage("outdatedVersion")})`
        } else if (version > data.version) {
            label_version.innerHTML = `v${version} (${chrome.i18n.getMessage("devVersion")})`
        } else {
            label_version.innerHTML = `v${version} (${chrome.i18n.getMessage("latestVersion")})`
        }
    });
}, 5000)
