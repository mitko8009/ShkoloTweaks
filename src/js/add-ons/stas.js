// ShkoloTweaks Stas Add-on
// Adds a popup alert system to the dashboard for important messages

// Init STAS (Shkolo Tweaks Alert System)
loadCssFile("css/shkolo/add-ons/stas.css")

// STAS Popup Alert

class STASButton {
    constructor(text, href='', style='') {
        this.text = text;
        this.href = href;
        this.style = style;
    }
}

function openPopup(title, content, buttons) {
    popup_conteiner = document.createElement('div');
    popup_conteiner.id = 'popup_conteiner';
    popup_conteiner.classList.add("stas", "popup");
    
    popup_exit = document.createElement('div');
    popup_exit.id = 'popup_exit';
    popup_exit.classList.add("stas", "popup-exit");
    popup_exit.addEventListener('click', function() { $('#popup_conteiner').animate({opacity: 0}, 100, function() { $('#popup_conteiner').remove();});});
    popup_conteiner.appendChild(popup_exit);
    
    popup_box = document.createElement('div');
    popup_box.id = 'popup_box';
    popup_box.classList.add("stas", "popup-box", "rounded");
    popup_conteiner.appendChild(popup_box);

    popup_title = document.createElement('div');
    popup_title.id = 'popup_title';
    popup_title.classList.add("stas", "popup-title");
        popup_title_text = document.createElement('h1');
        popup_title_text.innerHTML = title;
        popup_title.appendChild(popup_title_text);
    popup_box.appendChild(popup_title);

    popup_content = document.createElement('div');
    popup_content.id = 'popup_content';
    popup_content.classList.add("stas", "popup-content");
    popup_content.innerHTML = content;
    popup_box.appendChild(popup_content);

    popup_buttons = document.createElement('div');
    popup_buttons.id = 'popup_buttons';
    popup_buttons.classList.add("stas", "popup-buttons");
    for (let i = 0; i < buttons.length; i++) {
        button = document.createElement('a');
        button.classList.add("stas", "popup-button", "rounded");
        button.innerHTML = buttons[i].text;
        button.href = buttons[i].href;
        button.style = buttons[i].style;
        popup_buttons.appendChild(button);
    }
    popup_box.appendChild(popup_buttons);
    
    document.body.appendChild(popup_conteiner);
    $("#popup_conteiner").css({opacity: 0}).animate({opacity: 1}, 250);
}

// STAS Callbacks

// if (pageurl.includes('dashboard')) {
//     openPopup('STAS (Shkolo Tweaks Alert System) - Testing',
// `
// ${manifest.name} - Name <br>
// ${version} - Version <br>
// ${pageurl} - Dashboard <br>
// `,
// [
//     new STASButton('Read More', `${pageurl}`),
//     new STASButton('See All Messages', 'https://app.shkolo.bg/messages')
// ]);
// }

