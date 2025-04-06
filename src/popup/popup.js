const manifest = chrome.runtime.getManifest()
const version = manifest.version
const label_version = document.getElementById('version')

function refresh_page() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.reload(tabs[0].id)
    })
}

$("#version").text("v"+version)

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
    chrome.storage.sync.set({ theme: theme }, () => { refresh_page() })
})

darkThemeBtn.addEventListener('click', () => {
    theme = 'dark'
    applyTheme(theme)
    chrome.storage.sync.set({ theme: theme }, () => { refresh_page() })
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
    refresh_page()
})

$("#blur-data").click(() => {
    const blur_data = $("#blur-data").prop("checked")
    chrome.storage.sync.set({ blur_data: blur_data })
    refresh_page()
})