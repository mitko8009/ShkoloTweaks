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

// New helper: pick correct storage (local vs sync) based on disable_theme_sync
function withThemeStorage(cb) {
    chrome.storage.local.get({ disable_theme_sync: false }, (r) => {
        const store = r.disable_theme_sync ? chrome.storage.local : chrome.storage.sync;
        cb(store);
    });
}

chrome.storage.sync.get(null, (result) => {
    const autoRefresh = result.autoRefresh ?? false
    $("#autoRefresh").prop("checked", autoRefresh)

    const schedule = result.schedule ?? false
    $("#schedule").prop("checked", schedule)

    const control_tests = result.control_tests ?? false
    $("#control_tests").prop("checked", control_tests)

    const reorder_sidebar = result.reorder_sidebar ?? false
    $("#reorder_sidebar").prop("checked", reorder_sidebar)

    const year_countdown = result.year_countdown ?? false
    $("#year_countdown").prop("checked", year_countdown)
    tagSetting("year_countdown", chrome.i18n.getMessage("beta"), "#ffcc00")

    const stats_panel = result.stats_panel ?? false
    $("#stats_panel").prop("checked", stats_panel)
    tagSetting("stats_panel", chrome.i18n.getMessage("beta"), "#ffcc00")

    const dev_tools = result.dev_tools ?? false
    $("#dev_tools").prop("checked", dev_tools)
    tagSetting("dev_tools", "Dev", "#5d0087")

    const colored_icons = result.colored_icons ?? false
    $("#colored_icons").prop("checked", colored_icons)

    const no_avatars = result.no_avatars ?? false
    $("#no_avatars").prop("checked", no_avatars)
    tagSetting("no_avatars", chrome.i18n.getMessage("new"), "#0d50e2")

    // QoL settings (new)
    const remove_ads = result.remove_ads ?? true
    $("#remove_ads").prop("checked", remove_ads)

    const load_qol_css = result.load_qol_css ?? true
    $("#load_qol_css").prop("checked", load_qol_css)

    const email_and_tel = result.email_and_tel ?? true
    $("#email_and_tel").prop("checked", email_and_tel)

    const messages_background_fix = result.messages_background_fix ?? true
    $("#messages_background_fix").prop("checked", messages_background_fix)

    const details_date = result.details_date ?? true
    $("#details_date").prop("checked", details_date)

    const inapp_ext_settings = result.inapp_ext_settings ?? true
    $("#inapp_ext_settings").prop("checked", inapp_ext_settings)

    const move_logout_button = result.move_logout_button ?? true
    $("#move_logout_button").prop("checked", move_logout_button)

    const trusted_devices_logins = result.trusted_devices_logins ?? true
    $("#trusted_devices_logins").prop("checked", trusted_devices_logins)
})

chrome.storage.local.get(null, (result) => {
    if (result.disablePupilIDFeatures) {
        tagSetting("schedule", "UNAVALIABLE", "#ff4f4f")
        $("#schedule").parent().addClass("disabled")

        tagSetting("control_tests", "UNAVALIABLE", "#ff4f4f")
        $("#control_tests").parent().addClass("disabled")

        tagSetting("stats_panel", "UNAVALIABLE", "#ff4f4f")
        $("#stats_panel").parent().addClass("disabled")
    }
})

// Settings Click Event
$(".options").click(function () {
    if ($(this).hasClass("no-toggle")) return;

    this.children[0].checked = !this.children[0].checked

    const option = this.children[0].id
    const optionElement = $("#" + option)
    const optionValue = optionElement.prop("checked")
    chrome.storage.sync.set({ [option]: optionValue })

    $(this).addClass("clicked")
    setTimeout(() => {
        $(this).removeClass("clicked")
    }, 300)
})

// General Settings
// Theme Switcher
const lightThemeBtn = document.getElementById('lightTheme')
const darkThemeBtn = document.getElementById('darkTheme')
const body = document.body

withThemeStorage((store) => {
    store.get(['theme'], (res) => {
        const t = res.theme || 'light';
        applyTheme(t);
    });
});

lightThemeBtn.addEventListener('click', () => {
    applyTheme('light');
    withThemeStorage((store) => store.set({ theme: 'light' }));
});

darkThemeBtn.addEventListener('click', () => {
    applyTheme('dark');
    withThemeStorage((store) => store.set({ theme: 'dark' }));
});

let editingThemeId = null;

