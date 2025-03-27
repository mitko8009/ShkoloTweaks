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
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            callback(xhr.responseText);
        }
    }
    xhr.send(data);
}

function getWeekNumber(date = new Date()) {
    let startOfYear = new Date(date.getFullYear(), 0, 1);
    let pastDays = (date - startOfYear) / (1000 * 60 * 60 * 24);
    return Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
}
