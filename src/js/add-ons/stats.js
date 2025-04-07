// ShkoloTweaks Stats Add-on
// Adds a new tab to the stats page with some cool stats

function stats_main() {
    if (pageurl.includes("//app.shkolo.bg/stats/pupil/")) {
        // Navbar Tab
        let navbar = $(".nav.nav-tabs")[0]
    
        let at_tab = document.createElement("li")
        at_tab.appendChild(document.createElement("a"))
        at_tab.children[0].setAttribute("data-toggle", "tab")
        at_tab.children[0].setAttribute("data-value", "tab-st")
        at_tab.children[0].href = "#tab-st"
        at_tab.children[0].classList.add("stats-tab")
        let at_TabIcon = document.createElement("i")
        at_TabIcon.classList.add("fal", "fa-chart-line")
        at_tab.children[0].appendChild(at_TabIcon)
        at_tab.children[0].innerHTML += " ShkoloTweaks"
        navbar.appendChild(at_tab)
    
        // Tab Content
        let tab_content = $(".tab-content")[0]
    
        let at_TabContent = tab_content.appendChild(document.createElement("div"))
        at_TabContent.classList.add("tab-pane")
        at_TabContent.id = "tab-st"
    
        // Left Column
        let at_TabContentLeft = at_TabContent.appendChild(document.createElement("div"))
        at_TabContentLeft.classList.add("col-md-6", "column", "sortable")
    
        // Cool Stats Widget
        let at_StatsWidget = at_TabContentLeft.appendChild(document.createElement("div"))
        at_StatsWidget.classList.add("portlet", "portlet-sortable", "portlet-rank", "light", "bordered")
    
        let at_StatsWidgetTitle = at_StatsWidget.appendChild(document.createElement("div"))
        at_StatsWidgetTitle.classList.add("portlet-title")
        at_StatsWidgetTitle.appendChild(document.createElement("div"))
        at_StatsWidgetTitle.children[0].classList.add("caption")
        at_StatsWidgetTitle.children[0].appendChild(getIcon("chart-line"))
        at_StatsWidgetTitle.children[0].innerHTML += "<span class='caption-subject bold font-blue-steel uppercase'> Cool Stats</span>"
        
        let at_StatsWidgetContent = at_StatsWidget.appendChild(document.createElement("div"))
        at_StatsWidgetContent.classList.add("portlet-body", "stats-rank-portlet-body", "clearfix")
    
        let at_StatsWidgetContent_LTO = at_StatsWidgetContent.appendChild(document.createElement("div"))
        at_StatsWidgetContent_LTO.classList.add("col-sm-4", "col-xs-6", "stats-rank-box", "cursor-pointer", "centered-text")
    
        let at_StatsWidgetContent_LTO_Value = at_StatsWidgetContent_LTO.appendChild(document.createElement("div"))
        at_StatsWidgetContent_LTO_Value.classList.add("rank-value")
        at_StatsWidgetContent_LTO_Value.appendChild(document.createElement("div"))
        at_StatsWidgetContent_LTO_Value.children[0].classList.add("stats-rank")
        chrome.storage.sync.get(["LTO"], (result) => {
            at_StatsWidgetContent_LTO_Value.children[0].innerHTML = result.LTO
        })
    
        at_StatsWidgetContent_LTO_Value.appendChild(document.createElement("div"))
        at_StatsWidgetContent_LTO_Value.classList.add("stats-label")
        at_StatsWidgetContent_LTO_Value.children[1].innerHTML = chrome.i18n.getMessage("StatsLTO")
        
        let at_StatsWidgetContent_LTO_popup = at_StatsWidgetContent_LTO.appendChild(document.createElement("div"))
        at_StatsWidgetContent_LTO_popup.classList.add("popupText", "statsRankPopup")
        at_StatsWidgetContent_LTO_popup.innerHTML = chrome.i18n.getMessage("StatsLTOPopup")
    }
}

try {
    chrome.storage.sync.get(['stats_panel'], (result) => {
        if (result.stats_panel === undefined || result.stats_panel === true) {
            stats_main()
        }
    })
} catch (e) {
    console.log("Error in stats.js: " + e)
}

function stat_tracking() {
    if (pageurl.includes("//app.shkolo.bg/dashboard")) {
        chrome.storage.sync.get(["LTO"], (result) => {
            LTO = result.LTO
            if (LTO === undefined) LTO = 0
            LTO += 1
            chrome.storage.sync.set({LTO: LTO})
        })
    }
}

