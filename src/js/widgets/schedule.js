let scheduleWidgetTitle
let scheduleWidgetContent

const sc_Widget = WIDGETSROW.children[0].cloneNode(true);
let sc_Data = {}

function sc_saveLocaly(data) {
    let scheduleData = {}

    for (let i = 0; i < data.children.length; i++) { // Days
        scheduleData[WEEKDAYS[i]] = {}

        for (let j = 0; j < data.children[i].children[1].children.length; j++) { // Classes
            scheduleData[WEEKDAYS[i]][j] = {}
            if (data.children[i].children[1].children[j].children[0].children.length <= 0) {
                scheduleData[WEEKDAYS[i]][j] = {}
            } else {
                for (let m = 0; m < data.children[i].children[1].children[j].children[0].children[0].children.length; m++) { // Class Details
                    if (data.children[i].children[1].children[j].children[0].children[0].children[m].innerHTML.length > 0) {
                        //console.log(data.children[i].children[1].children[j].children[0].children[0].children[m].innerHTML + " / " + i + " / " + j + " / " + m); // Debugging
                        scheduleData[WEEKDAYS[i]][j][m] = data.children[i].children[1].children[j].children[0].children[0].children[m].innerHTML
                    }
                }
            }
        }
    }
    
    scheduleData = JSON.stringify(scheduleData)
    return scheduleData
}

function sc_fetchAndSave(displayDay, widget) {
    pupil_id = JSON.parse(localStorage.getItem("diary_filters_supports_/diary"))["pupil_id"]
    class_year_id = JSON.parse(localStorage.getItem("diary_filters_supports_/diary"))["class_year_id"]
    weekDay = getWeekNumber().toString()
    weekDay = "13"
    ajax(`https://app.shkolo.bg/ajax/diary/getScheduleForClass?pupil_id=${pupil_id}&year=${year.toString().slice(-2)}&week=${weekDay}&class_year_id=${class_year_id}`, 'GET', '', function(response) {
        const parser = new DOMParser();
        response = parser.parseFromString(response, 'text/html');
        response = response.getElementsByClassName('scheduleTable')[0];

        scheduleWidgetContent.innerHTML = ""
        sc_Data = JSON.parse(sc_saveLocaly(response))
        sc_DisplayDay(displayDay, sc_Data, widget)
    });
}

function sc_DisplayDay(day, data, widget) {
    dayData = data[day]
    
    scheduleWidgetTitle.innerHTML = chrome.i18n.getMessage("Schedule") + " | " + chrome.i18n.getMessage(day)

    scheduleWidgetContent.innerHTML = ""

    for (let i = 0; i < Object.keys(dayData).length; i++) {
        if (Object.keys(dayData[i]).length > 0) {
            let classNode = document.createElement("div")
            classNode.classList.add("rounded", "scheduleClass")
            classNode.style = "margin-top: 8px; padding: 10px; font-size: 16px; border: 1px solid var(--border-primary);"
            
            let classInfo = document.createElement("div")
            classInfo.classList.add("scheduleClassInfo")

            // Class Title (Ex. "Mathematics", "English", etc.)
            let classTitle = document.createElement("a")
            classTitle.innerHTML = dayData[i][0]
            classTitle.classList.add("scheduleCourse")
            if (dayData[i][0].includes("</i>")) {
                let classTitleDetails = dayData[i][0].split("</i> ")[0]
                classTitle.innerHTML = dayData[i][0].split("</i> ")[1].split("(")[0]
                classTitle.innerHTML = classTitleDetails + "</i> " + classTitle.innerHTML
            }
            classInfo.appendChild(classTitle)
    
            // Class Teacher (Ex. "Mrs. Raicheva", etc.)
            let classTeacher = document.createElement("span")
            classTeacher.innerHTML = " | " + dayData[i][1]
            classTeacher.classList.add("scheduleSecondary", "secondaryFirst")
            classInfo.appendChild(classTeacher)

            classNode.appendChild(classInfo)
            
            let rightInfo = document.createElement("span")
            rightInfo.classList.add("pull-right")

            // Class Room (Ex. "Room 103", "Room 404", etc.)
            let classRoom = document.createElement("span");
            classRoom.innerHTML = dayData[i][2];
            classRoom.style.paddingRight = "12px";
            classRoom.classList.add("scheduleSecondary");
            rightInfo.appendChild(classRoom);

            // Class Time (Ex. "08:00 - 09:00", "09:00 - 10:00", etc.)
            if (dayData[i][3] !== undefined) {
                let classTime = document.createElement("span");
                classTime.innerHTML = dayData[i][3];
                classTime.classList.add("scheduleSecondary");
                rightInfo.appendChild(classTime);
            }

            // Wrap both elements in a flex container
            rightInfo.classList.add("rightInfo");
            classNode.appendChild(rightInfo);
            scheduleWidgetContent.appendChild(classNode);
        }
    }

    widget.children[0].style.height=scheduleWidgetContent.offsetHeight+100+"px"
}

