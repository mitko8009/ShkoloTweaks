function navBtnEffect(add = false) {
    const GAP = 26;

    $(".navbar-content").animate({backgroundColor: "rgb(110, 110, 110)"}, 20).delay(200).animate({backgroundColor: "rgb(40, 42, 43)"}, 20);

    add ? 
    $(".navbar-content").animate({width: $(".navbar-content").width() + $(".nav-link").eq(1).width() + GAP}, 300):
    $(".navbar-content").animate({width: $(".navbar-content").width() - $(".nav-link").eq(1).width() - GAP}, 300);
}

function setOnFocus(elementId) {
    for (let i = 0; i < $(".window").length; i++) {
        $(".window").eq(i).css("z-index", 7 - i);
    }

    $("#" + elementId).css("z-index", 8);
}

function closeWindow(elementId) {
    navBtnEffect(true);

    $("#win_" + elementId).animate({opacity: 0}, 300, () => {
        $("#win_" + elementId).hide();
        $("#nav_" + elementId).css("opacity", 0).show().animate({opacity: 1}, 50);
    });
}

function openWindow(elementId) {
    navBtnEffect(false);
    setOnFocus("win_" + elementId);

    $("#nav_" + elementId).animate({opacity: 0}, 200, () => {
        $("#nav_" + elementId).hide();
    });

    $("#win_" + elementId).css({opacity: 0}).show().animate({opacity: 1}, 200);
}

$(document).ready(() => {
    $(".draggable").draggable({
        handle: ".winHeader",
        containment: ".content",
        scroll: false,
        snap: ".content",
        snapMode: "inner",
        cursor: "move",
        stack: ".window",
    }).resizable();

    // Portfolio
    $("#win_portfolio_close").click(() => { closeWindow("portfolio"); });
    $("#nav_portfolio").click(() => { openWindow("portfolio"); });

    // Projects
    $("#win_projects_close").click(() => { closeWindow("projects"); });
    $("#nav_projects").click(() => { openWindow("projects"); });

    // Awards
    $("#win_awards_close").click(() => { closeWindow("awards"); });
    $("#nav_awards").click(() => { openWindow("awards"); });

    // Shkolo Tweaks
    $("#win_ShTw_close").click(() => { closeWindow("ShTw"); });
    $("#nav_ShTw").click(() => { openWindow("ShTw"); });
    

    $(".nav-link").tooltip({
        tooltipClass: "navbar-tooltip",
        position: {my: "center top+14", at: "center bottom"},
    });
});