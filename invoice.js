/* =========================================
   INVOICE MANAGEMENT
   LOCAL + RENDER PRODUCTION
========================================= */

const API_BASE =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api"
        : "/api";


const invoiceForm =
    document.getElementById("invoiceForm");

const customerSelect =
    document.getElementById("customer");

const invoiceNumberInput =
    document.getElementById("invoiceNumber");

const amountInput =
    document.getElementById("amount");

const invoiceDateInput =
    document.getElementById("invoiceDate");

const statusSelect =
    document.getElementById("status");

const invoiceTableBody =
    document.getElementById("invoiceTableBody");

const totalInvoicesElement =
    document.getElementById("totalInvoices");

const submitBtn =
    document.getElementById("submitBtn");

const clearBtn =
    document.getElementById("clearBtn");

const formTitle =
    document.getElementById("formTitle");

const formDescription =
    document.getElementById("formDescription");


let invoices = [];

let editingInvoiceId = null;


/* =========================================
   PAGE LOAD
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setTodayDate();

        initializePage();

    }
);


async function initializePage() {

    await loadCustomers();

    await loadInvoices();

}


/* =========================================
   TODAY DATE
========================================= */

function setTodayDate() {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    invoiceDateInput.value =
        `${year}-${month}-${day}`;

}


/* =========================================
   LOAD CUSTOMERS
========================================= */

async function loadCustomers() {

    try {

        const response =
            await fetch(
                `${API_BASE}/customers`,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Customer API error: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to load customers"
            );

        }


        const customers =
            data.customers || [];


        customerSelect.innerHTML =
            `<option value="">
                Select Customer
            </option>`;


        customers.forEach(
            customer => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    customer.id;


                option.textContent =
                    customer.name ||
                    customer.customer_name ||
                    `Customer #${customer.id}`;


                customerSelect.appendChild(
                    option
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Customer loading error:",
            error
        );


        customerSelect.innerHTML =
            `<option value="">
                Unable to load customers
            </option>`;

    }

}


/* =========================================
   LOAD INVOICES
========================================= */

async function loadInvoices() {

    try {

        invoiceTableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="loading-cell"
                >
                    Loading invoices...
                </td>
            </tr>
        `;


        const response =
            await fetch(
                `${API_BASE}/invoices`,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Invoice API error: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to load invoices"
            );

        }


        invoices =
            data.invoices || [];


        totalInvoicesElement.textContent =
            invoices.length;


        renderInvoices();

    }

    catch (error) {

        console.error(
            "Invoice loading error:",
            error
        );


        totalInvoicesElement.textContent =
            "0";


        invoiceTableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="error-cell"
                >
                    Failed to load invoice records.
                </td>
            </tr>
        `;

    }

}


/* =========================================
   RENDER INVOICES
========================================= */

function renderInvoices() {

    if (invoices.length === 0) {

        invoiceTableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="empty-cell"
                >
                    No invoice records found.
                </td>
            </tr>
        `;

        return;
    }


    invoiceTableBody.innerHTML = "";


    invoices.forEach(
        invoice => {

            const amount =
                Number(
                    invoice.amount || 0
                );


            const paid =
                Number(
                    invoice.total_paid ??
                    invoice.paid_amount ??
                    0
                );


            const balance =
                Number(
                    invoice.balance_due ??
                    Math.max(
                        amount - paid,
                        0
                    )
                );


            const status =
                String(
                    invoice.status ||
                    "pending"
                ).toLowerCase();


            const customerName =
                invoice.customer_name ||
                invoice.customer ||
                "-";


            const invoiceNumber =
                invoice.invoice_number ||
                "-";


            const date =
                invoice.invoice_date ||
                invoice.date ||
                "";


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHtml(invoice.id)}
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
                        ₹${formatMoney(amount)}
                    </strong>
                </td>

                <td>
                    <span class="paid-amount">
                        ₹${formatMoney(paid)}
                    </span>
                </td>

                <td>
                    <span class="balance-amount">
                        ₹${formatMoney(balance)}
                    </span>
                </td>

                <td>
                    ${formatDate(date)}
                </td>

                <td>
                    <span
                        class="status-badge status-${escapeHtml(status)}"
                    >
                        ${capitalize(status)}
                    </span>
                </td>

                <td>

                    <div class="action-buttons">

                        <button
                            type="button"
                            class="edit-btn"
                            data-id="${invoice.id}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="delete-btn"
                            data-id="${invoice.id}"
                        >
                            Delete
                        </button>

                        <button
                            type="button"
                            class="print-btn"
                            data-id="${invoice.id}"
                        >
                            Print
                        </button>

                    </div>

                </td>
            `;


            invoiceTableBody.appendChild(
                row
            );

        }
    );


    document
        .querySelectorAll(".edit-btn")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        editInvoice(
                            Number(
                                button.dataset.id
                            )
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(".delete-btn")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteInvoice(
                            Number(
                                button.dataset.id
                            )
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(".print-btn")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        printInvoice(
                            Number(
                                button.dataset.id
                            )
                        );

                    }
                );

            }
        );

}


