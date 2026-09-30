const DASHBOARD_API =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/dashboard"
        : "/api/dashboard";

async function loadReports() {
    try {
        const response = await fetch(DASHBOARD_API);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(
                data.message || "Failed to load reports"
            );
        }

        const dashboard = data.dashboard || {};

        const totalIncome =
            Number(dashboard.totalIncome || 0);

        const totalExpense =
            Number(dashboard.totalExpense || 0);

        const netProfit =
            Number(dashboard.netProfit || 0);

        const totalPayments =
            Number(dashboard.totalPayments || 0);

        const totalCustomers =
            Number(dashboard.totalCustomers || 0);

        const totalInvoices =
            Number(dashboard.totalInvoices || 0);

        // Main report cards
        setText(
            "totalIncome",
            formatCurrency(totalIncome)
        );

        setText(
            "totalExpense",
            formatCurrency(totalExpense)
        );

        setText(
            "netProfit",
            formatCurrency(netProfit)
        );

        setText(
            "totalPayments",
            formatCurrency(totalPayments)
        );

        setText(
            "totalCustomers",
            totalCustomers
        );

        setText(
            "totalInvoices",
            totalInvoices
        );

        // Financial Summary
        setText(
            "summaryIncome",
            formatCurrency(totalIncome)
        );

        setText(
            "summaryExpense",
            formatCurrency(totalExpense)
        );

        setText(
            "summaryProfit",
            formatCurrency(netProfit)
        );

        // System Summary
        setText(
            "summaryCustomers",
            totalCustomers
        );

        setText(
            "summaryInvoices",
            totalInvoices
        );

        setText(
            "summaryPayments",
            formatCurrency(totalPayments)
        );

        showMessage(
            "Reports loaded successfully.",
            "success"
        );

    } catch (error) {
        console.error("Reports Error:", error);

        showMessage(
            "Unable to load finance reports. Please check the server connection.",
            "error"
        );
    }
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function formatCurrency(value) {
    return `₹${Number(value || 0).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    )}`;
}

function showMessage(message, type) {
    const messageElement =
        document.getElementById("message");

    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;
    messageElement.className =
        `message ${type}`;

    if (type === "success") {
        setTimeout(() => {
            messageElement.textContent = "";
            messageElement.className = "message";
        }, 2500);
    }
}

document.addEventListener(
    "DOMContentLoaded",
    loadReports
);