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

function sc_fetchAndSave(displayDay) {
    const fetchWithPupilId = () => {
        if (!window.shkolo_pupil_id) {
            setTimeout(fetchWithPupilId, 50);
            return;
        }
        
        weekDay = getWeekNumber().toString()
        ajax(`https://app.shkolo.bg/ajax/diary/getScheduleForClass?pupil_id=${window.shkolo_pupil_id}&year=${year.toString().slice(-2)}&week=${weekDay}`, 'GET', '', function (response) {
            const parser = new DOMParser();
            response = parser.parseFromString(response, 'text/html');
            response = response.getElementsByClassName('scheduleTable')[0];

            scheduleWidgetContent.innerHTML = ""
            sc_Data = JSON.parse(sc_saveLocaly(response))
            sc_DisplayDay(displayDay, sc_Data)
        });
    };
    
    fetchWithPupilId();
}

function sc_DisplayDay(day, data) {
    dayData = data[day]

    if (!dayData || Object.keys(dayData).length === 0) {
        scheduleWidgetTitle.innerHTML = chrome.i18n.getMessage("Schedule") + " | " + chrome.i18n.getMessage(day)
        scheduleWidgetContent.innerHTML = chrome.i18n.getMessage("NoScheduleData")
        return
    }

    scheduleWidgetTitle.innerHTML = chrome.i18n.getMessage("Schedule") + " | " + chrome.i18n.getMessage(day)

    scheduleWidgetContent.innerHTML = ""

    for (let i = 0; i < Object.keys(dayData).length; i++) {
        if (Object.keys(dayData[i]).length > 0) {
            let indexOffset = 0;

            if (dayData[i][0].includes("<i class=\"fas fa-desktop\"></i>")) indexOffset = 1; // Adjust if class is online

            let classNode = document.createElement("div")
            classNode.classList.add("rounded", "scheduleClass")
            classNode.style = "margin-top: 8px; padding: 10px; font-size: 16px; border: 1px solid var(--primary-fg);"

            let classInfo = document.createElement("div")
            classInfo.classList.add("scheduleClassInfo")

            // Class Title (Ex. "Mathematics", "English", etc.)
            let classTitle = document.createElement("a")
            classTitle.innerHTML = dayData[i][0+indexOffset]
            classTitle.classList.add("scheduleCourse")
            if (dayData[i][0+indexOffset].includes("</i>")) {
                let classTitleDetails = dayData[i][0+indexOffset].split("</i> ")[0] + "</i> "
                classTitle.innerHTML = dayData[i][0+indexOffset].split("</i> ")[1].split("(")[0]

                // Replace book icon with desktop icon for online classes
                if (dayData[i][0].includes("<i class=\"fas fa-desktop\"></i>")) {
                    classTitleDetails = classTitleDetails.replace("<i class=\"icon-book-open\"></i>", "<i class=\"fas fa-desktop\"></i>")
                }

                classTitle.innerHTML = classTitleDetails + classTitle.innerHTML
            }
            classInfo.appendChild(classTitle)

            if (window.syncedSettings.sub_schedule_teacher_name) {
                // Class Teacher (Ex. "Mrs. Raicheva", etc.)
                let classTeacher = document.createElement("span")
                classTeacher.innerHTML = " | " + dayData[i][1+indexOffset]
                classTeacher.classList.add("scheduleSecondary", "secondaryFirst")
                classInfo.appendChild(classTeacher)
            }

            classNode.appendChild(classInfo)

            let rightInfo = document.createElement("span")
            rightInfo.classList.add("pull-right")

            if (window.syncedSettings.sub_schedule_room_number) {
                // Class Room (Ex. "Room 103", "Room 404", etc.)
                let classRoom = document.createElement("span");
                classRoom.innerHTML = dayData[i][2+indexOffset];
                classRoom.style.paddingRight = "12px";
                classRoom.classList.add("scheduleSecondary");
                rightInfo.appendChild(classRoom);
            }

            // Class Time (Ex. "08:00 - 09:00", "09:00 - 10:00", etc.)
            if (dayData[i][3+indexOffset] !== undefined) {
                let classTime = document.createElement("span");
                classTime.innerHTML = dayData[i][3+indexOffset];
                classTime.classList.add("scheduleSecondary");
                rightInfo.appendChild(classTime);
            }

            // Wrap both elements in a flex container
            rightInfo.classList.add("rightInfo");
            classNode.appendChild(rightInfo);
            scheduleWidgetContent.appendChild(classNode);
        }
    }

    // sc_Widget.children[0].style.height=scheduleWidgetContent.offsetHeight+100+"px"
}

