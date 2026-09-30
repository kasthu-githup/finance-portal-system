/* =========================================
   FINANCE MANAGEMENT PORTAL
   INVOICE MANAGEMENT
   LOCAL + RENDER PRODUCTION
========================================= */


/* =========================================
   API BASE
========================================= */

const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "/api";


/* =========================================
   ELEMENTS
========================================= */

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


/* =========================================
   STATE
========================================= */

let editingInvoiceId = null;

let invoices = [];


/* =========================================
   PAGE LOAD
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setTodayDate();

    await loadCustomers();

    await loadInvoices();

  }
);


/* =========================================
   TODAY DATE
========================================= */

function setTodayDate() {

  if (!invoiceDateInput) {
    return;
  }


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
            "Accept": "application/json"
          },
          cache: "no-store"
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
        "Failed to load customers"
      );

    }


    const customers =
      data.customers || [];


    customerSelect.innerHTML =
      `<option value="">
        Select Customer
      </option>`;


    customers.forEach(
      (customer) => {

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


    showMessage(
      "Unable to load customer records.",
      "error"
    );

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
            "Accept": "application/json"
          },
          cache: "no-store"
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
        "Failed to load invoices"
      );

    }


    invoices =
      data.invoices || [];


    renderInvoices();

  }

  catch (error) {

    console.error(
      "Invoice loading error:",
      error
    );


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


    showMessage(
      error.message ||
      "Failed to load invoice records.",
      "error"
    );

  }

}


/* =========================================
   RENDER INVOICES
========================================= */

function renderInvoices() {

  totalInvoicesElement.textContent =
    invoices.length;


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
    (invoice) => {

      const row =
        document.createElement("tr");


      const invoiceAmount =
        Number(
          invoice.amount || 0
        );


      const totalPaid =
        Number(
          invoice.total_paid ??
          invoice.paid_amount ??
          0
        );


      const balanceDue =
        Math.max(
          Number(
            invoice.balance_due ??
            (
              invoiceAmount -
              totalPaid
            )
          ),
          0
        );


      const status =
        String(
          invoice.status ||
          "pending"
        ).toLowerCase();


      row.innerHTML = `

        <td>
          ${escapeHtml(invoice.id)}
        </td>

        <td>
          <strong>
            ${escapeHtml(
              invoice.invoice_number ||
              "-"
            )}
          </strong>
        </td>

        <td>
          ${escapeHtml(
            invoice.customer_name ||
            invoice.customer ||
            "-"
          )}
        </td>

        <td>
          <strong>
            ₹${formatMoney(
              invoiceAmount
            )}
          </strong>
        </td>

        <td>
          <span class="paid-amount">
            ₹${formatMoney(
              totalPaid
            )}
          </span>
        </td>

        <td>
          <span class="balance-amount">
            ₹${formatMoney(
              balanceDue
            )}
          </span>
        </td>

        <td>
          ${formatDate(
            invoice.invoice_date
          )}
        </td>

        <td>
          ${getStatusBadge(
            status
          )}
        </td>

        <td>

          <div class="action-buttons">

            <button
              type="button"
              class="edit-btn"
              onclick="editInvoice(${invoice.id})"
            >
              Edit
            </button>

            <button
              type="button"
              class="delete-btn"
              onclick="deleteInvoice(${invoice.id})"
            >
              Delete
            </button>

          </div>

        </td>

      `;


      invoiceTableBody.appendChild(
        row
      );

    }
  );

}


/* =========================================
   CREATE / UPDATE INVOICE
========================================= */

invoiceForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const customerId =
      customerSelect.value;


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


    /* VALIDATION */

    if (!customerId) {

      showMessage(
        "Please select a customer.",
        "error"
      );

      customerSelect.focus();

      return;
    }


    if (!invoiceNumber) {

      showMessage(
        "Please enter an invoice number.",
        "error"
      );

      invoiceNumberInput.focus();

      return;
    }


    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {

      showMessage(
        "Please enter a valid amount.",
        "error"
      );

      amountInput.focus();

      return;
    }


    if (!invoiceDate) {

      showMessage(
        "Please select invoice date.",
        "error"
      );

      invoiceDateInput.focus();

      return;
    }


    const payload = {

      customer_id:
        Number(customerId),

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


      /* UPDATE */

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


      /* CREATE */

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
          "Unable to save invoice."
        );

      }


      showMessage(
        editingInvoiceId
          ? "Invoice updated successfully."
          : "Invoice created successfully.",
        "success"
      );


      resetForm();


      await loadInvoices();

    }

    catch (error) {

      console.error(
        "Invoice save error:",
        error
      );


      showMessage(
        error.message ||
        "Failed to save invoice.",
        "error"
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

window.editInvoice =
  function (id) {

    const invoice =
      invoices.find(
        (item) =>
          Number(item.id) ===
          Number(id)
      );


    if (!invoice) {

      showMessage(
        "Invoice not found.",
        "error"
      );

      return;
    }


    editingInvoiceId =
      invoice.id;


    customerSelect.value =
      invoice.customer_id ??
      invoice.customerId ??
      "";


    invoiceNumberInput.value =
      invoice.invoice_number ||
      "";


    amountInput.value =
      invoice.amount ??
      "";


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

  };


/* =========================================
   DELETE INVOICE
========================================= */

window.deleteInvoice =
  async function (id) {

    const invoice =
      invoices.find(
        (item) =>
          Number(item.id) ===
          Number(id)
      );


    if (!invoice) {

      showMessage(
        "Invoice not found.",
        "error"
      );

      return;
    }


    const invoiceNumber =
      invoice.invoice_number ||
      `#${invoice.id}`;


    const confirmed =
      confirm(
        `Are you sure you want to delete invoice ${invoiceNumber}?\n\n` +
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
          "Unable to delete invoice."
        );

      }


      showMessage(
        "Invoice deleted successfully.",
        "success"
      );


      await loadInvoices();

    }

    catch (error) {

      console.error(
        "Invoice delete error:",
        error
      );


      showMessage(
        error.message ||
        "Failed to delete invoice.",
        "error"
      );

    }

  };


/* =========================================
   CLEAR FORM
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
   STATUS BADGE
========================================= */

function getStatusBadge(status) {

  const safeStatus =
    String(status)
      .toLowerCase();


  let label =
    "Pending";


  if (
    safeStatus ===
    "partial"
  ) {
    label = "Partial";
  }


  if (
    safeStatus ===
    "paid"
  ) {
    label = "Paid";
  }


  if (
    safeStatus ===
    "cancelled"
  ) {
    label = "Cancelled";
  }


  return `
    <span
      class="status-badge status-${escapeHtml(
        safeStatus
      )}"
    >
      ${label}
    </span>
  `;

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

    return String(value);

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


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      date.getDate()
    ).padStart(2, "0");


  return `${year}-${month}-${day}`;

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =========================================
   MESSAGE
========================================= */

function showMessage(
  message,
  type = "success"
) {

  const oldMessage =
    document.getElementById(
      "invoiceMessage"
    );


  if (oldMessage) {
    oldMessage.remove();
  }


  const messageBox =
    document.createElement(
      "div"
    );


  messageBox.id =
    "invoiceMessage";


  messageBox.textContent =
    message;


  messageBox.style.position =
    "fixed";


  messageBox.style.top =
    "20px";


  messageBox.style.right =
    "20px";


  messageBox.style.zIndex =
    "9999";


  messageBox.style.padding =
    "14px 20px";


  messageBox.style.borderRadius =
    "10px";


  messageBox.style.fontWeight =
    "600";


  messageBox.style.boxShadow =
    "0 8px 25px rgba(0,0,0,0.15)";


  messageBox.style.maxWidth =
    "380px";


  if (type === "error") {

    messageBox.style.background =
      "#ffe5e5";

    messageBox.style.color =
      "#b42318";

    messageBox.style.border =
      "1px solid #ffb3b3";

  }

  else {

    messageBox.style.background =
      "#e8fff1";

    messageBox.style.color =
      "#087443";

    messageBox.style.border =
      "1px solid #a8e6c1";

  }


  document.body.appendChild(
    messageBox
  );


  setTimeout(
    () => {

      if (messageBox) {
        messageBox.remove();
      }

    },
    3500
  );

}