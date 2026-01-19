const manifest = chrome.runtime.getManifest()
const version = manifest.version_name || manifest.version
const pageurl = window.location.href

// Define jQuery
let script = document.createElement("script")
script.src = chrome.runtime.getURL("lib/jquery.min.js")
script.type = "text/javascript" 
document.getElementsByTagName("head")[0].appendChild(script)
