let defaultsSchema = {};

async function loadSettingSchema() {
    try {
        const response = await fetch(chrome.runtime.getURL('setting-schema.json'));
        if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
        const schema = await response.json();

        if (!schema || !Array.isArray(schema.schema)) {
            console.warn('Invalid or missing schema passed to loadOptionsInSettings');
            return;
        }

        defaultsSchema = schema['defaults'] || {};

        loadOptionsInSettings(schema);
        loadSettingsState(schema);
        optionsEventHandler();
    } catch (e) {
        console.error('Error loading setting schema:', e);
    }
}
loadSettingSchema();

function createOptionElement(item, values, isSuboption = false) {
    const { type, id, i18n_title, i18n_description, min, max, options } = item;
    const idPrefix = isSuboption ? 'suboption_' : '';
    const elementId = `${idPrefix}${id}`;

    const optionDiv = document.createElement('div');
    optionDiv.className = isSuboption ? 'options suboption-item' : 'options';

    let inputElement;
    const currentValue = values[id] !== undefined ? values[id] : defaultsSchema[id];

    // Create input based on type
    if (type === 'boolean') {
        inputElement = document.createElement('input');
        inputElement.id = elementId;
        inputElement.type = 'checkbox';
        inputElement.checked = !!currentValue;

        const switchLabel = document.createElement('label');
        switchLabel.setAttribute('for', elementId);
        switchLabel.className = 'switch';
        optionDiv.appendChild(inputElement);
        optionDiv.appendChild(switchLabel);

    } else if (type === 'int') {
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'input-wrapper';

        inputElement = document.createElement('input');
        inputElement.id = elementId;
        inputElement.type = 'number';
        inputElement.className = 'input-number';
        inputElement.value = currentValue !== undefined ? currentValue : (defaultsSchema[id] || 0);
        if (min !== undefined) inputElement.min = min;
        if (max !== undefined) inputElement.max = max;

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'input-confirm-btn';
        confirmBtn.textContent = '✓';
        confirmBtn.title = 'Apply';

        inputWrapper.appendChild(inputElement);
        inputWrapper.appendChild(confirmBtn);
        optionDiv.appendChild(inputWrapper);

    } else if (type === 'enum') {
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'input-wrapper';

        inputElement = document.createElement('select');
        inputElement.id = elementId;
        inputElement.className = 'input-select';

        if (Array.isArray(options)) {
            options.forEach(opt => {
                const optionEl = document.createElement('option');
                optionEl.value = opt.value;
                const optLabel = chrome.i18n?.getMessage(opt.i18n) || opt.label || opt.value;
                optionEl.textContent = optLabel;
                if (opt.value === currentValue) {
                    optionEl.selected = true;
                }
                inputElement.appendChild(optionEl);
            });
        }

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'input-confirm-btn';
        confirmBtn.textContent = '✓';
        confirmBtn.title = 'Apply';

        inputWrapper.appendChild(inputElement);
        inputWrapper.appendChild(confirmBtn);
        optionDiv.appendChild(inputWrapper);
    }

    // Text label
    const textLabel = document.createElement('label');
    textLabel.setAttribute('for', elementId);
    const translatedTitle = chrome.i18n?.getMessage(i18n_title) || i18n_title || id;
    textLabel.textContent = translatedTitle;
    optionDiv.appendChild(textLabel);

    // Description
    const description = document.createElement('p');
    description.className = 'description';
    if (i18n_description) {
        const translatedDesc = chrome.i18n?.getMessage(i18n_description) || i18n_description;
        description.textContent = translatedDesc;
    }
    optionDiv.appendChild(description);

    // Event handlers based on type
    if (type === 'boolean') {
        optionDiv.onclick = (e) => {
            const tag = e.target.tagName.toLowerCase();
            if (tag === 'input' || tag === 'label') return;
            inputElement.checked = !inputElement.checked;
            chrome.storage.sync.set({ [id]: inputElement.checked });
            optionDiv.classList.add('clicked');
            setTimeout(() => optionDiv.classList.remove('clicked'), 300);
        };

        inputElement.onchange = (e) => {
            e.stopPropagation();
            chrome.storage.sync.set({ [id]: inputElement.checked });
        };

    } else if (type === 'int') {
        const confirmBtn = optionDiv.querySelector('.input-confirm-btn');
        let initialValue = inputElement.value;

        inputElement.oninput = (e) => {
            e.stopPropagation();
            const hasChanged = inputElement.value !== initialValue;
            confirmBtn.classList.toggle('visible', hasChanged);
        };

        inputElement.onkeypress = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmBtn.click();
            }
        };

        confirmBtn.onclick = (e) => {
            e.stopPropagation();
            const value = parseInt(inputElement.value, 10);
            if (!isNaN(value)) {
                chrome.storage.sync.set({ [id]: value }, () => {
                    initialValue = inputElement.value;
                    confirmBtn.classList.remove('visible');
                    optionDiv.classList.add('clicked');
                    setTimeout(() => optionDiv.classList.remove('clicked'), 300);
                });
            }
        };

    } else if (type === 'enum') {
        const confirmBtn = optionDiv.querySelector('.input-confirm-btn');
        let initialValue = inputElement.value;

        inputElement.onchange = (e) => {
            e.stopPropagation();
            const hasChanged = inputElement.value !== initialValue;
            confirmBtn.classList.toggle('visible', hasChanged);
        };

        confirmBtn.onclick = (e) => {
            e.stopPropagation();
            chrome.storage.sync.set({ [id]: inputElement.value }, () => {
                initialValue = inputElement.value;
                confirmBtn.classList.remove('visible');
                optionDiv.classList.add('clicked');
                setTimeout(() => optionDiv.classList.remove('clicked'), 300);
            });
        };
    }

    return { optionDiv, inputElement };
}

