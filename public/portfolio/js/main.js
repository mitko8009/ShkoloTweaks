function navEffect(add = false) { // Navbar Effect Function
    $(".navbar-content").animate({backgroundColor: "rgb(110, 110, 110)"}, 20).delay(200).animate({backgroundColor: "rgb(40, 42, 43)"}, 20);

    add ?
    $(".navbar-content").animate({width: $(".navbar-content").width() + $(".nav-link").eq(1).width() + 26}, 300):
    $(".navbar-content").animate({width: $(".navbar-content").width() - $(".nav-link").eq(1).width() - 26}, 300);
}

function setOnFocus(elementId) { // Window Focus Function
    for (let i = 0; i < $(".window").length; i++) {
        $(".window").eq(i).css("z-index", 7 - i);
    }

    $("#" + elementId).css("z-index", 8);
}

function openWindow(id) { // Open Window Function
    navEffect(false);
    setOnFocus("win_" + id);

    $("#nav_"+id).animate({opacity: 0}, 200, function() { $(this).hide(); });
    $("#win_"+id).css({opacity: 0}).show().animate({opacity: 1}, 200);
}

function closeWindow(id) { // Close Window Function
    navEffect(true);

    $("#win_"+id).animate({opacity: 0}, 300, function() {
        $(this).hide();
        $("#nav_"+id).css("opacity", 0).show().animate({opacity: 1}, 50);
    });
}

const AddCustomStyle = css => document.head.appendChild(document.createElement("style")).innerHTML = css;
const AddCustomScript = js => document.body.appendChild(document.createElement("script")).innerHTML = js;

$(document).ready(() => {
    $(".window").draggable({
        handle: ".winHeader",
        containment: ".content",
        scroll: false,
        snap: ".content",
        snapMode: "inner",
        cursor: "move",
        stack: ".window",
    }).resizable();

    $(".closeWindowBtn").click(function() { // Close Window Function
        id = $(this).attr("id").split("_")[1];
        closeWindow(id);
    });

    $(".navWin").click(function() { // Open Window Function
        id = $(this).attr("id").split("_")[1];
        openWindow(id);
    });

    $(".winHeader").mousedown(function() { setOnFocus($(this).parent().attr("id")); });

    $(".nav-link").tooltip({
        tooltipClass: "navbar-tooltip",
        position: {my: "center top+14", at: "center bottom"},
    });
});
