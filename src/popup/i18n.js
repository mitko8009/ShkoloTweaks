$("#Customizations").html(chrome.i18n.getMessage("customizations"))
$("#lightTheme").html(chrome.i18n.getMessage("lightTheme"))
$("#darkTheme").html(chrome.i18n.getMessage("darkTheme"))
$("#advanced_settings").html(chrome.i18n.getMessage("advanced_settings"))

$("#popup_settings").html(chrome.i18n.getMessage("popup_settings"))
$("#auto_refresh").html(chrome.i18n.getMessage("auto_refresh"))
$("#auto_refresh_description").html(chrome.i18n.getMessage("auto_refresh_description"))

$("#shkolo_settings").html(chrome.i18n.getMessage("shkolo_settings"))
$("#developer_settings").html(chrome.i18n.getMessage("developer_settings"))

$(".options").each(function() {
    const element = this.children[2]
    const id = element.id
    const message = chrome.i18n.getMessage(id)
    if (message) {
        element.innerHTML = message
    }

    const description = this.querySelector(".description");
    const descriptionId = description ? description.id : null;
    const descriptionMessage = chrome.i18n.getMessage(descriptionId)
    if (descriptionMessage) {
        description.innerHTML = descriptionMessage
    }
})

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