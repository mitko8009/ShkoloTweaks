$(document).ready(() => {
    const consoleInput = document.querySelector(".console-input");
    const consoleHistory = $(".console-history");

    var once = false;
    $("#terminalBtn").click(() => {
        if (once) return;
        navEffect(true);
        $("#nav_terminal").css("opacity", 0).show().animate({opacity: 1}, 50);
        once = true;
    });

    function addResult(inputAsStr, output) {
        const outputAsStr = output instanceof Error ? output.toString() : JSON.stringify(output);
        const inputLogElement = document.createElement("div");
        const outputLogElement = document.createElement("div");

        inputLogElement.classList.add("console-input-log")
        outputLogElement.classList.add("console-output-log")

        inputLogElement.textContent = `> ${inputAsStr}`;
        outputLogElement.textContent = outputAsStr;

        consoleHistory.append(inputLogElement, outputLogElement);
    }

    consoleInput.addEventListener("keyup", e => {
        if ($("#win_console").is(":hidden")) return;
        
        const code = consoleInput.value.trim();

        if (e.key === "ArrowUp") {
            try { consoleInput.value = document.getElementsByClassName("console-input-log")[document.getElementsByClassName("console-input-log").length - 1].innerText.slice(2); } catch (err) { return; }
        }

        if (code.length === 0) return;

        if (e.key === "Enter") {
            try {
                if (code === "clear") consoleHistory.children().remove();
                else if (code == "help") addResult(code, "Commands: clear, openWindow(id), closeWindow(id), ids");
                else if (code == "ids") addResult(code, "Available Window IDs: ShTw, terminal, projects, awards, portfolio")
                else if (code == "mihad") addResult(code, "Mihad is guilty.");
                else if (code == "CBFX") window.open("//store.steampowered.com/app/670510/ColorBlend_FX_Desaturation/");
                else addResult(code, eval(code));
            } catch (err) {
                addResult(code, err.toString());
            }

            consoleInput.value = "";
            consoleHistory.scrollTop = consoleHistory.scrollHeight;
        }
    });
});