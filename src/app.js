const manifest = chrome.runtime.getManifest()
const version = manifest.version
const pageurl = window.location.href

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const WIDGETSROW = $(".col-md-12")[0].children[2]

var date = new Date()

var scheduleWidgetTitle
var scheduleWidgetContent

// Define jQuery
var script = document.createElement("script")
script.src = chrome.runtime.getURL("lib/jquery.min.js")
script.type = "text/javascript"
document.getElementsByTagName("head")[0].appendChild(script)

const AddCustomStyle = css => document.head.appendChild(document.createElement("style")).innerHTML = css

function loadCssFile(fileName) {
    fetch(chrome.runtime.getURL(fileName))
    .then(response => response.text())
    .then(data => { AddCustomStyle(data) });
}

function removeElements(elements) {
    Array.from(elements).forEach(function (element) {
        element.remove()
    })
}

function loadDiary() {
    const iframe = document.createElement("iframe")
    iframe.src = "https://app.shkolo.bg/diary#tab_schedule"
    iframe.sandbox = "allow-scripts allow-same-origin"
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    return iframe
}

function sc_saveLocaly(data) {
    var scheduleData = {}

    for (var i = 0; i < data.children.length; i++) { // Days
        scheduleData[WEEKDAYS[i]] = {}

        for (var j = 0; j < data.children[i].children[1].children.length; j++) { // Classes
            scheduleData[WEEKDAYS[i]][j] = {}
            if (data.children[i].children[1].children[j].children[0].children.length <= 0) {
                scheduleData[WEEKDAYS[i]][j] = {}
            } else {
                for (var m = 0; m < data.children[i].children[1].children[j].children[0].children[0].children.length; m++) { // Class Details
                    if (data.children[i].children[1].children[j].children[0].children[0].children[m].innerHTML.length > 0) {
                        //console.log(data.children[i].children[1].children[j].children[0].children[0].children[m].innerHTML + " / " + i + " / " + j + " / " + m); // Debugging
                        scheduleData[WEEKDAYS[i]][j][m] = data.children[i].children[1].children[j].children[0].children[0].children[m].innerHTML
                    }
                }
            }
        }
    }
    
    scheduleData = JSON.stringify(scheduleData)
    chrome.storage.local.set({scheduleData: scheduleData})
}

function sc_fetchAndSave(displayDay, widget) {
    console.log("Fetching schedule data...")

    var iframe = loadDiary()

    iframe.addEventListener("load", () => {
        scheduleWidgetContent.innerHTML = ""
        setTimeout(() => {
            sc_saveLocaly(iframe.contentWindow.document.getElementsByClassName("scheduleTable")[0].cloneNode(true))

            chrome.storage.local.get(["scheduleData"], (result) => {
                result.scheduleData = JSON.parse(result.scheduleData)
                sc_DisplayDay(displayDay, result.scheduleData, widget)
            });
        }, 1000);
    });
}

