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


// ------------ Theme Logic ------------

function applyTheme(theme) {
    if (theme === 'dark') {
        $(".bg_overlay").show()
        body.style.color = '#ccc'
        body.classList.add('dark-theme')
        darkThemeBtn.classList.add('active')
        lightThemeBtn.classList.remove('active')
    } else {
        $(".bg_overlay").hide()
        body.style.color = '#fff'
        body.classList.remove('dark-theme')
        lightThemeBtn.classList.add('active')
        darkThemeBtn.classList.remove('active')
    }
}

function getThemeData(keys, cb) {
    chrome.storage.local.get({ disable_theme_sync: false }, (r) => {
        const disable = !!r.disable_theme_sync;
        const syncKeys = [];
        const localKeys = [];

        keys.forEach(k => {
            if ((k === 'active_custom_themes' || k === 'theme') && disable) localKeys.push(k);
            else syncKeys.push(k);
        });

        let results = {};
        let pending = 0;
        if (syncKeys.length) {
            pending++;
            chrome.storage.sync.get(syncKeys, (resSync) => {
                results = Object.assign(results, resSync || {});
                if (--pending === 0) cb(results);
            });
        }
        if (localKeys.length) {
            pending++;
            chrome.storage.local.get(localKeys, (resLocal) => {
                results = Object.assign(results, resLocal || {});
                if (--pending === 0) cb(results);
            });
        }
        if (pending === 0) cb(results);
    });
}

function setThemeData(obj, cb) {
    chrome.storage.local.get({ disable_theme_sync: false }, (r) => {
        const disable = !!r.disable_theme_sync;
        const syncObj = {};
        const localObj = {};

        Object.keys(obj).forEach(k => {
            if ((k === 'active_custom_themes' || k === 'theme') && disable) localObj[k] = obj[k];
            else syncObj[k] = obj[k];
        });

        let pending = 0;
        if (Object.keys(syncObj).length) {
            pending++;
            chrome.storage.sync.set(syncObj, () => {
                if (--pending === 0) cb && cb();
            });
        }
        if (Object.keys(localObj).length) {
            pending++;
            chrome.storage.local.set(localObj, () => {
                if (--pending === 0) cb && cb();
            });
        }
        if (pending === 0) cb && cb();
    });
}

// New helper: pick correct storage (local vs sync) based on disable_theme_sync
function withThemeStorage(cb) {
    chrome.storage.local.get({ disable_theme_sync: false }, (r) => {
        const store = r.disable_theme_sync ? chrome.storage.local : chrome.storage.sync;
        cb(store);
    });
}

// General Settings
// Theme Switcher
const lightThemeBtn = document.getElementById('lightTheme')
const darkThemeBtn = document.getElementById('darkTheme')
const body = document.body

// initialize from storage.theme (base)
getThemeData(['theme'], (res) => {
    const t = res.theme || 'light';
    applyTheme(t);
});

lightThemeBtn.addEventListener('click', () => {
    applyTheme('light');
    setThemeData({ theme: 'light' });
});

darkThemeBtn.addEventListener('click', () => {
    applyTheme('dark');
    setThemeData({ theme: 'dark' });
});

let editingThemeId = null;

