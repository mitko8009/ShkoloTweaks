function refresh_page() {
    chrome.storage.sync.get(['autoRefresh'], (result) => {
        if (result.autoRefresh) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.reload(tabs[0].id)
            })
        }
    })

}

// Theme Switcher: use storage.theme ("light"|"dark"|"custom:<id>")
const lightThemeBtn = document.getElementById('lightTheme')
const darkThemeBtn = document.getElementById('darkTheme')
const body = document.body
const PINNED_SETTINGS_KEY = 'pinned_settings'
let pinnedSettingsCache = []
let settingSchemaCache = null

function applyTheme(theme) {
    if (theme === 'dark') {
        $(".bg_overlay").show()
        body.style.color = '#ccc'
        darkThemeBtn.classList.add('active')
        lightThemeBtn.classList.remove('active')
    } else if (typeof theme === 'string' && theme.startsWith('custom:')) {
        $(".bg_overlay").hide()
        body.style.color = '#fff'
        darkThemeBtn.classList.remove('active')
        lightThemeBtn.classList.remove('active')
    } else {
        $(".bg_overlay").hide()
        body.style.color = '#fff'
        lightThemeBtn.classList.add('active')
        darkThemeBtn.classList.remove('active')
    }
}

// initialize base from storage.theme
function getThemeStore(cb) {
    chrome.storage.local.get({ disable_theme_sync: false }, (r) => {
        cb(r.disable_theme_sync ? chrome.storage.local : chrome.storage.sync);
    });
}

// initialize base from storage.theme (respect disable_theme_sync)
getThemeStore((store) => {
    store.get(['theme'], (result) => {
        const t = result.theme || 'light';
        applyTheme(t);
    });
});

lightThemeBtn.addEventListener('click', () => {
    applyTheme('light');
    getThemeStore((store) => store.set({ theme: 'light' }));
});

darkThemeBtn.addEventListener('click', () => {
    applyTheme('dark');
    getThemeStore((store) => store.set({ theme: 'dark' }));
});

chrome.storage.sync.get(['dev_tools'], (result) => {
    if (result.dev_tools) {
        fetch("https://raw.githubusercontent.com/mitko8009/ShkoloTweaks/refs/heads/main/src/manifest.json")
            .then(response => response.json())
            .then(data => {
                $("#dev").html("Lastest (GH): v" + (data.version_name || data.version))
            })
    }
})

function togglePopupCustomThemeId(id, cb) {
    getThemeStore((store) => {
        store.get({ active_custom_themes: [] }, (res) => {
            const arr = new Set((res.active_custom_themes || []).map(String));
            const sid = String(id);
            if (arr.has(sid)) arr.delete(sid); else arr.add(sid);
            const newArr = Array.from(arr);
            store.set({ active_custom_themes: newArr }, () => cb && cb(newArr));
        });
    });
}