function showSuboptionsPopup(parentItem) {
    const overlay = document.getElementById('box_popup_overlay');
    if (!overlay) return;

    // Create popup
    const popup = document.createElement('div');
    popup.className = 'box popup suboptions-popup';
    popup.style.maxWidth = '500px';
    popup.style.width = '90%';

    // Header
    const header = document.createElement('div');
    header.className = 'popup-header';
    const title = document.createElement('h2');
    title.className = 'popup-title';
    const parentTitle = chrome.i18n?.getMessage(parentItem.i18n_title) || parentItem.i18n_title || 'Options';
    title.textContent = parentTitle;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'delete';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.onclick = () => closeSuboptionsPopup();
    header.appendChild(title);
    header.appendChild(closeBtn);
    popup.appendChild(header);

    // Suboptions container
    const suboptionsContainer = document.createElement('div');
    suboptionsContainer.className = 'suboptions-container';

    // Load current storage values
    chrome.storage.sync.get(null, (result) => {
        const values = { ...result };

        parentItem.suboptions.forEach((subItem) => {
            const { type } = subItem;

            // Support boolean, int, and enum types
            if (!['boolean', 'int', 'enum'].includes(type)) return;

            const { optionDiv } = createOptionElement(subItem, values, true);
            suboptionsContainer.appendChild(optionDiv);
        });

        popup.appendChild(suboptionsContainer);
        document.body.appendChild(popup);
        overlay.style.display = 'block';

        overlay.onclick = () => closeSuboptionsPopup();
    });
}

function closeSuboptionsPopup() {
    const overlay = document.getElementById('box_popup_overlay');
    const popup = document.querySelector('.suboptions-popup');
    if (overlay) overlay.style.display = 'none';
    if (popup) popup.remove();
    if (overlay) overlay.onclick = null;
}

function loadOptionsInSettings(schema) {
    if (!schema || !Array.isArray(schema.schema)) return;

    const items = schema.schema || [];

    chrome.storage.sync.get(null, (result) => {
        const values = { ...result };

        items.forEach((item) => {
            const { type, id, section } = item;

            // Support boolean, int, and enum types
            if (!['boolean', 'int', 'enum'].includes(type) || !id || !section) return;

            const sectionElement = document.getElementById(section);
            if (!sectionElement) {
                console.warn(`Section element not found: ${section}`);
                return;
            }

            if (document.getElementById(id)) {
                return;
            }

            const { optionDiv } = createOptionElement(item, values, false);

            // If there are suboptions, add a gear button
            if (item.suboptions && Array.isArray(item.suboptions) && item.suboptions.length > 0) {
                const gearBtn = document.createElement('button');
                gearBtn.className = 'suboptions-gear-btn';
                gearBtn.setAttribute('aria-label', 'More options');

                const gearImg = document.createElement('img');
                gearImg.src = chrome.runtime.getURL('../assets/gear.svg');
                gearImg.alt = 'Settings';
                gearBtn.appendChild(gearImg);

                gearBtn.onclick = (e) => {
                    e.stopPropagation();
                    showSuboptionsPopup(item);
                };
                optionDiv.appendChild(gearBtn);
            }

            sectionElement.appendChild(optionDiv);
        });
    });
}

