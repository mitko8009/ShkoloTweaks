const manifest = chrome.runtime.getManifest()
const version = manifest.version
const label_version = document.getElementById('version')

function refresh_page() {
    chrome.storage.sync.get(['autoRefresh'], (result) => {
        if (result.autoRefresh) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.reload(tabs[0].id)
            })
        }
    })

}

$("#version").text("v" + version)

// Theme Switcher: use storage.theme ("light"|"dark"|"custom:<id>")
const lightThemeBtn = document.getElementById('lightTheme')
const darkThemeBtn = document.getElementById('darkTheme')
const body = document.body

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

// Buttons
chrome.storage.sync.get(['rounded', 'blur_data'], (result) => {
    const rounded = result.rounded || false
    const blur_data = result.blur_data || false

    $("#rounded").prop("checked", rounded)
    $("#blur-data").prop("checked", blur_data)
})

$("#rounded").click(() => {
    const rounded = $("#rounded").prop("checked")
    chrome.storage.sync.set({ rounded: rounded })
    refresh_page()
})

$("#blur-data").click(() => {
    const blur_data = $("#blur-data").prop("checked")
    chrome.storage.sync.set({ blur_data: blur_data })
    refresh_page()
})

chrome.storage.sync.get(['dev_tools'], (result) => {
    if (result.dev_tools) {
        fetch("https://raw.githubusercontent.com/mitko8009/ShkoloTweaks/refs/heads/main/src/manifest.json")
            .then(response => response.json())
            .then(data => {
                $("#dev").html("Lastest: v" + data.version)
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
