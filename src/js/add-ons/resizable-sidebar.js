function resizableSidebar() {
    loadCssFile("/css/shkolo/misc/resizable-sidebar.css")

    const sidebar = $("body > div.page-container > div.page-sidebar-wrapper > div")

    const minWidth = 200, maxWidth = 600

    let isResizing = false

    // Define the resizer element
    let resizer = document.createElement("div")
    resizer.className = "resizable-sidebar resizer"
    sidebar[0].children[0].appendChild(resizer)

    // Add event listeners for resizing
    resizer.addEventListener("mousedown", () => {
        isResizing = true
        document.body.style.userSelect = 'none'
    })

    document.addEventListener("mousemove", (e) => {
        if (!isResizing) return
        const newWidth = clamp(e.clientX - sidebar[0].offsetLeft, minWidth, maxWidth)
        updateSidebarWidth(newWidth)
    })

    document.addEventListener("mouseup", (e) => {
        if (!isResizing) return
        isResizing = false
        document.body.style.userSelect = 'auto'

        const newWidth = clamp(e.clientX - sidebar[0].offsetLeft, minWidth, maxWidth)
        chrome.storage.sync.set({ sidebarWidth: newWidth })
    })

    // Initialize the sidebar width to a default value if not set
    document.addEventListener("DOMContentLoaded", () => {
        // Ensure the sidebar is initialized with the correct width
        chrome.storage.sync.get("sidebarWidth", (result) => {
            if (result.sidebarWidth) {
                updateSidebarWidth(result.sidebarWidth)
            }
        })
    })
}

function updateSidebarWidth(width) {
    const sidebar = $("body > div.page-container > div.page-sidebar-wrapper > div")
    const content = $("body > div.page-container > div.page-content-wrapper > div")

    sidebar.css("width", `${width}px`)
    content.css("margin-left", `${width}px`)
    content.css("width", `calc(100% - ${width}px)`)
}

// resizableSidebar()