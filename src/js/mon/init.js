// Initialize Extension
const manifest = chrome.runtime.getManifest()
const version = manifest.version
const pageurl = window.location.href

// Load Global Settings
let globalResult
let theme, blur_data, rounded, scheduleWidget, DEBUG // Global Variables
chrome.storage.sync.get(null, (result) => {
    globalResult = result
    
    theme = result.theme
    blur_data = result.blur_data
    rounded = result.rounded
    scheduleWidget = result.scheduleWidget
    DEBUG = result.dev_tools


    loadCssFile("css/mon/__global.css")

    if (theme !== "light") { // Load Any Theme
        loadCssFile(`themes/__mon__/${theme}/style.css`)
    }

    (() => {
        const maxRetries = 5
        const baseDelay = 300

        function hasLoaded() {
            const v = getComputedStyle(document.documentElement)
                .getPropertyValue('--has-loaded')
                .trim()
                .toLowerCase()
            return v === 'true' || v === '1' || v === 'yes'
        }

        function reloadTheme() {
            // try to find the theme <link> we previously inserted
            const selector = `link[rel="stylesheet"]`
            const links = Array.from(document.querySelectorAll(selector))
            const themeLink = links.find(l => l.href && l.href.includes(`/themes/__mon__/${theme}/style.css`))

            if (themeLink) {
                // force reload by changing query param cache-buster
                try {
                    const u = new URL(themeLink.href)
                    u.searchParams.set('_cb', Date.now())
                    themeLink.href = u.toString()
                } catch (e) {
                    // fallback if URL constructor fails
                    themeLink.href = `${themeLink.href.split('?')[0]}?_cb=${Date.now()}`
                }
            } else {
                // if link not found, insert it again
                loadCssFile(`themes/__mon__/${theme}/style.css?_cb=${Date.now()}`)
            }
        }

        function attempt(retriesLeft) {
            if (hasLoaded()) {
                if (DEBUG) console.log('Theme reported --has-loaded=true')
                return
            }
            if (retriesLeft <= 0) {
                if (DEBUG) console.warn('Theme did not set --has-loaded after retries')
                return
            }
            if (DEBUG) console.log('--has-loaded is false; retrying theme load, attempts left:', retriesLeft)
            reloadTheme()
            setTimeout(() => attempt(retriesLeft - 1), baseDelay)
        }

        if (theme && theme !== 'light') {
            attempt(maxRetries)
        }
    })()
})
