async function loadSettingSchema() {
    try {
        const response = await fetch(chrome.runtime.getURL('setting-schema.json'));
        if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
        const schema = await response.json();

        // Process schema to add tags to settings in the UI
        console.log('Loaded setting schema:', schema);
        loadSettingsState(schema);
    } catch (e) {
        console.error('Error loading setting schema:', e);
    }
}

function loadSettingsState(schema) {
    if (!schema || !Array.isArray(schema.schema)) {
        console.warn('Invalid or missing schema passed to loadSettingsState');
        return;
    }

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

                // Determine effective value: storage overrides defaults
                const hasStored = Object.prototype.hasOwnProperty.call(merged, id);
                const value = hasStored ? merged[id] : defaults[id];

                // Apply checkbox state if input exists
                try {
                    const el = document.getElementById(id);
                    if (el && (el.type === 'checkbox' || el.getAttribute && el.getAttribute('type') === 'checkbox')) {
                        el.checked = !!value;
                        if (window.jQuery) $(el).prop('checked', !!value);
                    }
                } catch { }

                // Apply tags defined on schema item (look up definitions in schema.tags)
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

loadSettingSchema();

// Settings Click Event
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

// Compatibility Settings
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

// Search for settings
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
