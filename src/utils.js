// Utility functions for the extension
// Author: mitko8009

const AddCustomStyle = css => document.head.appendChild(document.createElement("style")).innerHTML = css

loadCssFile = (fileName) => fetch(chrome.runtime.getURL(fileName)).then(response => response.text()).then(data => AddCustomStyle(data))

function moveElementWithRecursion(element, target, checkElement) {
    try {
        setTimeout(() => {
            const targetEl = $(target)
            targetEl.append($(element))
            if ($(checkElement).length <= 0) {
                moveElementWithRecursion(element, target, checkElement)
                return
            }
        }, 100)
    } catch {
        moveElementWithRecursion(element, target, checkElement)
    }
}

ajax = function(url, method, data, callback) {
    var xhr = new XMLHttpRequest()
    xhr.open(method, url, true)
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            callback(xhr.responseText)
        }
    }
    xhr.send(data)
}

function getWeekNumber(date = new Date()) {
    let startOfYear = new Date(date.getFullYear(), 0, 1)
    let pastDays = (date - startOfYear) / (1000 * 60 * 60 * 24)
    return Math.ceil((pastDays + startOfYear.getDay() + 1) / 7)
}

function isColorLight(hex) {
    hex = hex.replace('#', '')
    if (hex.length === 3) {
        hex = hex.split('').map(x => x + x).join('')
    }
    const r = parseInt(hex.substr(0,2),16)
    const g = parseInt(hex.substr(2,2),16)
    const b = parseInt(hex.substr(4,2),16)

    return (r*0.299 + g*0.587 + b*0.114) > 186
}

function removeElements(elements) {
    Array.from(elements).forEach(function (element) {
        element.remove()
    })
}

function getIcon(subject) {
    let icon = document.createElement("i")
    icon.classList.add("fal", "fa-"+subject.toLowerCase(), "scIcon")
    return icon
}

function convertToUnixTimestamp(dateString) {
    const parts = dateString.split(" ");
    const dateParts = parts[0].split("/");
    const timeParts = parts[1].split(":");

    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Months are zero-based
    const year = parseInt(dateParts[2], 10);
    const hours = timeParts.length > 0 ? parseInt(timeParts[0], 10) : 0
    const minutes = timeParts.length > 1 ? parseInt(timeParts[1], 10) : 0
    const seconds = timeParts.length > 2 ? parseInt(timeParts[2], 10) : 0

    return Math.floor(new Date(year, month, day, hours, minutes, seconds).getTime() / 1000)
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}