(function () {
    chrome.storage.sync.get(['mon_side_navbar'], (result) => {
        const enabled = result.mon_side_navbar ?? false;
        if (!enabled) return;

        const SIDE_NAV_BAR_SELECTOR = "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > nav"
        const NAV_BAR_SELECTOR = "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > div > main > div > ng-component > sb-simple-page-skeleton-template > sb-book > sb-tabs > div > nav"
        const SCHOOL_BUTTON_SELECTOR = "#twroot > sb-root > sb-snackbar-root > sb-student > sb-app-chrome > div > nav > sb-app-menu > div > sb-menu > ul > li > button"

        AddCustomStyle(`
            a:focus-visible, .mat-tab-link:focus {
                color: #fff !important;
                background-color: #8b8b8b73 !important;
                border-radius: 8px !important;
            }
        `)

        // Auto expand School Menu to prevent glitches
        function clickSchoolButton() {
            const schoolButton = document.querySelector(SCHOOL_BUTTON_SELECTOR)
            if (schoolButton) {
                schoolButton.click()
            } else {
                setTimeout(clickSchoolButton, 500)
            }
        }

        clickSchoolButton()

        // Move the Nav bar to the side
        function moveNavBar() {
            const sideNavBar = document.querySelector(SIDE_NAV_BAR_SELECTOR)
            const navBar = document.querySelector(NAV_BAR_SELECTOR)
            if (sideNavBar && navBar) {
                sideNavBar.appendChild(navBar)
                removeElements(document.querySelectorAll(NAV_BAR_SELECTOR))
            } else {
                setTimeout(moveNavBar, 50)
            }
        }

        moveNavBar();
    });
})();