function renderCustomThemeButtons() {
    const MAX_INLINE = 3;
    const list = document.querySelector(".custom-themes-inline") || document.querySelector(".custom-themes-list") || document.querySelector(".theme-toggle");
    const moreBtn = document.getElementById("custom_themes_more_btn");
    if (!list) return;
    list.querySelectorAll(".custom-theme-btn").forEach(n => n.remove());

    // fetch data across appropriate storages:
    getThemeData(['custom_themes', 'theme', 'active_custom_themes'], (res) => {
        const themes = res.custom_themes || [];
        const currentTheme = res.theme || 'light';
        const activeIds = new Set((res.active_custom_themes || []).map(String));

        if (currentTheme === 'dark') {
            document.body.classList.add('dark-theme');
            darkThemeBtn.classList.add('active');
            lightThemeBtn.classList.remove('active');
        } else if (typeof currentTheme === 'string' && currentTheme.startsWith('custom:')) {
            lightThemeBtn.classList.remove('active');
            darkThemeBtn.classList.remove('active');
            document.body.classList.remove('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
            lightThemeBtn.classList.add('active');
            darkThemeBtn.classList.remove('active');
        }

        themes.slice(0, MAX_INLINE).forEach(t => {
            const id = String(t.created);
            if (list.querySelector(`.custom-theme-btn[data-custom-id="${CSS.escape(id)}"]`)) return;

            const btn = document.createElement("button");
            btn.className = "custom-theme-btn";
            btn.textContent = t.name;
            btn.dataset.customId = id;
            if (!list.classList.contains("theme-toggle")) btn.style.marginLeft = "6px";

            if (activeIds.has(id)) btn.classList.add('active');

            btn.addEventListener("dblclick", (e) => {
                e.preventDefault();
                editingThemeId = id;
                $("#custom_css_textarea").val(t.css || "");
                setCustomCssPreview(t.css || "");
                showPopup($("#custom_css_popup"));
            });

            btn.addEventListener("click", () => {
                toggleCustomThemeId(id, (newArr) => {
                    const isActive = newArr.map(String).includes(id);
                    if (isActive) btn.classList.add('active'); else btn.classList.remove('active');
                    renderCustomThemeButtons();
                });
            });

            btn.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                if (!confirm(`Remove custom theme "${t.name}"?`)) return;

                // remove from custom_themes (sync) and if it was the current theme, reset theme (sync).
                getThemeData(['custom_themes', 'theme', 'active_custom_themes'], (r) => {
                    const newArr = (r.custom_themes || []).filter(x => String(x.created) !== id);
                    const prevTheme = r.theme;

                    // update custom_themes (always sync) and also clear theme if it pointed to removed custom
                    const updates = { custom_themes: newArr };
                    if (prevTheme === `custom:${id}`) updates.theme = 'light';

                    // active_custom_themes should be updated in its corresponding storage (handled by setThemeData)
                    setThemeData(updates, () => {
                        // also remove id from active_custom_themes if present
                        const active = (r.active_custom_themes || []).filter(x => String(x) !== id);
                        setThemeData({ active_custom_themes: active }, () => {
                            renderCustomThemeButtons();
                        });
                    });
                });
            });

            list.appendChild(btn);
        });

        if (moreBtn) {
            if (themes.length > MAX_INLINE) {
                moreBtn.style.display = "inline-flex";
                moreBtn.onclick = () => {
                    renderCustomThemesPopup(themes, activeIds);
                    $("#custom_themes_popup").show();
                    $("#box_popup_overlay").show();
                };
            } else {
                moreBtn.style.display = "none";
                moreBtn.onclick = null;
            }
        }
    });
}

// render full popup with all custom themes
function renderCustomThemesPopup(themes, activeIdsSet) {
    const container = document.getElementById("custom_themes_list_popup");
    if (!container) return;
    container.innerHTML = "";

    themes.forEach(t => {
        const id = String(t.created);
        const btn = document.createElement("button");
        btn.className = "custom-theme-btn";
        btn.textContent = t.name;
        btn.dataset.customId = id;

        if (activeIdsSet.has(id)) btn.classList.add('active');

        btn.addEventListener("click", () => {
            toggleCustomThemeId(id, (newArr) => {
                const isActive = newArr.map(String).includes(id);
                if (isActive) btn.classList.add('active'); else btn.classList.remove('active');
            });
        });

        btn.addEventListener("dblclick", (e) => {
            e.preventDefault();
            editingThemeId = id;
            $("#custom_css_textarea").val(t.css || "");
            setCustomCssPreview(t.css || "");
            showPopup($("#custom_css_popup"));
        });

        btn.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (!confirm(`Remove custom theme "${t.name}"?`)) return;
            withThemeStorage((store2) => {
                store2.get({ custom_themes: [], theme: 'light', active_custom_themes: [] }, (r) => {
                    const newArr = (r.custom_themes || []).filter(x => String(x.created) !== id);
                    const prevTheme = r.theme;
                    store2.set({ custom_themes: newArr }, () => {
                        if (prevTheme === `custom:${id}`) {
                            store2.set({ theme: 'light' }, () => {
                                renderCustomThemesPopup(newArr, new Set([]));
                                renderCustomThemeButtons();
                            });
                        } else {
                            renderCustomThemesPopup(newArr, new Set((r.active_custom_themes || []).map(String)));
                            renderCustomThemeButtons();
                        }
                    });
                });
            });
        });

        container.appendChild(btn);
    });

    const closeBtn = document.getElementById("custom_themes_popup_close");
    if (closeBtn) closeBtn.onclick = () => {
        $("#custom_themes_popup").hide();
        $("#box_popup_overlay").hide();
        renderCustomThemeButtons();
    };
}

