function QoL() {
    this.initialize = function() {
        this.removeAds();
        this.loadQoLCss();
        this.emailAndTel();
        this.messagesBackgroundFix();
        this.detailsDate();
        this.InAppExtSettings();

        // Extras
        if (compatibility_mode) { loadCssFile("/css/shkolo/compatibility.css") }

        chrome.storage.sync.get(null, (result) => {
            if (result.colored_icons || result.colored_icons === undefined) loadCssFile("/css/shkolo/misc/colored_icons.css")
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

    this.InAppExtSettings = function() {
        if (pageurl.includes("/profile/settings")) {
            try {
                // Create settings container
                const settingsContainer = document.querySelector("body > div.page-container > div.page-content-wrapper > div > div > div > form > div");
                if (!settingsContainer) return;

                const settingsContainerPortlet = document.createElement("div");
                settingsContainerPortlet.className = "portlet";
                
                const settingsContainerPortletBody = document.createElement("div");
                settingsContainerPortletBody.className = "portlet-body";

                const settingsContainerPortletTitle = document.createElement("div");
                settingsContainerPortletTitle.className = "portlet-title";
                settingsContainerPortletTitle.innerHTML = `<div class="caption"><img src="${chrome.runtime.getURL("assets/icon_x48_white.png")}" alt="ShkoloTweaks Icon" style="width: 24px; height: 24px;"> ShkoloTweaks BETA</div>`;

                // Discaimer
                const disclaimer = document.createElement("div");
                disclaimer.className = "alert alert-warning";
                disclaimer.innerHTML = chrome.i18n.getMessage("disclaimer_settings_reload");
                settingsContainerPortletBody.appendChild(disclaimer);

                const disclaimer2 = document.createElement("div");
                disclaimer2.className = "alert alert-info";
                disclaimer2.innerHTML = chrome.i18n.getMessage("disclaimer_settings_more");
                settingsContainerPortletBody.appendChild(disclaimer2);

                // Append settings
                // Appearance Settings
                settingsContainerPortletBody.appendChild(document.createElement("h3")).innerText = chrome.i18n.getMessage("appearanceSettingsTitle");
                settingsContainerPortletBody.appendChild(Object.assign(document.createElement("hr"), { style: "margin-top:-0.5rem" }));
                settingsContainerPortletBody.appendChild(createCheckbox(chrome.i18n.getMessage("roundedLabel"), "rounded-corners", rounded));
                settingsContainerPortletBody.appendChild(createCheckbox(chrome.i18n.getMessage("blurLabel"), "blur-background", blur_data));
                settingsContainerPortletBody.appendChild(createCheckbox(chrome.i18n.getMessage("coloredIcons_description"), "colored-icons", globalResult.colored_icons));

                // Extening Functionality
                settingsContainerPortletBody.appendChild(document.createElement("h3")).innerText = chrome.i18n.getMessage("extendingFunctionalityTitle");
                settingsContainerPortletBody.appendChild(Object.assign(document.createElement("hr"), { style: "margin-top:-0.5rem" }));
                settingsContainerPortletBody.appendChild(createCheckbox(chrome.i18n.getMessage("schedule_widget_description"), "show-schedule-module", globalResult.schedule));
                settingsContainerPortletBody.appendChild(createCheckbox(chrome.i18n.getMessage("control_tests_widget_description"), "control-tests-widget", globalResult.control_tests));
                settingsContainerPortletBody.appendChild(createCheckbox(chrome.i18n.getMessage("yearCountdown_description"), "year-countdown", globalResult.year_countdown));
                settingsContainerPortletBody.appendChild(createCheckbox(chrome.i18n.getMessage("statsPanel_description"), "stats-panel", globalResult.stats_panel));

                // Miscellaneous
                settingsContainerPortletBody.appendChild(document.createElement("h3")).innerText = chrome.i18n.getMessage("Miscellaneous");
                settingsContainerPortletBody.appendChild(Object.assign(document.createElement("hr"), { style: "margin-top:-0.5rem" }));
                settingsContainerPortletBody.appendChild(createCheckbox(chrome.i18n.getMessage("devTools"), "dev-tools", globalResult.dev_tools));

                // Listener for saving settings
                settingsContainerPortletBody.querySelectorAll('input[type="checkbox"]').forEach(input => {
                    input.addEventListener('change', (e) => {
                        const keyMap = {
                            "rounded-corners": "rounded",
                            "blur-background": "blur_data",
                            "colored-icons": "colored_icons",
                            "show-schedule-module": "schedule",
                            "control-tests-widget": "control_tests",
                            "year-countdown": "year_countdown",
                            "stats-panel": "stats_panel",
                            "dev-tools": "dev_tools"
                        };
                        const key = keyMap[e.target.id];
                        if (key) {
                            if (key in globalResult) {
                                globalResult[key] = e.target.checked;
                            } else {
                                window[key] = e.target.checked;
                            }
                            chrome.storage.sync.set({ [key]: e.target.checked });
                        }
                    });
                });

                // Version and information
                settingsContainerPortletBody.appendChild(document.createElement("h3")).innerText = chrome.i18n.getMessage("information");
                settingsContainerPortletBody.appendChild(Object.assign(document.createElement("hr"), { style: "margin-top:-0.5rem" }));

                const disclaimerParagraph = document.createElement("div");
                disclaimerParagraph.className = "alert alert-warning";
                disclaimerParagraph.innerHTML = chrome.i18n.getMessage("FooterDisclaimer");
                settingsContainerPortletBody.appendChild(disclaimerParagraph);

                const versionParagraph = document.createElement("div");
                versionParagraph.className = "alert alert-info";
                versionParagraph.innerHTML = `${chrome.i18n.getMessage("version")}: <b>${version}</b>`;

                const btnContainer = document.createElement("div");
                btnContainer.style.marginTop = "0.5rem";

                const websiteBtn = document.createElement("a");
                websiteBtn.href = manifest.homepage_url;
                websiteBtn.target = "_blank";
                websiteBtn.className = "btn btn-default";
                websiteBtn.style.marginRight = "0.5rem";
                websiteBtn.innerHTML = `<img src="${chrome.runtime.getURL("assets/icon_x48_white.png")}" alt="Website" style="width:22px;vertical-align:middle;margin-right:2px;margin-top:-0.3rem;margin-left:-0.4rem;"> Official Website`;

                const githubBtn = document.createElement("a");
                githubBtn.href = "https://github.com/mitko8009/ShkoloTweaks";
                githubBtn.target = "_blank";
                githubBtn.className = "btn btn-default";
                githubBtn.innerHTML = `<img src="${chrome.runtime.getURL("assets/github-mark.svg")}" alt="GitHub" style="width:22px;vertical-align:middle;margin-right:2px;margin-top:-0.3rem;margin-left:-0.4rem;"> GitHub`;

                btnContainer.appendChild(websiteBtn);
                btnContainer.appendChild(githubBtn);

                versionParagraph.appendChild(btnContainer);
                settingsContainerPortletBody.appendChild(versionParagraph);

                // Append the settings container to the main settings container
                settingsContainerPortlet.appendChild(settingsContainerPortletTitle);
                settingsContainerPortlet.appendChild(settingsContainerPortletBody);
                settingsContainer.appendChild(settingsContainerPortlet);
            } catch (error) {
                console.error(`[${manifest.name} v${version}][QoL]: Failed to access settings container. ERROR: ${error}`);
            }
        }
    }

    function createCheckbox(labelText, id, chekced = false) {
        const formGroup = document.createElement("div");
        formGroup.className = "form-group";
        
        const label = document.createElement("label");
        label.setAttribute("for", id);
        label.className = "control-label col-md-6";
        label.textContent = labelText;

        const inputGroup = document.createElement("div");
        inputGroup.className = "input-group col-md-3";

        const onOffSwitch = document.createElement("label");
        onOffSwitch.className = "onOffSwitch neutral-colors";

        const checkbox = document.createElement("input");
        checkbox.className = "onOffSwitch-input";
        checkbox.type = "checkbox";
        checkbox.name = id;
        checkbox.id = id;
        if (chekced) checkbox.checked = true;

        const switchLabel = document.createElement("span");
        switchLabel.className = "onOffSwitch-label";
        switchLabel.setAttribute("data-on", "Yes");
        switchLabel.setAttribute("data-off", "No");

        const switchHandle = document.createElement("span");
        switchHandle.className = "onOffSwitch-handle";

        onOffSwitch.appendChild(checkbox);
        onOffSwitch.appendChild(switchLabel);
        onOffSwitch.appendChild(switchHandle);

        inputGroup.appendChild(onOffSwitch);

        formGroup.appendChild(label);
        formGroup.appendChild(inputGroup);

        return formGroup;
    }
}