function sc_DisplayDay(day, data, widget) {
    dayData = data[day]
    
    scheduleWidgetTitle.innerHTML = chrome.i18n.getMessage("Schedule") + " | " + chrome.i18n.getMessage(day)

    scheduleWidgetContent.innerHTML = ""

    for (var i = 0; i < Object.keys(dayData).length; i++) {
        if (Object.keys(dayData[i]).length > 0) {
            var classNode = document.createElement("div")
            classNode.classList.add("rounded", "scheduleClass")
            classNode.style = "margin-top: 8px; padding: 10px; font-size: 16px; border: 1px solid #ffffff;"
    
            // Class Title (Ex. "Mathematics", "English", etc.)
            var classTitle = document.createElement("a")
            classTitle.innerHTML = dayData[i][0]
            classTitle.classList.add("scheduleCourse")
            if (dayData[i][0].includes("</i>")) {
                var classTitleDetails = dayData[i][0].split("</i> ")[0]
                classTitle.innerHTML = dayData[i][0].split("</i> ")[1].split("(")[0]
                classTitle.innerHTML = classTitleDetails + "</i> " + classTitle.innerHTML
            }
            classNode.appendChild(classTitle)
    
            // Class Teacher (Ex. "Mrs. Raicheva", etc.)
            var classTeacher = document.createElement("span")
            classTeacher.innerHTML = " | " + dayData[i][1]
            classTeacher.classList.add("scheduleSecondary", "secondaryFirst")
            classNode.appendChild(classTeacher)
    
            // Class Time (Ex. "08:00 - 09:00", "09:00 - 10:00", etc.)
            var classTime = document.createElement("span")
            classTime.innerHTML = dayData[i][3] === undefined ? chrome.i18n.getMessage("NoRoom") : dayData[i][3]
            classTime.classList.add("scheduleSecondary", "pull-right")
            classNode.appendChild(classTime)
    
            // Class Room (Ex. "Room 103", "Room 404", etc.)
            var classRoom = document.createElement("span")
            classRoom.innerHTML = dayData[i][2]
            classRoom.style = "padding-right: 12px;"
            classRoom.classList.add("scheduleSecondary", "pull-right")
            classNode.appendChild(classRoom)
    
            scheduleWidgetContent.appendChild(classNode)
        }
    }

    var scheduleWidgetContentHeight = scheduleWidgetContent.offsetHeight + 100
    widget.children[0].style.height = scheduleWidgetContentHeight + "px"
}

function getIcon(subject) {
    var icon = document.createElement("i")
    icon.classList.add("fal", "fa-"+subject.toLowerCase(), "scIcon")
    return icon
}

loadCssFile("css/__global.css")

$("#sc-name-lbl").html($("#sc-name-lbl").html() + " | ShkoloTweaks v" + version + " (Beta)");
$(".page-footer-inner")[0].innerHTML += " | " + chrome.i18n.getMessage("FooterDisclaimer");

if (pageurl.includes("//app.shkolo.bg/stats/pupil/")) {
    // Navbar Tab
    var navbar = $(".nav.nav-tabs")[0]

    var at_tab = document.createElement("li")
    at_tab.appendChild(document.createElement("a"))
    at_tab.children[0].setAttribute("data-toggle", "tab")
    at_tab.children[0].setAttribute("data-value", "tab-st")
    at_tab.children[0].href = "#tab-st"
    at_tab.children[0].classList.add("stats-tab")
    var at_TabIcon = document.createElement("i")
    at_TabIcon.classList.add("fal", "fa-chart-line")
    at_tab.children[0].appendChild(at_TabIcon)
    at_tab.children[0].innerHTML += " ShkoloTweaks"
    navbar.appendChild(at_tab)

    // Tab Content
    var tab_content = $(".tab-content")[0]

    var at_TabContent = tab_content.appendChild(document.createElement("div"))
    at_TabContent.classList.add("tab-pane")
    at_TabContent.id = "tab-st"

    // Left Column
    var at_TabContentLeft = at_TabContent.appendChild(document.createElement("div"))
    at_TabContentLeft.classList.add("col-md-6", "column", "sortable")

    // Cool Stats Widget
    var at_StatsWidget = at_TabContentLeft.appendChild(document.createElement("div"))
    at_StatsWidget.classList.add("portlet", "portlet-sortable", "portlet-rank", "light", "bordered")

    var at_StatsWidgetTitle = at_StatsWidget.appendChild(document.createElement("div"))
    at_StatsWidgetTitle.classList.add("portlet-title")
    at_StatsWidgetTitle.appendChild(document.createElement("div"))
    at_StatsWidgetTitle.children[0].classList.add("caption")
    at_StatsWidgetTitle.children[0].appendChild(getIcon("chart-line"))
    at_StatsWidgetTitle.children[0].innerHTML += "<span class='caption-subject bold font-blue-steel uppercase'> Cool Stats</span>"
    
    var at_StatsWidgetContent = at_StatsWidget.appendChild(document.createElement("div"))
    at_StatsWidgetContent.classList.add("portlet-body", "stats-rank-portlet-body", "clearfix")

    var at_StatsWidgetContent_LTO = at_StatsWidgetContent.appendChild(document.createElement("div"))
    at_StatsWidgetContent_LTO.classList.add("col-sm-4", "col-xs-6", "stats-rank-box", "cursor-pointer", "centered-text")

    var at_StatsWidgetContent_LTO_Value = at_StatsWidgetContent_LTO.appendChild(document.createElement("div"))
    at_StatsWidgetContent_LTO_Value.classList.add("rank-value")
    at_StatsWidgetContent_LTO_Value.appendChild(document.createElement("div"))
    at_StatsWidgetContent_LTO_Value.children[0].classList.add("stats-rank")
    chrome.storage.sync.get(["LTO"], (result) => {
        at_StatsWidgetContent_LTO_Value.children[0].innerHTML = result.LTO
    })

    at_StatsWidgetContent_LTO_Value.appendChild(document.createElement("div"))
    at_StatsWidgetContent_LTO_Value.classList.add("stats-label")
    at_StatsWidgetContent_LTO_Value.children[1].innerHTML = chrome.i18n.getMessage("StatsLTO")
    
    var at_StatsWidgetContent_LTO_popup = at_StatsWidgetContent_LTO.appendChild(document.createElement("div"))
    at_StatsWidgetContent_LTO_popup.classList.add("popupText", "statsRankPopup")
    at_StatsWidgetContent_LTO_popup.innerHTML = chrome.i18n.getMessage("StatsLTOPopup")
} else if (pageurl.includes("//app.shkolo.bg/dashboard")) {
    chrome.storage.sync.get(["LTO"], (result) => {
        LTO = result.LTO
        if (LTO === undefined) LTO = 0
        LTO += 1
        chrome.storage.sync.set({LTO: LTO})
    });
}