$("#chrome_storage").click(() => {
    showPopup($("#chrome_storage_popup"))

    fetchAllStorages((all) => {
        updateStorageTable(all)
    })
})

$("#chrome_storage_update_button").click(() => {
    fetchAllStorages((all) => {
        updateStorageTable(all)
    })
})

$("#chrome_storage_set_button").click(() => {
    const key = $("#chrome_storage_key").val().trim()
    if (key) {
        $("#chrome_storage_key").val("")
        showStorageEditPopup(key, 'sync')
    }
})

$("#chrome_storage_remove_button").click(() => {
    const key = $("#chrome_storage_key").val().trim()

    if (key) {
        chrome.storage.sync.remove([key], () => {
            $("#chrome_storage_key").val("")
            chrome.storage.sync.get(null, (result) => {
                updateStorageTable(result)
            })
        })
    }
})

$("#chrome_storage_clear_button").click(() => {
    if (!confirm("Are you sure you want to clear all Chrome storage data? This action cannot be undone.")) return;

    const areas = ['sync', 'local', 'session'];
    let pending = 0;
    let anyCleared = false;

    areas.forEach(area => {
        const areaObj = chrome.storage[area];
        if (areaObj && typeof areaObj.clear === 'function') {
            pending++;
            anyCleared = true;
            try {
                areaObj.clear(() => {
                    if (--pending === 0) {
                        fetchAllStorages((all) => {
                            updateStorageTable(all);
                        });
                    }
                });
            } catch (e) {
                if (--pending === 0) {
                    fetchAllStorages((all) => {
                        updateStorageTable(all);
                    });
                }
            }
        }
    });

    if (!anyCleared) {
        chrome.storage.sync.clear(() => {
            fetchAllStorages((all) => {
                updateStorageTable(all);
            });
        });
    }
})

function updateStorageTable(allData) {
    const storagesOrder = ['managed', 'session', 'local', 'sync'];
    const allKeys = new Set();
    storagesOrder.forEach(s => {
        const obj = allData[s] || {};
        Object.keys(obj).forEach(k => allKeys.add(k));
    });

    let tableContent = "<table><thead><tr><th>Storage</th><th>Key</th><th>Value</th><th>Actions</th></tr></thead><tbody>";
    allKeys.forEach(key => {
        // collect values per storage for this key
        const presentIn = [];
        const valuesByStorage = {};
        storagesOrder.forEach(s => {
            const obj = allData[s] || {};
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                presentIn.push(s);
                valuesByStorage[s] = obj[key];
            }
        });

        // determine display value and conflict state
        let conflict = false;
        const seen = new Set();
        for (const s of presentIn) {
            const vstr = JSON.stringify(valuesByStorage[s]);
            seen.add(vstr);
            if (seen.size > 1) { conflict = true; break; }
        }

        // storage badges
        const storageBadges = presentIn.map(s => `<span class="storage-badge ${s}">${s}</span>`).join(' ');

        // value presentation
        let valueCellHtml = "";
        if (conflict) {
            // show conflict badge and per-storage values for inspection
            const conflictBadge = `<span class="storage-badge conflict">Conflict</span>`;
            let listHtml = `<div class="storage-value-list">`;
            storagesOrder.forEach(s => {
                if (!Object.prototype.hasOwnProperty.call(valuesByStorage, s)) return;
                const val = valuesByStorage[s];
                const pretty = typeof val === 'string' ? escapeHtml(val) : escapeHtml(JSON.stringify(val));
                listHtml += `<div class="storage-value-item"><div class="storage-name">${escapeHtml(s)}</div><div class="storage-val">${pretty}</div></div>`;
            });
            listHtml += `</div>`;
            valueCellHtml = conflictBadge + listHtml;
        } else {
            // single canonical display (first storage according to order)
            let displayVal;
            if (presentIn.length) {
                displayVal = valuesByStorage[presentIn[0]];
            } else {
                displayVal = undefined;
            }
            const pretty = typeof displayVal === 'string' ? escapeHtml(displayVal) : escapeHtml(JSON.stringify(displayVal));
            valueCellHtml = pretty;
        }

        let actionHtml = '';
        presentIn.forEach(s => {
            const val = valuesByStorage[s];
            if (typeof val === 'boolean') {
                actionHtml += `<button class="reverse-btn" data-key="${escapeHtmlAttr(key)}" data-store="${s}">Reverse (${escapeHtml(s)})</button>`;
            }
            actionHtml += `<button class="edit-btn" data-key="${escapeHtmlAttr(key)}" data-store="${s}">Edit (${escapeHtml(s)})</button>`;
        });

        tableContent += `<tr><td>${storageBadges}</td><td>${escapeHtml(key)}</td><td>${valueCellHtml}</td><td>${actionHtml}</td></tr>`;
    });

    tableContent += "</tbody></table>";
    $("#chrome_storage_result").html(tableContent)
}

