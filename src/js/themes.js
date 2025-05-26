loadCssFile("css/shkolo/__global.css")

function checkTheme() {
    chrome.storage.sync.get(['theme', 'blur_data', 'rounded'], (result) => {
        theme = result.theme
        blur_data = result.blur_data
        rounded = result.rounded

        if (theme !== "light") { // Load Any Theme
            loadCssFile(`themes/${theme}/style.css`)
    
            // Remove all element styles from all elements in the message-body
            let messageBody = document.getElementsByClassName("message-body")[0]
            if (messageBody !== undefined) {
                for (let i = 0; i < messageBody.children.length; i++) {
                    messageBody.children[i].removeAttribute("style")
                }
            }
            
            try {
                let script = document.createElement("script")
                script.src = chrome.runtime.getURL(`themes/${theme}/script.js`)
                script.type = "text/javascript"
                document.getElementsByTagName("head")[0].appendChild(script)
            } catch { console.warn("Failed to load script.js for the theme.") }
        }
        
        if(blur_data || blur_data === undefined) { loadCssFile("css/shkolo/blurData.css") }
        if(rounded || rounded === undefined) { loadCssFile("css/shkolo/rounded.css") } 
    })
}

checkTheme();