function loadSettingsState(schema) {
    const getTagText = (tagDef, tagKey) => {
        if (!tagDef) return tagKey;
        if (tagDef.i18n && typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage) {
            try {
                const msg = chrome.i18n.getMessage(tagDef.i18n);
                if (msg) return msg;
            } catch { /* ignore */ }
        }
        return tagDef.i18n || tagKey;
    };

    // Read both sync and local storages and merge (local overrides sync)
    chrome.storage.sync.get(null, (syncRes) => {
        chrome.storage.local.get(null, (localRes) => {
            const syncData = syncRes || {};
            const localData = localRes || {};
            const merged = Object.assign({}, syncData, localData);

            const items = schema.schema || [];
            const tagDefs = schema.tags || {};
            const defaults = schema.defaults || {};

            items.forEach((item) => {
                const id = item.id || item.key;
                if (!id) return;

                const hasStored = Object.prototype.hasOwnProperty.call(merged, id);
                const value = hasStored ? merged[id] : defaults[id];

                try {
                    const el = document.getElementById(id);
                    if (el && (el.type === 'checkbox' || el.getAttribute && el.getAttribute('type') === 'checkbox')) {
                        el.checked = !!value;
                        if (window.jQuery) $(el).prop('checked', !!value);
                    }
                } catch { }

                // Apply tags
                if (Array.isArray(item.tags) && item.tags.length) {
                    item.tags.forEach((tagKey) => {
                        const tagDef = tagDefs[tagKey];
                        const text = getTagText(tagDef, tagKey);
                        const color = (tagDef && tagDef.color) ? tagDef.color : '#999';
                        try {
                            tagSetting(id, text, color);
                        } catch { }
                    });
                }
            });

            if (localData.disablePupilIDFeatures) {
                const unavailableTag = tagDefs['unavailable'];
                const unavailableText = getTagText(unavailableTag, 'unavailable');
                const unavailableColor = unavailableTag.color;

                const affectedSettings = ['schedule', 'control_tests', 'stats_panel', 'leaderboard'];
                affectedSettings.forEach((id) => {
                    try {
                        tagSetting(id, unavailableText, unavailableColor);
                        $(`#${id}`).parent().addClass("disabled");
                    } catch { }
                });
            }
        });
    });
}

function optionsEventHandler() {
    $(".options").click(function (e) {
        if ($(this).hasClass("no-toggle")) return;

        // If the click originated on an interactive element let its handler manage state.
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
        if (tag === 'input' || tag === 'button' || tag === 'label' || $(e.target).closest('button').length) {
            return;
        }

        const checkbox = this.querySelector('input[type="checkbox"]');
        if (!checkbox) return;

        checkbox.checked = !checkbox.checked;

        const option = checkbox.id
        const optionValue = $(checkbox).prop("checked")

        if (option === 'leaderboard' && optionValue === true) {
            const ok = confirm('Enable Leaderboard?\nThis enables a leaderboard extension that can submit your success, feedback count, pupil_id and school name to a NON-Shkolo server, and the information will be publicly accessible.\nProceed?');
            if (!ok) {
                checkbox.checked = false;
                return;
            }
        }

        if (option === 'disable_theme_sync') {
            chrome.storage.local.set({ disable_theme_sync: optionValue }, () => {
                // refresh theme UI/storage behavior immediately
                withThemeStorage((store) => {
                    store.get(['theme'], (res) => {
                        applyTheme(res.theme || 'light')
                        renderCustomThemeButtons()
                    })
                })
            })
        } else {
            chrome.storage.sync.set({ [option]: optionValue })
        }

        $(this).addClass("clicked")
        setTimeout(() => {
            $(this).removeClass("clicked")
        }, 300)
    })

    // Handle direct checkbox changes and persist accordingly (prevents double-toggles)
    $(".options input[type='checkbox']").on('change', function (e) {
        e.stopPropagation();

        const option = this.id
        const optionValue = $(this).prop("checked")

        // Confirm when enabling leaderboard
        if (option === 'leaderboard' && optionValue === true) {
            const ok = confirm('This enables a leaderboard extension that can submit your success, feedback count, pupil_id and school name to a NON-Shkolo server, and the information will be publicly accessible.\nProceed?');
            if (!ok) {
                $(this).prop('checked', false)
                return;
            }
        }

        if (option === 'disable_theme_sync') {
            chrome.storage.local.set({ disable_theme_sync: optionValue }, () => {
                // refresh theme UI/storage behavior immediately
                withThemeStorage((store) => {
                    store.get(['theme'], (res) => {
                        applyTheme(res.theme || 'light')
                        renderCustomThemeButtons()
                    })
                })
            })
        } else {
            chrome.storage.sync.set({ [option]: optionValue })
        }
    })
}

