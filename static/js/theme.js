/* =========================================================
   SKILL-BUILD THEME MANAGER
   Light / Dark Mode
   Compatible with existing button IDs
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIG
       ===================================================== */

    const STORAGE_KEY = "skillBuildTheme";


    const LIGHT = "light";
    const DARK = "dark";


    /* =====================================================
       GET SAVED THEME
       ===================================================== */

    function getSavedTheme() {

        try {

            const savedTheme =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (
                savedTheme === LIGHT ||
                savedTheme === DARK
            ) {

                return savedTheme;

            }

        }

        catch (error) {

            console.warn(
                "Could not read saved theme:",
                error
            );

        }


        return LIGHT;
    }


    /* =====================================================
       APPLY THEME
       ===================================================== */

    function applyTheme(theme) {

        if (
            theme !== LIGHT &&
            theme !== DARK
        ) {

            theme = LIGHT;

        }


        /*
            Main theme switch.

            Our CSS uses:

            html[data-theme="dark"]
        */

        document.documentElement.setAttribute(
            "data-theme",
            theme
        );


        /*
            Tell browser the page is light/dark.
        */

        document.documentElement.style.colorScheme =
            theme;


        /*
            Save preference.
        */

        try {

            localStorage.setItem(
                STORAGE_KEY,
                theme
            );

        }

        catch (error) {

            console.warn(
                "Could not save theme:",
                error
            );

        }


        updateThemeButtons(
            theme
        );

    }


    /* =====================================================
       FIND BUTTON THEME
       Works with BOTH:
       - data-theme
       - existing IDs
       ===================================================== */

    function getButtonTheme(button) {

        /*
            First preference:
            data-theme
        */

        const dataTheme =
            button.getAttribute(
                "data-theme"
            );


        if (
            dataTheme === LIGHT ||
            dataTheme === DARK
        ) {

            return dataTheme;

        }


        /*
            Existing Skill-Build button IDs.
        */

        const id =
            button.id;


        if (
            id === "lightThemeButton" ||
            id === "mobileLightThemeButton"
        ) {

            return LIGHT;

        }


        if (
            id === "darkThemeButton" ||
            id === "mobileDarkThemeButton"
        ) {

            return DARK;

        }


        return null;

    }


    /* =====================================================
       UPDATE BUTTONS
       ===================================================== */

    function updateThemeButtons(theme) {

        const buttons =
            document.querySelectorAll(
                ".theme-button"
            );


        buttons.forEach((button) => {

            const buttonTheme =
                getButtonTheme(button);


            button.classList.toggle(
                "active",
                buttonTheme === theme
            );


            /*
                Accessibility state
            */

            if (buttonTheme) {

                button.setAttribute(
                    "aria-pressed",
                    buttonTheme === theme
                        ? "true"
                        : "false"
                );

            }

        });

    }


    /* =====================================================
       HANDLE THEME BUTTON CLICK
       ===================================================== */

    function handleThemeClick(button) {

        const requestedTheme =
            getButtonTheme(button);


        if (!requestedTheme) {

            console.warn(
                "Theme button has no recognised theme:",
                button
            );

            return;

        }


        applyTheme(
            requestedTheme
        );

    }


    /* =====================================================
       GLOBAL CLICK HANDLER
       ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const target =
                event.target;


            /*
                Find the nearest theme button.
            */

            const button =
                target.closest(
                    ".theme-button"
                );


            if (!button) {
                return;
            }


            handleThemeClick(
                button
            );

        }
    );


    /* =====================================================
       INITIALISE
       ===================================================== */

    function initialise() {

        const savedTheme =
            getSavedTheme();


        applyTheme(
            savedTheme
        );

    }


    /*
        If DOM is already available,
        initialise immediately.

        Otherwise wait for it.
    */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialise,
            {
                once: true
            }
        );

    }

    else {

        initialise();

    }


    /* =====================================================
       SYNCHRONISE MULTIPLE TABS
       ===================================================== */

    window.addEventListener(
        "storage",
        function (event) {

            if (
                event.key !== STORAGE_KEY
            ) {

                return;

            }


            const newTheme =
                event.newValue;


            if (
                newTheme === LIGHT ||
                newTheme === DARK
            ) {

                document.documentElement.setAttribute(
                    "data-theme",
                    newTheme
                );


                document.documentElement.style
                    .colorScheme = newTheme;


                updateThemeButtons(
                    newTheme
                );

            }

        }
    );


})();