loadCssFile("css/shkolo/__global.css")

function checkTheme() {
    chrome.storage.sync.get(null, (storage) => {
        if (storage.theme !== "light") { // Load Any Theme
            loadCssFile(`themes/${storage.theme}/style.css`);

            // Remove all element styles from all elements in the message-body
            let messageBody = document.getElementsByClassName("message-body")[0];
            if (messageBody !== undefined) {
                for (let i = 0; i < messageBody.children.length; i++) {
                    messageBody.children[i].removeAttribute("style");
                }
            }

            try {
                let script = document.createElement("script");
                script.src = chrome.runtime.getURL(`themes/${storage.theme}/script.js`);
                script.type = "text/javascript";
                document.getElementsByTagName("head")[0].appendChild(script);
            } catch {
                console.warn("Failed to load script.js for the theme.");
            }
        }

        if (storage.blur_data) { loadCssFile("css/shkolo/blurData.css"); }
        if (storage.no_avatars) { loadCssFile("css/shkolo/noAvatars.css"); }
        if (storage.rounded) { loadCssFile("css/shkolo/rounded.css"); }
    });
}

checkTheme();
