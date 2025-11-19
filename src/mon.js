// Define jQuery
let script = document.createElement("script")
script.src = chrome.runtime.getURL("lib/jquery.min.js")
script.type = "text/javascript" 
document.getElementsByTagName("head")[0].appendChild(script)

function CleanUp() {
    // moveElementWithRecursion(
    //     "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > div > main > ng-component > sb-simple-page-skeleton-template > sb-book > sb-tabs > div > nav",
    //     "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > nav",
    //     "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > nav > nav"
    // )

    // moveElementWithRecursion(
    //     "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > nav > sb-app-menu",
    //     "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > header > div",
    //     "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > header > div > sb-app-menu"
    // )

    // $("#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > nav > sb-app-menu").remove()
    
    // moveElementWithRecursion(
    //     "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > header > div > sb-app-menu > div > sb-menu > ul > li > sb-menu",
    //     "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > nav",
    //     "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > nav > sb-menu"
    // )
}

function main() {
    CleanUp()
}

main()