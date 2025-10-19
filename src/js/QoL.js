function QoL() {
    this.initialize = function () {
        // load feature flags from sync storage with defaults
        chrome.storage.sync.get({
            remove_ads: true,
            load_qol_css: true,
            email_and_tel: true,
            messages_background_fix: true,
            details_date: true,
            inapp_ext_settings: true,
            move_logout_button: true,
            trusted_devices_logins: true,
            colored_icons: true,
            rounded: false
        }, (result) => {
            if (result.load_qol_css) this.loadQoLCss();
            if (result.remove_ads) this.removeAds();
            if (result.email_and_tel) this.emailAndTel();
            if (result.messages_background_fix) this.messagesBackgroundFix();
            if (result.details_date) this.detailsDate();
            if (result.inapp_ext_settings) this.InAppExtSettings();
            if (result.move_logout_button) this.moveLogOutButton();
            if (result.trusted_devices_logins) this.trustedDevicesLogins();

            // Extras
            if (typeof compatibility_mode !== 'undefined' && compatibility_mode) {
                loadCssFile("/css/shkolo/compatibility.css");
            }

            if (result.colored_icons || result.colored_icons === undefined) {
                loadCssFile("/css/shkolo/misc/colored_icons.css");
            }
            if (result.rounded) {
                loadCssFile("/css/shkolo/rounded.css");
            }
        });
    }

    this.loadQoLCss = function () {
        loadCssFile("/css/shkolo/QoL.css");
    }

    this.removeAds = function () {
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

    this.emailAndTel = function () {
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

    this.messagesBackgroundFix = function () {
        if (pageurl.includes("/messages/")) {
            let spans = document.querySelectorAll("span");
            spans.forEach(span => {
                if (span.style.backgroundColor === "rgb(255, 255, 255)") {
                    span.style.backgroundColor = "";
                }
            });
        }
    }

    this.detailsDate = function () {
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

    this.detailsDate_element = function (table, i, columnIndex, char_to_replace, hasIcon = true) {
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

    this.InAppExtSettings = function () {
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
                settingsContainerPortletBody.appendChild(createCheckbox(chrome.i18n.getMessage("noAvatars"), "no-avatars", globalResult.no_avatars));
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
                            "no-avatars": "no_avatars",
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
                            chrome.storage.sync.set({ [key]: e.target.checked }, () => {
                                // If rounded was toggled, add/remove the CSS dynamically
                                if (key === "rounded") {
                                    if (e.target.checked) {
                                        loadCssFile("/css/shkolo/rounded.css");
                                    } else {
                                        // removeCssFile is expected to exist in the project; fall back to removing link tag if needed
                                        try { removeCssFile("/css/shkolo/rounded.css"); } catch (err) {
                                            // fallback: remove any matching <link> elements
                                            document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                                                if (link.href && link.href.includes("/css/shkolo/rounded.css")) link.remove();
                                            });
                                        }
                                    }
                                }
                            });
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

    this.moveLogOutButton = function () {
        try {
            const logoutButton = document.querySelector(`body > div.page-header.navbar.navbar-fixed-top > div > div.top-menu > ul > li.hidden-xs.hidden-sm.dropdown.dropdown-quick-sidebar-toggler`).cloneNode(true);

            if (pageurl.includes("/profile") && logoutButton) {
                const anchor = logoutButton.querySelector("a");
                if (anchor) {
                    const icon = anchor.querySelector("i");
                    if (icon) {
                        icon.insertAdjacentText("afterend", " Logout");
                    }
                }
                const profileList = document.querySelector("body > div.page-container > div.page-content-wrapper > div > div > div > div.profile-sidebar > div > div.profile-usermenu > ul");
                if (profileList) { profileList.appendChild(logoutButton); }
            }

            const oldLogoutButton = document.querySelector("body > div.page-header.navbar.navbar-fixed-top > div > div.top-menu > ul > li.hidden-xs.hidden-sm.dropdown.dropdown-quick-sidebar-toggler");
            if (oldLogoutButton) { oldLogoutButton.remove(); }
        } catch (error) {
            console.error(`[${manifest.name} v${version}][QoL]: Failed to move logout button. ERROR: ${error}`);
        }
    }

    function normalizeKey(s) {
        if (s === null || s === undefined) return "";
        return String(s).replace(/\s+/g, " ").trim().toLowerCase();
    }

    function renderSaveButton(btn, state) {
        if (!btn) return;
        switch (state) {
            case "saving":
                btn.setAttribute("aria-busy", "true");
                btn.innerHTML = '<i class="fa fa-spinner fa-spin" aria-hidden="true"></i>';
                break;
            case "saved":
                btn.removeAttribute("aria-busy");
                btn.innerHTML = '<i class="fa fa-check" style="color:#3ddc84 !important;" aria-hidden="true"></i>';
                break;
            default:
                btn.removeAttribute("aria-busy");
                btn.innerHTML = '<i class="fa fa-save" aria-hidden="true"></i>';
                break;
        }
    }

    this.trustedDevicesLogins = function () {
        if (pageurl.includes("/profile/logins")) {
            try {
                const container = document.querySelector("#tab_logins > div:nth-child(2)");
                if (!container) return;

                const table = container.querySelector("table.table");
                if (!table) return;

                const rows = table.querySelectorAll("tbody > tr");

                chrome.storage.sync.get({ saved_device_models: [], saved_browsers: [] }, (res) => {
                    const savedModels = res.saved_device_models || [];
                    const savedBrowsers = res.saved_browsers || [];

                    const savedModelKeys = new Set((savedModels || []).map(normalizeKey));
                    const savedBrowserKeys = new Set((savedBrowsers || []).map(normalizeKey));

                    let toolbar = container.querySelector(".saved-models-toolbar");
                    if (!toolbar) {
                        toolbar = document.createElement("div");
                        toolbar.className = "saved-models-toolbar";
                        toolbar.style.margin = "0.5rem 0; display:flex; gap:.5rem; align-items:center";

                        const modelsBtn = document.createElement("button");
                        modelsBtn.className = "btn btn-sm btn-default saved-models-btn";
                        modelsBtn.textContent = (chrome && chrome.i18n && chrome.i18n.getMessage) ? (chrome.i18n.getMessage("savedModels") || "Saved models") : "Saved models";

                        const browsersBtn = document.createElement("button");
                        browsersBtn.className = "btn btn-sm btn-default saved-browsers-btn";
                        browsersBtn.textContent = (chrome && chrome.i18n && chrome.i18n.getMessage) ? (chrome.i18n.getMessage("savedBrowsers") || "Saved browsers") : "Saved browsers";

                        modelsBtn.addEventListener("click", () => openSavedListModal("models", container));
                        browsersBtn.addEventListener("click", () => openSavedListModal("browsers", container));

                        toolbar.appendChild(modelsBtn);
                        toolbar.appendChild(browsersBtn);

                        container.insertBefore(toolbar, container.firstChild);
                    }

                    rows.forEach(row => {
                        const cells = row.children;
                        if (!cells || cells.length === 0) return;

                        const browserCell = cells[4];
                        const modelCell = cells[cells.length - 1];

                        if (browserCell) {
                            const browserText = browserCell.textContent.trim();
                            if (browserText) {
                                let existing = browserCell.querySelector(".save-browser-btn");
                                if (!existing) {
                                    const key = normalizeKey(browserText);
                                    const isSaved = savedBrowserKeys.has(key);
                                    const btn = document.createElement("button");
                                    btn.type = "button";
                                    btn.className = "btn btn-xs btn-default save-browser-btn";
                                    btn.style.marginLeft = "0.4rem";
                                    btn.dataset.browser = browserText;
                                    btn.dataset.browserKey = key;
                                    btn.dataset.saved = isSaved ? "1" : "0";

                                    renderSaveButton(btn, isSaved ? "saved" : "unsaved");

                                    if (!isSaved) browserCell.classList.add("suspicious-item");
                                    else browserCell.classList.remove("suspicious-item");

                                    btn.addEventListener("click", () => {
                                        const b = btn.dataset.browser;
                                        if (!b || btn.dataset.saved === "1") return;
                                        renderSaveButton(btn, "saving");
                                        saveBrowser(b, () => {
                                            btn.dataset.saved = "1";
                                            renderSaveButton(btn, "saved");
                                            // remove unsaved marker from cell
                                            const td = btn.closest("td");
                                            if (td) td.classList.remove("suspicious-item");
                                            refreshBadges(container);
                                        });
                                    });

                                    browserCell.appendChild(btn);
                                }
                            }
                        }

                        // --- Model save button ---
                        if (modelCell) {
                            const modelText = modelCell.textContent.trim();
                            if (modelText) {
                                let existingModelBtn = modelCell.querySelector(".save-model-btn");
                                if (!existingModelBtn) {
                                    const key = normalizeKey(modelText);
                                    const isSavedModel = savedModelKeys.has(key);
                                    const btn = document.createElement("button");
                                    btn.type = "button";
                                    btn.className = "btn btn-xs btn-default save-model-btn";
                                    btn.style.marginLeft = "0.4rem";
                                    btn.dataset.model = modelText;
                                    btn.dataset.modelKey = key;
                                    btn.dataset.saved = isSavedModel ? "1" : "0";

                                    renderSaveButton(btn, isSavedModel ? "saved" : "unsaved");

                                    if (!isSavedModel) modelCell.classList.add("suspicious-item");
                                    else modelCell.classList.remove("suspicious-item");

                                    btn.addEventListener("click", () => {
                                        const m = btn.dataset.model;
                                        if (!m || btn.dataset.saved === "1") return;
                                        renderSaveButton(btn, "saving");
                                        saveDeviceModel(m, () => {
                                            btn.dataset.saved = "1";
                                            renderSaveButton(btn, "saved");
                                            const td = btn.closest("td");
                                            if (td) td.classList.remove("suspicious-item");
                                            refreshBadges(container);
                                        });
                                    });

                                    modelCell.appendChild(btn);
                                }
                            }
                        }
                    });

                    refreshBadges(container);
                });
            } catch (error) {
                console.error(`[${manifest.name} v${version}][QoL]: Failed to fix trusted devices logins. ERROR: ${error}`);
            }
        }
    }

    function saveDeviceModel(model, callback) {
        if (!model || model.length === 0) {
            if (typeof callback === "function") callback();
            return;
        }
        const key = normalizeKey(model);
        chrome.storage.sync.get({ saved_device_models: [] }, (res) => {
            let arr = res.saved_device_models || [];
            const arrKeys = arr.map(normalizeKey);
            if (!arrKeys.includes(key)) {
                arr.push(model);
                chrome.storage.sync.set({ saved_device_models: arr }, () => {
                    console.debug(`[${manifest.name} v${version}][QoL]: Saved device model "${model}"`);
                    if (typeof callback === "function") callback();
                });
            } else {
                if (typeof callback === "function") callback();
            }
        });
    }

    function saveBrowser(browser, callback) {
        if (!browser || browser.length === 0) {
            if (typeof callback === "function") callback();
            return;
        }
        const key = normalizeKey(browser);
        chrome.storage.sync.get({ saved_browsers: [] }, (res) => {
            let arr = res.saved_browsers || [];
            const arrKeys = arr.map(normalizeKey);
            if (!arrKeys.includes(key)) {
                arr.push(browser);
                chrome.storage.sync.set({ saved_browsers: arr }, () => {
                    console.debug(`[${manifest.name} v${version}][QoL]: Saved browser "${browser}"`);
                    if (typeof callback === "function") callback();
                });
            } else {
                if (typeof callback === "function") callback();
            }
        });
    }

    function removeSavedItem(type, value, callback) {
        const keyName = type === "browsers" ? "saved_browsers" : "saved_device_models";
        const norm = normalizeKey(value);
        chrome.storage.sync.get({ [keyName]: [] }, (res) => {
            let arr = res[keyName] || [];
            const newArr = arr.filter(item => normalizeKey(item) !== norm);
            if (newArr.length !== arr.length) {
                chrome.storage.sync.set({ [keyName]: newArr }, () => {
                    console.debug(`[${manifest.name} v${version}][QoL]: Removed ${type.slice(0, -1)} "${value}"`);
                    if (typeof callback === "function") callback();
                });
            } else {
                if (typeof callback === "function") callback();
            }
        });
    }

    function openSavedListModal(type, container) {
        const key = type === "browsers" ? "saved_browsers" : "saved_device_models";
        chrome.storage.sync.get({ [key]: [] }, (res) => {
            const items = res[key] || [];

            let existingModal = container.querySelector(".saved-list-modal");
            if (existingModal) existingModal.remove();

            const modal = document.createElement("div");
            modal.className = "saved-list-modal";
            modal.style.position = "relative";
            modal.style.background = "#fff";
            modal.style.border = "1px solid #ddd";
            modal.style.padding = ".6rem";
            modal.style.maxHeight = "300px";
            modal.style.overflow = "auto";
            modal.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
            modal.style.marginBottom = ".5rem";

            const title = document.createElement("div");
            title.style.fontWeight = "600";
            title.style.marginBottom = ".4rem";
            title.textContent = (type === "browsers") ? ((chrome && chrome.i18n && chrome.i18n.getMessage) ? (chrome.i18n.getMessage("savedBrowsersList") || "Saved browsers") : "Saved browsers") : ((chrome && chrome.i18n && chrome.i18n.getMessage) ? (chrome.i18n.getMessage("savedModelsList") || "Saved models") : "Saved models");
            modal.appendChild(title);

            if (!items.length) {
                const empty = document.createElement("div");
                empty.textContent = "(none)";
                empty.style.color = "#666";
                modal.appendChild(empty);
            } else {
                items.forEach(it => {
                    const row = document.createElement("div");
                    row.style.display = "flex";
                    row.style.justifyContent = "space-between";
                    row.style.alignItems = "center";
                    row.style.padding = "0.2rem 0";

                    const t = document.createElement("div");
                    t.textContent = it;
                    t.style.flex = "1";

                    const removeBtn = document.createElement("button");
                    removeBtn.className = "btn btn-xs btn-danger";
                    removeBtn.textContent = (chrome && chrome.i18n && chrome.i18n.getMessage) ? (chrome.i18n.getMessage("remove") || "Remove") : "Remove";
                    removeBtn.style.marginLeft = "0.5rem";

                    const normKey = normalizeKey(it);
                    removeBtn.dataset.key = normKey;

                    removeBtn.addEventListener("click", () => {
                        removeSavedItem(type, it, () => {
                            row.remove();
                            if (type === "browsers") {
                                container.querySelectorAll(`.save-browser-btn[data-browser-key="${CSS.escape(normKey)}"]`).forEach(b => {
                                    b.dataset.saved = "0";
                                    renderSaveButton(b, "unsaved");
                                    const td = b.closest("td");
                                    if (td) td.classList.add("suspicious-item");
                                });
                            } else {
                                container.querySelectorAll(`.save-model-btn[data-model-key="${CSS.escape(normKey)}"]`).forEach(b => {
                                    b.dataset.saved = "0";
                                    renderSaveButton(b, "unsaved");
                                    const td = b.closest("td");
                                    if (td) td.classList.add("suspicious-item");
                                });
                            }
                            refreshBadges(container);
                        });
                    });

                    row.appendChild(t);
                    row.appendChild(removeBtn);
                    modal.appendChild(row);
                });
            }

            const close = document.createElement("div");
            close.style.textAlign = "right";
            close.style.marginTop = ".4rem";
            const closeBtn = document.createElement("button");
            closeBtn.className = "btn btn-xs btn-default";
            closeBtn.textContent = (chrome && chrome.i18n && chrome.i18n.getMessage) ? (chrome.i18n.getMessage("close") || "Close") : "Close";
            closeBtn.addEventListener("click", () => {
                modal.remove();
            });
            close.appendChild(closeBtn);
            modal.appendChild(close);

            container.insertBefore(modal, container.firstChild.nextSibling);
        });
    }
}