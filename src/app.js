const manifest = chrome.runtime.getManifest()
const version = manifest.version
const pageurl = window.location.href

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const WIDGETSROW = document.getElementsByClassName("col-md-12")[0].children[2]

var date = new Date()

var scheduleWidgetTitle
var scheduleWidgetContent

const AddCustomStyle = css => document.head.appendChild(document.createElement("style")).innerHTML = css

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

    console.log(data)

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

            chrome.storage.local.get(["scheduleData"], function(result) {
                result.scheduleData = JSON.parse(result.scheduleData)
                sc_DisplayDay(displayDay, result.scheduleData, widget)
            });
        }, 1000);
    });
}

function sc_DisplayDay(day, data, widget) {
    dayData = data[day]
    
    scheduleWidgetTitle.innerHTML =  "SCHEDULE | " + day

    scheduleWidgetContent.innerHTML = ""

    for (var i = 0; i < Object.keys(dayData).length; i++) {
        if (Object.keys(dayData[i]).length > 0) {
            var classNode = document.createElement("div")
            classNode.classList.add("rounded")
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
            classTeacher.classList.add("scheduleSecondary")
            classTeacher.classList.add("secondaryFirst")
            classNode.appendChild(classTeacher)
    
            // Class Time (Ex. "08:00 - 09:00", "09:00 - 10:00", etc.)
            var classTime = document.createElement("span")
            classTime.innerHTML = dayData[i][3] === undefined ? "No room specified" : dayData[i][3]
            classTime.classList.add("scheduleSecondary")
            classTime.classList.add("pull-right")
            classNode.appendChild(classTime)
    
            // Class Room (Ex. "Room 103", "Room 404", etc.)
            var classRoom = document.createElement("span")
            classRoom.innerHTML = dayData[i][2]
            classRoom.style = "padding-right: 12px;"
            classRoom.classList.add("scheduleSecondary")
            classRoom.classList.add("pull-right")
            classNode.appendChild(classRoom)
    
            scheduleWidgetContent.appendChild(classNode)
        }
    }

    var scheduleWidgetContentHeight = scheduleWidgetContent.offsetHeight + 100
    widget.children[0].style.height = scheduleWidgetContentHeight + "px"
}

function getIcon(subject) {
    var icon = document.createElement("i")
    icon.classList.add("fal")
    icon.classList.add("scIcon")
    icon.classList.add("fa-"+subject.toLowerCase())
    return icon
}

// Global Styles
AddCustomStyle(`
    .rounded {
        border-radius: 8px !important;
    }
`)

document.getElementById("sc-name-lbl").innerHTML = document.getElementById("sc-name-lbl").innerHTML + " | ShkoloTweaks v" + version + " (Beta)";
document.getElementsByClassName("page-footer-inner")[0].innerHTML = document.getElementsByClassName("page-footer-inner")[0].innerHTML + " | ShkoloTweaks е създадено от екип <b>ITPG Studios</b> и е софтуер, който не е свързан или одобрен от Shkolo.bg.";



if (pageurl.includes("https://app.shkolo.bg/stats/pupil/")) {
    // Navbar Tab
    var navbar = document.getElementsByClassName("nav nav-tabs")[0]

    var at_tab = document.createElement("li")
    at_tab.appendChild(document.createElement("a"))
    at_tab.children[0].setAttribute("data-toggle", "tab")
    at_tab.children[0].setAttribute("data-value", "tab-st")
    at_tab.children[0].href = "#tab-st"
    at_tab.children[0].classList.add("stats-tab")
    var at_TabIcon = document.createElement("i")
    at_TabIcon.classList.add("fal")
    at_TabIcon.classList.add("fa-chart-line")
    at_tab.children[0].appendChild(at_TabIcon)
    at_tab.children[0].innerHTML += " ShkoloTweaks"
    navbar.appendChild(at_tab)

    // Tab Content
    var tab_content = document.getElementsByClassName("tab-content")[0]

    var at_TabContent = document.createElement("div")
    at_TabContent.classList.add("tab-pane")
    at_TabContent.id = "tab-st"

    // Left Column
    var at_TabContentLeft = document.createElement("div")
    at_TabContentLeft.classList.add("col-md-6")
    at_TabContentLeft.classList.add("column")
    at_TabContentLeft.classList.add("sortable")

    // Cool Stats Widget
    var at_StatsWidget = document.createElement("div")
    at_StatsWidget.classList.add("portlet")
    at_StatsWidget.classList.add("portlet-sortable")
    at_StatsWidget.classList.add("portlet-rank")
    at_StatsWidget.classList.add("light")
    at_StatsWidget.classList.add("bordered")

    var at_StatsWidgetTitle = document.createElement("div")
    at_StatsWidgetTitle.classList.add("portlet-title")
    at_StatsWidgetTitle.appendChild(document.createElement("div"))
    at_StatsWidgetTitle.children[0].classList.add("caption")
    at_StatsWidgetTitle.children[0].appendChild(getIcon("chart-line"))
    at_StatsWidgetTitle.children[0].innerHTML += "<span class='caption-subject bold font-blue-steel uppercase'> Cool Stats</span>"
    
    var at_StatsWidgetContent = document.createElement("div")
    at_StatsWidgetContent.classList.add("portlet-body")
    at_StatsWidgetContent.classList.add("stats-rank-portlet-body")
    at_StatsWidgetContent.classList.add("clearfix")

    at_StatsWidget.appendChild(at_StatsWidgetTitle)
    at_StatsWidget.appendChild(at_StatsWidgetContent)

    at_TabContentLeft.appendChild(at_StatsWidget)

    // Append the columns
    at_TabContent.appendChild(at_TabContentLeft)

    // Append the tab content
    tab_content.appendChild(at_TabContent)
}

