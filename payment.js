const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api"
        : "/api";

const paymentForm = document.getElementById("paymentForm");
const invoiceSelect = document.getElementById("invoice");
const paymentAmountInput = document.getElementById("paymentAmount");
const paymentDateInput = document.getElementById("paymentDate");
const paymentMethodSelect = document.getElementById("paymentMethod");

const paymentTableBody = document.getElementById("paymentTableBody");
const totalPaymentsElement = document.getElementById("totalPayments");
const totalTransactionsElement = document.getElementById("totalTransactions");

const submitBtn = document.getElementById("submitBtn");
const clearBtn = document.getElementById("clearBtn");

const formTitle = document.getElementById("formTitle");
const formDescription = document.getElementById("formDescription");

let payments = [];
let invoices = [];
let editingPaymentId = null;

document.addEventListener("DOMContentLoaded", () => {
    setTodayDate();
    initializePage();
});

async function initializePage() {
    await loadInvoices();
    await loadPayments();
}

function setTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    paymentDateInput.value = `${year}-${month}-${day}`;
}

async function loadInvoices() {
    try {
        const response = await fetch(`${API_URL}/invoices`);

        if (!response.ok) {
            throw new Error(`Invoice API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Unable to load invoices");
        }

        invoices = data.invoices || [];

        renderInvoiceOptions();
    } catch (error) {
        console.error("Invoice loading error:", error);

        invoiceSelect.innerHTML = `
            <option value="">
                Unable to load invoices
            </option>
        `;
    }
}

function renderInvoiceOptions() {
    invoiceSelect.innerHTML = `
        <option value="">
            Select Invoice
        </option>
    `;

    invoices.forEach(invoice => {
        const status = String(
            invoice.status || "pending"
        ).toLowerCase();

        if (status === "cancelled") {
            return;
        }

        const invoiceAmount = Number(invoice.amount || 0);

        const paid = Number(
            invoice.total_paid ??
            invoice.paid_amount ??
            0
        );

        const balance = Math.max(
            Number(
                invoice.balance_due ??
                (invoiceAmount - paid)
            ),
            0
        );

        const option = document.createElement("option");

        option.value = invoice.id;

        let text =
            `${invoice.invoice_number || `#${invoice.id}`} — ` +
            `${invoice.customer_name || "Customer"} — ` +
            `₹${formatMoney(invoiceAmount)}`;

        if (balance > 0) {
            text += ` — Balance ₹${formatMoney(balance)}`;
        } else {
            text += ` — Fully Paid`;
        }

        option.textContent = text;

        if (
            balance <= 0 &&
            editingPaymentId === null
        ) {
            option.disabled = true;
        }

        invoiceSelect.appendChild(option);
    });
}

async function loadPayments() {
    try {
        paymentTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="loading-cell">
                    Loading payment records...
                </td>
            </tr>
        `;

        const response = await fetch(`${API_URL}/payments`);

        if (!response.ok) {
            throw new Error(`Payment API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(
                data.message || "Unable to load payments"
            );
        }

        payments = data.payments || [];

        renderPayments();
    } catch (error) {
        console.error("Payment loading error:", error);

        totalPaymentsElement.textContent = "₹0.00";
        totalTransactionsElement.textContent = "0";

        paymentTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="error-cell">
                    Failed to load payment records.
                </td>
            </tr>
        `;
    }
}

function renderPayments() {
    totalTransactionsElement.textContent = payments.length;

    const totalPayments = payments.reduce(
        (sum, payment) =>
            sum +
            Number(
                payment.amount ??
                payment.payment_amount ??
                0
            ),
        0
    );

    totalPaymentsElement.textContent =
        `₹${formatMoney(totalPayments)}`;

    if (payments.length === 0) {
        paymentTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-cell">
                    No payment records found.
                </td>
            </tr>
        `;

        return;
    }

    paymentTableBody.innerHTML = "";

    payments.forEach(payment => {
        const invoiceAmount = Number(
            payment.invoice_amount ?? 0
        );

        const paymentAmount = Number(
            payment.amount ??
            payment.payment_amount ??
            0
        );

        const balance = Number(
            payment.balance_due ??
            Math.max(
                invoiceAmount - paymentAmount,
                0
            )
        );

        const invoiceNumber =
            payment.invoice_number || "-";

        const customerName =
            payment.customer_name || "-";

        const paymentDate =
            payment.payment_date || "";

        const paymentMethod =
            payment.payment_method || "-";

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                ${escapeHtml(payment.id)}
            </td>

            <td>
                <strong>
                    ${escapeHtml(invoiceNumber)}
                </strong>
            </td>

            <td>
                ${escapeHtml(customerName)}
            </td>

            <td>
                <strong>
                    ₹${formatMoney(invoiceAmount)}
                </strong>
            </td>

            <td>
                <span class="payment-amount">
                    ₹${formatMoney(paymentAmount)}
                </span>
            </td>

            <td>
                <span class="balance-amount">
                    ₹${formatMoney(balance)}
                </span>
            </td>

            <td>
                ${formatDate(paymentDate)}
            </td>

            <td>
                <span class="method-badge">
                    ${escapeHtml(paymentMethod)}
                </span>
            </td>

            <td>
                <div class="action-buttons">

                    <button
                        type="button"
                        class="edit-btn"
                        data-id="${payment.id}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        data-id="${payment.id}"
                    >
                        Delete
                    </button>

                    <button
                        type="button"
                        class="print-btn"
                        data-id="${payment.id}"
                    >
                        Print
                    </button>

                </div>
            </td>
        `;

        paymentTableBody.appendChild(row);
    });

    document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", () => {
            editPayment(Number(button.dataset.id));
        });
    });

    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", () => {
            deletePayment(Number(button.dataset.id));
        });
    });

    document.querySelectorAll(".print-btn").forEach(button => {
        button.addEventListener("click", () => {
            printPayment(Number(button.dataset.id));
        });
    });
}