function fetchAllStorages(callback) {
    const stores = ['managed', 'session', 'local', 'sync'];
    const results = {};
    let pending = stores.length;

    stores.forEach(storeName => {
        if (!chrome.storage[storeName]) {
            // storage area not available in this runtime (e.g., session or managed)
            results[storeName] = {};
            if (--pending === 0) callback(results);
            return;
        }
        try {
            chrome.storage[storeName].get(null, (res) => {
                results[storeName] = res || {};
                if (--pending === 0) callback(results);
            });
        } catch (e) {
            results[storeName] = {};
            if (--pending === 0) callback(results);
        }
    });
}

// utility to escape HTML
function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function escapeHtmlAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
}

$(document).on('click', '.reverse-btn', function () {
    const key = $(this).data('key')
    const storeName = $(this).data('store')
    if (!key || !storeName) return

    const storeArea = chrome.storage[storeName]
    if (!storeArea) {
        alert(`Storage area "${storeName}" is not available.`)
        return
    }

    try {
        storeArea.get([key], (res) => {
            const current = res ? res[key] : undefined
            if (typeof current !== 'boolean') {
                alert('Value is not a boolean in that storage area.')
                return
            }
            const newVal = !current
            storeArea.set({ [key]: newVal }, () => {
                // refresh the table after update
                fetchAllStorages((all) => {
                    updateStorageTable(all)
                })
            })
        })
    } catch (e) {
        alert('Failed to access storage area: ' + storeName)
    }
})

//popup system
let activePopup = null

function hideAllPopups() {
    $("#box_popup_overlay").hide()
    $("#chrome_storage_popup").hide()
}

$("#box_popup_overlay").click(() => {
    if (activePopup) {
        activePopup.hide()
        $("#box_popup_overlay").hide()
        activePopup = null
    }
})

$("#box_popup_overlay").on("click", function () {
    $("#custom_css_popup").hide()
    const el = document.getElementById('custom_css_preview')
    if (el) el.remove()
    editingThemeId = null

    $("#custom_themes_popup").hide()
    renderCustomThemeButtons()
})

function showPopup(popup) {
    hideAllPopups()
    $("#box_popup_overlay").show()
    popup.show()
    activePopup = popup
}

$(document).on('click', '.edit-btn', function () {
    const key = $(this).data('key');
    const fromStore = $(this).data('store');
    if (!key) return;
    showStorageEditPopup(key, fromStore);
});