chrome.storage.sync.get(["theme", "cleanUp", "blurPfp", "rounded", "scheduleWidget"], (result) => {
    const { theme, cleanUp, blurPfp, rounded, scheduleWidget } = result

    if (theme !== "dark" && theme !== "light") {
        chrome.storage.sync.set({theme: "dark"})
        window.reload()
    }

    if (theme === "dark") {
        fetch(chrome.runtime.getURL("css/dark.css"))
            .then(response => response.text())
            .then(data => {
                AddCustomStyle(data)
            });
    } else {
        var topMenu = document.getElementsByClassName("nav navbar-nav pull-right")[0]
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

        AddCustomStyle(`
        .scIcon {
            color: #4b77be !important;
        }
        `)
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

        scheduleWidgetTitle.innerHTML = "Schedule"

        scheduleWidgetContent.style.fontSize = "14px"
        scheduleWidgetContent.style.fontWeight = "bold"
        scheduleWidgetContent.innerHTML = "Loading..."
        scheduleWidgetContent.style.height = "auto"

        var icon = document.createElement("i")
        icon.classList.add("fal")
        icon.classList.add("fa-table")
        if (theme === "dark") icon.style = "color: white !important;"
        else icon.style = "color: #4b77be !important;"
        sc_Widget.children[0].children[0].children[0].appendChild(icon)

        var scheduleViewMore = document.createElement("a")
        scheduleViewMore.innerHTML = "View More"
        scheduleViewMore.href = "https://app.shkolo.bg/diary#tab_schedule"
        if (theme === "dark") scheduleViewMore.style = "font-weight: bold; border: 1px solid white; padding: 8px; display: inline-block;"
        else scheduleViewMore.style = "font-weight: bold; border: 1px solid #4b77be; padding: 8px; display: inline-block;"
        if (rounded) scheduleViewMore.classList.add("rounded")
        scheduleViewMore.classList.add("pull-right")
        sc_Widget.children[0].children[0].appendChild(scheduleViewMore)

        var scheduleRefresh = document.createElement("a")
        scheduleRefresh.innerHTML = "Refresh"
        if (theme === "dark") scheduleRefresh.style = "font-weight: bold; border: 1px solid white; padding: 8px; display: inline-block; margin-right: 10px;"
        else scheduleRefresh.style = "font-weight: bold; border: 1px solid #4b77be; padding: 8px; display: inline-block; margin-right: 8px;"
        if (rounded) scheduleRefresh.classList.add("rounded")
        scheduleRefresh.classList.add("pull-right")
        scheduleRefresh.onclick = () => {
            scheduleWidgetTitle.innerHTML = "Schedule"
            scheduleWidgetContent.innerHTML = "Fetching schedule data..."
            sc_fetchAndSave(WEEKDAYS[date.getDay() - 1 > 4 ? 0 : date.getDay() - 1], sc_Widget)
        }
        sc_Widget.children[0].children[0].appendChild(scheduleRefresh)

        chrome.storage.local.get(["scheduleData"], function(result) {
            const { scheduleData } = result

            var data = JSON.parse(scheduleData)

            // DATA VALIDATION
            var refreshSchedule = false
            if (scheduleData === undefined || scheduleData === null || data === undefined) refreshSchedule = true
            try {
                if (!refreshSchedule) {
                    if (Object.keys(data[weekday]).length <= 0 || !data[weekday].hasOwnProperty("0")) {
                        console.log(`Data not found for ${weekday}.`)
                        refreshSchedule = true
                    }
                }
            } catch (e) {
                console.log(`Data not found for ${weekday}.`)
                refreshSchedule = true
            }

            // Next and Previous Day Buttons
            var nextDay = document.createElement("a")
            var icon = document.createElement("i")
            icon.classList.add("fal")
            icon.classList.add("fa-chevron-right")
            nextDay.appendChild(icon)
            if (theme === "dark") nextDay.style = `font-weight: bold; border: 1px solid white; padding: 8px; display: inline-block; margin-right: 8px;`
            else nextDay.style = `font-weight: bold; border: 1px solid #4b77be; padding: 8px; display: inline-block; margin-right: 8px;`
            if (rounded) nextDay.classList.add("rounded")
            nextDay.classList.add("pull-right")
            nextDay.onclick = () => {
                day += 1
                if (day > 4) day = 0
                sc_DisplayDay(WEEKDAYS[day], data, sc_Widget)
            }
            sc_Widget.children[0].children[0].appendChild(nextDay)

            var previousDay = document.createElement("a")
            var icon = document.createElement("i")
            icon.classList.add("fal")
            icon.classList.add("fa-chevron-left")
            previousDay.appendChild(icon)
            if (theme === "dark") previousDay.style = `font-weight: bold; border: 1px solid white; padding: 8px; display: inline-block; margin-right: 8px;`
            else previousDay.style = `font-weight: bold; border: 1px solid #4b77be; padding: 8px; display: inline-block; margin-right: 8px;`
            if (rounded) previousDay.classList.add("rounded")
            previousDay.classList.add("pull-right")
            previousDay.onclick = () => {
                day -= 1
                if (day < 0) day = 4
                sc_DisplayDay(WEEKDAYS[day], data, sc_Widget)
            }
            sc_Widget.children[0].children[0].appendChild(previousDay)
            

            if (refreshSchedule) {
                sc_fetchAndSave(weekday, sc_Widget)
            } else {
                sc_DisplayDay(weekday, data, sc_Widget)
            }
        });
        
        if (!cleanUp) sc_Widget.children[0].children[2].remove()
        WIDGETSROW.appendChild(sc_Widget)
    }

    if (cleanUp) {
        removeElements(document.getElementsByClassName("btn btn-lg btn-e2e red huge"))
        removeElements(document.getElementsByClassName("rank-descr"))
        removeElements(document.getElementsByClassName("mobile-app-badges"))
        removeElements(document.getElementsByClassName("mobile-app-link"))
        document.getElementById("help-link-in-menu").remove()

        var dropdownmenulist = document.getElementsByClassName("dropdown-menu-list scroller")

        for (var i = 0; i < dropdownmenulist.length; i++) {
            dropdownmenulist[i].style = "height: 310px !important;" 
        }

        AddCustomStyle(`
        .page-header.navbar .top-menu .navbar-nav>li.dropdown-extended .dropdown-menu {
            max-height: 400px !important;
            min-height: 361px !important;
        }

        .profile-userpic img.avatar {
            width: 150px;
            height: 150px;
        }

        .select2-container, .inbox-compose .controls>input {
            margin-bottom: 4px !important;
            margin-top: 4px !important;
        }

        .nav-item, .page-sidebar .page-sidebar-menu .sub-menu li > a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu .sub-menu li > a {
            margin: 5px !important;
        }

        .portlet>.portlet-title>.caption, .inbox-nav-folder .inbox-nav-folder-info .inbox-nav-folder-name, .dashboard-stat .details .number, .dashboard-stat .details .desc {
            font-weight: bold;
        }

        `)
    }

    if(blurPfp) {
        fetch(chrome.runtime.getURL("css/blurData.css"))
            .then(response => response.text())
            .then(data => {
                AddCustomStyle(data)
            });
    }

    if (rounded) {
        fetch(chrome.runtime.getURL("css/rounded.css"))
            .then(response => response.text())
            .then(data => {
                AddCustomStyle(data)
            });
    } else {
        AddCustomStyle(`
        .rounded {
            border-radius: 0 !important;
        }`)
    }
});
