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