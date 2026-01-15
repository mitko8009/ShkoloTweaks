loadCssFile("css/shkolo/__global.css")

function setBaseTheme(base) {
    const id = "shkolo_base_theme"
    const existing = document.getElementById(id)
    if (existing) existing.remove()

    if (!base || base === "light") {
        document.documentElement.classList.remove("dark-theme")
        return
    }

    if (typeof base === "string" && base.startsWith("custom:")) {
        document.documentElement.classList.remove("dark-theme")
        return
    }

    const href = chrome.runtime.getURL(`themes/${base}/style.css`)
    const l = document.createElement("link")
    l.id = id
    l.rel = "stylesheet"
    l.href = href
    document.head.appendChild(l)

    if (base === "dark") document.documentElement.classList.add("dark-theme")
    else document.documentElement.classList.remove("dark-theme")
}

function checkTheme() {
    chrome.storage.local.get({ disable_theme_sync: false }, (pref) => {
        const disabled = !!pref.disable_theme_sync;
        const collect = (storageObj) => {
            const themeVal = storageObj.theme || 'light';
            setBaseTheme(themeVal);

            let combined = "";
            const active = Array.isArray(storageObj.active_custom_themes) ? storageObj.active_custom_themes.map(String) : [];
            if (active.length && Array.isArray(storageObj.custom_themes)) {
                for (const id of active) {
                    const ct = storageObj.custom_themes.find(t => String(t.created) === String(id));
                    if (ct && ct.css) combined += `\n/* custom theme: ${ct.name} */\n` + ct.css;
                }
            }

            if (storageObj.custom_css) combined += `\n/* editor custom_css */\n` + storageObj.custom_css;

            applyCustomCss(combined);

            if (storageObj.blur_data) { loadCssFile("css/shkolo/blurData.css"); }
            if (storageObj.no_avatars) { loadCssFile("css/shkolo/noAvatars.css"); }
            if (storageObj.rounded) { loadCssFile("css/shkolo/rounded.css"); }
            if (storageObj.colored_icons) { loadCssFile("/css/shkolo/misc/colored_icons.css"); }

            if (storageObj.animations) {
                // Load variables for animations before the main animations CSS
                const styleEl = document.createElement("style");
                styleEl.id = "shkolo_animations_vars";
                styleEl.textContent = `:root {
                    --animation-duration: ${parseFloat(storageObj.sub_animation_duration || 300)}ms;
                }`;
                document.head.appendChild(styleEl);
                loadCssFile("css/shkolo/misc/animations.css");
            }

            let messageBody = document.getElementsByClassName("message-body")[0];
            if (messageBody !== undefined) {
                for (let i = 0; i < messageBody.children.length; i++) {
                    messageBody.children[i].removeAttribute("style");
                }
            }
        };

        if (disabled) {
            chrome.storage.sync.get(null, (syncVals) => {
                chrome.storage.local.get(['theme', 'active_custom_themes'], (localVals) => {
                    const merged = Object.assign({}, syncVals || {}, localVals || {});
                    collect(merged);
                });
            });
        } else {
            chrome.storage.sync.get(null, (storage) => {
                collect(storage);
            });
        }
    });
}

function applyCustomCss(css) {
    let el = document.getElementById("shkolo_custom_css");
    if (!el) {
        el = document.createElement("style");
        el.id = "shkolo_custom_css";
        document.head.appendChild(el);
    }
    el.textContent = css || "";
}

chrome.storage.onChanged.addListener((changes, area) => {
    const keys = ['theme', 'active_custom_themes', 'custom_css', 'custom_themes', 'blur_data', 'no_avatars', 'rounded', 'disable_theme_sync'];
    for (const k of Object.keys(changes)) {
        if (keys.includes(k)) {
            setTimeout(checkTheme, 10);
            break;
        }
    }
});

checkTheme();
