chrome.runtime.onMessage.addListener(data => {
    const {event, prefs} = data
    switch (event) {
        case 'onStart':
            handleSave(prefs);
            break
        default:
            break
    }
})


const handleSave = (prefs) => {
    chrome.storage.local.set(prefs)
    console.log("Saved", prefs)
    chrome.runtime.sendMessage({ event: "UPDATE_POPUP"})
}