function refresh_page() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.reload(tabs[0].id)
    })
}

// Theme Switcher
const lightThemeBtn = document.getElementById('lightTheme')
const darkThemeBtn = document.getElementById('darkTheme')
const body = document.body

let theme = 'light' // Default theme

function applyTheme(theme) {
    if (theme === 'dark') {
        body.style.background = 'linear-gradient(135deg, #1e1e1e, #3a3a3a)'
        body.style.color = '#ccc'
        darkThemeBtn.classList.add('active')
        lightThemeBtn.classList.remove('active')
    } else {
        body.style.background = 'linear-gradient(135deg, #5d8bf7, #a3c1fc)'
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