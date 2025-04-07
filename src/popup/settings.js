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

chrome.storage.sync.get(['autoRefresh', 'schedule', 'control_tests', 'reorder_sidebar', 'year_countdown', 'stats_panel'], (result) => {
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

    const stats_panel = result.stats_panel ?? false
    $("#stats_panel").prop("checked", stats_panel)
})

$(".options").click(function() {
    this.children[0].checked = !this.children[0].checked

    const option = this.children[0].id
    const optionElement = $("#"+option)
    const optionValue = optionElement.prop("checked")
    chrome.storage.sync.set({ [option]: optionValue })
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