function sc_main() {
    if (sc_Widget === undefined) return

    let day = today.getDay() - 1
    if (day < 0 || day > 4) day = 0
    let weekday = WEEKDAYS[day]

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
    
    let headerButtons = document.createElement("div")
    headerButtons.classList.add("pull-right", "sc_buttons_row", "rounded")

    //////////////////////////
    // Schedule Share Button
    // var scheduleShare = document.createElement("a")
    // scheduleShare.innerHTML = chrome.i18n.getMessage("Share")
    // scheduleShare.classList.add("sc_buttons", "pull-right", "rounded")
    // headerButtons.appendChild(scheduleShare)
    //////////////////////////

    let scheduleViewMore = document.createElement("a")
    scheduleViewMore.innerHTML = chrome.i18n.getMessage("ViewMore")
    scheduleViewMore.href = "https://app.shkolo.bg/diary#tab_schedule"
    scheduleViewMore.classList.add("pull-right", "sc_buttons", "rounded")
    headerButtons.appendChild(scheduleViewMore)

    // let scheduleRefresh = document.createElement("a")
    // scheduleRefresh.innerHTML = chrome.i18n.getMessage("Refresh")
    // scheduleRefresh.classList.add("pull-right", "sc_buttons", "rounded")
    // scheduleRefresh.onclick = () => {
    //     scheduleWidgetTitle.innerHTML = chrome.i18n.getMessage("Schedule")
    //     scheduleWidgetContent.innerHTML = chrome.i18n.getMessage("FetchSchedule")
    //     sc_fetchAndSave(WEEKDAYS[today.getDay() - 1 > 4 ? 0 : today.getDay() - 1], sc_Widget)
    // }
    // headerButtons.appendChild(scheduleRefresh)

    try {
        sc_fetchAndSave(weekday, sc_Widget) // Fetch and save the schedule data
    } catch (e) {
        console.error("Failed to fetch the Schedule data. Error: "+e)
        scheduleWidgetContent.innerHTML = chrome.i18n.getMessage("FailedToFetchSchedule")
    }

    // Next and Previous Day Buttons
    let nextDay = document.createElement("a")
    let rightIcon = document.createElement("i")
    rightIcon.classList.add("fal", "fa-chevron-right")
    nextDay.appendChild(rightIcon)
    nextDay.classList.add("sc_buttons", "pull-right", "rounded")
    nextDay.onclick = () => {
        day += 1
        if (day > 4) day = 0
        sc_DisplayDay(WEEKDAYS[day], sc_Data, sc_Widget)
    }
    headerButtons.appendChild(nextDay)

    let previousDay = document.createElement("a")
    let leftIcon = document.createElement("i")
    leftIcon.classList.add("fal", "fa-chevron-left")
    previousDay.appendChild(leftIcon)
    previousDay.classList.add("sc_buttons", "pull-right", "rounded")
    previousDay.onclick = () => {
        day -= 1
        if (day < 0) day = 4
        sc_DisplayDay(WEEKDAYS[day], sc_Data, sc_Widget)
    }
    headerButtons.appendChild(previousDay)

    
    if (!cleanUp) sc_Widget.children[0].children[2].remove() // Remove the widget footer
    WIDGETSROW.appendChild(sc_Widget)

    sc_Widget.children[0].children[0].appendChild(headerButtons)
}

try {
    // if (scheduleWidget) sc_main()
    sc_main()
} catch (e) {
    console.error("Failed to load the Schedule widget. Error: "+e)
}