//* Compatibility Settings
var clickCount = 0
$("#logo").click(() => {
    clickCount++

    if (clickCount >= 10) {
        clickCount = 0
        chrome.storage.sync.get("compatibility_mode", (result) => {
            chrome.storage.sync.set({ compatibility_mode: !result.compatibility_mode }, () => {
                const compatibilityMode = !result.compatibility_mode
                if (compatibilityMode) {
                    alert("Compatibility mode enabled.")
                } else {
                    alert("Compatibility mode disabled.")
                }
            })
        })

        $("#logo").css({
            "transition": "transform 1s",
            "transform": "rotate(0deg)"
        })
    }

    if (!(clickCount <= 2)) $("#logo").css({
        "transition": "transform 0.2s",
        "transform": "rotate(" + ((clickCount - 2) * 7) + "deg)"
    })
})

function tagSetting(setting, text, color) {
    const fontColor = isColorLight(color) ? '#000' : '#fff'
    const settingElement = $("#" + setting).parent()
    const tag = $("<p class='tag' style='background-color: " + color + "; color: " + fontColor + "'>" + text + "</p>")
    settingElement.children().eq(2).after(tag)
}

//* Search for settings
function filterSettings(query) {
    const q = (query || "").trim().toLowerCase()
    let matches = 0

    $(".box-wrapper > .box").each(function () {
        const box = $(this)
        let boxHasVisible = false

        box.find(".options").each(function () {
            const opt = $(this)
            const label = (opt.children().eq(2).text() || "")
            const desc = (opt.find(".description").text() || "")
            const combined = (label + " " + desc + " " + opt.children().eq(0).attr('id')).toLowerCase()

            if (!q || combined.indexOf(q) !== -1) {
                opt.removeClass("settings-hidden")
                boxHasVisible = true
                matches++
            } else {
                opt.addClass("settings-hidden")
            }
        })

        const headerText = (box.find("h1, h2, h3").first().text() || "").toLowerCase()
        if (!q || boxHasVisible || headerText.indexOf(q) !== -1) {
            box.removeClass("settings-hidden")
            if (q && !boxHasVisible && headerText.indexOf(q) !== -1) {
                box.find(".options").removeClass("settings-hidden")
            }
        } else {
            box.addClass("settings-hidden")
        }
    })

    const $count = $("#settings_search_count")
    if (matches) {
        $count.removeClass('empty')
        $count.text(matches + " match" + (matches === 1 ? "" : "es"))
    } else {
        $count.addClass('empty')
        $count.text(matches ? matches : "")
    }

    const hasQuery = Boolean(q)
    $("#settings_search_clear").css('visibility', hasQuery ? 'visible' : 'hidden')
}

$("#settings_search").on("input", function () {
    filterSettings($(this).val())
})

$("#settings_search_clear").on("click", function () {
    $("#settings_search").val("")
    filterSettings("")
    $("#settings_search").focus()
})

$(document).on('keydown', function (e) {
    if (e.key === "Escape") {
        const v = $("#settings_search").val()
        if (v && v.length) {
            $("#settings_search_clear").click()
            e.preventDefault()
        }
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        $("#settings_search").focus()
        e.preventDefault()
    }
})

$(function () {
    const initial = $("#settings_search").val() || ""
    $("#settings_search_clear").css('visibility', initial.trim() ? 'visible' : 'hidden')
    if (initial.trim()) filterSettings(initial)
})
