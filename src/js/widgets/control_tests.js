let ctWidgetTitle
let ctWidgetContent

const ct_Widget = WIDGETSROW.children[0].cloneNode(true)
let ct_Data = {}

function ct_parseData(data) {
    let parsedData = {}

    // Check if data there is any data
    if (!data || !data.children || data.children.length === 0 || data.children[0].children[0].children.length === 0) {
        return JSON.stringify(parsedData) // Return empty object
    }

    for (let j = 0; j < data.children.length; j++) { // Tests
        parsedData[j] = {}
        parsedData[j]["title"] = data.children[j].children[0].children[0].innerHTML
        parsedData[j]['url'] = data.children[j].children[0].children[0].href
        let date = data.children[j].children[1].innerHTML
        let [datePart, timePart] = date.split(" ")
        let [_day, _month, _year] = datePart.split(".").map(Number);
        let [hours, minutes] = timePart.split(":").map(Number);
        date = new Date(_year, _month - 1, _day, hours, minutes)
        date = Math.floor(date.getTime() / 1000); // Get Unix timestamp (in seconds)
        parsedData[j]['date'] = date
    }

    parsedData = JSON.stringify(parsedData)
    return parsedData
}

function ct_getData() {
    ajax(`https://app.shkolo.bg/ajax/diary/getControlTests?pupil_id=${pupil_id}`, 'GET', '', function (response) {
        const parser = new DOMParser()
        response = parser.parseFromString(response, 'text/html')
        response = response.getElementsByClassName('controlTestBody')[0].children[1].children[1]

        ctWidgetContent.innerHTML = ""
        ct_Data = JSON.parse(ct_parseData(response))
        ct_DisplayData(ct_Data)
    })
}

function ct_DisplayData(data) {
    ctWidgetContent.innerHTML = ""

    if (Object.keys(data).length === 0) {
        ctWidgetContent.innerHTML = chrome.i18n.getMessage("NoUpcomingTests")
        return
    }

    const maxItems = 5; // Limit the number of items displayed
    let itemCount = 0;

    const currentTime = Math.floor(Date.now() / 1000); // Current time in Unix timestamp

    // Sort the data by date in ascending order (soonest first)
    let sortedData = Object.values(data).sort((a, b) => a.date - b.date);
    for (let i = 0; i < sortedData.length; i++) {
        if (itemCount >= maxItems) break; // Stop if the limit is reached

        if (Object.keys(sortedData[i]).length > 0) {
            let testDateTimestamp = sortedData[i]['date'];
            if (testDateTimestamp > currentTime) { // Only show upcoming tests
                let testNode = document.createElement("div");
                testNode.classList.add("rounded", "controlTest");
                testNode.style = "margin-top: 8px; padding: 10px; font-size: 16px; border: 1px solid var(--primary-fg);";

                let testTitle = document.createElement("a");
                testTitle.innerHTML = sortedData[i]['title'];
                testTitle.href = sortedData[i]['url'];
                testTitle.target = "_blank";
                testNode.appendChild(testTitle);

                let testDate = document.createElement("div");
                let date = new Date(testDateTimestamp * 1000);
                let daysLeft = Math.ceil((testDateTimestamp - currentTime) / (60 * 60 * 24)); // Calculate days left
                let formattedDate = date.toLocaleString('en-GB', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }).replace(',', '');
                testDate.innerHTML = `${formattedDate} (${daysLeft} DAYS LEFT)`;

                // Change color if the test is sooner than 2 weeks
                if (daysLeft <= 14) {
                    testDate.style.color = "#ffc204";
                } else {
                    testDate.style.color = "#888";
                }

                testDate.style.fontSize = "12px";
                testNode.appendChild(testDate);

                ctWidgetContent.appendChild(testNode);
                itemCount++; // Increment the item count
            }
        }
    }
}

function ct_main() {
    if (disablePupilIDFeatures) return // Disable the widget if the Pupil ID features are disabled
    if (ct_Widget === undefined) return

    ct_Widget.className = `col-sm-6`
    ct_Widget.children[0].className = `portlet portlet-sortable light bordered`

    ctWidgetTitle = ct_Widget.children[0].children[0].children[0].children[1]
    ctWidgetContent = ct_Widget.children[0].children[1]

    // Remove the copied content of the widget
    removeElements(ct_Widget.children[0].children[1].children)
    removeElements(ct_Widget.children[0].children[0].children[0].children[0].children)
    ct_Widget.children[0].children[0].children[0].children[0].remove() // Remove the icon

    ctWidgetTitle.innerHTML = chrome.i18n.getMessage("ControlTestsTitle")
    ct_Widget.children[0].children[0].children[0].appendChild(getIcon("file-signature"))

    ctWidgetContent.style.fontSize = "14px"
    ctWidgetContent.style.fontWeight = "bold"
    ctWidgetContent.style.padding = "10px"
    ctWidgetContent.innerHTML = chrome.i18n.getMessage("Loading")

    // Header buttons
    let headerButtons = document.createElement("div")
    headerButtons.classList.add("pull-right", "widget_buttons_row", "rounded")

    let viewMore = document.createElement("a")
    viewMore.innerHTML = chrome.i18n.getMessage("ViewMore")
    viewMore.href = "https://app.shkolo.bg/diary#tab_control_test"
    viewMore.classList.add("pull-right", "widget_buttons", "rounded")
    headerButtons.appendChild(viewMore)

    ct_getData()

    /////////////////////////////////
    // Append the widget to the widgets row
    ct_Widget.children[0].children[2].remove() // Remove the widget footer if cleanUp is disabled
    ct_Widget.children[0].children[0].appendChild(headerButtons)
    WIDGETSROW.appendChild(ct_Widget)
}

var disablePupilIDFeatures = false // Disable pupil ID features if there is no pupil ID
chrome.storage.local.get(null, (result) => { // WARNING: This is LOCAL storage, not SYNC
    disablePupilIDFeatures = result.disablePupilIDFeatures
})

try {
    chrome.storage.sync.get(['control_tests'], (result) => {
        if (result.control_tests === true) {
            ct_main()
        } else {
            ct_Widget.remove()
        }
    })
} catch (e) {
    console.error("Control Tests Widget Error: ", e)
}