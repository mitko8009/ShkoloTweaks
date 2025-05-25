function applyTheme(theme) {
    if (theme === 'dark') {
        $(".bg_overlay").show()
    } else {
        $(".bg_overlay").hide()
    }
}

chrome.storage.sync.get(['theme'], (result) => {
    theme = result.theme || 'light'
    applyTheme(theme)
})

chrome.storage.sync.get(null, (result) => {
    const autoRefresh = result.autoRefresh ?? true
    $("#autoRefresh").prop("checked", autoRefresh)

    const schedule = result.schedule ?? true
    $("#schedule").prop("checked", schedule)

    const control_tests = result.control_tests ?? true
    $("#control_tests").prop("checked", control_tests)

    const reorder_sidebar = result.reorder_sidebar ?? true
    $("#reorder_sidebar").prop("checked", reorder_sidebar)

    const year_countdown = result.year_countdown ?? false
    $("#year_countdown").prop("checked", year_countdown)
    tagSetting("year_countdown", "Beta Feature", "#ffcc00")

    const stats_panel = result.stats_panel ?? false
    $("#stats_panel").prop("checked", stats_panel)
    tagSetting("stats_panel", "Beta Feature", "#ffcc00")

    const dev_tools = result.dev_tools ?? false
    $("#dev_tools").prop("checked", dev_tools)
    tagSetting("dev_tools", "Dev", "#6d48a5")

    const colored_icons = result.colored_icons ?? false
    $("#colored_icons").prop("checked", colored_icons)
    tagSetting("colored_icons", "New", "#0d50e2")
})

chrome.storage.local.get(null, (result) => {
    if (result.disablePupilIDFeatures) {
        tagSetting("schedule", "UNAVALIABLE", "#ff4f4f")
        $("#schedule").parent().addClass("disabled")

        tagSetting("control_tests", "UNAVALIABLE", "#ff4f4f")
        $("#control_tests").parent().addClass("disabled")

        tagSetting("stats_panel", "UNAVALIABLE", "#ff4f4f")
        $("#stats_panel").parent().addClass("disabled")
    }
})

$(".options").click(function() {
    this.children[0].checked = !this.children[0].checked

    const option = this.children[0].id
    const optionElement = $("#" + option)
    const optionValue = optionElement.prop("checked")
    chrome.storage.sync.set({ [option]: optionValue })

    $(this).addClass("clicked")
    setTimeout(() => {
        $(this).removeClass("clicked")
    }, 300)
})

// General Settings
// Theme Switcher
const lightThemeBtn = document.getElementById('lightTheme')
const darkThemeBtn = document.getElementById('darkTheme')
const body = document.body

let theme = 'light' // Default theme

function applyTheme(theme) {
    if (theme === 'dark') {
        $(".bg_overlay").show()
        body.style.color = '#ccc'
        darkThemeBtn.classList.add('active')
        lightThemeBtn.classList.remove('active')
    } else {
        $(".bg_overlay").hide()
        body.style.color = '#fff'
        lightThemeBtn.classList.add('active')
        darkThemeBtn.classList.remove('active')
    }
}

chrome.storage.sync.get(['theme'], (result) => {
    theme = result.theme || 'light'
    applyTheme(theme)
})

lightThemeBtn.addEventListener('click', () => {
    theme = 'light'
    applyTheme(theme)
    chrome.storage.sync.set({ theme: theme })
})

darkThemeBtn.addEventListener('click', () => {
    theme = 'dark'
    applyTheme(theme)
    chrome.storage.sync.set({ theme: theme })
})

// Buttons
chrome.storage.sync.get(['rounded', 'blur_data'], (result) => {
    const rounded = result.rounded || false
    const blur_data = result.blur_data || false

    $("#rounded").prop("checked", rounded)
    $("#blur-data").prop("checked", blur_data)
})

$("#rounded").click(() => {
    const rounded = $("#rounded").prop("checked")
    chrome.storage.sync.set({ rounded: rounded })
})

$("#blur-data").click(() => {
    const blur_data = $("#blur-data").prop("checked")
    chrome.storage.sync.set({ blur_data: blur_data })
})

$("#chrome_storage").click(() => {
    showPopup($("#chrome_storage_popup"))

    chrome.storage.sync.get(null, (result) => {
        updateStorageTable(result)
    })
})

$("#chrome_storage_update_button").click(() => {
    chrome.storage.sync.get(null, (result) => {
        updateStorageTable(result)
    })
})

$("#chrome_storage_set_button").click(() => {
    const key = $("#chrome_storage_key").val().trim()
    const value = $("#chrome_storage_value").val().trim()

    if (key) {
        chrome.storage.sync.set({ [key]: value }, () => {
            $("#chrome_storage_key").val("")
            $("#chrome_storage_value").val("")
            chrome.storage.sync.get(null, (result) => {
                updateStorageTable(result)
            })
        })
    }
})

$("#chrome_storage_remove_button").click(() => {
    const key = $("#chrome_storage_key").val().trim()

    if (key) {
        chrome.storage.sync.remove([key], () => {
            $("#chrome_storage_key").val("")
            chrome.storage.sync.get(null, (result) => {
                updateStorageTable(result)
            })
        })
    }
})

$("#chrome_storage_clear_button").click(() => {
    if (confirm("Are you sure you want to clear all Chrome storage data? This action cannot be undone.")) {
        chrome.storage.sync.clear(() => {
            chrome.storage.sync.get(null, (result) => {
                updateStorageTable(result)
            })
        })
    }
})

function updateStorageTable(data) {
    let tableContent = "<table><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>"
    for (const [key, value] of Object.entries(data)) {
        tableContent += `<tr><td>${key}</td><td>${JSON.stringify(value)}</td></tr>`
    }
    tableContent += "</tbody></table>"
    $("#chrome_storage_result").html(tableContent)
}

//popup system
let activePopup = null

function hideAllPopups() {
    $("#box_popup_overlay").hide()
    $("#chrome_storage_popup").hide()
}

$("#box_popup_overlay").click(() => {
    if (activePopup) {
        activePopup.hide()
        $("#box_popup_overlay").hide()
        activePopup = null
    }
})

function showPopup(popup) {
    hideAllPopups()
    $("#box_popup_overlay").show()
    popup.show()
    activePopup = popup
}

// Compatibility Settings
var clickCount = 0
$("#logo").click(() => {
    clickCount++

    if (clickCount >= 10) {
        clickCount = 0
        chrome.storage.sync.get("compatibility_mode" , (result) => {
            chrome.storage.sync.set({ compatibility_mode: !result.compatibility_mode }, () => {
                const compatibilityMode = !result.compatibility_mode
                if (compatibilityMode) {
                    alert("Compatibility mode enabled.")
                } else {
                    alert("Compatibility mode disabled.")
                }
            })
        })

        $("#logo").css({
            "transition": "transform 1s",
            "transform": "rotate(0deg)"
        })
    }    

    if (!(clickCount <= 2)) $("#logo").css({
        "transition": "transform 0.2s",
        "transform": "rotate(" + ((clickCount - 2) * 7) + "deg)"
    })
})

// Tag a Setting | Add a tag for more information to a setting
function tagSetting(setting, text, color) {
    const fontColor = isColorLight(color) ? '#000' : '#fff'
    const settingElement = $("#" + setting).parent()
    const tag = $("<p class='tag' style='background-color: " + color + "; color: " + fontColor + "'>" + text + "</p>")
    settingElement.children().eq(2).after(tag)
    console.log("Tagging setting: " + setting)
}