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

chrome.storage.sync.get(['autoRefresh'], (result) => {
    const autoRefresh = result.autoRefresh
    $("#autoRefresh").prop("checked", autoRefresh)
})

// Popup Settings
$("#autoRefresh").click(() => {
    const autoRefresh = $("#autoRefresh").prop("checked")
    chrome.storage.sync.set({ autoRefresh: autoRefresh })
})