/* =========================================
   CUSTOMER MANAGEMENT
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
    `${API_BASE}/customers`;


/* =========================================
   ELEMENTS
========================================= */

const customerForm =
    document.getElementById("customerForm");

const customerTableBody =
    document.getElementById("customerTableBody");

const totalCustomersElement =
    document.getElementById("totalCustomers");

const messageElement =
    document.getElementById("message");

const searchInput =
    document.getElementById("searchInput");

const clearBtn =
    document.getElementById("clearBtn");

const addCustomerBtn =
    document.getElementById("addCustomerBtn");

const emptyState =
    document.getElementById("emptyState");


/* =========================================
   STATE
========================================= */

let customers = [];

let editingId = null;


/* =========================================
   LOAD CUSTOMERS
========================================= */

async function loadCustomers() {

    try {

        const response =
            await fetch(
                API_URL,
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
                `HTTP Error: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to load customers"
            );

        }


        customers =
            Array.isArray(
                data.customers
            )
                ? data.customers
                : [];


        renderCustomers(
            customers
        );

    }

    catch (error) {

        console.error(
            "Load customers error:",
            error
        );


        customerTableBody.innerHTML = "";


        if (emptyState) {

            emptyState.style.display =
                "block";

        }


        showMessage(
            "Unable to load customer records.",
            "error"
        );

    }

}


/* =========================================
   RENDER CUSTOMERS
========================================= */

function renderCustomers(
    customerList
) {

    customerTableBody.innerHTML = "";


    totalCustomersElement.textContent =
        customers.length;


    if (
        customerList.length === 0
    ) {

        if (emptyState) {

            emptyState.style.display =
                "block";

        }

        return;
    }


    if (emptyState) {

        emptyState.style.display =
            "none";

    }


    customerList.forEach(
        (customer) => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td class="customer-id">
                    ${escapeHtml(
                        customer.id
                    )}
                </td>

                <td class="customer-name">
                    ${escapeHtml(
                        customer.name
                    )}
                </td>

                <td class="customer-email">
                    ${escapeHtml(
                        customer.email || "-"
                    )}
                </td>

                <td class="customer-phone">
                    ${escapeHtml(
                        customer.phone || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        customer.address || "-"
                    )}
                </td>

                <td>

                    <button
                        type="button"
                        class="action-btn edit-btn"
                        onclick="editCustomer(${customer.id})"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="action-btn delete-btn"
                        onclick="deleteCustomer(${customer.id})"
                    >
                        Delete
                    </button>

                </td>

            `;


            customerTableBody.appendChild(
                row
            );

        }
    );

}


/* =========================================
   ADD / UPDATE CUSTOMER
========================================= */

customerForm.addEventListener(
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
                .trim();


        const phone =
            document
                .getElementById("phone")
                .value
                .trim();


        const address =
            document
                .getElementById("address")
                .value
                .trim();


        /* VALIDATION */

        if (!name) {

            showMessage(
                "Customer name is required.",
                "error"
            );

            document
                .getElementById("name")
                .focus();

            return;
        }


        try {

            addCustomerBtn.disabled =
                true;


            addCustomerBtn.textContent =
                editingId
                    ? "Updating..."
                    : "Adding...";


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

                                name,

                                email:
                                    email ||
                                    null,

                                phone:
                                    phone ||
                                    null,

                                address:
                                    address ||
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
                    "Customer operation failed"
                );

            }


            showMessage(
                editingId
                    ? "Customer updated successfully."
                    : "Customer added successfully.",
                "success"
            );


            resetForm();


            await loadCustomers();

        }

        catch (error) {

            console.error(
                "Customer operation error:",
                error
            );


            showMessage(
                error.message ||
                "Unable to save customer.",
                "error"
            );

        }

        finally {

            addCustomerBtn.disabled =
                false;


            addCustomerBtn.textContent =
                "＋ Add Customer";

        }

    }
);


/* =========================================
   EDIT CUSTOMER
========================================= */

window.editCustomer =
    function (id) {

        const customer =
            customers.find(
                (item) =>
                    Number(item.id) ===
                    Number(id)
            );


        if (!customer) {

            showMessage(
                "Customer record not found.",
                "error"
            );

            return;
        }


        editingId =
            customer.id;


        document.getElementById(
            "name"
        ).value =
            customer.name || "";


        document.getElementById(
            "email"
        ).value =
            customer.email || "";


        document.getElementById(
            "phone"
        ).value =
            customer.phone || "";


        document.getElementById(
            "address"
        ).value =
            customer.address || "";


        addCustomerBtn.textContent =
            "Update Customer";


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    };


/* =========================================
   DELETE CUSTOMER
========================================= */

window.deleteCustomer =
    async function (id) {

        const confirmed =
            confirm(
                "Are you sure you want to delete this customer?"
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
                "Customer deleted successfully.",
                "success"
            );


            await loadCustomers();

        }

        catch (error) {

            console.error(
                "Delete customer error:",
                error
            );


            showMessage(
                error.message ||
                "Unable to delete customer.",
                "error"
            );

        }

    };


/* =========================================
   SEARCH CUSTOMERS
========================================= */

searchInput.addEventListener(
    "input",
    () => {

        const searchTerm =
            searchInput.value
                .trim()
                .toLowerCase();


        if (!searchTerm) {

            renderCustomers(
                customers
            );

            return;
        }


        const filteredCustomers =
            customers.filter(
                (customer) => {

                    const name =
                        String(
                            customer.name || ""
                        ).toLowerCase();


                    const email =
                        String(
                            customer.email || ""
                        ).toLowerCase();


                    const phone =
                        String(
                            customer.phone || ""
                        ).toLowerCase();


                    const address =
                        String(
                            customer.address || ""
                        ).toLowerCase();


                    return (
                        name.includes(
                            searchTerm
                        ) ||

                        email.includes(
                            searchTerm
                        ) ||

                        phone.includes(
                            searchTerm
                        ) ||

                        address.includes(
                            searchTerm
                        )
                    );

                }
            );


        renderCustomers(
            filteredCustomers
        );

    }
);


/* =========================================
   CLEAR
========================================= */

clearBtn.addEventListener(
    "click",
    () => {

        resetForm();


        searchInput.value =
            "";


        renderCustomers(
            customers
        );


        messageElement.textContent =
            "";


        messageElement.className =
            "message";

    }
);


/* =========================================
   RESET FORM
========================================= */

function resetForm() {

    editingId = null;


    customerForm.reset();


    addCustomerBtn.textContent =
        "＋ Add Customer";

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

loadCustomers();