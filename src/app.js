const manifest = chrome.runtime.getManifest()
const version = manifest.version
const pageurl = window.location.href

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const WIDGETSROW = $(".col-md-12")[0].children[2]

const today = new Date();
const year = today.getFullYear();

// Define jQuery
var script = document.createElement("script")
script.src = chrome.runtime.getURL("lib/jquery.min.js")
script.type = "text/javascript" 
document.getElementsByTagName("head")[0].appendChild(script)

const AddCustomStyle = css => document.head.appendChild(document.createElement("style")).innerHTML = css

function loadCssFile(fileName) {
    fetch(chrome.runtime.getURL(fileName))
    .then(response => response.text())
    .then(data => { AddCustomStyle(data) });
}

function removeElements(elements) {
    Array.from(elements).forEach(function (element) {
        element.remove()
    })
}

function getIcon(subject) {
    var icon = document.createElement("i")
    icon.classList.add("fal", "fa-"+subject.toLowerCase(), "scIcon")
    return icon
}

loadCssFile("css/__global.css")

function main() {
        if (theme !== "light") { // Load Any Theme
        loadCssFile(`themes/${theme}/style.css`)

        // Remove all element styles from all elements in the message-body
        var messageBody = document.getElementsByClassName("message-body")[0]
        if (messageBody !== undefined) {
            for (var i = 0; i < messageBody.children.length; i++) {
                messageBody.children[i].removeAttribute("style")
            }
        }
        
        try {
            var script = document.createElement("script")
            script.src = chrome.runtime.getURL(`themes/${theme}/script.js`)
            script.type = "text/javascript"
            document.getElementsByTagName("head")[0].appendChild(script)
        } catch { console.warn("Failed to load script.js for the theme.") }
    } else {
        var topMenu = $(".nav.navbar-nav.pull-right")[0]
        var option = topMenu.children[2].cloneNode(true)
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

    if (cleanUp) { // Cleanup (aka. General Fixes)
        removeElements($(".btn.btn-lg.btn-e2e.red.huge"))
        removeElements($(".rank-descr"))
        removeElements($(".mobile-app-badges"))
        removeElements($(".mobile-app-link"))
        $("#help-link-in-menu").remove()

        loadCssFile("css/cleanup.css")
    }

    if(blurPfp) { loadCssFile("css/blurData.css") }
    if(rounded) { loadCssFile("css/rounded.css") } 

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