paymentForm.addEventListener("submit", async event => {
    event.preventDefault();

    const invoiceId = Number(invoiceSelect.value);
    const amount = Number(paymentAmountInput.value);
    const paymentDate = paymentDateInput.value;
    const paymentMethod = paymentMethodSelect.value;

    if (!invoiceId) {
        alert("Please select an invoice.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid payment amount.");
        return;
    }

    if (!paymentDate) {
        alert("Please select payment date.");
        return;
    }

    if (!paymentMethod) {
        alert("Please select payment method.");
        return;
    }

    const selectedInvoice = invoices.find(
        invoice => Number(invoice.id) === invoiceId
    );

    if (selectedInvoice) {
        const invoiceAmount =
            Number(selectedInvoice.amount || 0);

        const invoicePaid =
            Number(selectedInvoice.total_paid ?? 0);

        let availableBalance =
            Number(
                selectedInvoice.balance_due ??
                (invoiceAmount - invoicePaid)
            );

        if (editingPaymentId) {
            const oldPayment = payments.find(
                payment =>
                    Number(payment.id) ===
                    Number(editingPaymentId)
            );

            if (
                oldPayment &&
                Number(oldPayment.invoice_id) === invoiceId
            ) {
                availableBalance += Number(
                    oldPayment.amount || 0
                );
            }
        }

        if (amount > availableBalance) {
            alert(
                `Payment exceeds the available balance.\n\n` +
                `Available Balance: ₹${formatMoney(
                    availableBalance
                )}`
            );

            return;
        }
    }

    const payload = {
        invoice_id: invoiceId,
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod
    };

    try {
        submitBtn.disabled = true;

        let response;

        if (editingPaymentId) {
            response = await fetch(
                `${API_URL}/payments/${editingPaymentId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );
        } else {
            response = await fetch(
                `${API_URL}/payments`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Unable to save payment."
            );
        }

        alert(
            editingPaymentId
                ? "Payment updated successfully."
                : "Payment added successfully."
        );

        resetForm();

        await loadInvoices();
        await loadPayments();

    } catch (error) {
        console.error("Payment save error:", error);
        alert(error.message);
    } finally {
        submitBtn.disabled = false;
    }
});

function editPayment(id) {
    const payment = payments.find(
        item => Number(item.id) === Number(id)
    );

    if (!payment) {
        alert("Payment not found.");
        return;
    }

    editingPaymentId = payment.id;

    renderInvoiceOptions();

    invoiceSelect.value =
        payment.invoice_id || "";

    paymentAmountInput.value =
        payment.amount ??
        payment.payment_amount ??
        "";

    paymentDateInput.value =
        normalizeDate(payment.payment_date);

    paymentMethodSelect.value =
        payment.payment_method || "";

    formTitle.textContent = "Edit Payment";

    formDescription.textContent =
        "Update the selected payment transaction.";

    submitBtn.textContent =
        "✓ Update Payment";

    clearBtn.textContent = "Cancel";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

async function deletePayment(id) {
    const payment = payments.find(
        item => Number(item.id) === Number(id)
    );

    if (!payment) {
        alert("Payment not found.");
        return;
    }

    const confirmed = confirm(
        `Delete this payment?\n\n` +
        `Payment: ₹${formatMoney(payment.amount)}`
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/payments/${id}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Unable to delete payment."
            );
        }

        alert("Payment deleted successfully.");

        await loadInvoices();
        await loadPayments();

    } catch (error) {
        console.error(
            "Payment delete error:",
            error
        );

        alert(error.message);
    }
}

function printPayment(id) {
    const payment = payments.find(
        item => Number(item.id) === Number(id)
    );

    if (!payment) {
        alert("Payment not found.");
        return;
    }

    const invoiceAmount =
        Number(payment.invoice_amount || 0);

    const paymentAmount =
        Number(
            payment.amount ||
            payment.payment_amount ||
            0
        );

    const balance =
        Number(
            payment.balance_due ??
            Math.max(
                invoiceAmount - paymentAmount,
                0
            )
        );

    const invoiceNumber =
        payment.invoice_number || "-";

    const customerName =
        payment.customer_name || "-";

    const paymentDate =
        payment.payment_date || "";

    const paymentMethod =
        payment.payment_method || "-";

    const printWindow = window.open(
        "",
        "_blank",
        "width=900,height=700"
    );

    if (!printWindow) {
        alert(
            "Please allow pop-ups to print the receipt."
        );

        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>

        <html>

        <head>

            <title>
                Payment Receipt - ${escapeHtml(invoiceNumber)}
            </title>

            <style>

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    padding: 40px;
                    font-family: Arial, sans-serif;
                    color: #222;
                    background: white;
                }

                .receipt {
                    max-width: 700px;
                    margin: auto;
                    border: 1px solid #ddd;
                    padding: 40px;
                }

                .header {
                    text-align: center;
                    border-bottom: 2px solid #222;
                    padding-bottom: 25px;
                    margin-bottom: 30px;
                }

                .header h1 {
                    margin: 0 0 6px;
                    font-size: 28px;
                }

                .header p {
                    margin: 0;
                    color: #777;
                    font-size: 14px;
                }

                .info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 30px;
                }

                .info-box {
                    padding: 14px;
                    background: #f7f7f7;
                    border-radius: 8px;
                }

                .label {
                    font-size: 11px;
                    color: #777;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }

                .value {
                    font-size: 16px;
                    font-weight: bold;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th,
                td {
                    padding: 14px;
                    border-bottom: 1px solid #ddd;
                }

                th {
                    background: #f5f5f5;
                    text-align: left;
                }

                .right {
                    text-align: right;
                }

                .payment-total {
                    margin-top: 25px;
                    padding: 18px;
                    border: 2px solid #222;
                    display: flex;
                    justify-content: space-between;
                    font-size: 20px;
                    font-weight: bold;
                }

                .balance {
                    margin-top: 15px;
                    text-align: right;
                    font-size: 16px;
                }

                .footer {
                    text-align: center;
                    margin-top: 45px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #777;
                    font-size: 12px;
                }

                @media print {

                    body {
                        padding: 0;
                    }

                    .receipt {
                        border: none;
                    }

                }

            </style>

        </head>

        <body>

            <div class="receipt">

                <div class="header">

                    <h1>
                        PAYMENT RECEIPT
                    </h1>

                    <p>
                        Finance Management Portal
                    </p>

                </div>

                <div class="info">

                    <div class="info-box">

                        <div class="label">
                            Invoice
                        </div>

                        <div class="value">
                            ${escapeHtml(invoiceNumber)}
                        </div>

                    </div>

                    <div class="info-box">

                        <div class="label">
                            Payment Date
                        </div>

                        <div class="value">
                            ${formatDate(paymentDate)}
                        </div>

                    </div>

                    <div class="info-box">

                        <div class="label">
                            Customer
                        </div>

                        <div class="value">
                            ${escapeHtml(customerName)}
                        </div>

                    </div>

                    <div class="info-box">

                        <div class="label">
                            Payment Method
                        </div>

                        <div class="value">
                            ${escapeHtml(paymentMethod)}
                        </div>

                    </div>

                </div>

                <table>

                    <thead>

                        <tr>

                            <th>
                                Description
                            </th>

                            <th class="right">
                                Amount
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        <tr>

                            <td>
                                Invoice Amount
                            </td>

                            <td class="right">
                                ₹${formatMoney(invoiceAmount)}
                            </td>

                        </tr>

                        <tr>

                            <td>
                                Payment Received
                            </td>

                            <td class="right">
                                ₹${formatMoney(paymentAmount)}
                            </td>

                        </tr>

                    </tbody>

                </table>

                <div class="payment-total">

                    <span>
                        Payment Received
                    </span>

                    <span>
                        ₹${formatMoney(paymentAmount)}
                    </span>

                </div>

                <div class="balance">

                    Balance Due:

                    <strong>
                        ₹${formatMoney(balance)}
                    </strong>

                </div>

                <div class="footer">
                    Thank you for your payment.
                </div>

            </div>

            <script>

                window.onload = function() {
                    window.print();
                };

            <\/script>

        </body>

        </html>
    `);

    printWindow.document.close();
}

clearBtn.addEventListener("click", () => {
    resetForm();
});

function resetForm() {
    editingPaymentId = null;

    paymentForm.reset();

    setTodayDate();

    invoiceSelect.value = "";
    paymentMethodSelect.value = "";

    formTitle.textContent = "Add Payment";

    formDescription.textContent =
        "Record a payment received for an invoice.";

    submitBtn.textContent =
        "＋ Add Payment";

    clearBtn.textContent = "Clear";

    renderInvoiceOptions();
}

function formatMoney(value) {
    return Number(value || 0).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value).slice(0, 10);
    }

    return date.toLocaleDateString("en-IN");
}

function normalizeDate(value) {
    if (!value) {
        return "";
    }

    return String(value).slice(0, 10);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}