function sc_main() {
    if (disablePupilIDFeatures) return // Disable the widget if the Pupil ID features are disabled
    if (sc_Widget === undefined) return

    let day = today.getDay() - 1
    if (day < 0 || day > 4) day = 0
    let weekday = WEEKDAYS[day]

    sc_Widget.className = "col-sm-6"
    sc_Widget.children[0].className = `portlet portlet-sortable light bordered`

    scheduleWidgetTitle = sc_Widget.children[0].children[0].children[0].children[1]
    scheduleWidgetContent = sc_Widget.children[0].children[1]

    // Remove the copied content of the widget
    removeElements(sc_Widget.children[0].children[1].children) // Remove the content of the widget
    removeElements(sc_Widget.children[0].children[0].children[0].children[0].children)
    sc_Widget.children[0].children[0].children[0].children[0].remove()

    scheduleWidgetTitle.innerHTML = chrome.i18n.getMessage("Schedule")
    sc_Widget.children[0].children[0].children[0].appendChild(getIcon("table"))

    scheduleWidgetContent.style.fontSize = "14px"
    scheduleWidgetContent.style.fontWeight = "bold"
    scheduleWidgetContent.style.height = "auto"
    scheduleWidgetContent.style.paddingTop = "0"
    scheduleWidgetContent.style.paddingBottom = "10px"
    scheduleWidgetContent.innerHTML = chrome.i18n.getMessage("Loading")

    let headerButtons = document.createElement("div")
    headerButtons.classList.add("pull-right", "sc_buttons_row", "rounded")

    let scheduleViewMore = document.createElement("a")
    scheduleViewMore.innerHTML = chrome.i18n.getMessage("ViewMore")
    scheduleViewMore.href = "https://app.shkolo.bg/diary#tab_schedule"
    scheduleViewMore.classList.add("pull-right", "widget_buttons", "rounded")
    headerButtons.appendChild(scheduleViewMore)

    // let scheduleRefresh = document.createElement("a")
    // scheduleRefresh.innerHTML = chrome.i18n.getMessage("Refresh")
    // scheduleRefresh.classList.add("pull-right", "widget_buttons", "rounded")
    // scheduleRefresh.onclick = () => {
    //     scheduleWidgetTitle.innerHTML = chrome.i18n.getMessage("Schedule")
    //     scheduleWidgetContent.innerHTML = chrome.i18n.getMessage("FetchSchedule")
    //     sc_fetchAndSave(WEEKDAYS[today.getDay() - 1 > 4 ? 0 : today.getDay() - 1], sc_Widget)
    // }
    // headerButtons.appendChild(scheduleRefresh)

    try {
        sc_fetchAndSave(weekday) // Fetch and save the schedule data
    } catch (e) {
        console.error("Failed to fetch the Schedule data. Error: " + e)
        scheduleWidgetContent.innerHTML = chrome.i18n.getMessage("FailedToFetchSchedule")
    }

    // Next and Previous Day Buttons
    let nextDay = document.createElement("a")
    let rightIcon = document.createElement("i")
    rightIcon.classList.add("fal", "fa-chevron-right")
    nextDay.appendChild(rightIcon)
    nextDay.classList.add("widget_buttons", "pull-right", "rounded")
    nextDay.onclick = () => {
        day += 1
        if (day > 4) day = 0
        sc_DisplayDay(WEEKDAYS[day], sc_Data)
    }
    headerButtons.appendChild(nextDay)

    let previousDay = document.createElement("a")
    let leftIcon = document.createElement("i")
    leftIcon.classList.add("fal", "fa-chevron-left")
    previousDay.appendChild(leftIcon)
    previousDay.classList.add("widget_buttons", "pull-right", "rounded")
    previousDay.onclick = () => {
        day -= 1
        if (day < 0) day = 4
        sc_DisplayDay(WEEKDAYS[day], sc_Data, sc_Widget)
    }
    headerButtons.appendChild(previousDay)

    sc_Widget.children[0].children[0].appendChild(headerButtons)

    sc_Widget.children[0].children[2].remove() // Remove the widget footer
    WIDGETSROW.appendChild(sc_Widget)
}

var disablePupilIDFeatures = false // Disable pupil ID features if there is no pupil ID
chrome.storage.local.get(null, (result) => { // WARNING: This is LOCAL storage, not SYNC
    disablePupilIDFeatures = result.disablePupilIDFeatures
})

try {
    chrome.storage.sync.get(['schedule'], (result) => {
        if (result.schedule === true) {
            sc_main()
        } else {
            sc_Widget.remove()
        }
    })
} catch (e) {
    console.error("Failed to load the Schedule widget. Error: " + e)
}
