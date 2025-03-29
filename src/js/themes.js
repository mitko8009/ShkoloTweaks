loadCssFile("css/shkolo/__global.css")

function checkTheme() {
    chrome.storage.sync.get(['theme', 'blurPfp', 'rounded'], (result) => {
        theme = result.theme
        blurPfp = result.blurPfp
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
        } else {            
            let topMenu = $(".nav.navbar-nav.pull-right")[0]
            let option = topMenu.children[2].cloneNode(true)
            removeElements(option.children[0].children)
            option.children[0].innerHTML = "Apply Dark Theme"
            option.children[0].style = "color: white !important; font-weight: bold;"
            option.children[0].href = "javascript:void(0)"
            option.children[0].onclick = () => {
                chrome.storage.sync.set({theme: "dark"})
                location.reload()
            }
            option.title = "Apply Dark Theme"
            topMenu.prepend(option)
        }
        
        if(blurPfp) { loadCssFile("css/shkolo/blurData.css") }
        if(rounded) { loadCssFile("css/shkolo/rounded.css") } 
    })
}

checkTheme();