// show edit popup and populate fields
function showStorageEditPopup(key, fromStore) {
    const $popup = $("#chrome_storage_edit_popup");
    $("#edit_key").val(key);
    // default selected store is the one user clicked, but user may change it
    if (fromStore && $("#edit_store option[value='" + fromStore + "']").length) {
        $("#edit_store").val(fromStore);
    } else {
        $("#edit_store").val("sync");
    }

    // Load current value from the source store (fromStore) to prefill textarea
    const srcStore = (fromStore && chrome.storage[fromStore]) ? chrome.storage[fromStore] : null;
    if (srcStore) {
        try {
            srcStore.get([key], (res) => {
                const cur = res ? res[key] : undefined;
                let text;
                let shouldParse = false;
                try {
                    if (typeof cur === 'object' && cur !== null) {
                        text = JSON.stringify(cur, null, 2);
                        shouldParse = true;
                    } else if (typeof cur === 'boolean' || typeof cur === 'number' || cur === null) {
                        text = JSON.stringify(cur);
                        shouldParse = true;
                    } else if (cur === undefined) {
                        text = "";
                        shouldParse = false;
                    } else {
                        text = String(cur);
                        shouldParse = false;
                    }
                } catch (e) {
                    text = String(cur === undefined ? "" : cur);
                    shouldParse = false;
                }
                $("#edit_value").val(text);
                $("#edit_parse_json").prop("checked", shouldParse);
                showPopup($popup);
            });
        } catch (e) {
            // fallback: empty editor
            $("#edit_value").val("");
            $("#edit_parse_json").prop("checked", false);
            showPopup($popup);
        }
    } else {
        // storage area unavailable; still open for manual entry
        $("#edit_value").val("");
        $("#edit_parse_json").prop("checked", false);
        showPopup($popup);
    }
}

// Save / Cancel handlers
$("#chrome_storage_edit_cancel").on("click", function () {
    $("#chrome_storage_edit_popup").hide();
    $("#box_popup_overlay").hide();
});

$("#chrome_storage_edit_save").on("click", function () {
    const key = $("#edit_key").val();
    const targetStore = $("#edit_store").val() || "sync";
    const raw = $("#edit_value").val();
    const parseJson = $("#edit_parse_json").prop("checked");

    if (!key) {
        alert("No key specified.");
        return;
    }

    let newVal;
    if (parseJson) {
        try {
            newVal = JSON.parse(raw);
        } catch (e) {
            alert("Invalid JSON: " + e.message);
            return;
        }
    } else {
        newVal = raw;
    }

    const area = chrome.storage[targetStore];
    if (!area) {
        alert("Selected storage area is not available: " + targetStore);
        return;
    }

    const obj = {};
    obj[key] = newVal;
    try {
        area.set(obj, () => {
            // close popup and refresh table
            $("#chrome_storage_edit_popup").hide();
            $("#box_popup_overlay").hide();
            fetchAllStorages((all) => {
                updateStorageTable(all);
            });
        });
    } catch (e) {
        alert("Failed to save to storage: " + e.message);
    }
});

$("#chrome_storage_edit_remove").on("click", function () {
    const key = $("#edit_key").val();
    const targetStore = $("#edit_store").val() || "sync";
    if (!key) return;
    if (!confirm(`Remove key "${key}" from ${targetStore}?`)) return;

    const area = chrome.storage[targetStore];
    if (!area) {
        alert("Selected storage area is not available: " + targetStore);
        return;
    }

    try {
        area.remove([key], () => {
            $("#chrome_storage_edit_popup").hide();
            $("#box_popup_overlay").hide();
            fetchAllStorages((all) => {
                updateStorageTable(all);
            });
        });
    } catch (e) {
        alert("Failed to remove from storage: " + e.message);
    }
});

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

function setCustomCssPreview(css) {
    let el = document.getElementById('custom_css_preview')
    if (!el) {
        el = document.createElement('style')
        el.id = 'custom_css_preview'
        document.head.appendChild(el)
    }
    el.textContent = css || ''
}

// open custom css editor
$("#open_custom_css").on("click", function () {
    showPopup($("#custom_css_popup"))
    chrome.storage.sync.get(['custom_css'], (res) => {
        const css = res.custom_css || ""
        $("#custom_css_textarea").val(css)
        setCustomCssPreview(css)
    })
})

