const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");

const loginButton =
    document.getElementById("loginButton");


const passwordInput =
    document.getElementById("password");

const passwordToggle =
    document.getElementById(
        "passwordToggle"
    );


/* =========================================================
   PASSWORD VISIBILITY
   ========================================================= */

passwordToggle.addEventListener(
    "click",
    () => {

        const isPassword =
            passwordInput.type === "password";


        passwordInput.type =
            isPassword
                ? "text"
                : "password";


        passwordToggle.textContent =
            isPassword
                ? "Hide"
                : "Show";

    }
);


/* =========================================================
   LOGIN
   ========================================================= */

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        loginMessage.textContent =
            "";

        loginMessage.className =
            "auth-message";


        const email =
            document.getElementById(
                "email"
            ).value.trim();


        const password =
            passwordInput.value;


        if (!email || !password) {

            loginMessage.textContent =
                "Please enter your email and password.";

            loginMessage.classList.add(
                "error"
            );

            return;
        }


        try {

            loginButton.disabled = true;

            loginButton.textContent =
                "Logging in...";


            const { data, error } =
                await supabaseClient.auth.signInWithPassword({

                    email: email,

                    password: password

                });


            if (error) {
                throw error;
            }


            loginMessage.textContent =
                "Login successful. Redirecting...";

            loginMessage.classList.add(
                "success"
            );


            console.log(
                "Login successful:",
                data
            );


            setTimeout(() => {

                window.location.href =
                    "/dashboard";

            }, 700);

        }

        catch (error) {

            loginMessage.textContent =
                error.message ||
                "Unable to login.";

            loginMessage.classList.add(
                "error"
            );


            loginButton.disabled = false;

            loginButton.textContent =
                "Login";


            console.error(
                "Login error:",
                error
            );

        }

    }
);