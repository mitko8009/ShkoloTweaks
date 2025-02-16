const manifest = chrome.runtime.getManifest()
const version = manifest.version
const pageurl = window.location.href

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const WIDGETSROW = $(".col-md-12")[0].children[2]

const today = new Date();
const year = today.getFullYear();

// Define jQuery
let script = document.createElement("script")
script.src = chrome.runtime.getURL("lib/jquery.min.js")
script.type = "text/javascript" 
document.getElementsByTagName("head")[0].appendChild(script)

function removeElements(elements) {
    Array.from(elements).forEach(function (element) {
        element.remove()
    })
}

function getIcon(subject) {
    let icon = document.createElement("i")
    icon.classList.add("fal", "fa-"+subject.toLowerCase(), "scIcon")
    return icon
}

function checkTheme() {
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

        return
    }

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

loadCssFile("css/shkolo/__global.css")

function main() {
    checkTheme()

    if (cleanUp) { // Cleanup (aka. General Fixes)
        removeElements($(".btn.btn-lg.btn-e2e.red.huge"))
        removeElements($(".rank-descr"))
        removeElements($(".mobile-app-badges"))
        removeElements($(".mobile-app-link"))
        $("#help-link-in-menu").remove()

        loadCssFile("css/shkolo/cleanup.css")

        if (pageurl.endsWith("/profile") || pageurl.includes("/profile/data/view")) {
            // mailto fix (issue #16)
            let emailElement, telElement
            if (pageurl.endsWith("/profile")) {
                emailElement = document.querySelector("body > div.page-container > div.page-content-wrapper > div > div > div > div.profile-content > div > div.portlet-body > div > div > form > div:nth-child(6) > div > p")
                telElement = document.querySelector("body > div.page-container > div.page-content-wrapper > div > div > div > div.profile-content > div > div.portlet-body > div > div > form > div:nth-child(5) > div > p")
                console.log(emailElement)
            } else if (pageurl.includes("/profile/data/view")) {
                emailElement = document.querySelector("body > div.page-container > div.page-content-wrapper > div > div > div > div > div > div.portlet-body.form > form > div > div:nth-child(2) > div:nth-child(2) > div > div > p")
                telElement = document.querySelector("body > div.page-container > div.page-content-wrapper > div > div > div > div > div > div.portlet-body.form > form > div > div:nth-child(4) > div:nth-child(2) > div > div > p")
            }
            console.log(emailElement)

            if (emailElement !== null) {
                email = emailElement.innerHTML
                emailElement.innerHTML = `<a href="mailto:${email}">${email}</a>`
            }

            if (telElement !== null) {
                let telIcon = telElement.children.length > 0 ? telElement.children[0].cloneNode(true) : null; // There might not be an icon
                if (telIcon) {
                    telElement.children[0].remove();
                }

                tel = telElement.innerHTML.trim()
                telElement.innerHTML = (telIcon != null ? telIcon.outerHTML : "") + ` <a href="tel:${tel}">${tel}</a>`
            }
        }

        if (pageurl.includes("/messages/")) {
            let spans = document.querySelectorAll("span");
            spans.forEach(span => {
                if (span.style.backgroundColor === "rgb(255, 255, 255)") {
                    span.style.backgroundColor = "";
                }
            });
        }
    }

    if(blurPfp) { loadCssFile("css/shkolo/blurData.css") }
    if(rounded) { loadCssFile("css/shkolo/rounded.css") } 

    $("#sc-name-lbl").html($("#sc-name-lbl").html() + ` | ${manifest.name} v` + version);

    $(".page-footer-inner")[0].innerHTML += " | " + chrome.i18n.getMessage("FooterDisclaimer");
}  

let globalResult;
let theme, cleanUp, blurPfp, rounded, scheduleWidget // Global Variables
chrome.storage.sync.get(["theme", "cleanUp", "blurPfp", "rounded", "scheduleWidget"], (result) => {
    globalResult = result

    theme = result.theme
    cleanUp = result.cleanUp
    blurPfp = result.blurPfp
    rounded = result.rounded
    scheduleWidget = result.scheduleWidget

    main();
});
