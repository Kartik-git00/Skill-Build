const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


const userNameElement =
    document.getElementById(
        "userName"
    );


const welcomeNameElement =
    document.getElementById(
        "welcomeName"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


/* =========================================================
   SHOW DASHBOARD
   ========================================================= */

function showDashboard() {

    document.body.classList.remove(
        "dashboard-loading"
    );

    document.body.classList.add(
        "dashboard-ready"
    );

}


/* =========================================================
   REDIRECT TO LOGIN
   ========================================================= */

function redirectToLogin() {

    window.location.replace(
        "/login"
    );

}


/* =========================================================
   CHECK AUTHENTICATION
   ========================================================= */

async function loadDashboard() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();


        if (error) {
            throw error;
        }


        const user =
            data.user;


        if (!user) {

            redirectToLogin();

            return;
        }


        const metadata =
            user.user_metadata || {};


        const name =
            metadata.name ||
            user.email ||
            "Learner";


        userNameElement.textContent =
            name;


        welcomeNameElement.textContent =
            name;


        /*
            Authentication succeeded.
            Now reveal the dashboard.
        */

        showDashboard();

    }

    catch (error) {

        console.error(
            "Dashboard authentication error:",
            error
        );


        redirectToLogin();

    }

}


/* =========================================================
   LOGOUT
   ========================================================= */

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            logoutButton.disabled = true;

            logoutButton.textContent =
                "Logging out...";


            const {
                error
            } =
                await supabaseClient.auth.signOut();


            if (error) {
                throw error;
            }


            /*
                Go to homepage after logout.
            */

            window.location.replace(
                "/"
            );

        }

        catch (error) {

            console.error(
                "Logout error:",
                error
            );


            logoutButton.disabled = false;

            logoutButton.textContent =
                "Logout";

        }

    }
);


/* =========================================================
   START
   ========================================================= */

loadDashboard();