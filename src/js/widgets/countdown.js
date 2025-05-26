let countdownWidgetTitle
let countdownWidgetContent

function getDaysUntilEndOfSchool() {
    const june30 = new Date(year, 5, 30)
    if (today > june30) june30.setFullYear(year+1)
        
    let weekdaysCount = 0
    let currentDate = new Date(today)

    while (currentDate <= june30) {
        const dayOfWeek = currentDate.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) weekdaysCount++
        currentDate.setDate(currentDate.getDate()+1)
    }

    return weekdaysCount
}

function fullYear() {
    const sep15 = new Date(year, 8, 15)
    const nextYear = year+1
    const june30 = new Date(nextYear, 5, 30)

    let weekdaysCount = 0
    let currentDate = new Date(sep15)

    while (currentDate <= june30) {
        const dayOfWeek = currentDate.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) weekdaysCount++
        currentDate.setDate(currentDate.getDate()+1)
    }

    return weekdaysCount
}

function cw_main() {
    const cw_Widget = WIDGETSROW.children[0].cloneNode(true)

    if (cw_Widget === undefined) return

    cw_Widget.className=`col-sm-12`
    // cw_Widget.children[0].className=`portlet portlet-sortable light bordered`
    cw_Widget.children[0].className=`portlet portlet-sortable`

    removeElements(cw_Widget.children[0].children[1].children) // Remove the content of the widget
    removeElements(cw_Widget.children[0].children[0].children[0].children[0].children)
    
    countdownWidgetTitle = cw_Widget.children[0].children[0].children[0].children[1]
    countdownWidgetContent = cw_Widget.children[0].children[1]

    cw_Widget.children[0].children[0].children[0].children[0].remove()
    
    const daysUntilEndOfSchool = getDaysUntilEndOfSchool()
    const fullyear = fullYear()
    countdownWidgetTitle.innerHTML = chrome.i18n.getMessage("CountdownTitle").replace("{{DAYS}}", daysUntilEndOfSchool)
    
    countdownWidgetContent.innerHTML = `<progress id="file" value="${fullyear-daysUntilEndOfSchool}" max="${fullyear}"></progress><p style="opacity: .8;">${chrome.i18n.getMessage("CountdownFooter")}<p>`
    countdownWidgetContent.style.fontSize = "14px"
    countdownWidgetContent.style.fontWeight = "bold"
    countdownWidgetContent.style.height = "auto"
    
    // cw_Widget.children[0].children[2].remove()
    WIDGETSROW.appendChild(cw_Widget)
}

try {
    chrome.storage.sync.get(['year_countdown'], (result) => {
        if (result.year_countdown === true) {
            cw_main()
        }
    })
} catch (e) {
    console.error("Failed to load the Countdown widget. Error: "+e)
}