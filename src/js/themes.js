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
    chrome.storage.sync.get(null, (storage) => {
        const themeVal = storage.theme || 'light';
        setBaseTheme(themeVal);

        let combined = "";
        const active = Array.isArray(storage.active_custom_themes) ? storage.active_custom_themes.map(String) : [];
        if (active.length && Array.isArray(storage.custom_themes)) {
            for (const id of active) {
                const ct = storage.custom_themes.find(t => String(t.created) === String(id));
                if (ct && ct.css) combined += `\n/* custom theme: ${ct.name} */\n` + ct.css;
            }
        }

        if (storage.custom_css) combined += `\n/* editor custom_css */\n` + storage.custom_css;

        applyCustomCss(combined);

        if (storage.blur_data) { loadCssFile("css/shkolo/blurData.css"); }
        if (storage.no_avatars) { loadCssFile("css/shkolo/noAvatars.css"); }
        if (storage.rounded) { loadCssFile("css/shkolo/rounded.css"); }

        let messageBody = document.getElementsByClassName("message-body")[0];
        if (messageBody !== undefined) {
            for (let i = 0; i < messageBody.children.length; i++) {
                messageBody.children[i].removeAttribute("style");
            }
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
    if (area !== "sync") return;
    if (changes.theme || changes.active_custom_themes || changes.custom_css || changes.custom_themes || changes.blur_data || changes.no_avatars || changes.rounded) {
        setTimeout(checkTheme, 10);
    }
});

checkTheme();
