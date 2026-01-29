function QoL() {
    this.initialize = function () {
        // load feature flags from sync storage with defaults
        chrome.storage.sync.get(null, (result) => {
            window.syncedSettings = result;

            if (result.load_qol_css) loadCssFile("/css/shkolo/QoL.css");
            if (result.remove_ads) this.removeAds();
            if (result.email_and_tel) this.emailAndTel();
            if (result.messages_background_fix) this.messagesBackgroundFix();
            if (result.details_date) this.detailsDate();
            if (result.inapp_ext_settings) this.InAppExtSettings();
            if (result.move_logout_button) this.moveLogOutButton();
            if (result.trusted_devices_logins) this.trustedDevicesLogins();

            // Extras
            if (typeof compatibility_mode !== 'undefined' && compatibility_mode) {
                loadCssFile("/css/shkolo/misc/compatibility.css");
            }
        });
    }

    this.removeAds = function () {
        try {
            let settings = window.syncedSettings || {};
            if (settings.sub_remove_statistics_button) removeElements($(".btn.btn-lg.btn-e2e.red.huge"));
            if (settings.sub_remove_rank_disclaimer) removeElements($(".rank-descr"));
            if (settings.sub_remove_mobile_app_badges) removeElements($(".mobile-app-badges"));
            if (settings.sub_remove_mobile_app_badges) removeElements($(".mobile-app-link"));
            if (settings.sub_remove_help_link) $("#help-link-in-menu").remove();
            if (settings.sub_remove_shkolo_academy_link) {
                $("a[href*='https://shkolo.academy']").each(function() { this.parentElement.remove(); });
            }
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
                } else if (pageurl.includes("/profile/data/view")) {
                    emailElement = document.querySelector("body > div.page-container > div.page-content-wrapper > div > div > div > div > div > div.portlet-body.form > form > div > div:nth-child(2) > div:nth-child(2) > div > div > p")
                    telElement = document.querySelector("body > div.page-container > div.page-content-wrapper > div > div > div > div > div > div.portlet-body.form > form > div > div:nth-child(4) > div:nth-child(2) > div > div > p")
                }

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

        if (pageurl.includes("/profile/logins") && window.syncedSettings.sub_show_date_logins) {
            try {
                const table = $("#tab_logins > div:nth-child(2) > table > tbody > tr")
                for (let i = 0; i < table.length; i++) {
                    detailsDate_element(table, i, 0, dotRegex);
                }
            } catch (error) {
                console.error(`[${manifest.name} v${version}][QoL]: Failed to fix details date. ERROR: ${error}`)
            }
        }

        if (pageurl.includes("/profile/pendingprofilepic") && window.syncedSettings.sub_show_data_profile_picture) {
            try {
                const table = $("body > div.page-container > div.page-content-wrapper > div > div > div > div.profile-content > div > div.portlet-body > div:nth-child(2) > div > table > tbody > tr")
                for (let i = 0; i < table.length; i++) {
                    detailsDate_element(table, i, 1, dashRegex, false);
                }
            } catch (error) {
                console.error(`[${manifest.name} v${version}][QoL]: Failed to fix pending profile picture date. ERROR: ${error}`)
            }
        }
    }

    function detailsDate_element(table, i, columnIndex, char_to_replace, hasIcon = true) {
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

        if (DEBUG) console.debug(`[${manifest.name} v${version}][QoL]: Converting date "${dateElementText}" to "${formattedDate}" to Unix Timestamp: ${UnixTimestamp} (${daysSinceTimestamp} days ago)`);

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

                // Disclaimer
                const disclaimer = document.createElement("div");
                disclaimer.className = "alert alert-warning";
                disclaimer.innerHTML = chrome.i18n.getMessage("disclaimer_settings_reload");
                settingsContainerPortletBody.appendChild(disclaimer);

                fetch(chrome.runtime.getURL('setting-schema.json'))
                    .then(response => response.json())
                    .then(schema => {
                        chrome.storage.sync.get(null, (result) => {
                            const defaults = schema.defaults || {};
                            const currentValues = { ...defaults, ...result };

                            // Group settings by section
                            const sections = {
                                main_settings_options: { title: chrome.i18n.getMessage("shkolo_settings") || "Shkolo Settings", items: [], visible: currentValues.sub_settings_section_main !== false },
                                qol_settings_options: { title: chrome.i18n.getMessage("QoLSettings") || "QoL Settings", items: [], visible: currentValues.sub_settings_section_qol !== false },
                                experimental_settings_options: { title: chrome.i18n.getMessage("beta_features_title") || "Experimental Features", items: [], visible: currentValues.sub_settings_section_experimental !== false },
                                mon_settings_options: { title: chrome.i18n.getMessage("mon_settings") || "MON Settings", items: [], visible: currentValues.sub_settings_section_mon !== false },
                                dev_settings_options: { title: chrome.i18n.getMessage("developer_settings") || "Developer Settings", items: [], visible: currentValues.sub_settings_section_dev !== false }
                            };

                            // Organize items by section
                            schema.schema.forEach(item => {
                                if (item.type === 'boolean' && item.section && sections[item.section]) {
                                    sections[item.section].items.push(item);
                                }
                            });

                            // Render each section
                            Object.keys(sections).forEach(sectionKey => {
                                const section = sections[sectionKey];
                                if (section.visible && section.items.length > 0) {
                                    const heading = document.createElement("h3");
                                    heading.textContent = section.title;
                                    settingsContainerPortletBody.appendChild(heading);

                                    const hr = document.createElement("hr");
                                    hr.style.marginTop = "-0.5rem";
                                    settingsContainerPortletBody.appendChild(hr);

                                    section.items.forEach(item => {
                                        const label = chrome.i18n.getMessage(item.i18n_title) || item.i18n_title || item.id;
                                        const isChecked = currentValues[item.id] !== undefined ? currentValues[item.id] : defaults[item.id];
                                        const checkbox = createCheckbox(label, item.id, isChecked);
                                        settingsContainerPortletBody.appendChild(checkbox);
                                    });
                                }
                            });

                            // Handle settings changes
                            settingsContainerPortletBody.querySelectorAll('input[type="checkbox"]').forEach(input => {
                                input.addEventListener('change', (e) => {
                                    const key = e.target.id;
                                    const value = e.target.checked;

                                    // Update global result if it exists
                                    if (key in globalResult) {
                                        globalResult[key] = value;
                                    } else {
                                        window[key] = value;
                                    }

                                    chrome.storage.sync.set({ [key]: value }, () => {
                                        // Handle special cases
                                        if (key === "rounded") {
                                            if (value) {
                                                loadCssFile("/css/shkolo/rounded.css");
                                            } else {
                                                try { removeCssFile("/css/shkolo/rounded.css"); } catch (err) {
                                                    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                                                        if (link.href && link.href.includes("/css/shkolo/rounded.css")) link.remove();
                                                    });
                                                }
                                            }
                                        }
                                    });
                                });
                            });

                            // Version and information
                            const infoHeading = document.createElement("h3");
                            infoHeading.textContent = chrome.i18n.getMessage("information");
                            settingsContainerPortletBody.appendChild(infoHeading);

                            const infoHr = document.createElement("hr");
                            infoHr.style.marginTop = "-0.5rem";
                            settingsContainerPortletBody.appendChild(infoHr);

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
                        });
                    })
                    .catch(error => {
                        console.error(`[${manifest.name} v${version}][QoL]: Failed to load settings schema. ERROR: ${error}`);
                    });
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

            if (true) {
                logoutButton.children[0].href = "#";
                logoutButton.children[0].addEventListener("click", function (e) {
                    if (confirm(chrome.i18n.getMessage("logout_confirmation"))) {
                        window.location.href = "/auth/logout";
                    }
                });
            }

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
            if (oldLogoutButton) oldLogoutButton.remove();
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

                chrome.storage.sync.get({ saved_device_models: [], saved_browsers: [], saved_ips: [] }, (res) => {
                    const savedModels = res.saved_device_models || [];
                    const savedBrowsers = res.saved_browsers || [];
                    const savedIps = res.saved_ips || [];

                    const savedModelKeys = new Set((savedModels || []).map(normalizeKey));
                    const savedBrowserKeys = new Set((savedBrowsers || []).map(normalizeKey));
                    const savedIpKeys = new Set((savedIps || []).map(normalizeKey));

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

                        const ipsBtn = document.createElement("button");
                        ipsBtn.className = "btn btn-sm btn-default saved-ips-btn";
                        ipsBtn.textContent = (chrome && chrome.i18n && chrome.i18n.getMessage) ? (chrome.i18n.getMessage("savedIPs") || "Saved IPs") : "Saved IPs";

                        modelsBtn.addEventListener("click", () => openSavedListModal("models", container));
                        browsersBtn.addEventListener("click", () => openSavedListModal("browsers", container));
                        ipsBtn.addEventListener("click", () => openSavedListModal("ips", container));

                        toolbar.appendChild(modelsBtn);
                        toolbar.appendChild(browsersBtn);
                        toolbar.appendChild(ipsBtn);

                        container.insertBefore(toolbar, container.firstChild);
                    }

                    rows.forEach(row => {
                        const cells = row.children;
                        if (!cells || cells.length === 0) return;

                        const ipCell = cells[1]; // 2nd column (index 1)
                        const browserCell = cells[4];
                        const modelCell = cells[cells.length - 1];

                        // --- IP save button ---
                        if (ipCell) {
                            const ipText = ipCell.textContent.trim();
                            if (ipText) {
                                let existingIpBtn = ipCell.querySelector(".save-ip-btn");
                                if (!existingIpBtn) {
                                    const key = normalizeKey(ipText);
                                    const isSavedIp = savedIpKeys.has(key);
                                    const btn = document.createElement("button");
                                    btn.type = "button";
                                    btn.className = "btn btn-xs btn-default save-ip-btn";
                                    btn.style.marginLeft = "0.4rem";
                                    btn.dataset.ip = ipText;
                                    btn.dataset.ipKey = key;
                                    btn.dataset.saved = isSavedIp ? "1" : "0";

                                    renderSaveButton(btn, isSavedIp ? "saved" : "unsaved");

                                    if (!isSavedIp) ipCell.classList.add("suspicious-item");
                                    else ipCell.classList.remove("suspicious-item");

                                    btn.addEventListener("click", () => {
                                        const v = btn.dataset.ip;
                                        if (!v || btn.dataset.saved === "1") return;
                                        renderSaveButton(btn, "saving");
                                        saveIP(v, () => {
                                            btn.dataset.saved = "1";
                                            renderSaveButton(btn, "saved");
                                            const td = btn.closest("td");
                                            if (td) td.classList.remove("suspicious-item");
                                            refreshBadges(container);
                                        });
                                    });

                                    ipCell.appendChild(btn);
                                }
                            }
                        }

                        // --- Browser save button ---
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
                    if (DEBUG) console.debug(`[${manifest.name} v${version}][QoL]: Saved device model "${model}"`);
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
                    if (DEBUG) console.debug(`[${manifest.name} v${version}][QoL]: Saved browser "${browser}"`);
                    if (typeof callback === "function") callback();
                });
            } else {
                if (typeof callback === "function") callback();
            }
        });
    }

    // New: save IP
    function saveIP(ip, callback) {
        if (!ip || ip.length === 0) {
            if (typeof callback === "function") callback();
            return;
        }
        const key = normalizeKey(ip);
        chrome.storage.sync.get({ saved_ips: [] }, (res) => {
            let arr = res.saved_ips || [];
            const arrKeys = arr.map(normalizeKey);
            if (!arrKeys.includes(key)) {
                arr.push(ip);
                chrome.storage.sync.set({ saved_ips: arr }, () => {
                    if (DEBUG) console.debug(`[${manifest.name} v${version}][QoL]: Saved IP "${ip}"`);
                    if (typeof callback === "function") callback();
                });
            } else {
                if (typeof callback === "function") callback();
            }
        });
    }

    function removeSavedItem(type, value, callback) {
        // map type to storage key
        const keyName = (type === "browsers") ? "saved_browsers" : (type === "ips") ? "saved_ips" : "saved_device_models";
        const norm = normalizeKey(value);
        chrome.storage.sync.get({ [keyName]: [] }, (res) => {
            let arr = res[keyName] || [];
            const newArr = arr.filter(item => normalizeKey(item) !== norm);
            if (newArr.length !== arr.length) {
                chrome.storage.sync.set({ [keyName]: newArr }, () => {
                    if (DEBUG) console.debug(`[${manifest.name} v${version}][QoL]: Removed ${type.slice(0, -1)} "${value}"`);
                    if (typeof callback === "function") callback();
                });
            } else {
                if (typeof callback === "function") callback();
            }
        });
    }

    function openSavedListModal(type, container) {
        let key;
        if (type === "browsers") key = "saved_browsers";
        else if (type === "ips") key = "saved_ips";
        else key = "saved_device_models";

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
            title.textContent = (type === "browsers") ? ((chrome && chrome.i18n && chrome.i18n.getMessage) ? (chrome.i18n.getMessage("savedBrowsersList") || "Saved browsers") : "Saved browsers")
                : (type === "ips") ? ((chrome && chrome.i18n && chrome.i18n.getMessage) ? (chrome.i18n.getMessage("savedIPsList") || "Saved IPs") : "Saved IPs")
                    : ((chrome && chrome.i18n && chrome.i18n.getMessage) ? (chrome.i18n.getMessage("savedModelsList") || "Saved models") : "Saved models");
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
                            } else if (type === "ips") {
                                container.querySelectorAll(`.save-ip-btn[data-ip-key="${CSS.escape(normKey)}"]`).forEach(b => {
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