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