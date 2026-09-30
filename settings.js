const DATABASE_API = "http://localhost:5000/api/test-db";

const messageElement =
    document.getElementById("message");

const databaseStatus =
    document.getElementById("databaseStatus");

const logoutBtn =
    document.getElementById("logoutBtn");

const userNameElement =
    document.getElementById("userName");

const userEmailElement =
    document.getElementById("userEmail");

const userRoleElement =
    document.getElementById("userRole");


/* =========================
   LOAD USER DETAILS
========================= */

function loadUserDetails() {

    const storedUser =
        localStorage.getItem("finance_user") ||
        sessionStorage.getItem("finance_user");

    if (!storedUser) {
        return;
    }

    try {

        const user = JSON.parse(storedUser);

        if (userNameElement) {
            userNameElement.textContent =
                user.name || "User";
        }

        if (userEmailElement) {
            userEmailElement.textContent =
                user.email || "-";
        }

        if (userRoleElement) {
            userRoleElement.textContent =
                user.role || "Admin";
        }

    } catch (error) {

        console.error(
            "User data error:",
            error
        );

    }
}


/* =========================
   DATABASE STATUS
========================= */

async function checkDatabase() {

    try {

        databaseStatus.textContent =
            "Checking...";

        databaseStatus.className =
            "status-badge";


        const response =
            await fetch(DATABASE_API);


        const data =
            await response.json();


        if (
            response.ok &&
            data.success
        ) {

            databaseStatus.textContent =
                "Online";

            databaseStatus.className =
                "status-badge online-badge";

        } else {

            throw new Error(
                "Database connection failed"
            );

        }

    } catch (error) {

        console.error(
            "Database status error:",
            error
        );

        databaseStatus.textContent =
            "Offline";

        databaseStatus.className =
            "status-badge";

        showMessage(
            "Database connection could not be verified.",
            "error"
        );
    }
}


/* =========================
   LOGOUT
========================= */

logoutBtn.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            "finance_token"
        );

        localStorage.removeItem(
            "finance_user"
        );

        sessionStorage.removeItem(
            "finance_token"
        );

        sessionStorage.removeItem(
            "finance_user"
        );

        window.location.href =
            "login.html";

    }
);


/* =========================
   MESSAGE
========================= */

function showMessage(
    message,
    type
) {

    messageElement.textContent =
        message;

    messageElement.className =
        `message ${type}`;

}


/* =========================
   INITIALIZE
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadUserDetails();

        checkDatabase();

    }
);