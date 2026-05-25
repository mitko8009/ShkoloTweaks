const manifest = chrome.runtime.getManifest()
const version = manifest.version_name || manifest.version
let defaultsSchema = {};
let settingSchema = {}; 

$("#version").text("v" + version)

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