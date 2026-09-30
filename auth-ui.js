const storedUser =
    localStorage.getItem("finance_user") ||
    sessionStorage.getItem("finance_user");

let currentUser = null;

try {
    currentUser = storedUser
        ? JSON.parse(storedUser)
        : null;
} catch (error) {
    console.error("User data error:", error);
}


document.addEventListener("DOMContentLoaded", () => {

    const userNameElement =
        document.getElementById("userName");

    const userRoleElement =
        document.getElementById("userRole");

    const logoutBtn =
        document.getElementById("logoutBtn");


    if (currentUser) {

        if (userNameElement) {
            userNameElement.textContent =
                currentUser.name || "User";
        }

        if (userRoleElement) {
            userRoleElement.textContent =
                currentUser.role || "Admin";
        }
    }


    if (logoutBtn) {

        logoutBtn.addEventListener("click", () => {

            localStorage.removeItem("finance_token");
            localStorage.removeItem("finance_user");

            sessionStorage.removeItem("finance_token");
            sessionStorage.removeItem("finance_user");

            window.location.href = "login.html";
        });

    }

});