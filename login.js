import {
    signInWithPopup,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import { auth } from "./firebase-config.js";


/* =========================================
   API URL
   Local → localhost backend
   Render → same domain /api
========================================= */

const LOGIN_API =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/login"
        : "/api/login";


/* =========================================
   DOM ELEMENTS
========================================= */

const loginForm =
    document.getElementById("loginForm");

const loginBtn =
    document.getElementById("loginBtn");

const messageElement =
    document.getElementById("message");

const googleBtn =
    document.getElementById("googleBtn");

const rememberMe =
    document.getElementById("rememberMe");


/* =========================================
   EMAIL + PASSWORD LOGIN
========================================= */

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const email =
            document
                .getElementById("email")
                .value
                .trim();

        const password =
            document
                .getElementById("password")
                .value;


        /* -------------------------------
           Validation
        ------------------------------- */

        if (!email || !password) {

            showMessage(
                "Please enter email and password.",
                "error"
            );

            return;
        }


        try {

            loginBtn.disabled = true;

            loginBtn.textContent =
                "Signing in...";


            /* -------------------------------
               API Request
            ------------------------------- */

            const response =
                await fetch(
                    LOGIN_API,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email,
                            password
                        })
                    }
                );


            /* -------------------------------
               Read Response
            ------------------------------- */

            const data =
                await response.json();


            /* -------------------------------
               Login Failed
            ------------------------------- */

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Invalid email or password."
                );

            }


            /* -------------------------------
               Save Login
            ------------------------------- */

            saveLoginData(
                data.token,
                data.user
            );


            /* -------------------------------
               Success
            ------------------------------- */

            showMessage(
                "Login successful. Redirecting...",
                "success"
            );


            setTimeout(() => {

                window.location.href =
                    "index.html";

            }, 700);


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            /* -------------------------------
               Network Error
            ------------------------------- */

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
                    "Unable to login.",
                    "error"
                );

            }


        } finally {

            loginBtn.disabled = false;

            loginBtn.textContent =
                "Sign In";

        }

    }
);


/* =========================================
   GOOGLE SIGN-IN
========================================= */

googleBtn.addEventListener(
    "click",
    async () => {

        try {

            googleBtn.disabled = true;

            googleBtn.textContent =
                "Connecting to Google...";


            /* -------------------------------
               Google Provider
            ------------------------------- */

            const provider =
                new GoogleAuthProvider();


            provider.setCustomParameters({
                prompt: "select_account"
            });


            /* -------------------------------
               Firebase Google Login
            ------------------------------- */

            const result =
                await signInWithPopup(
                    auth,
                    provider
                );


            const user =
                result.user;


            /* -------------------------------
               Firebase Token
            ------------------------------- */

            const firebaseToken =
                await user.getIdToken();


            /* -------------------------------
               Google User Data
            ------------------------------- */

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


            /* -------------------------------
               Save Google Login
            ------------------------------- */

            if (
                rememberMe &&
                rememberMe.checked
            ) {

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


                /* Clear old session */

                sessionStorage.removeItem(
                    "finance_token"
                );

                sessionStorage.removeItem(
                    "finance_user"
                );

            } else {

                sessionStorage.setItem(
                    "finance_token",
                    firebaseToken
                );

                sessionStorage.setItem(
                    "finance_user",
                    JSON.stringify(
                        googleUser
                    )
                );


                /* Clear old local login */

                localStorage.removeItem(
                    "finance_token"
                );

                localStorage.removeItem(
                    "finance_user"
                );

            }


            /* -------------------------------
               Success Message
            ------------------------------- */

            showMessage(
                "Google login successful. Redirecting...",
                "success"
            );


            setTimeout(() => {

                window.location.href =
                    "index.html";

            }, 700);


        } catch (error) {

            console.error(
                "Google Sign-In error:",
                error
            );


            let message =
                "Google Sign-In failed.";


            /* -------------------------------
               Firebase Error Handling
            ------------------------------- */

            switch (error.code) {

                case "auth/popup-closed-by-user":

                    message =
                        "Google Sign-In window was closed.";

                    break;


                case "auth/popup-blocked":

                    message =
                        "Browser blocked the Google Sign-In popup.";

                    break;


                case "auth/operation-not-allowed":

                    message =
                        "Google Sign-In is not enabled in Firebase Authentication.";

                    break;


                case "auth/unauthorized-domain":

                    message =
                        "This website domain is not authorized in Firebase.";

                    break;


                case "auth/invalid-api-key":

                    message =
                        "Firebase API configuration is invalid.";

                    break;


                case "auth/network-request-failed":

                    message =
                        "Network error. Please check your internet connection.";

                    break;


                case "auth/cancelled-popup-request":

                    message =
                        "Another Google Sign-In request is already running.";

                    break;


                default:

                    if (
                        error.message
                    ) {

                        console.error(
                            error.message
                        );

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
                `<span class="google-icon">G</span>
                 Continue with Google`;

        }

    }
);


/* =========================================
   SAVE LOGIN DATA
========================================= */

function saveLoginData(
    token,
    user
) {

    if (
        rememberMe &&
        rememberMe.checked
    ) {

        localStorage.setItem(
            "finance_token",
            token
        );

        localStorage.setItem(
            "finance_user",
            JSON.stringify(user)
        );


        /* Clear old session */

        sessionStorage.removeItem(
            "finance_token"
        );

        sessionStorage.removeItem(
            "finance_user"
        );

    } else {

        sessionStorage.setItem(
            "finance_token",
            token
        );

        sessionStorage.setItem(
            "finance_user",
            JSON.stringify(user)
        );


        /* Clear old local login */

        localStorage.removeItem(
            "finance_token"
        );

        localStorage.removeItem(
            "finance_user"
        );

    }

}


/* =========================================
   SHOW MESSAGE
========================================= */

function showMessage(
    message,
    type
) {

    if (!messageElement) {
        return;
    }


    messageElement.textContent =
        message;


    messageElement.className =
        `message ${type}`;

}