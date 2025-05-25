function QoL() {
    this.initialize = function() {
        this.removeAds();
        this.loadQoLCss();
        this.emailAndTel();
        this.messagesBackgroundFix();
        this.detailsDate();

        // Extras
        if (compatibility_mode) { loadCssFile("/css/shkolo/compatibility.css") }

        chrome.storage.sync.get(null, (result) => {
            if (result.colored_icons) loadCssFile("/css/shkolo/misc/colored_icons.css")
        })
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
        const dotRegex = /\./g
        const dashRegex = /\-/g

        if (pageurl.includes("/profile/logins")) {
            try { 
                const table = $("#tab_logins > div:nth-child(2) > table > tbody > tr")
                for (let i = 0; i < table.length; i++) {
                    this.detailsDate_element(table, i, 0, dotRegex);
                }
            } catch (error) {
                console.error(`[${manifest.name} v${version}][QoL]: Failed to fix details date. ERROR: ${error}`)
            }
        }

        if (pageurl.includes("/profile/pendingprofilepic")) {
            try {
                const table = $("body > div.page-container > div.page-content-wrapper > div > div > div > div.profile-content > div > div.portlet-body > div:nth-child(2) > div > table > tbody > tr")
                for (let i = 0; i < table.length; i++) {
                    this.detailsDate_element(table, i, 1, dashRegex, false);
                }
            } catch (error) {
                console.error(`[${manifest.name} v${version}][QoL]: Failed to fix pending profile picture date. ERROR: ${error}`)
            }
        }
    }

    this.detailsDate_element = function(table, i, columnIndex, char_to_replace, hasIcon = true) {
        const dateElement = table[i].children[columnIndex].cloneNode(true)
        if (hasIcon) dateElement.children[0].remove()
        let dateElementText = dateElement.innerHTML.trim().replace(/^\s+|\s+$/g, '').replace(/\s{2,}/g, ' ')
        if (dateElementText.length && !/\d/.test(dateElementText[0])) {
            dateElementText = dateElementText.substring(1).trim()
        }
        dateElementText = dateElementText.replace(char_to_replace, "/")

        // Identify date format and convert to DD/MM/YYYY HH:mm:ss
        let formattedDate = dateElementText;
        let dateObj = null;

        // Try to match YYYY/MM/DD or DD/MM/YYYY with optional time
        const ymdRegex = /^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
        const dmyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/

        if (ymdRegex.test(dateElementText)) {
            // Format: YYYY/MM/DD [HH:mm[:ss]]
            const match = dateElementText.match(ymdRegex);
            dateObj = new Date(
                Number(match[1]), // year
                Number(match[2]) - 1, // month (0-based)
                Number(match[3]), // day
                Number(match[4] || 0), // hour
                Number(match[5] || 0), // minute
                Number(match[6] || 0)  // second
            );
        } else if (dmyRegex.test(dateElementText)) {
            // Format: DD/MM/YYYY [HH:mm[:ss]]
            const match = dateElementText.match(dmyRegex);
            dateObj = new Date(
                Number(match[3]), // year
                Number(match[2]) - 1, // month (0-based)
                Number(match[1]), // day
                Number(match[4] || 0), // hour
                Number(match[5] || 0), // minute
                Number(match[6] || 0)  // second
            );
        }

        if (dateObj && !isNaN(dateObj.getTime())) {
            // Format to DD/MM/YYYY HH:mm:ss
            const pad = n => n.toString().padStart(2, '0');
            formattedDate = `${pad(dateObj.getDate())}/${pad(dateObj.getMonth() + 1)}/${dateObj.getFullYear()} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`
        }

        let UnixTimestamp = dateObj ? Math.floor(dateObj.getTime() / 1000) : convertToUnixTimestamp(dateElementText);
        let daysSinceTimestamp = Math.floor((Date.now() / 1000 - UnixTimestamp) / 86400);

        console.debug(`[${manifest.name} v${version}][QoL]: Converting date "${dateElementText}" to "${formattedDate}" to Unix Timestamp: ${UnixTimestamp} (${daysSinceTimestamp} days ago)`);

        table[i].children[columnIndex].innerHTML += `<span style="margin-left: .8rem; filter: brightness(0.8);">(${chrome.i18n.getMessage("DaysAgo").replace("%s", daysSinceTimestamp)})</span>`;
    }
}