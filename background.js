chrome.runtime.onMessage.addListener(data => {
    switch (data.event) {
        case 'onStop':
            console.log("On stop event received!")
            break
        case 'onStart':
            console.log("On start event received!")
            break
        default:
            break
    }
})