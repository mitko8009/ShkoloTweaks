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

//* /////////////////////
//*  Custom CSS Editor //
//* /////////////////////

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
