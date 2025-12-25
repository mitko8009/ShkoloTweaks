$("#Customizations").html(chrome.i18n.getMessage("customizations"))
$("#lightTheme").html(chrome.i18n.getMessage("lightTheme"))
$("#darkTheme").html(chrome.i18n.getMessage("darkTheme"))
$("#advanced_settings").html(chrome.i18n.getMessage("advanced_settings"))

$("#popup_settings").html(chrome.i18n.getMessage("popup_settings"))
$("#auto_refresh").html(chrome.i18n.getMessage("auto_refresh"))
$("#auto_refresh_description").html(chrome.i18n.getMessage("auto_refresh_description"))

$("#shkolo_settings").html(chrome.i18n.getMessage("shkolo_settings"))
$("#developer_settings").html(chrome.i18n.getMessage("developer_settings"))

// Theme label & description
if ($("#theme_label").length) {
    $("#theme_label").text(chrome.i18n.getMessage("theme") || "Theme")
}
if ($("#theme_description").length) {
    $("#theme_description").text(chrome.i18n.getMessage("theme_description") || "")
}

// Search input i18n
if ($("#settings_search").length) {
    const placeholder = chrome.i18n.getMessage("search_settings") || "Search settings..."
    $("#settings_search").attr("placeholder", placeholder)
}
if ($("#settings_search_clear").length) {
    const txt = chrome.i18n.getMessage("clear") || "Clear"
    $("#settings_search_clear").text("×")
    $("#settings_search_clear").attr("title", txt)
}

// MON settings title
if ($("#mon_settings_title").length) {
    $("#mon_settings_title").text(chrome.i18n.getMessage("mon_settings_title") || "MON Settings")
}