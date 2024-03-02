const site = window.location.hostname

const AddCustomStyle = css => document.head.appendChild(document.createElement("style")).innerHTML = css

function CreateCustomElement(tag, attr_tag, attr_name, value) {
    const custom_element = document.createElement(tag)
    custom_element.setAttribute(attr_tag, attr_name)
    custom_element.innerHTML = value
    document.body.append(custom_element)
}

// CSS Injection
try {
    document.getElementById("sc-name-lbl").innerHTML = document.getElementById("sc-name-lbl").innerHTML + " | ShkoloTweaks v0.0.2"
    
    //const navMenu = document.getElementsByClassName("nav navbar-nav pull-right") // Get Shkolo's navbar
    //
    //const settings_element = document.createElement("li") // Add Element to navbar
    //settings_element.setAttribute("class", "dropdown")
    //settings_element.setAttribute("id", "settings")
    //settings_element.setAttribute("title", "ShkoloTweaks")
    //navMenu[0].appendChild(settings_element)
    //
    //const settings_button_element = document.createElement("a") // Navbar button
    //settings_button_element.setAttribute("class", "dropdown-toggle")
    //settings_button_element.setAttribute("href", "https://www.instagram.com/mitko8009_/")
    //settings_button_element.setAttribute("id", "settings-button")
    //settings_button_element.innerHTML = "ShkoloTweaks"
    //AddCustomStyle("#settings-button { color: #fff; padding-right: 10px;}")
    //settings_element.appendChild(settings_button_element)
} catch (error) {
    console.log("[ShkoloTweaks]\nNavbar not found!\nNo further actions will be taken.")
}

