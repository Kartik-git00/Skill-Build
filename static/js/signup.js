const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


const signupForm =
    document.getElementById("signupForm");

const signupMessage =
    document.getElementById("signupMessage");

const signupButton =
    document.getElementById("signupButton");


const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirmPassword");


const strengthBar =
    document.getElementById("strengthBar");

const strengthText =
    document.getElementById("strengthText");


const confirmPasswordMessage =
    document.getElementById(
        "confirmPasswordMessage"
    );


const passwordToggle =
    document.getElementById("passwordToggle");

const confirmPasswordToggle =
    document.getElementById(
        "confirmPasswordToggle"
    );


/* =========================================================
   PASSWORD VISIBILITY
   ========================================================= */

function togglePasswordVisibility(
    input,
    button
) {

    const isPassword =
        input.type === "password";


    input.type =
        isPassword ? "text" : "password";


    button.textContent =
        isPassword ? "Hide" : "Show";


    button.setAttribute(
        "aria-label",
        isPassword
            ? "Hide password"
            : "Show password"
    );
}


passwordToggle.addEventListener(
    "click",
    () => {

        togglePasswordVisibility(
            passwordInput,
            passwordToggle
        );

    }
);


confirmPasswordToggle.addEventListener(
    "click",
    () => {

        togglePasswordVisibility(
            confirmPasswordInput,
            confirmPasswordToggle
        );

    }
);


/* =========================================================
   PASSWORD STRENGTH
   ========================================================= */

function getPasswordStrength(password) {

    let score = 0;


    if (password.length >= 8) {
        score++;
    }


    if (/[A-Z]/.test(password)) {
        score++;
    }


    if (/[0-9]/.test(password)) {
        score++;
    }


    if (/[^A-Za-z0-9]/.test(password)) {
        score++;
    }


    if (password.length >= 12) {
        score++;
    }


    return score;
}


function updateRequirement(
    elementId,
    condition
) {

    const element =
        document.getElementById(elementId);

    const icon =
        element.querySelector(
            ".requirement-icon"
        );


    if (condition) {

        icon.textContent = "✓";

        element.classList.add("valid");

    } else {

        icon.textContent = "○";

        element.classList.remove("valid");

    }

}


function updatePasswordStrength() {

    const password =
        passwordInput.value;


    const score =
        getPasswordStrength(password);


    updateRequirement(
        "lengthRequirement",
        password.length >= 8
    );


    updateRequirement(
        "uppercaseRequirement",
        /[A-Z]/.test(password)
    );


    updateRequirement(
        "numberRequirement",
        /[0-9]/.test(password)
    );


    updateRequirement(
        "specialRequirement",
        /[^A-Za-z0-9]/.test(password)
    );


    strengthBar.className =
        "strength-bar";


    strengthText.className =
        "password-strength-text";


    if (!password) {

        strengthText.textContent =
            "Password strength";

        return;
    }


    if (score <= 2) {

        strengthBar.classList.add(
            "weak"
        );

        strengthText.classList.add(
            "weak-text"
        );

        strengthText.textContent =
            "Weak password";

    } else if (score <= 4) {

        strengthBar.classList.add(
            "average"
        );

        strengthText.classList.add(
            "average-text"
        );

        strengthText.textContent =
            "Average password";

    } else {

        strengthBar.classList.add(
            "strong"
        );

        strengthText.classList.add(
            "strong-text"
        );

        strengthText.textContent =
            "Strong password";

    }

}


passwordInput.addEventListener(
    "input",
    updatePasswordStrength
);


/* =========================================================
   PASSWORD MATCHING
   ========================================================= */

function checkPasswordMatch() {

    const password =
        passwordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;


    if (!confirmPassword) {

        confirmPasswordMessage.textContent =
            "";

        confirmPasswordMessage.className =
            "field-message";

        return false;
    }


    if (password === confirmPassword) {

        confirmPasswordMessage.textContent =
            "✓ Passwords match";

        confirmPasswordMessage.className =
            "field-message match";

        return true;
    }


    confirmPasswordMessage.textContent =
        "Passwords do not match";

    confirmPasswordMessage.className =
        "field-message no-match";

    return false;
}


passwordInput.addEventListener(
    "input",
    () => {

        if (confirmPasswordInput.value) {
            checkPasswordMatch();
        }

    }
);


confirmPasswordInput.addEventListener(
    "input",
    checkPasswordMatch
);


/* =========================================================
   FORM VALIDATION
   ========================================================= */

function validateSignupForm() {

    const name =
        document.getElementById(
            "name"
        ).value.trim();


    const email =
        document.getElementById(
            "email"
        ).value.trim();


    const password =
        passwordInput.value;


    const confirmPassword =
        confirmPasswordInput.value;


    const nameError =
        document.getElementById(
            "nameError"
        );


    const emailError =
        document.getElementById(
            "emailError"
        );


    nameError.textContent = "";

    emailError.textContent = "";


    let valid = true;


    if (!name) {

        nameError.textContent =
            "Please enter your name.";

        valid = false;

    }


    if (!email) {

        emailError.textContent =
            "Please enter your email.";

        valid = false;

    }


    if (password.length < 8) {

        signupMessage.textContent =
            "Password must contain at least 8 characters.";

        signupMessage.className =
            "auth-message error";

        valid = false;

    }


    if (!checkPasswordMatch()) {

        signupMessage.textContent =
            "Please make sure both passwords match.";

        signupMessage.className =
            "auth-message error";

        valid = false;

    }


    return valid;
}


/* =========================================================
   SIGNUP
   ========================================================= */

signupForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        signupMessage.textContent =
            "";

        signupMessage.className =
            "auth-message";


        if (!validateSignupForm()) {
            return;
        }


        const name =
            document.getElementById(
                "name"
            ).value.trim();


        const email =
            document.getElementById(
                "email"
            ).value.trim();


        const password =
            passwordInput.value;


        try {

            signupButton.disabled = true;

            signupButton.textContent =
                "Creating Account...";


            const { data, error } =
                await supabaseClient.auth.signUp({

                    email: email,

                    password: password,

                    options: {
                        data: {
                            name: name
                        }
                    }

                });


            if (error) {
                throw error;
            }


            /*
                Force the user through the login page.
            */

            await supabaseClient.auth.signOut();


            signupMessage.textContent =
                "Account created successfully. Redirecting to login...";

            signupMessage.className =
                "auth-message success";


            setTimeout(() => {

                window.location.href =
                    "/login";

            }, 1200);

        }

        catch (error) {

            signupMessage.textContent =
                error.message ||
                "Unable to create your account.";

            signupMessage.className =
                "auth-message error";


            signupButton.disabled = false;

            signupButton.textContent =
                "Create Account";


            console.error(
                "Signup error:",
                error
            );

        }

    }
);