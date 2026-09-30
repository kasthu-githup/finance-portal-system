/* =========================================
   EXPENSE MANAGEMENT
   LOCAL + RENDER PRODUCTION
========================================= */


/* =========================================
   API BASE URL
========================================= */

const API_BASE =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api"
        : "/api";


const API_URL =
    `${API_BASE}/expenses`;


/* =========================================
   ELEMENTS
========================================= */

const expenseForm =
    document.getElementById("expenseForm");

const expenseTableBody =
    document.getElementById("expenseTableBody");

const totalExpenseElement =
    document.getElementById("totalExpense");

const messageElement =
    document.getElementById("message");


/* =========================================
   STATE
========================================= */

let expenseRecords = [];

let editingId = null;


/* =========================================
   LOAD EXPENSES
========================================= */

async function loadExpenses() {

    try {

        const response =
            await fetch(API_URL, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            });


        if (!response.ok) {

            throw new Error(
                `HTTP Error: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to load expenses"
            );

        }


        expenseRecords =
            Array.isArray(data.expenses)
                ? data.expenses
                : [];


        renderExpenses(
            expenseRecords
        );

    }

    catch (error) {

        console.error(
            "Load expenses error:",
            error
        );


        expenseTableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    style="text-align:center;"
                >
                    Unable to load expense records.
                </td>
            </tr>
        `;


        showMessage(
            "Unable to load expense records.",
            "error"
        );

    }

}


/* =========================================
   RENDER EXPENSES
========================================= */

function renderExpenses(records) {

    expenseTableBody.innerHTML = "";


    let total = 0;


    if (records.length === 0) {

        expenseTableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    style="text-align:center;"
                >
                    No expense records found.
                </td>
            </tr>
        `;


        totalExpenseElement.textContent =
            "₹0";


        return;
    }


    records.forEach(
        (expense) => {

            total +=
                Number(
                    expense.amount || 0
                );


            const row =
                document.createElement("tr");


            const date =
                expense.expense_date
                    ? formatDate(
                        expense.expense_date
                    )
                    : "-";


            row.innerHTML = `

                <td>
                    ${escapeHtml(
                        expense.id
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        expense.title
                    )}
                </td>

                <td class="amount">
                    ₹${formatMoney(
                        expense.amount
                    )}
                </td>

                <td>
                    ${date}
                </td>

                <td>
                    ${escapeHtml(
                        expense.category ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        expense.description ||
                        "-"
                    )}
                </td>

                <td>

                    <button
                        type="button"
                        class="action-btn edit-btn"
                        onclick="editExpense(${expense.id})"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="action-btn delete-btn"
                        onclick="deleteExpense(${expense.id})"
                    >
                        Delete
                    </button>

                </td>

            `;


            expenseTableBody.appendChild(
                row
            );

        }
    );


    totalExpenseElement.textContent =
        `₹${formatMoney(total)}`;

}


/* =========================================
   ADD / UPDATE EXPENSE
========================================= */

expenseForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const title =
            document
                .getElementById("title")
                .value
                .trim();


        const amount =
            document
                .getElementById("amount")
                .value;


        const expense_date =
            document
                .getElementById("expense_date")
                .value;


        const category =
            document
                .getElementById("category")
                .value;


        const description =
            document
                .getElementById("description")
                .value
                .trim();


        /* VALIDATION */

        if (!title) {

            showMessage(
                "Expense title is required.",
                "error"
            );

            return;
        }


        if (
            amount === "" ||
            !Number.isFinite(
                Number(amount)
            ) ||
            Number(amount) <= 0
        ) {

            showMessage(
                "Please enter a valid amount.",
                "error"
            );

            return;
        }


        try {

            const url =
                editingId
                    ? `${API_URL}/${editingId}`
                    : API_URL;


            const method =
                editingId
                    ? "PUT"
                    : "POST";


            const response =
                await fetch(
                    url,
                    {
                        method,

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                title,

                                amount:
                                    Number(
                                        amount
                                    ),

                                expense_date:
                                    expense_date ||
                                    null,

                                category:
                                    category ||
                                    null,

                                description:
                                    description ||
                                    null

                            })
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
                    "Expense operation failed"
                );

            }


            showMessage(
                editingId
                    ? "Expense updated successfully."
                    : "Expense added successfully.",
                "success"
            );


            resetForm();


            await loadExpenses();

        }

        catch (error) {

            console.error(
                "Expense operation error:",
                error
            );


            showMessage(
                error.message ||
                "Unable to save expense.",
                "error"
            );

        }

    }
);


/* =========================================
   EDIT EXPENSE
========================================= */

window.editExpense =
    function (id) {

        const expense =
            expenseRecords.find(
                (item) =>
                    Number(item.id) ===
                    Number(id)
            );


        if (!expense) {

            showMessage(
                "Expense record not found.",
                "error"
            );

            return;
        }


        editingId =
            expense.id;


        document.getElementById(
            "title"
        ).value =
            expense.title || "";


        document.getElementById(
            "amount"
        ).value =
            expense.amount || "";


        document.getElementById(
            "expense_date"
        ).value =
            expense.expense_date
                ? String(
                    expense.expense_date
                ).substring(0, 10)
                : "";


        document.getElementById(
            "category"
        ).value =
            expense.category || "";


        document.getElementById(
            "description"
        ).value =
            expense.description || "";


        const submitButton =
            expenseForm.querySelector(
                "button[type='submit']"
            );


        if (submitButton) {

            submitButton.textContent =
                "Update Expense";

        }


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    };


/* =========================================
   DELETE EXPENSE
========================================= */

window.deleteExpense =
    async function (id) {

        const confirmed =
            confirm(
                "Are you sure you want to delete this expense record?"
            );


        if (!confirmed) {
            return;
        }


        try {

            const response =
                await fetch(
                    `${API_URL}/${id}`,
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
                    "Delete failed"
                );

            }


            showMessage(
                "Expense deleted successfully.",
                "success"
            );


            await loadExpenses();

        }

        catch (error) {

            console.error(
                "Delete expense error:",
                error
            );


            showMessage(
                error.message ||
                "Unable to delete expense.",
                "error"
            );

        }

    };


/* =========================================
   RESET FORM
========================================= */

function resetForm() {

    editingId = null;


    expenseForm.reset();


    const submitButton =
        expenseForm.querySelector(
            "button[type='submit']"
        );


    if (submitButton) {

        submitButton.textContent =
            "Add Expense";

    }

}


/* =========================================
   MESSAGE
========================================= */

function showMessage(
    message,
    type
) {

    messageElement.textContent =
        message;


    messageElement.className =
        `message ${type}`;


    setTimeout(
        () => {

            messageElement.textContent =
                "";

            messageElement.className =
                "message";

        },
        4000
    );

}


/* =========================================
   DATE FORMAT
========================================= */

function formatDate(value) {

    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value)
            .substring(0, 10);

    }


    return date.toLocaleDateString(
        "en-IN"
    );

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
   HTML SECURITY
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
   INITIAL LOAD
========================================= */

loadExpenses();