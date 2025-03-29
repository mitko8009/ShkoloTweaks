const manifest = chrome.runtime.getManifest()
const version = manifest.version
const pageurl = window.location.href

// Define jQuery
let script = document.createElement("script")
script.src = chrome.runtime.getURL("lib/jquery.min.js")
script.type = "text/javascript" 
document.getElementsByTagName("head")[0].appendChild(script)

function checkTheme() {
    if (theme !== "light") { // Load Any Theme
        loadCssFile(`themes/__mon__/${theme}/style.css`)

        try {
            let script = document.createElement("script")
            script.src = chrome.runtime.getURL(`themes/__mon__/${theme}/script.js`)
            script.type = "text/javascript"
            document.getElementsByTagName("head")[0].appendChild(script)
        } catch { console.warn("Failed to load script.js for the theme.") }

        return
    }

    // Placeholder for theme switch button
}

function CleanUp() {
    moveElementWithRecursion(
        "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > div > main > ng-component > sb-simple-page-skeleton-template > sb-book > sb-tabs > div > nav",
        "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > nav",
        "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > nav > nav"
    )

    // moveElementWithRecursion(
    //     "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > nav > sb-app-menu",
    //     "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > header > div",
    //     "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > header > div > sb-app-menu"
    // )

    $("#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > nav > sb-app-menu").remove()
    
    // moveElementWithRecursion(
    //     "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > header > div > sb-app-menu > div > sb-menu > ul > li > sb-menu",
    //     "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > nav",
    //     "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > nav > sb-menu"
    // )
}

function main() {
    loadCssFile("css/mon/__global.css")

    checkTheme()
    if (cleanUp) CleanUp()
}

let globalResult
let theme, cleanUp, blurPfp, rounded, scheduleWidget // Global Variables
chrome.storage.sync.get(["theme", "cleanUp", "blurPfp", "rounded", "scheduleWidget"], (result) => {
    globalResult = result

    theme = result.theme
    cleanUp = result.cleanUp
    blurPfp = result.blurPfp
    rounded = result.rounded
    scheduleWidget = result.scheduleWidget

    main()
})
