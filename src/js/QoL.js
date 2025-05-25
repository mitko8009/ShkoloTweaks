function QoL() {
    this.initialize = function() {
        this.removeAds();
        this.loadQoLCss();
        this.emailAndTel();
        this.messagesBackgroundFix();
        this.detailsDate();

        // Extras
        if (compatibility_mode) { loadCssFile("/css/shkolo/compatibility.css") }
    }

    this.loadQoLCss = function() {
        loadCssFile("/css/shkolo/QoL.css");
    }

    this.removeAds = function() {
        try {
            removeElements($(".btn.btn-lg.btn-e2e.red.huge"));
            removeElements($(".rank-descr"));
            removeElements($(".mobile-app-badges"));
            removeElements($(".mobile-app-link"));
            $("#help-link-in-menu").remove();
        } catch (error) {
            console.error(`[${manifest.name} v${version}][QoL]: Failed to remove ads. ERROR: ${error}`);
        }
    }

    this.emailAndTel = function() {
        try {
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
    
        } catch (error) {
            console.error(`[${manifest.name} v${version}][QoL]: Failed to fix email and phone links. ERROR: ${error}`);
        }
    }

    this.messagesBackgroundFix = function() {
        if (pageurl.includes("/messages/")) {
            let spans = document.querySelectorAll("span");
            spans.forEach(span => {
                if (span.style.backgroundColor === "rgb(255, 255, 255)") {
                    span.style.backgroundColor = "";
                }
            });
        }
    }

    this.detailsDate = function() {
        if (pageurl.includes("/profile/logins")) {
            try { 
                const table = $("#tab_logins > div:nth-child(2) > table > tbody > tr")
                for (let i = 0; i < table.length; i++) {
                    const dateElement = table[i].children[0].cloneNode(true)
                    dateElement.children[0].remove()
                    let dateElementText = dateElement.innerHTML
                    dateElementText = dateElement.innerHTML.substring(1)
                    dateElementText = dateElementText.replace(/\./g, "/")
                    let UnixTimestamp = convertToUnixTimestamp(dateElementText)
                    let daysSinceTimestamp = Math.floor((Date.now() / 1000 - UnixTimestamp) / 86400);
                    
                    table[i].children[0].innerHTML += `<span style="margin-left: .8rem; filter: brightness(0.8);">(${chrome.i18n.getMessage("DaysAgo").replace("%s", daysSinceTimestamp)})</span>`
                }
            } catch (error) {
                console.error(`[${manifest.name} v${version}][QoL]: Failed to fix details date. ERROR: ${error}`)
            }
        }
    }
}