function renderCustomThemeButtons() {
    const MAX_INLINE = 3;
    const list = document.querySelector(".custom-themes-inline") || document.querySelector(".custom-themes-list") || document.querySelector(".theme-toggle");
    const moreBtn = document.getElementById("custom_themes_more_btn");
    if (!list) return;
    list.querySelectorAll(".custom-theme-btn").forEach(n => n.remove());

    withThemeStorage((store) => {
        store.get(['custom_themes', 'theme', 'active_custom_themes'], (res) => {
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
                    withThemeStorage((store2) => {
                        store2.get({ custom_themes: [], theme: 'light', active_custom_themes: [] }, (r) => {
                            const newArr = (r.custom_themes || []).filter(x => String(x.created) !== id);
                            const prevTheme = r.theme;
                            store2.set({ custom_themes: newArr }, () => {
                                if (prevTheme === `custom:${id}`) {
                                    store2.set({ theme: 'light' }, () => renderCustomThemeButtons());
                                } else {
                                    renderCustomThemeButtons();
                                }
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

// Buttons
chrome.storage.sync.get(['rounded', 'blur_data'], (result) => {
    const rounded = result.rounded || false
    const blur_data = result.blur_data || false

    $("#rounded").prop("checked", rounded)
    $("#blur_data").prop("checked", blur_data)
})

$("#rounded").click(() => {
    const rounded = $("#rounded").prop("checked")
    chrome.storage.sync.set({ rounded: rounded })
})

$("#blur_data").click(() => {
    const blur_data = $("#blur_data").prop("checked")
    chrome.storage.sync.set({ blur_data: blur_data })
})

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
    const value = $("#chrome_storage_value").val().trim()

    if (key) {
        chrome.storage.sync.set({ [key]: value }, () => {
            $("#chrome_storage_key").val("")
            $("#chrome_storage_value").val("")
            chrome.storage.sync.get(null, (result) => {
                updateStorageTable(result)
            })
        })
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
    if (confirm("Are you sure you want to clear all Chrome storage data? This action cannot be undone.")) {
        chrome.storage.sync.clear(() => {
            chrome.storage.sync.get(null, (result) => {
                updateStorageTable(result)
            })
        })
    }
})

function updateStorageTable(allData) {
    const storagesOrder = ['managed', 'session', 'local', 'sync'];
    const allKeys = new Set();
    storagesOrder.forEach(s => {
        const obj = allData[s] || {};
        Object.keys(obj).forEach(k => allKeys.add(k));
    });

    let tableContent = "<table><thead><tr><th>Key</th><th>Value</th><th>Storage</th><th>Actions</th></tr></thead><tbody>";
    allKeys.forEach(key => {
        let displayVal = undefined;
        for (const s of storagesOrder) {
            const obj = allData[s] || {};
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                displayVal = obj[key];
                break;
            }
        }
        const pretty = typeof displayVal === 'string' ? displayVal : JSON.stringify(displayVal);

        // storage badges
        const presentIn = storagesOrder.filter(s => {
            const obj = allData[s] || {};
            return Object.prototype.hasOwnProperty.call(obj, key);
        });

        const storageBadges = presentIn.map(s => `<span class="storage-badge ${s}">${s}</span>`).join(' ');

        let actionHtml = '';
        presentIn.forEach(s => {
            const obj = allData[s] || {};
            const val = obj[key];
            if (typeof val === 'boolean') {
                actionHtml += `<button class="reverse-btn" data-key="${escapeHtmlAttr(key)}" data-store="${s}">Reverse</button>`;
            }
        });

        tableContent += `<tr><td>${storageBadges}</td><td>${escapeHtml(key)}</td><td>${escapeHtml(pretty)}</td><td>${actionHtml}</td></tr>`;
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
        withThemeStorage((store) => {
            store.get({ custom_themes: [] }, (res) => {
                const arr = res.custom_themes || []
                const idx = arr.findIndex(t => String(t.created) === String(editingThemeId))
                if (idx !== -1) {
                    arr[idx].css = String(css)
                    store.set({ custom_themes: arr }, () => {
                        btn.text("Updated")
                        setTimeout(() => btn.text(old), 1000)
                        editingThemeId = null
                        $("#custom_css_popup").hide()
                        $("#box_popup_overlay").hide()
                        setCustomCssPreview("")
                        renderCustomThemeButtons()
                    })
                } else {
                    store.set({ custom_css: css }, () => {
                        btn.text("Saved")
                        setTimeout(() => btn.text(old), 1000)
                    })
                }
            })
        })
        return
    }

    withThemeStorage((store) => {
        store.set({ custom_css: css }, () => {
            btn.text("Saved")
            setTimeout(() => btn.text(old), 1000)
        })
    })
})

// Reset
$("#custom_css_reset").on("click", function () {
    if (!confirm("Reset custom CSS? This will remove saved custom styles.")) return
    withThemeStorage((store) => {
        store.remove(['custom_css'], () => {
            $("#custom_css_textarea").val("")
            setCustomCssPreview("")
            editingThemeId = null
        })
    });
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

    withThemeStorage((store) => {
        store.get({ custom_themes: [] }, (res) => {
            const arr = res.custom_themes || []
            arr.push({ name: String(name), css: css, created: Date.now() })
            store.set({ custom_themes: arr }, () => {
                alert("Custom theme added.")
                $("#custom_css_export_panel").hide()
            })
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
    withThemeStorage((store) => {
        store.get({ active_custom_themes: [] }, (res) => {
            const arr = new Set((res.active_custom_themes || []).map(String));
            const sid = String(id);
            if (arr.has(sid)) arr.delete(sid); else arr.add(sid);
            const newArr = Array.from(arr);
            store.set({ active_custom_themes: newArr }, () => {
                cb && cb(newArr);
            });
        });
    });
}

chrome.storage.sync.get(['theme', 'active_custom_themes'], (res) => {
    const t = res.theme || 'light';
    applyTheme(t);
    renderCustomThemeButtons();
});
