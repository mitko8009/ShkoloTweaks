const manifest = chrome.runtime.getManifest()
const version = manifest.version
const pageurl = window.location.href

const today = new Date();
const year = today.getFullYear();

// User Details
const pupil_id = JSON.parse(localStorage.getItem("diary_filters_grades_/diary"))["pupil_id"]

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

function main() {
    removeElements($(".btn.btn-lg.btn-e2e.red.huge"))
    removeElements($(".rank-descr"))
    removeElements($(".mobile-app-badges"))
    removeElements($(".mobile-app-link"))
    $("#help-link-in-menu").remove()

    loadCssFile("css/shkolo/cleanup.css")

    if (compatibility_mode) { loadCssFile("css/shkolo/compatibility.css") }

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

        if (pageurl.includes("/messages/")) {
            let spans = document.querySelectorAll("span");
            spans.forEach(span => {
                if (span.style.backgroundColor === "rgb(255, 255, 255)") {
                    span.style.backgroundColor = "";
                }
            });
        }
    }

    try {
        $("#sc-name-lbl").html($("#sc-name-lbl").html() + ` | ${manifest.name} v` + version);
        $(".page-footer-inner")[0].innerHTML += " | " + chrome.i18n.getMessage("FooterDisclaimer");
    } catch {
        console.log("Login page footer fix failed")
    }

}  

let globalResult;
let theme, blur_data, rounded, DEBUG, compatibility_mode // Global Variables
chrome.storage.sync.get(["theme", "blur_data", "rounded", "dev_tools", "compatibility_mode"], (result) => {
    globalResult = result

    theme = result.theme
    blur_data = result.blur_data
    rounded = result.rounded
    DEBUG = result.dev_tools
    compatibility_mode = result.compatibility_mode

    main();
});
