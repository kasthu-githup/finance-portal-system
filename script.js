/* =========================================
   FINANCE MANAGEMENT PORTAL
   DASHBOARD
========================================= */


/* =========================================
   API BASE URL
========================================= */

// Local backend server
const API_BASE = "http://localhost:5000/api";

const DASHBOARD_API = `${API_BASE}/dashboard`;


/* =========================================
   LOAD DASHBOARD
========================================= */

async function loadDashboard() {

    try {

        console.log("=================================");
        console.log("Loading Finance Dashboard...");
        console.log("API URL:", DASHBOARD_API);
        console.log("=================================");


        const response = await fetch(
            `${DASHBOARD_API}?t=${Date.now()}`,
            {
                method: "GET",
                cache: "no-store",
                headers: {
                    "Accept": "application/json"
                }
            }
        );


        console.log(
            "Dashboard HTTP Status:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                `Server returned HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "Dashboard API Response:",
            data
        );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Dashboard loading failed"
            );

        }


        const dashboard =
            data.dashboard || {};


        console.log(
            "LIVE DASHBOARD DATA:",
            dashboard
        );


        /* =========================================
           GET VALUES
        ========================================= */

        const totalIncome =
            Number(
                dashboard.totalIncome || 0
            );


        const totalExpense =
            Number(
                dashboard.totalExpense || 0
            );


        const netProfit =
            totalIncome - totalExpense;


        const totalCustomers =
            Number(
                dashboard.totalCustomers || 0
            );


        const totalInvoices =
            Number(
                dashboard.totalInvoices || 0
            );


        const totalPayments =
            Number(
                dashboard.totalPayments || 0
            );


        /* =========================================
           MAIN DASHBOARD CARDS
        ========================================= */

        const incomeElement =
            document.getElementById(
                "totalIncome"
            );


        const expenseElement =
            document.getElementById(
                "totalExpense"
            );


        const profitElement =
            document.getElementById(
                "netProfit"
            );


        const customersElement =
            document.getElementById(
                "totalCustomers"
            );


        const invoicesElement =
            document.getElementById(
                "totalInvoices"
            );


        const paymentsElement =
            document.getElementById(
                "totalPayments"
            );


        if (incomeElement) {

            incomeElement.textContent =
                formatCurrency(
                    totalIncome
                );

        }


        if (expenseElement) {

            expenseElement.textContent =
                formatCurrency(
                    totalExpense
                );

        }


        if (profitElement) {

            profitElement.textContent =
                formatCurrency(
                    netProfit
                );

        }


        if (customersElement) {

            customersElement.textContent =
                totalCustomers;

        }


        if (invoicesElement) {

            invoicesElement.textContent =
                totalInvoices;

        }


        if (paymentsElement) {

            paymentsElement.textContent =
                formatCurrency(
                    totalPayments
                );

        }


        /* =========================================
           BALANCE
        ========================================= */

        const balanceElement =
            document.getElementById(
                "balanceAmount"
            );


        if (balanceElement) {

            balanceElement.textContent =
                formatNumber(
                    netProfit
                );


            balanceElement.style.color =
                netProfit < 0
                    ? "#dc2626"
                    : "#15803d";

        }


        /* =========================================
           NET PROFIT CARD
        ========================================= */

        const netProfitCard =
            document.getElementById(
                "netProfitCard"
            );


        if (netProfitCard) {

            netProfitCard.textContent =
                formatCurrency(
                    netProfit
                );


            netProfitCard.style.color =
                netProfit < 0
                    ? "#dc2626"
                    : "#15803d";

        }


        /* =========================================
           PAYMENTS CARD
        ========================================= */

        const paymentsCard =
            document.getElementById(
                "paymentsCard"
            );


        if (paymentsCard) {

            paymentsCard.textContent =
                formatCurrency(
                    totalPayments
                );

        }


        /* =========================================
           PROFIT STATUS
        ========================================= */

        const profitStatus =
            document.getElementById(
                "profitStatus"
            );


        if (profitStatus) {

            if (netProfit > 0) {

                profitStatus.textContent =
                    "PROFIT";


                profitStatus.style.color =
                    "#15803d";

            }

            else if (netProfit < 0) {

                profitStatus.textContent =
                    "LOSS";


                profitStatus.style.color =
                    "#dc2626";

            }

            else {

                profitStatus.textContent =
                    "BREAK EVEN";


                profitStatus.style.color =
                    "#6b7280";

            }

        }


        /* =========================================
           PROFIT PROGRESS
        ========================================= */

        const profitProgress =
            document.getElementById(
                "profitProgress"
            );


        if (profitProgress) {

            let percentage = 0;


            if (totalIncome > 0) {

                percentage =
                    (
                        netProfit /
                        totalIncome
                    ) * 100;

            }


            percentage =
                Math.max(
                    0,
                    Math.min(
                        100,
                        percentage
                    )
                );


            profitProgress.style.width =
                `${percentage}%`;

        }


        /* =========================================
           PAYMENT STATUS
        ========================================= */

        const paymentStatus =
            document.getElementById(
                "paymentStatus"
            );


        if (paymentStatus) {

            paymentStatus.textContent =
                totalPayments > 0
                    ? "PAYMENTS RECEIVED"
                    : "NO PAYMENTS";


            paymentStatus.style.color =
                totalPayments > 0
                    ? "#15803d"
                    : "#6b7280";

        }


        /* =========================================
           PAYMENT PROGRESS
        ========================================= */

        const paymentProgress =
            document.getElementById(
                "paymentProgress"
            );


        if (paymentProgress) {

            const percentage =
                totalPayments > 0
                    ? 100
                    : 0;


            paymentProgress.style.width =
                `${percentage}%`;

        }


        /* =========================================
           FINANCIAL SUMMARY
        ========================================= */

        const summaryText =
            document.getElementById(
                "summaryText"
            );


        if (summaryText) {

            summaryText.textContent =
                `${formatCurrency(
                    netProfit
                )} ${
                    netProfit < 0
                        ? "net loss"
                        : "net profit"
                }`;


            summaryText.style.color =
                netProfit < 0
                    ? "#dc2626"
                    : "#15803d";

        }


        /* =========================================
           ACCOUNT HOLDER
        ========================================= */

        const storedUser =
            localStorage.getItem(
                "finance_user"
            ) ||
            sessionStorage.getItem(
                "finance_user"
            );


        const accountHolder =
            document.getElementById(
                "accountHolder"
            );


        if (
            storedUser &&
            accountHolder
        ) {

            try {

                const user =
                    JSON.parse(
                        storedUser
                    );


                accountHolder.textContent =
                    user.name ||
                    user.email ||
                    "Finance Admin";

            }

            catch (error) {

                console.error(
                    "User data error:",
                    error
                );

            }

        }


        /* =========================================
           SUCCESS MESSAGE
        ========================================= */

        console.log(
            "================================="
        );

        console.log(
            "Dashboard loaded successfully"
        );

        console.log(
            "Income:",
            totalIncome
        );

        console.log(
            "Expense:",
            totalExpense
        );

        console.log(
            "Net Profit:",
            netProfit
        );

        console.log(
            "Customers:",
            totalCustomers
        );

        console.log(
            "Invoices:",
            totalInvoices
        );

        console.log(
            "Payments:",
            totalPayments
        );

        console.log(
            "================================="
        );

    }

    catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "DASHBOARD ERROR"
        );

        console.error(
            error
        );

        console.error(
            "API URL:",
            DASHBOARD_API
        );

        console.error(
            "Make sure server.js is running on port 5000."
        );

        console.error(
            "================================="
        );

    }

}


/* =========================================
   CURRENCY FORMAT
========================================= */

function formatCurrency(value) {

    const number =
        Number(value || 0);


    if (number < 0) {

        return `-₹${Math.abs(
            number
        ).toLocaleString("en-IN")}`;

    }


    return `₹${number.toLocaleString(
        "en-IN"
    )}`;

}


/* =========================================
   NUMBER FORMAT
========================================= */

function formatNumber(value) {

    const number =
        Number(value || 0);


    if (number < 0) {

        return `-${Math.abs(
            number
        ).toLocaleString("en-IN")}`;

    }


    return number.toLocaleString(
        "en-IN"
    );

}


/* =========================================
   START DASHBOARD
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Finance Dashboard initialized"
        );

        loadDashboard();

    }
);