chrome.storage.sync.get(["theme", "cleanUp", "blurPfp", "rounded", "scheduleWidget"], (result) => {
    const { theme, cleanUp, blurPfp, rounded, scheduleWidget } = result

    if (theme !== "light") { // Load Any Theme
        loadCssFile(`themes/${theme}/style.css`)

        try {
            var script = document.createElement("script")
            script.src = chrome.runtime.getURL(`themes/${theme}/script.js`)
            script.type = "text/javascript"
            document.getElementsByTagName("head")[0].appendChild(script)
        } catch { console.warn("Failed to load script.js for the theme.") }
    } else {
        var topMenu = $(".nav.navbar-nav.pull-right")[0]
        var option = topMenu.children[2].cloneNode(true)
        removeElements(option.children[0].children)
        option.children[0].innerHTML = "Apply Dark Theme"
        option.children[0].style = "color: white !important; font-weight: bold;"
        option.children[0].href = "javascript:void(0)"
        option.children[0].onclick = () => {
            chrome.storage.sync.set({theme: "dark"})
            location.reload()
        }
        option.title = "Apply Dark Theme"
        topMenu.prepend(option)
    }
    
    if (scheduleWidget && pageurl.includes("dashboard")) {
        const sc_Widget = WIDGETSROW.children[0].cloneNode(true)

        var day = date.getDay() - 1
        if (day < 0 || day > 4) day = 0
        var weekday = WEEKDAYS[day]

        sc_Widget.className = "col-sm-6"

        removeElements(sc_Widget.children[0].children[1].children) // Remove the content of the widget
        removeElements(sc_Widget.children[0].children[0].children[0].children[0].children)

        scheduleWidgetTitle = sc_Widget.children[0].children[0].children[0].children[1]
        scheduleWidgetContent = sc_Widget.children[0].children[1]

        sc_Widget.children[0].children[0].children[0].children[0].remove()

        scheduleWidgetTitle.innerHTML = chrome.i18n.getMessage("Schedule")

        scheduleWidgetContent.style.fontSize = "14px"
        scheduleWidgetContent.style.fontWeight = "bold"
        scheduleWidgetContent.style.height = "auto"
        scheduleWidgetContent.innerHTML = chrome.i18n.getMessage("Loading")

        var icon = document.createElement("i")
        icon.classList.add("fal", "fa-table")
        if (theme === "dark") icon.style = "color: white !important;"
        else icon.style = "color: #4b77be !important;"
        sc_Widget.children[0].children[0].children[0].appendChild(icon)

        var scheduleViewMore = document.createElement("a")
        scheduleViewMore.innerHTML = chrome.i18n.getMessage("ViewMore")
        scheduleViewMore.href = "https://app.shkolo.bg/diary#tab_schedule"
        if (theme === "dark") scheduleViewMore.style = "font-weight: bold; border: 1px solid white; padding: 8px; display: inline-block;"
        else scheduleViewMore.style = "font-weight: bold; border: 1px solid #4b77be; padding: 8px; display: inline-block;"
        scheduleViewMore.classList.add("pull-right", "sc_buttons", "rounded")
        sc_Widget.children[0].children[0].appendChild(scheduleViewMore)

        var scheduleRefresh = document.createElement("a")
        scheduleRefresh.innerHTML = chrome.i18n.getMessage("Refresh")
        if (theme === "dark") scheduleRefresh.style = "font-weight: bold; border: 1px solid white; padding: 8px; display: inline-block; margin-right: 10px;"
        else scheduleRefresh.style = "font-weight: bold; border: 1px solid #4b77be; padding: 8px; display: inline-block; margin-right: 8px;"
        scheduleRefresh.classList.add("pull-right", "sc_buttons", "rounded")
        scheduleRefresh.onclick = () => {
            scheduleWidgetTitle.innerHTML = chrome.i18n.getMessage("Schedule")
            scheduleWidgetContent.innerHTML = chrome.i18n.getMessage("FetchSchedule")
            sc_fetchAndSave(WEEKDAYS[date.getDay() - 1 > 4 ? 0 : date.getDay() - 1], sc_Widget)
        }
        sc_Widget.children[0].children[0].appendChild(scheduleRefresh)

        chrome.storage.local.get(["scheduleData"], function(result) {
            const { scheduleData } = result
            var refreshSchedule = false

            try { var data = JSON.parse(scheduleData); } catch (error) { refreshSchedule = true; }

            if (scheduleData === undefined || scheduleData === null || data === undefined) refreshSchedule = true

            // Next and Previous Day Buttons
            var nextDay = document.createElement("a")
            var icon = document.createElement("i")
            icon.classList.add("fal", "fa-chevron-right")
            nextDay.appendChild(icon)
            nextDay.classList.add("sc_buttons", "pull-right", "rounded")
            nextDay.onclick = () => {
                day += 1
                if (day > 4) day = 0
                sc_DisplayDay(WEEKDAYS[day], data, sc_Widget)
            }
            sc_Widget.children[0].children[0].appendChild(nextDay)

            var previousDay = document.createElement("a")
            var icon = document.createElement("i")
            icon.classList.add("fal", "fa-chevron-left")
            previousDay.appendChild(icon)
            previousDay.classList.add("sc_buttons", "pull-right", "rounded")
            previousDay.onclick = () => {
                day -= 1
                if (day < 0) day = 4
                sc_DisplayDay(WEEKDAYS[day], data, sc_Widget)
            }
            sc_Widget.children[0].children[0].appendChild(previousDay)
            

            try {
                if (refreshSchedule) {
                    sc_fetchAndSave(weekday, sc_Widget)
                } else {
                    sc_DisplayDay(weekday, data, sc_Widget)
                }
            } catch (error) {
                console.error("If you see this error. Please report it to the developer.\n"+error)
                scheduleWidgetContent.innerHTML = chrome.i18n.getMessage("FetchScheduleError") + "<br>" + error
            }
        });
        
        if (!cleanUp) sc_Widget.children[0].children[2].remove()
        WIDGETSROW.appendChild(sc_Widget)
    }

    if (cleanUp) { // Cleanup (aka. General Fixes)
        removeElements($(".btn.btn-lg.btn-e2e.red.huge"))
        removeElements($(".rank-descr"))
        removeElements($(".mobile-app-badges"))
        removeElements($(".mobile-app-link"))
        $("#help-link-in-menu").remove()

        loadCssFile("css/cleanup.css")
    }

    if(blurPfp) { loadCssFile("css/blurData.css") }
    if (rounded) { loadCssFile("css/rounded.css") } 
});