function renderPopupCustomThemes() {
    const toggle = document.querySelector(".theme-toggle");
    if (!toggle) return;
    toggle.querySelectorAll(".custom-theme-btn").forEach(n => n.remove());

    chrome.storage.sync.get(['custom_themes'], (syncRes) => {
        getThemeStore((store) => {
            store.get(['theme', 'active_custom_themes'], (res) => {
                const themes = (syncRes.custom_themes || []);
                const currentTheme = res.theme || 'light';
                const activeIds = new Set((res.active_custom_themes || []).map(String));

                if (currentTheme === 'dark') {
                    document.body.classList.add('dark-theme');
                    darkThemeBtn.classList.add('active');
                    lightThemeBtn.classList.remove('active');
                } else if (typeof currentTheme === 'string' && currentTheme.startsWith('custom:')) {
                    document.body.classList.remove('dark-theme');
                    lightThemeBtn.classList.remove('active');
                    darkThemeBtn.classList.remove('active');
                } else {
                    document.body.classList.remove('dark-theme');
                    lightThemeBtn.classList.add('active');
                    darkThemeBtn.classList.remove('active');
                }

                try {
                    const path = (window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : "";
                    if (path.endsWith("/popup.html") || path.endsWith("popup.html")) return;
                } catch (e) {
                    return;
                }

                themes.forEach(t => {
                    const id = String(t.created);
                    if (toggle.querySelector(`.custom-theme-btn[data-custom-id="${CSS.escape(id)}"]`)) return;

                    const btn = document.createElement("button");
                    btn.className = "custom-theme-btn";
                    btn.textContent = t.name;
                    btn.dataset.customId = id;
                    btn.style.padding = "6px 10px";
                    btn.style.borderRadius = "6px";
                    btn.style.border = "1px solid #e2e8f0";
                    btn.style.background = "#fff";
                    btn.style.marginLeft = "6px";

                    if (activeIds.has(id)) {
                        btn.classList.add('active');
                        btn.style.background = "#e6f0ff";
                    }

                    btn.addEventListener("click", () => {
                        getThemeStore((store2) => {
                            store2.get({ active_custom_themes: [] }, (s) => {
                                const set = new Set((s.active_custom_themes || []).map(String));
                                if (set.has(id)) set.delete(id); else set.add(id);
                                const arr = Array.from(set);
                                store2.set({ active_custom_themes: arr }, () => {
                                    if (set.has(id)) { btn.classList.add('active'); btn.style.background = "#e6f0ff"; }
                                    else { btn.classList.remove('active'); btn.style.background = "#fff"; }
                                    refresh_page();
                                });
                            });
                        });
                    });

                    btn.addEventListener("contextmenu", (e) => {
                        e.preventDefault();
                        if (!confirm(`Remove custom theme "${t.name}"?`)) return;
                        // custom_themes stored in sync; theme may be in theme store
                        chrome.storage.sync.get({ custom_themes: [] }, (syncR) => {
                            getThemeStore((store2) => {
                                store2.get({ theme: 'light', active_custom_themes: [] }, (r) => {
                                    const newArr = (syncR.custom_themes || []).filter(x => String(x.created) !== id);
                                    const prevTheme = r.theme;
                                    chrome.storage.sync.set({ custom_themes: newArr }, () => {
                                        if (prevTheme === `custom:${id}`) {
                                            store2.set({ theme: 'light' }, () => {
                                                renderPopupCustomThemes();
                                                refresh_page();
                                            });
                                        } else {
                                            renderPopupCustomThemes();
                                        }
                                    });
                                });
                            });
                        });
                    });

                    toggle.appendChild(btn);
                });
            });
        });
    });

    renderPopupCustomThemes();
    chrome.storage.onChanged.addListener((changes, area) => {
        const keys = ['custom_themes', 'theme', 'active_custom_themes'];
        for (const k of Object.keys(changes)) {
            if (keys.includes(k)) { renderPopupCustomThemes(); break; }
        }
    });
}

async function getSettingSchema() {
    if (settingSchemaCache) return settingSchemaCache
    try {
        const response = await fetch(chrome.runtime.getURL('setting-schema.json'))
        if (!response.ok) throw new Error(`Failed to load: ${response.status}`)
        const schema = await response.json()
        if (!schema || !Array.isArray(schema.schema)) return null
        settingSchemaCache = schema
        return schema
    } catch (e) {
        console.error('Error loading setting schema:', e)
        return null
    }
}

function applyBlockedSettings(schema, blockingId, isEnabled) {
    const items = schema && schema.schema ? schema.schema : []
    const defaults = schema && schema.defaults ? schema.defaults : {}
    const blockingItem = items.find(item => item.id === blockingId)
    if (!blockingItem || !Array.isArray(blockingItem.blocks)) return

    chrome.storage.sync.get(null, (result) => {
        const updates = {}
        const blockedStates = result.__blockedStates || {}

        blockingItem.blocks.forEach((blockedId) => {
            if (isEnabled) {
                if (!blockedStates[blockedId]) {
                    const hasValue = Object.prototype.hasOwnProperty.call(result, blockedId)
                    const currentValue = hasValue ? result[blockedId] : defaults[blockedId]
                    blockedStates[blockedId] = {
                        value: currentValue,
                        blockedBy: blockingId
                    }
                }
                updates[blockedId] = false
            } else if (blockedStates[blockedId] && blockedStates[blockedId].blockedBy === blockingId) {
                updates[blockedId] = blockedStates[blockedId].value
                delete blockedStates[blockedId]
            }
        })

        updates.__blockedStates = blockedStates
        chrome.storage.sync.set(updates)
    })
}

function persistPinnedSetting(id, value, schema, done) {
    if (id === 'leaderboard' && value === true) {
        const ok = confirm('Enable Leaderboard?\nThis enables a leaderboard extension that can submit your success, feedback count, pupil_id and school name to a NON-Shkolo server, and the information will be publicly accessible.\nProceed?')
        if (!ok) {
            if (typeof done === 'function') done(false)
            return
        }
    }

    if (id === 'disable_theme_sync') {
        chrome.storage.local.set({ disable_theme_sync: value }, () => {
            getThemeStore((store) => {
                store.get(['theme'], (res) => {
                    applyTheme(res.theme || 'light')
                })
            })
            if (typeof done === 'function') done(true)
        })
        return
    }

    chrome.storage.sync.set({ [id]: value }, () => {
        applyBlockedSettings(schema, id, value)
        if (typeof done === 'function') done(true)
    })
}

function buildPinnedOptionElement(item, value, defaults, schema) {
    const optionDiv = document.createElement('div')
    optionDiv.className = 'options'

    const input = document.createElement('input')
    input.type = 'checkbox'
    input.id = `pinned_${item.id}`
    const currentValue = value !== undefined ? value : defaults[item.id]
    input.checked = !!currentValue

    const switchLabel = document.createElement('label')
    switchLabel.setAttribute('for', input.id)
    switchLabel.className = 'switch'

    const textLabel = document.createElement('label')
    textLabel.setAttribute('for', input.id)
    textLabel.textContent = chrome.i18n.getMessage(item.i18n_title) || item.i18n_title || item.id

    optionDiv.appendChild(input)
    optionDiv.appendChild(switchLabel)
    optionDiv.appendChild(textLabel)

    optionDiv.onclick = (e) => {
        const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : ''
        if (tag === 'input' || tag === 'label' || tag === 'button') return
        input.checked = !input.checked
        persistPinnedSetting(item.id, input.checked, schema, (applied) => {
            if (!applied) {
                input.checked = !input.checked
                return
            }
            optionDiv.classList.add('clicked')
            setTimeout(() => optionDiv.classList.remove('clicked'), 300)
        })
    }

    input.onchange = (e) => {
        e.stopPropagation()
        persistPinnedSetting(item.id, input.checked, schema, (applied) => {
            if (!applied) {
                input.checked = !input.checked
            }
        })
    }

    return optionDiv
}

async function loadPinnedSettings() {
    const container = document.getElementById('pinned_options_list')
    const empty = document.getElementById('pinned_options_empty')
    if (!container) return

    const schema = await getSettingSchema()
    if (!schema) {
        container.innerHTML = ''
        if (empty) empty.style.display = 'block'
        return
    }

    chrome.storage.sync.get([PINNED_SETTINGS_KEY, 'dev_tools'], (syncRes) => {
        const pinnedRaw = Array.isArray(syncRes[PINNED_SETTINGS_KEY]) ? syncRes[PINNED_SETTINGS_KEY] : []
        const devTools = !!syncRes.dev_tools
        const pinnedIds = pinnedRaw.map(String)
        const items = pinnedIds
            .map((id) => schema.schema.find((item) => item.id === id))
            .filter((item) => {
                if (!item || item.type !== 'boolean' || item.hidden === true) return false
                if (item.tags && Array.isArray(item.tags) && item.tags.includes('dev') && !devTools) return false
                return true
            })

        pinnedSettingsCache = items.map((item) => String(item.id))
        container.innerHTML = ''

        if (!items.length) {
            if (empty) empty.style.display = 'block'
            return
        }

        if (empty) empty.style.display = 'none'

        const keys = items.map((item) => item.id)
        chrome.storage.sync.get(keys, (syncVals) => {
            chrome.storage.local.get(keys, (localVals) => {
                const merged = Object.assign({}, syncVals, localVals)
                const defaults = schema.defaults || {}

                items.forEach((item) => {
                    const optionDiv = buildPinnedOptionElement(item, merged[item.id], defaults, schema)
                    container.appendChild(optionDiv)
                })
            })
        })
    })
}

loadPinnedSettings()

if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync') {
            if (changes[PINNED_SETTINGS_KEY]) {
                loadPinnedSettings()
                return
            }
            const keys = Object.keys(changes)
            if (pinnedSettingsCache.length && keys.some((k) => pinnedSettingsCache.includes(k))) {
                loadPinnedSettings()
            }
        } else if (area === 'local') {
            if (pinnedSettingsCache.includes('disable_theme_sync') && changes.disable_theme_sync) {
                loadPinnedSettings()
            }
        }
    })
}
