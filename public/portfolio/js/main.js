$(document).ready(() => {
    var zIndexOnTop = 7;

    function navBtnEffect(add = false) {
        const GAP = 24;

        $(".navbar-content").animate({backgroundColor: "rgb(110, 110, 110)"}, 20).delay(200).animate({backgroundColor: "rgb(40, 42, 43)"}, 20);
        add ? $(".navbar-content").animate({width: $(".navbar-content").width() + $(".nav-link").eq(1).width() + GAP}) : $(".navbar-content").animate({width: $(".navbar-content").width() - $(".nav-link").eq(1).width() - GAP});
    }

    function setOnFocus(elementId) {
        for (let i = 0; i < $(".window").length; i++) {
            $(".window").eq(i).css("z-index", 7 - i);
        }

        $("#" + elementId).css("z-index", 8);
    }

    $(".draggable").draggable({
        handle: ".winHeader",
        containment: ".content",
        scroll: false,
        snap: ".content",
        snapMode: "inner",
        cursor: "move",
        stack: ".window",
    }).resizable();

    // About
    $("#closeWindowBtn").click(() => {
        navBtnEffect(true);

        $("#pjson").animate({opacity: 0}, 300, () => {
            $("#pjson").hide();
            $("#portfolioHome").css("opacity", 0).show().animate({opacity: 1}, 50);
        });
    });

    $("#portfolioHome").click(() => {
        navBtnEffect(false);
        setOnFocus("pjson");

        $("#portfolioHome").animate({opacity: 0}, 200, () => {
            $("#portfolioHome").hide();
        });

        $("#pjson").css({opacity: 0}).show().animate({opacity: 1}, 200);
    });

    // Projects
    $("#closeWinProjectsBtn").click(() => {
        navBtnEffect(true);

        $("#winProjects").animate({opacity: 0}, 300, () => {
            $("#winProjects").hide();
            $("#projectsIcon").css("opacity", 0).show().animate({opacity: 1}, 50);
        });
    });

    $("#projectsIcon").click(() => {
        navBtnEffect(false);
        setOnFocus("winProjects");

        $("#projectsIcon").animate({opacity: 0}, 200, () => {
            $("#projectsIcon").hide();
        });
        
        $("#winProjects").css({opacity: 0}).show().animate({opacity: 1}, 200);
    });

    // Awards
    $("#closeWinAwardsBtn").click(() => {
        navBtnEffect(true);

        $("#winAwards").animate({opacity: 0}, 300, () => {
            $("#winAwards").hide();
            $("#awardsIcon").css("opacity", 0).show().animate({opacity: 1}, 50);
        });
    });

    $("#awardsIcon").click(() => {
        navBtnEffect(false);
        setOnFocus("winAwards");

        $("#awardsIcon").animate({opacity: 0}, 200, () => {
            $("#awardsIcon").hide();
        });

        $("#winAwards").css({opacity: 0}).show().animate({opacity: 1}, 200);
    });
    

    $(".nav-link").tooltip({
        tooltipClass: "navbar-tooltip",
        position: {my: "center top+13", at: "center bottom"},
    });
});