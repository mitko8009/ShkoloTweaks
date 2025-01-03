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
$("#dev_panel").hide();

$("#saveBtn").click(() => { saveData(); })

chrome.storage.sync.set({flags: {}})
chrome.storage.sync.get(["flags"], (result) => {
    flags = result.flags
    fetch(chrome.runtime.getURL("data/dev_flags.json"))
    .then(response => response.json())
    .then(data => { chrome.storage.sync.set({flags: Object.assign({}, data, flags)}); })
});

function saveData() {
    const prefs = {
        theme: themeElement.value,
        rounded: $("#rounded").attr("aria-pressed") === "true",
        cleanUp: $("#cleanup").attr("aria-pressed") === "true",
        blurPfp: $("#blurpfp").attr("aria-pressed") === "true",
        scheduleWidget: $("#scWidget").attr("aria-pressed") === "true"
    }

    // $("#saveBtn").css("background", "none").css("box-shadow", "0 0 0 0");
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

// Checking for updates
function checkForUpdates() {
    fetch("https://shkolotweaks.xyz/extension/config.json")
    .then(response => response.json())
    .then(data => {
        if (version < data.version) {
            label_version.innerHTML = `v${version} (${chrome.i18n.getMessage("outdatedVersion").replace("%s", data.version)})`
        } else if (version > data.version) {
            label_version.innerHTML = `v${version} (${chrome.i18n.getMessage("devVersion").replace("%s", data.version)})`
        } else {
            label_version.innerHTML = `v${version} (${chrome.i18n.getMessage("latestVersion")})`
        }
    });
}
checkForUpdates();

// Developer Panel
// function refreshDevPanel() {
//     chrome.storage.sync.get(["flags"], (result) => {
//         console.log(result)
//         const flags = result.flags
//         $("#dev_flags").empty()
//         for (const flag in flags) {
//             $("#dev_flags").append(`<div class="dev_flag${flags[flag].value?"active":""}" data-flag="${flags[flag].flag}">${flags[flag].display}</div>`)
//         }
//     });

//     // $("#dev_flags").append(`<div class="dev_flag" data-flag="test" id="test">Test</div>`)
//     // $("#dev_flag").click(() => { console.log("Clicked!"); })
//     // document.getElementById("#dev_flags").append(`<div class="dev_flag" data-flag="test">Test</div>`)

//     // $(".dev_flag").click(function() {
//     //     console.log("Clicked: "+$(this).attr("data-flag"))
//     //     const flag = $(this).attr("data-flag")
//     //     chrome.storage.sync.get(["flags"], (result) => {
//     //         const flags = result.flags
//     //         flags[flag].value = !flags[flag].value
//     //         chrome.storage.sync.set({flags: flags})
//     //         console.log(flags)
//     //     });
//     // });
// }

// $(label_version).click(() => { 
//     checkForUpdates();
//     refreshDevPanel();
//     $("#dev_panel").css("opacity", 0).show().animate({opacity: 1}, 200);
// });
// $("#close_dev_panel").click(() => { $("#dev_panel").animate({opacity: 0}, 200, function() { $(this).hide(); }); });
// $("#logging").click(function() {
//     chrome.storage.sync.get(["logging"], (result) => {
//         const logging = result.logging
//         chrome.storage.sync.set({logging: !logging})
//         toggleOptionState($(this), !logging)
//     })
// });



// Themes
function themesInit() {
    fetch(chrome.runtime.getURL("themes/themes.json"))
    .then(response => response.json())
    .then(data => {
        for (const themeData in data["custom_themes"]) {
            const themeDirectory = data["custom_themes"][themeData].directory
            let tags = ""

            if (data["custom_themes"][themeData].icon) tags += `<img src="${chrome.runtime.getURL(`themes/${themeDirectory}/${data["custom_themes"][themeData].icon}`)}" class="icon32">`
            else tags += `<img src="${chrome.runtime.getURL(`assets/icon_x32.png`)}" class="icon32">`

            $("#custom-themes").append(`<a type="button" class="option theme-option" aria-pressed="false" id="theme_${themeDirectory}" data-value="${themeDirectory}">${tags}</a>`)
        }

        $("#themePopup").click(() => { $("#theme-options").show().css({opacity: 0}).animate({opacity: 1}, 100); })

        $(".theme-option").click(function() {
            themeElement.value = $(this).attr("data-value")
            $("#theme-options").animate({opacity: 0}, 100, function() { $(this).hide(); });
            toggleOptionState($(`#theme_${themeElement.value}`), false)
            saveData()
        });
    });
}

chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const url = new URL(tabs[0].url)

    if (url.hostname.includes("shkolo.bg")) {
        $("#shkoloBtn").remove()
    }
});

chrome.storage.sync.get(["theme", "cleanUp", "blurPfp", "rounded", "scheduleWidget"], (result) => {   
    const { theme, cleanUp, blurPfp, rounded, scheduleWidget } = result

    console.log(result)

    themeElement.value = theme
    toggleOptionState($(`#theme_${theme}`), false)
    toggleOptionState($("#rounded"), rounded)
    toggleOptionState($("#cleanup"), cleanUp)
    toggleOptionState($("#blurpfp"), blurPfp)
    toggleOptionState($("#scWidget"), scheduleWidget)
})

label_version.innerHTML = `v${version}`

themesInit();