/* =========================================
   CREATE / UPDATE INVOICE
========================================= */

invoiceForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const customerId =
            Number(
                customerSelect.value
            );


        const invoiceNumber =
            invoiceNumberInput.value.trim();


        const amount =
            Number(
                amountInput.value
            );


        const invoiceDate =
            invoiceDateInput.value;


        const status =
            statusSelect.value;


        if (!customerId) {

            alert(
                "Please select a customer."
            );

            return;
        }


        if (!invoiceNumber) {

            alert(
                "Please enter invoice number."
            );

            return;
        }


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            alert(
                "Please enter a valid amount."
            );

            return;
        }


        if (!invoiceDate) {

            alert(
                "Please select invoice date."
            );

            return;
        }


        const payload = {

            customer_id:
                customerId,

            invoice_number:
                invoiceNumber,

            amount,

            invoice_date:
                invoiceDate,

            status

        };


        try {

            submitBtn.disabled =
                true;


            let response;


            if (editingInvoiceId) {

                response =
                    await fetch(
                        `${API_BASE}/invoices/${editingInvoiceId}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );

            }

            else {

                response =
                    await fetch(
                        `${API_BASE}/invoices`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );

            }


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Failed to save invoice"
                );

            }


            alert(
                editingInvoiceId
                    ? "Invoice updated successfully."
                    : "Invoice created successfully."
            );


            resetForm();


            await loadInvoices();

        }

        catch (error) {

            console.error(
                "Save invoice error:",
                error
            );


            alert(
                error.message ||
                "Failed to save invoice."
            );

        }

        finally {

            submitBtn.disabled =
                false;

        }

    }
);


/* =========================================
   EDIT INVOICE
========================================= */

function editInvoice(id) {

    const invoice =
        invoices.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!invoice) {

        alert(
            "Invoice not found."
        );

        return;
    }


    editingInvoiceId =
        invoice.id;


    customerSelect.value =
        invoice.customer_id || "";


    invoiceNumberInput.value =
        invoice.invoice_number || "";


    amountInput.value =
        invoice.amount || "";


    invoiceDateInput.value =
        normalizeDate(
            invoice.invoice_date
        );


    statusSelect.value =
        invoice.status ||
        "pending";


    formTitle.textContent =
        "Edit Invoice";


    formDescription.textContent =
        "Update the selected invoice record.";


    submitBtn.textContent =
        "✓ Update Invoice";


    clearBtn.textContent =
        "Cancel";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================
   DELETE INVOICE
========================================= */

async function deleteInvoice(id) {

    const invoice =
        invoices.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!invoice) {

        alert(
            "Invoice not found."
        );

        return;
    }


    const invoiceNumber =
        invoice.invoice_number ||
        `#${invoice.id}`;


    const confirmed =
        confirm(
            `Delete invoice ${invoiceNumber}?\n\n` +
            `Invoices with linked payments cannot be deleted.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/invoices/${id}`,
                {
                    method: "DELETE",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to delete invoice"
            );

        }


        alert(
            "Invoice deleted successfully."
        );


        await loadInvoices();

    }

    catch (error) {

        console.error(
            "Delete invoice error:",
            error
        );


        alert(
            error.message ||
            "Failed to delete invoice."
        );

    }

}


/* =========================================
   PRINT INVOICE
========================================= */

function printInvoice(id) {

    const invoice =
        invoices.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!invoice) {

        alert(
            "Invoice not found."
        );

        return;
    }


    const amount =
        Number(
            invoice.amount || 0
        );


    const paid =
        Number(
            invoice.total_paid ??
            invoice.paid_amount ??
            0
        );


    const balance =
        Number(
            invoice.balance_due ??
            Math.max(
                amount - paid,
                0
            )
        );


    const customerName =
        invoice.customer_name ||
        invoice.customer ||
        "-";


    const invoiceNumber =
        invoice.invoice_number ||
        "-";


    const invoiceDate =
        invoice.invoice_date ||
        "";


    const status =
        capitalize(
            String(
                invoice.status ||
                "pending"
            ).toLowerCase()
        );


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=900,height=700"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups to print the invoice."
        );

        return;
    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                Invoice - ${escapeHtml(invoiceNumber)}
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

                .invoice {
                    max-width: 800px;
                    margin: auto;
                    border: 1px solid #ddd;
                    padding: 40px;
                }

                .top {
                    display: flex;
                    justify-content: space-between;
                    gap: 30px;
                    border-bottom: 2px solid #222;
                    padding-bottom: 25px;
                    margin-bottom: 30px;
                }

                h1 {
                    margin: 0 0 6px;
                    font-size: 30px;
                }

                .company {
                    font-size: 14px;
                    color: #666;
                }

                .invoice-info {
                    text-align: right;
                    font-size: 14px;
                    line-height: 1.8;
                }

                .customer {
                    margin-bottom: 30px;
                }

                .customer-title {
                    font-size: 12px;
                    color: #777;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }

                .customer-name {
                    font-size: 18px;
                    font-weight: bold;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }

                th,
                td {
                    padding: 14px;
                    border-bottom: 1px solid #ddd;
                }

                th {
                    text-align: left;
                    background: #f5f5f5;
                }

                .amount {
                    text-align: right;
                }

                .summary {
                    width: 360px;
                    margin-left: auto;
                    margin-top: 25px;
                }

                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 9px 0;
                    font-size: 15px;
                }

                .summary-row.total {
                    font-size: 18px;
                    font-weight: bold;
                    border-top: 2px solid #222;
                    margin-top: 8px;
                    padding-top: 14px;
                }

                .status {
                    margin-top: 25px;
                    display: inline-block;
                    padding: 7px 14px;
                    border-radius: 20px;
                    background: #eee;
                    font-weight: bold;
                }

                .footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    text-align: center;
                    color: #777;
                    font-size: 12px;
                }

                @media print {

                    body {
                        padding: 0;
                    }

                    .invoice {
                        border: none;
                    }

                }

            </style>

        </head>

        <body>

            <div class="invoice">

                <div class="top">

                    <div>

                        <h1>
                            INVOICE
                        </h1>

                        <div class="company">
                            Finance Management Portal
                        </div>

                    </div>


                    <div class="invoice-info">

                        <div>
                            <strong>
                                Invoice No:
                            </strong>

                            ${escapeHtml(
                                invoiceNumber
                            )}
                        </div>


                        <div>

                            <strong>
                                Date:
                            </strong>

                            ${formatDate(
                                invoiceDate
                            )}

                        </div>

                    </div>

                </div>


                <div class="customer">

                    <div class="customer-title">
                        Customer
                    </div>

                    <div class="customer-name">
                        ${escapeHtml(
                            customerName
                        )}
                    </div>

                </div>


                <table>

                    <thead>

                        <tr>

                            <th>
                                Description
                            </th>

                            <th class="amount">
                                Amount
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        <tr>

                            <td>
                                Invoice Amount
                            </td>

                            <td class="amount">
                                ₹${formatMoney(
                                    amount
                                )}
                            </td>

                        </tr>

                    </tbody>

                </table>


                <div class="summary">

                    <div class="summary-row">

                        <span>
                            Invoice Amount
                        </span>

                        <strong>
                            ₹${formatMoney(
                                amount
                            )}
                        </strong>

                    </div>


                    <div class="summary-row">

                        <span>
                            Paid Amount
                        </span>

                        <strong>
                            ₹${formatMoney(
                                paid
                            )}
                        </strong>

                    </div>


                    <div class="summary-row total">

                        <span>
                            Balance Due
                        </span>

                        <strong>
                            ₹${formatMoney(
                                balance
                            )}
                        </strong>

                    </div>

                </div>


                <div class="status">

                    Status:
                    ${escapeHtml(status)}

                </div>


                <div class="footer">

                    Thank you for your business.

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


/* =========================================
   CLEAR / RESET
========================================= */

clearBtn.addEventListener(
    "click",
    () => {

        resetForm();

    }
);


function resetForm() {

    editingInvoiceId =
        null;


    invoiceForm.reset();


    setTodayDate();


    customerSelect.value =
        "";


    statusSelect.value =
        "pending";


    formTitle.textContent =
        "Create Invoice";


    formDescription.textContent =
        "Create a new invoice for a customer.";


    submitBtn.textContent =
        "＋ Create Invoice";


    clearBtn.textContent =
        "Clear";

}


/* =========================================
   MONEY FORMAT
========================================= */

function formatMoney(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,

            maximumFractionDigits: 2
        }
    );

}


/* =========================================
   DATE FORMAT
========================================= */

function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value)
            .slice(0, 10);

    }


    return date.toLocaleDateString(
        "en-IN"
    );

}


/* =========================================
   NORMALIZE DATE
========================================= */

function normalizeDate(value) {

    if (!value) {
        return "";
    }


    return String(value)
        .slice(0, 10);

}


/* =========================================
   CAPITALIZE
========================================= */

function capitalize(value) {

    const text =
        String(value);


    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );

}


/* =========================================
   HTML SECURITY
========================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}