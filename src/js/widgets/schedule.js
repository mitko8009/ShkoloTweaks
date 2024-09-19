var scheduleWidgetTitle
var scheduleWidgetContent

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
            classNode.style = "margin-top: 8px; padding: 10px; font-size: 16px; border: 1px solid var(--border-primary);"
    
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

    widget.children[0].style.height=scheduleWidgetContent.offsetHeight+100+"px"
}

function sc_main() {
    const sc_Widget = WIDGETSROW.children[0].cloneNode(true)

    if (sc_Widget === undefined) return

    var day = today.getDay() - 1
    if (day < 0 || day > 4) day = 0
    var weekday = WEEKDAYS[day]

    sc_Widget.className = "col-sm-6"
    sc_Widget.children[0].className=`portlet portlet-sortable light bordered`

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

    sc_Widget.children[0].children[0].children[0].appendChild(getIcon("table"))

    //////////////////////////
    // Schedule Share Button
    // var scheduleShare = document.createElement("a")
    // scheduleShare.innerHTML = chrome.i18n.getMessage("Share")
    // scheduleShare.classList.add("sc_buttons", "pull-right", "rounded")
    // sc_Widget.children[0].children[0].appendChild(scheduleShare)
    //////////////////////////

    var scheduleViewMore = document.createElement("a")
    scheduleViewMore.innerHTML = chrome.i18n.getMessage("ViewMore")
    scheduleViewMore.href = "https://app.shkolo.bg/diary#tab_schedule"
    scheduleViewMore.classList.add("pull-right", "sc_buttons", "rounded")
    sc_Widget.children[0].children[0].appendChild(scheduleViewMore)

    var scheduleRefresh = document.createElement("a")
    scheduleRefresh.innerHTML = chrome.i18n.getMessage("Refresh")
    scheduleRefresh.classList.add("pull-right", "sc_buttons", "rounded")
    scheduleRefresh.onclick = () => {
        scheduleWidgetTitle.innerHTML = chrome.i18n.getMessage("Schedule")
        scheduleWidgetContent.innerHTML = chrome.i18n.getMessage("FetchSchedule")
        sc_fetchAndSave(WEEKDAYS[today.getDay() - 1 > 4 ? 0 : today.getDay() - 1], sc_Widget)
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
    
    if (!cleanUp) sc_Widget.children[0].children[2].remove() // Remove the widget footer
    WIDGETSROW.appendChild(sc_Widget)
}

try {
    sc_main()
} catch (e) {
    console.error("Failed to load the Schedule widget. Error: "+e)
}
