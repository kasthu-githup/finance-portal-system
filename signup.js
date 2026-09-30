import {
    signInWithPopup,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import { auth } from "./firebase-config.js";


/* =========================================================
   API
   Local:
   http://localhost:5000/api/signup

   Render:
   /api/signup
========================================================= */

const SIGNUP_API =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/signup"
        : "/api/signup";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const signupForm =
    document.getElementById("signupForm");

const signupBtn =
    document.getElementById("signupBtn");

const googleBtn =
    document.getElementById("googleBtn");

const messageElement =
    document.getElementById("message");


/* =========================================================
   CHECK REQUIRED ELEMENTS
========================================================= */

if (!signupForm) {
    console.error("signupForm not found.");
}

if (!signupBtn) {
    console.error("signupBtn not found.");
}


/* =========================================================
   EMAIL + PASSWORD SIGNUP
========================================================= */

if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const name =
                document
                    .getElementById("name")
                    .value
                    .trim();

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();

            const password =
                document
                    .getElementById("password")
                    .value;

            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    .value;

            const terms =
                document
                    .getElementById("terms")
                    .checked;


            /* -----------------------------------------
               VALIDATION
            ----------------------------------------- */

            if (
                !name ||
                !email ||
                !password ||
                !confirmPassword
            ) {

                showMessage(
                    "Please fill in all required fields.",
                    "error"
                );

                return;
            }


            if (name.length < 2) {

                showMessage(
                    "Please enter your full name.",
                    "error"
                );

                return;
            }


            if (password.length < 6) {

                showMessage(
                    "Password must be at least 6 characters.",
                    "error"
                );

                return;
            }


            if (password !== confirmPassword) {

                showMessage(
                    "Passwords do not match.",
                    "error"
                );

                return;
            }


            if (!terms) {

                showMessage(
                    "Please accept the registration terms.",
                    "error"
                );

                return;
            }


            try {

                signupBtn.disabled = true;

                signupBtn.textContent =
                    "Creating Account...";

                showMessage(
                    "Creating your account...",
                    "info"
                );


                /* -----------------------------------------
                   API REQUEST
                ----------------------------------------- */

                const response =
                    await fetch(
                        SIGNUP_API,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name,
                                email,
                                password
                            })
                        }
                    );


                /* -----------------------------------------
                   SAFE RESPONSE
                ----------------------------------------- */

                let data = {};

                try {

                    data =
                        await response.json();

                } catch {

                    throw new Error(
                        "Server returned an invalid response."
                    );

                }


                /* -----------------------------------------
                   API ERROR
                ----------------------------------------- */

                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Unable to create account."
                    );

                }


                /* -----------------------------------------
                   SUCCESS
                ----------------------------------------- */

                showMessage(
                    "Account created successfully!",
                    "success"
                );


                signupForm.reset();


                /*
                   Redirect to Login
                */

                setTimeout(() => {

                    window.location.href =
                        "login.html";

                }, 1200);


            } catch (error) {

                console.error(
                    "Signup Error:",
                    error
                );


                if (
                    error.name ===
                    "TypeError"
                ) {

                    showMessage(
                        "Unable to connect to the server. Please try again.",
                        "error"
                    );

                } else {

                    showMessage(
                        error.message ||
                        "Signup failed. Please try again.",
                        "error"
                    );

                }


            } finally {

                signupBtn.disabled = false;

                signupBtn.textContent =
                    "Create Account";

            }

        }
    );

}


/* =========================================================
   GOOGLE SIGN-IN
========================================================= */

if (googleBtn) {

    googleBtn.addEventListener(
        "click",
        async () => {

            try {

                googleBtn.disabled = true;

                googleBtn.innerHTML =
                    "Connecting to Google...";


                /* -----------------------------------------
                   GOOGLE PROVIDER
                ----------------------------------------- */

                const provider =
                    new GoogleAuthProvider();


                provider.setCustomParameters({
                    prompt: "select_account"
                });


                /* -----------------------------------------
                   FIREBASE GOOGLE LOGIN
                ----------------------------------------- */

                const result =
                    await signInWithPopup(
                        auth,
                        provider
                    );


                const user =
                    result.user;


                if (!user) {

                    throw new Error(
                        "Google account information was not received."
                    );

                }


                /* -----------------------------------------
                   FIREBASE ID TOKEN
                ----------------------------------------- */

                const firebaseToken =
                    await user.getIdToken(
                        true
                    );


                /* -----------------------------------------
                   SAVE GOOGLE USER
                ----------------------------------------- */

                const googleUser = {

                    id:
                        user.uid,

                    name:
                        user.displayName ||
                        "Google User",

                    email:
                        user.email ||
                        "",

                    role:
                        "Admin",

                    photoURL:
                        user.photoURL ||
                        ""

                };


                localStorage.setItem(
                    "finance_token",
                    firebaseToken
                );


                localStorage.setItem(
                    "finance_user",
                    JSON.stringify(
                        googleUser
                    )
                );


                /* -----------------------------------------
                   CLEAR OLD SESSION
                ----------------------------------------- */

                sessionStorage.removeItem(
                    "finance_token"
                );

                sessionStorage.removeItem(
                    "finance_user"
                );


                showMessage(
                    "Google Sign-In successful. Redirecting...",
                    "success"
                );


                setTimeout(() => {

                    window.location.href =
                        "index.html";

                }, 800);


            } catch (error) {

                console.error(
                    "Google Sign-In Error:",
                    error
                );


                let message =
                    "Google Sign-In failed.";


                switch (error.code) {

                    case "auth/unauthorized-domain":

                        message =
                            "This website domain is not authorized in Firebase.";

                        break;


                    case "auth/popup-closed-by-user":

                        message =
                            "Google Sign-In window was closed.";

                        break;


                    case "auth/popup-blocked":

                        message =
                            "Your browser blocked the Google Sign-In popup.";

                        break;


                    case "auth/operation-not-allowed":

                        message =
                            "Google Sign-In is not enabled in Firebase.";

                        break;


                    case "auth/network-request-failed":

                        message =
                            "Network error. Please check your internet connection.";

                        break;


                    case "auth/account-exists-with-different-credential":

                        message =
                            "An account already exists with this email using another sign-in method.";

                        break;


                    default:

                        if (error.message) {
                            message = error.message;
                        }

                        break;
                }


                showMessage(
                    message,
                    "error"
                );


            } finally {

                googleBtn.disabled = false;

                googleBtn.innerHTML =
                    `
                    <span class="google-icon">G</span>
                    Continue with Google
                    `;

            }

        }
    );

}


/* =========================================================
   MESSAGE FUNCTION
========================================================= */

function showMessage(
    message,
    type = "info"
) {

    if (!messageElement) {
        return;
    }


    messageElement.textContent =
        message;


    messageElement.className =
        `message ${type}`;


    if (type === "success") {

        setTimeout(() => {

            if (
                messageElement.textContent ===
                message
            ) {

                messageElement.textContent =
                    "";

                messageElement.className =
                    "message";

            }

        }, 4000);

    }

}