$("#custom_css_apply").on("click", function () {
    const css = $("#custom_css_textarea").val() || ""
    setCustomCssPreview(css)
})

$("#custom_css_save").on("click", function () {
    const css = $("#custom_css_textarea").val() || ""
    const btn = $("#custom_css_save")
    const old = btn.text()

    if (editingThemeId) {
        // update existing custom theme (custom_themes in sync)
        getThemeData(['custom_themes'], (res) => {
            const arr = res.custom_themes || []
            const idx = arr.findIndex(t => String(t.created) === String(editingThemeId))
            if (idx !== -1) {
                arr[idx].css = String(css)
                setThemeData({ custom_themes: arr }, () => {
                    btn.text("Updated")
                    setTimeout(() => btn.text(old), 1000)
                    editingThemeId = null
                    $("#custom_css_popup").hide()
                    $("#box_popup_overlay").hide()
                    setCustomCssPreview("")
                    renderCustomThemeButtons()
                })
            } else {
                chrome.storage.sync.set({ custom_css: css }, () => {
                    btn.text("Saved")
                    setTimeout(() => btn.text(old), 1000)
                })
            }
        })
        return
    }

    chrome.storage.sync.set({ custom_css: css }, () => {
        btn.text("Saved")
        setTimeout(() => btn.text(old), 1000)
    })
})

// Reset
$("#custom_css_reset").on("click", function () {
    if (!confirm("Reset custom CSS? This will remove saved custom styles.")) return
    chrome.storage.sync.remove(['custom_css'], () => {
        $("#custom_css_textarea").val("")
        setCustomCssPreview("")
        editingThemeId = null
    })
})

$("#custom_css_close").on("click", function () {
    $("#custom_css_popup").hide()
    $("#box_popup_overlay").hide()
    const el = document.getElementById('custom_css_preview')
    if (el) el.remove()
    editingThemeId = null
})

$("#box_popup_overlay").on("click", function () {
    $("#custom_css_popup").hide()
    const el = document.getElementById('custom_css_preview')
    if (el) el.remove()
    editingThemeId = null
})

$("#custom_css_export").on("click", function () {
    $("#custom_css_export_panel").show()
})

$("#custom_css_export_cancel").on("click", function () {
    $("#custom_css_export_panel").hide()
})

$("#custom_css_export_add").on("click", function () {
    const css = $("#custom_css_textarea").val() || ""
    if (!css.trim()) {
        alert("Custom CSS is empty.")
        return
    }
    const name = prompt("Theme name (for your custom themes):", "Custom theme")
    if (!name) return

    // custom_themes must remain in sync
    chrome.storage.sync.get({ custom_themes: [] }, (res) => {
        const arr = res.custom_themes || []
        arr.push({ name: String(name), css: css, created: Date.now() })
        chrome.storage.sync.set({ custom_themes: arr }, () => {
            alert("Custom theme added.")
            $("#custom_css_export_panel").hide()
            // refresh buttons
            renderCustomThemeButtons()
        })
    })
})

$("#custom_css_export_file").on("click", function () {
    const css = $("#custom_css_textarea").val() || ""
    if (!css.trim()) {
        alert("Custom CSS is empty.")
        return
    }
    const filename = `shkolo-custom-${Date.now()}.css`
    const blob = new Blob([css], { type: 'text/css' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    $("#custom_css_export_panel").hide()
})

function toggleCustomThemeId(id, cb) {
    // active_custom_themes may be local if disable_theme_sync is enabled; use getThemeData/setThemeData
    getThemeData(['active_custom_themes'], (res) => {
        const arrSet = new Set((res.active_custom_themes || []).map(String));
        const sid = String(id);
        if (arrSet.has(sid)) arrSet.delete(sid); else arrSet.add(sid);
        const newArr = Array.from(arrSet);
        setThemeData({ active_custom_themes: newArr }, () => {
            cb && cb(newArr);
        });
    });
}

// Ensure initial load of theme/active_custom_themes uses merged read
getThemeData(['theme', 'active_custom_themes'], (res) => {
    const t = res.theme || 'light';
    applyTheme(t);
    renderCustomThemeButtons();
});
