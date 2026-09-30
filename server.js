const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const pool = require("./db");

const app = express();

/* =========================================================
   BASIC MIDDLEWARE
========================================================= */

app.use(cors());
app.use(express.json());

/* =========================================================
   FRONTEND STATIC FILES
   IMPORTANT:
   Disable automatic index.html loading.
   Root "/" will be handled by the login route below.
========================================================= */

app.use(express.static(__dirname, {
    index: false
}));

/* =========================================================
   PAYMENT METHODS
========================================================= */

const ALLOWED_PAYMENT_METHODS = [
    "UPI",
    "Cash",
    "Card",
    "Bank Transfer",
    "Cheque"
];

/* =========================================================
   HOME
   Production website starts with LOGIN page.
========================================================= */

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "login.html")
    );
});

/* =========================================================
   DATABASE TEST
========================================================= */

app.get("/api/test-db", async (req, res) => {
    try {

        const result = await pool.query(
            "SELECT NOW() AS current_time"
        );

        res.json({
            success: true,
            message: "Neon PostgreSQL connected successfully",
            databaseTime: result.rows[0].current_time
        });

    } catch (error) {

        console.error(
            "Database error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message
        });
    }
});

/* =========================================================
   SIGNUP
========================================================= */

app.post("/api/signup", async (req, res) => {
    try {

        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Name, email and password are required"
            });
        }

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters"
            });
        }

        const existingUser =
            await pool.query(
                "SELECT id FROM users WHERE email = $1",
                [normalizedEmail]
            );

        if (existingUser.rows.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    "Email already registered"
            });
        }

        const passwordHash =
            await bcrypt.hash(
                password,
                10
            );

        const result =
            await pool.query(
                `INSERT INTO users
                    (
                        name,
                        email,
                        password_hash
                    )
                 VALUES
                    (
                        $1,
                        $2,
                        $3
                    )
                 RETURNING
                    id,
                    name,
                    email,
                    role,
                    created_at`,
                [
                    name.trim(),
                    normalizedEmail,
                    passwordHash
                ]
            );

        res.status(201).json({
            success: true,
            message:
                "Account created successfully",
            user: result.rows[0]
        });

    } catch (error) {

        console.error(
            "Signup error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Signup failed"
        });
    }
});

/* =========================================================
   LOGIN
========================================================= */

app.post("/api/login", async (req, res) => {
    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required"
            });
        }

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        const result =
            await pool.query(
                "SELECT * FROM users WHERE email = $1",
                [normalizedEmail]
            );

        if (result.rows.length === 0) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }

        const user =
            result.rows[0];

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!passwordMatch) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }

        const token =
            jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1d"
                }
            );

        res.json({
            success: true,
            message:
                "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.error(
            "Login error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
});

/* =========================================================
   INCOME
========================================================= */

/* GET ALL INCOME */

app.get("/api/income", async (req, res) => {
    try {

        const result =
            await pool.query(`
                SELECT *
                FROM income
                ORDER BY income_date DESC, id DESC
            `);

        res.json({
            success: true,
            income: result.rows
        });

    } catch (error) {

        console.error(
            "Get income error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch income"
        });
    }
});


/* ADD INCOME */

app.post("/api/income", async (req, res) => {
    try {

        const {
            title,
            amount,
            income_date,
            description
        } = req.body;

        const incomeAmount =
            Number(amount);

        if (
            !title ||
            !Number.isFinite(incomeAmount) ||
            incomeAmount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Title and a valid positive amount are required"
            });
        }

        const result =
            await pool.query(
                `INSERT INTO income
                    (
                        title,
                        amount,
                        income_date,
                        description
                    )
                 VALUES
                    (
                        $1,
                        $2,
                        COALESCE($3, CURRENT_DATE),
                        $4
                    )
                 RETURNING *`,
                [
                    title.trim(),
                    incomeAmount,
                    income_date || null,
                    description || null
                ]
            );

        res.status(201).json({
            success: true,
            message:
                "Income added successfully",
            income: result.rows[0]
        });

    } catch (error) {

        console.error(
            "Add income error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to add income"
        });
    }
});


/* UPDATE INCOME */

app.put("/api/income/:id", async (req, res) => {
    try {

        const { id } =
            req.params;

        const {
            title,
            amount,
            income_date,
            description
        } = req.body;

        const incomeAmount =
            Number(amount);

        if (
            !title ||
            !Number.isFinite(incomeAmount) ||
            incomeAmount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Title and a valid positive amount are required"
            });
        }

        const result =
            await pool.query(
                `UPDATE income
                 SET
                    title = $1,
                    amount = $2,
                    income_date =
                        COALESCE(
                            $3,
                            income_date
                        ),
                    description = $4
                 WHERE id = $5
                 RETURNING *`,
                [
                    title.trim(),
                    incomeAmount,
                    income_date || null,
                    description || null,
                    id
                ]
            );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Income record not found"
            });
        }

        res.json({
            success: true,
            message:
                "Income updated successfully",
            income: result.rows[0]
        });

    } catch (error) {

        console.error(
            "Update income error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update income"
        });
    }
});


/* DELETE INCOME */

app.delete("/api/income/:id", async (req, res) => {
    try {

        const { id } =
            req.params;

        const result =
            await pool.query(
                `DELETE FROM income
                 WHERE id = $1
                 RETURNING id`,
                [id]
            );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Income record not found"
            });
        }

        res.json({
            success: true,
            message:
                "Income deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete income error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete income"
        });
    }
});

/* =========================================================
   EXPENSES
========================================================= */

/* GET ALL EXPENSES */

app.get("/api/expenses", async (req, res) => {
    try {

        const result =
            await pool.query(`
                SELECT *
                FROM expenses
                ORDER BY expense_date DESC, id DESC
            `);

        res.json({
            success: true,
            expenses: result.rows
        });

    } catch (error) {

        console.error(
            "Get expenses error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch expenses"
        });
    }
});


/* ADD EXPENSE */

app.post("/api/expenses", async (req, res) => {
    try {

        const {
            title,
            amount,
            expense_date,
            category,
            description
        } = req.body;

        const expenseAmount =
            Number(amount);

        if (
            !title ||
            !Number.isFinite(expenseAmount) ||
            expenseAmount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Title and a valid positive amount are required"
            });
        }

        const result =
            await pool.query(
                `INSERT INTO expenses
                    (
                        title,
                        amount,
                        expense_date,
                        category,
                        description
                    )
                 VALUES
                    (
                        $1,
                        $2,
                        COALESCE($3, CURRENT_DATE),
                        $4,
                        $5
                    )
                 RETURNING *`,
                [
                    title.trim(),
                    expenseAmount,
                    expense_date || null,
                    category || null,
                    description || null
                ]
            );

        res.status(201).json({
            success: true,
            message:
                "Expense added successfully",
            expense: result.rows[0]
        });

    } catch (error) {

        console.error(
            "Add expense error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to add expense"
        });
    }
});


/* UPDATE EXPENSE */

app.put("/api/expenses/:id", async (req, res) => {
    try {

        const { id } =
            req.params;

        const {
            title,
            amount,
            expense_date,
            category,
            description
        } = req.body;

        const expenseAmount =
            Number(amount);

        if (
            !title ||
            !Number.isFinite(expenseAmount) ||
            expenseAmount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Title and a valid positive amount are required"
            });
        }

        const result =
            await pool.query(
                `UPDATE expenses
                 SET
                    title = $1,
                    amount = $2,
                    expense_date =
                        COALESCE(
                            $3,
                            expense_date
                        ),
                    category = $4,
                    description = $5
                 WHERE id = $6
                 RETURNING *`,
                [
                    title.trim(),
                    expenseAmount,
                    expense_date || null,
                    category || null,
                    description || null,
                    id
                ]
            );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Expense record not found"
            });
        }

        res.json({
            success: true,
            message:
                "Expense updated successfully",
            expense: result.rows[0]
        });

    } catch (error) {

        console.error(
            "Update expense error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update expense"
        });
    }
});


/* DELETE EXPENSE */

app.delete("/api/expenses/:id", async (req, res) => {
    try {

        const { id } =
            req.params;

        const result =
            await pool.query(
                `DELETE FROM expenses
                 WHERE id = $1
                 RETURNING id`,
                [id]
            );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Expense record not found"
            });
        }

        res.json({
            success: true,
            message:
                "Expense deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete expense error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete expense"
        });
    }
});

/* =========================================================
   CUSTOMERS
========================================================= */

/* GET CUSTOMERS */

app.get("/api/customers", async (req, res) => {
    try {

        const result =
            await pool.query(`
                SELECT *
                FROM customers
                ORDER BY id DESC
            `);

        res.json({
            success: true,
            customers: result.rows
        });

    } catch (error) {

        console.error(
            "Get customers error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch customers"
        });
    }
});


/* ADD CUSTOMER */

app.post("/api/customers", async (req, res) => {
    try {

        const {
            name,
            email,
            phone,
            address
        } = req.body;

        if (!name) {

            return res.status(400).json({
                success: false,
                message:
                    "Customer name is required"
            });
        }

        const result =
            await pool.query(
                `INSERT INTO customers
                    (
                        name,
                        email,
                        phone,
                        address
                    )
                 VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4
                    )
                 RETURNING *`,
                [
                    name.trim(),
                    email || null,
                    phone || null,
                    address || null
                ]
            );

        res.status(201).json({
            success: true,
            message:
                "Customer added successfully",
            customer: result.rows[0]
        });

    } catch (error) {

        console.error(
            "Add customer error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to add customer"
        });
    }
});


/* UPDATE CUSTOMER */

app.put("/api/customers/:id", async (req, res) => {
    try {

        const { id } =
            req.params;

        const {
            name,
            email,
            phone,
            address
        } = req.body;

        if (!name) {

            return res.status(400).json({
                success: false,
                message:
                    "Customer name is required"
            });
        }

        const result =
            await pool.query(
                `UPDATE customers
                 SET
                    name = $1,
                    email = $2,
                    phone = $3,
                    address = $4
                 WHERE id = $5
                 RETURNING *`,
                [
                    name.trim(),
                    email || null,
                    phone || null,
                    address || null,
                    id
                ]
            );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Customer not found"
            });
        }

        res.json({
            success: true,
            message:
                "Customer updated successfully",
            customer: result.rows[0]
        });

    } catch (error) {

        console.error(
            "Update customer error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update customer"
        });
    }
});


/* DELETE CUSTOMER */

app.delete("/api/customers/:id", async (req, res) => {
    try {

        const { id } =
            req.params;

        const linkedInvoices =
            await pool.query(
                `SELECT COUNT(*) AS count
                 FROM invoices
                 WHERE customer_id = $1`,
                [id]
            );

        const invoiceCount =
            Number(
                linkedInvoices.rows[0].count
            );

        if (invoiceCount > 0) {

            return res.status(409).json({
                success: false,
                message:
                    "This customer cannot be deleted because invoices are linked to the customer."
            });
        }

        const result =
            await pool.query(
                `DELETE FROM customers
                 WHERE id = $1
                 RETURNING id`,
                [id]
            );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Customer not found"
            });
        }

        res.json({
            success: true,
            message:
                "Customer deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete customer error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete customer"
        });
    }
});

/* =========================================================
   INVOICE + PAYMENT HELPERS
========================================================= */

async function getInvoicePaymentTotal(
    client,
    invoiceId
) {

    const result =
        await client.query(
            `SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS total_paid
             FROM payments
             WHERE invoice_id = $1`,
            [invoiceId]
        );

    return Number(
        result.rows[0].total_paid || 0
    );
}


async function syncInvoiceStatus(
    client,
    invoiceId
) {

    const invoiceResult =
        await client.query(
            `SELECT
                id,
                amount,
                status
             FROM invoices
             WHERE id = $1
             FOR UPDATE`,
            [invoiceId]
        );

    if (invoiceResult.rows.length === 0) {
        return null;
    }

    const invoice =
        invoiceResult.rows[0];

    const invoiceAmount =
        Number(
            invoice.amount || 0
        );

    const totalPaid =
        await getInvoicePaymentTotal(
            client,
            invoiceId
        );

    let status;

    if (
        invoice.status === "cancelled"
    ) {

        status = "cancelled";

    } else if (
        totalPaid <= 0
    ) {

        status = "pending";

    } else if (
        totalPaid >= invoiceAmount
    ) {

        status = "paid";

    } else {

        status = "partial";
    }

    await client.query(
        `UPDATE invoices
         SET status = $1
         WHERE id = $2`,
        [
            status,
            invoiceId
        ]
    );

    return {
        totalPaid,
        balanceDue:
            Math.max(
                invoiceAmount - totalPaid,
                0
            ),
        status
    };
}

/* =========================================================
   INVOICES
========================================================= */

/* GET INVOICES */

app.get("/api/invoices", async (req, res) => {
    try {

        const result =
            await pool.query(`
                SELECT
                    i.*,
                    c.name AS customer_name,

                    COALESCE(
                        SUM(p.amount),
                        0
                    ) AS total_paid,

                    GREATEST(
                        i.amount -
                        COALESCE(
                            SUM(p.amount),
                            0
                        ),
                        0
                    ) AS balance_due

                FROM invoices i

                LEFT JOIN customers c
                    ON i.customer_id = c.id

                LEFT JOIN payments p
                    ON i.id = p.invoice_id

                GROUP BY
                    i.id,
                    c.name

                ORDER BY i.id DESC
            `);

        res.json({
            success: true,
            invoices: result.rows
        });

    } catch (error) {

        console.error(
            "Get invoices error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch invoices"
        });
    }
});


/* ADD INVOICE */

app.post("/api/invoices", async (req, res) => {
    try {

        const {
            customer_id,
            invoice_number,
            amount,
            invoice_date,
            status
        } = req.body;

        const invoiceAmount =
            Number(amount);

        if (
            !invoice_number ||
            !Number.isFinite(invoiceAmount) ||
            invoiceAmount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invoice number and a valid positive amount are required"
            });
        }

        const duplicate =
            await pool.query(
                `SELECT id
                 FROM invoices
                 WHERE invoice_number = $1`,
                [invoice_number.trim()]
            );

        if (duplicate.rows.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    "Invoice number already exists"
            });
        }

        if (
            customer_id !== null &&
            customer_id !== undefined &&
            customer_id !== ""
        ) {

            const customer =
                await pool.query(
                    `SELECT id
                     FROM customers
                     WHERE id = $1`,
                    [customer_id]
                );

            if (customer.rows.length === 0) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Customer not found"
                });
            }
        }

        const finalStatus =
            status === "cancelled"
                ? "cancelled"
                : "pending";

        const result =
            await pool.query(
                `INSERT INTO invoices
                    (
                        customer_id,
                        invoice_number,
                        amount,
                        invoice_date,
                        status
                    )
                 VALUES
                    (
                        $1,
                        $2,
                        $3,
                        COALESCE(
                            $4,
                            CURRENT_DATE
                        ),
                        $5
                    )
                 RETURNING *`,
                [
                    customer_id || null,
                    invoice_number.trim(),
                    invoiceAmount,
                    invoice_date || null,
                    finalStatus
                ]
            );

        res.status(201).json({
            success: true,
            message:
                "Invoice created successfully",
            invoice: result.rows[0]
        });

    } catch (error) {

        console.error(
            "Add invoice error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to create invoice"
        });
    }
});


/* UPDATE INVOICE */

app.put("/api/invoices/:id", async (req, res) => {

    const client =
        await pool.connect();

    try {

        const { id } =
            req.params;

        const {
            customer_id,
            invoice_number,
            amount,
            invoice_date,
            status
        } = req.body;

        const invoiceAmount =
            Number(amount);

        if (
            !invoice_number ||
            !Number.isFinite(invoiceAmount) ||
            invoiceAmount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invoice number and a valid positive amount are required"
            });
        }

        await client.query("BEGIN");

        const existing =
            await client.query(
                `SELECT *
                 FROM invoices
                 WHERE id = $1
                 FOR UPDATE`,
                [id]
            );

        if (existing.rows.length === 0) {

            await client.query(
                "ROLLBACK"
            );

            return res.status(404).json({
                success: false,
                message:
                    "Invoice not found"
            });
        }

        const duplicate =
            await client.query(
                `SELECT id
                 FROM invoices
                 WHERE invoice_number = $1
                 AND id <> $2`,
                [
                    invoice_number.trim(),
                    id
                ]
            );

        if (duplicate.rows.length > 0) {

            await client.query(
                "ROLLBACK"
            );

            return res.status(409).json({
                success: false,
                message:
                    "Invoice number already exists"
            });
        }

        if (
            customer_id !== null &&
            customer_id !== undefined &&
            customer_id !== ""
        ) {

            const customer =
                await client.query(
                    `SELECT id
                     FROM customers
                     WHERE id = $1`,
                    [customer_id]
                );

            if (customer.rows.length === 0) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "Customer not found"
                });
            }
        }

        const totalPaid =
            await getInvoicePaymentTotal(
                client,
                id
            );

        if (
            invoiceAmount < totalPaid
        ) {

            await client.query(
                "ROLLBACK"
            );

            return res.status(400).json({
                success: false,
                message:
                    `Invoice amount cannot be less than total paid ₹${totalPaid.toLocaleString("en-IN")}`
            });
        }

        if (
            status === "cancelled" &&
            totalPaid > 0
        ) {

            await client.query(
                "ROLLBACK"
            );

            return res.status(400).json({
                success: false,
                message:
                    "An invoice with payments cannot be cancelled"
            });
        }

        let finalStatus;

        if (
            status === "cancelled"
        ) {

            finalStatus = "cancelled";

        } else if (
            totalPaid <= 0
        ) {

            finalStatus = "pending";

        } else if (
            totalPaid >= invoiceAmount
        ) {

            finalStatus = "paid";

        } else {

            finalStatus = "partial";
        }

        const result =
            await client.query(
                `UPDATE invoices
                 SET
                    customer_id = $1,
                    invoice_number = $2,
                    amount = $3,
                    invoice_date =
                        COALESCE(
                            $4,
                            invoice_date
                        ),
                    status = $5
                 WHERE id = $6
                 RETURNING *`,
                [
                    customer_id || null,
                    invoice_number.trim(),
                    invoiceAmount,
                    invoice_date || null,
                    finalStatus,
                    id
                ]
            );

        await client.query(
            "COMMIT"
        );

        res.json({
            success: true,
            message:
                "Invoice updated successfully",
            invoice: result.rows[0]
        });

    } catch (error) {

        await client.query(
            "ROLLBACK"
        );

        console.error(
            "Update invoice error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update invoice"
        });

    } finally {

        client.release();
    }
});


/* DELETE INVOICE */

app.delete("/api/invoices/:id", async (req, res) => {

    const client =
        await pool.connect();

    try {

        const { id } =
            req.params;

        await client.query(
            "BEGIN"
        );

        const invoice =
            await client.query(
                `SELECT id
                 FROM invoices
                 WHERE id = $1
                 FOR UPDATE`,
                [id]
            );

        if (invoice.rows.length === 0) {

            await client.query(
                "ROLLBACK"
            );

            return res.status(404).json({
                success: false,
                message:
                    "Invoice not found"
            });
        }

        const payments =
            await client.query(
                `SELECT COUNT(*) AS count
                 FROM payments
                 WHERE invoice_id = $1`,
                [id]
            );

        const paymentCount =
            Number(
                payments.rows[0].count
            );

        if (paymentCount > 0) {

            await client.query(
                "ROLLBACK"
            );

            return res.status(409).json({
                success: false,
                message:
                    "This invoice cannot be deleted because payments are linked to it. Delete the payments first."
            });
        }

        await client.query(
            `DELETE FROM invoices
             WHERE id = $1`,
            [id]
        );

        await client.query(
            "COMMIT"
        );

        res.json({
            success: true,
            message:
                "Invoice deleted successfully"
        });

    } catch (error) {

        await client.query(
            "ROLLBACK"
        );

        console.error(
            "Delete invoice error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete invoice"
        });

    } finally {

        client.release();
    }
});

/* =========================================================
   PAYMENTS
========================================================= */

/* GET PAYMENTS */

app.get("/api/payments", async (req, res) => {
    try {

        const result =
            await pool.query(`
                SELECT
                    p.id,
                    p.invoice_id,
                    p.amount,
                    p.payment_date,
                    p.payment_method,

                    i.invoice_number,
                    i.amount AS invoice_amount,

                    c.name AS customer_name,

                    COALESCE(
                        (
                            SELECT SUM(p2.amount)
                            FROM payments p2
                            WHERE p2.invoice_id =
                                p.invoice_id
                        ),
                        0
                    ) AS total_paid

                FROM payments p

                LEFT JOIN invoices i
                    ON p.invoice_id = i.id

                LEFT JOIN customers c
                    ON i.customer_id = c.id

                ORDER BY p.id DESC
            `);

        const payments =
            result.rows.map(
                payment => {

                    const invoiceAmount =
                        Number(
                            payment.invoice_amount ||
                            0
                        );

                    const totalPaid =
                        Number(
                            payment.total_paid ||
                            0
                        );

                    const balanceDue =
                        Math.max(
                            invoiceAmount -
                            totalPaid,
                            0
                        );

                    return {
                        ...payment,

                        invoice_amount:
                            invoiceAmount,

                        total_paid:
                            totalPaid,

                        balance_due:
                            balanceDue
                    };
                }
            );

        res.json({
            success: true,
            payments
        });

    } catch (error) {

        console.error(
            "Get payments error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch payments"
        });
    }
});


/* ADD PAYMENT */

app.post("/api/payments", async (req, res) => {

    const client =
        await pool.connect();

    try {

        const {
            invoice_id,
            amount,
            payment_date,
            payment_method
        } = req.body;

        const invoiceId =
            Number(invoice_id);

        const paymentAmount =
            Number(amount);

        if (
            !Number.isInteger(invoiceId) ||
            !Number.isFinite(paymentAmount) ||
            paymentAmount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Valid invoice ID and positive payment amount are required"
            });
        }

        if (
            !ALLOWED_PAYMENT_METHODS.includes(
                payment_method
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment method"
            });
        }

        await client.query(
            "BEGIN"
        );

        const invoiceResult =
            await client.query(
                `SELECT
                    id,
                    amount,
                    status
                 FROM invoices
                 WHERE id = $1
                 FOR UPDATE`,
                [invoiceId]
            );

        if (
            invoiceResult.rows.length === 0
        ) {

            await client.query(
                "ROLLBACK"
            );

            return res.status(404).json({
                success: false,
                message:
                    "Invoice not found"
            });
        }

        const invoice =
            invoiceResult.rows[0];

        if (
            invoice.status ===
            "cancelled"
        ) {

            await client.query(
                "ROLLBACK"
            );

            return res.status(400).json({
                success: false,
                message:
                    "Payments cannot be added to a cancelled invoice"
            });
        }

        const currentPaid =
            await getInvoicePaymentTotal(
                client,
                invoiceId
            );

        const availableBalance =
            Number(invoice.amount) -
            currentPaid;

        if (
            paymentAmount >
            availableBalance + 0.00001
        ) {

            await client.query(
                "ROLLBACK"
            );

            return res.status(400).json({
                success: false,
                message:
                    `Payment exceeds invoice balance. Maximum available: ₹${Math.max(
                        availableBalance,
                        0
                    ).toLocaleString("en-IN")}`
            });
        }

        const result =
            await client.query(
                `INSERT INTO payments
                    (
                        invoice_id,
                        amount,
                        payment_date,
                        payment_method
                    )
                 VALUES
                    (
                        $1,
                        $2,
                        COALESCE(
                            $3,
                            CURRENT_DATE
                        ),
                        $4
                    )
                 RETURNING *`,
                [
                    invoiceId,
                    paymentAmount,
                    payment_date || null,
                    payment_method
                ]
            );

        await syncInvoiceStatus(
            client,
            invoiceId
        );

        await client.query(
            "COMMIT"
        );

        res.status(201).json({
            success: true,
            message:
                "Payment added successfully",
            payment: result.rows[0]
        });

    } catch (error) {

        await client.query(
            "ROLLBACK"
        );

        console.error(
            "Add payment error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to add payment"
        });

    } finally {

        client.release();
    }
});


/* UPDATE PAYMENT */

app.put("/api/payments/:id", async (req, res) => {

    const client =
        await pool.connect();

    try {

        const { id } =
            req.params;

        const {
            invoice_id,
            amount,
            payment_date,
            payment_method
        } = req.body;

        const newInvoiceId =
            Number(invoice_id);

        const paymentAmount =
            Number(amount);

        if (
            !Number.isInteger(newInvoiceId) ||
            !Number.isFinite(paymentAmount) ||
            paymentAmount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Valid invoice ID and positive payment amount are required"
            });
        }

        if (
            !ALLOWED_PAYMENT_METHODS.includes(
                payment_method
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment method"
            });
        }

        await client.query(
            "BEGIN"
        );

        const existing =
            await client.query(
                `SELECT *
                 FROM payments
                 WHERE id = $1
                 FOR UPDATE`,
                [id]
            );

        if (
            existing.rows.length === 0
        ) {

            await client.query(
                "ROLLBACK"
            );

            return res.status(404).json({
                success: false,
                message:
                    "Payment not found"
            });
        }

        const oldPayment =
            existing.rows[0];

        const oldInvoiceId =
            Number(
                oldPayment.invoice_id
            );

        const invoiceIds = [
            ...new Set([
                oldInvoiceId,
                newInvoiceId
            ])
        ].sort(
            (a, b) => a - b
        );

        for (
            const invoiceId
            of invoiceIds
        ) {

            const invoiceCheck =
                await client.query(
                    `SELECT
                        id,
                        amount,
                        status
                     FROM invoices
                     WHERE id = $1
                     FOR UPDATE`,
                    [invoiceId]
                );

            if (
                invoiceCheck.rows.length === 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({
                    success: false,
                    message:
                        `Invoice ${invoiceId} not found`
                });
            }
        }

        const newInvoiceResult =
            await client.query(
                `SELECT
                    id,
                    amount,
                    status
                 FROM invoices
                 WHERE id = $1`,
                [newInvoiceId]
            );

        const newInvoice =
            newInvoiceResult.rows[0];

        if (
            newInvoice.status ===
            "cancelled"
        ) {

            await client.query(
                "ROLLBACK"
            );

            return res.status(400).json({
                success: false,
                message:
                    "Payments cannot be assigned to a cancelled invoice"
            });
        }

        let availableBalance;

        if (
            oldInvoiceId ===
            newInvoiceId
        ) {

            const currentTotal =
                await getInvoicePaymentTotal(
                    client,
                    oldInvoiceId
                );

            const totalWithoutOldPayment =
                currentTotal -
                Number(
                    oldPayment.amount
                );

            availableBalance =
                Number(
                    newInvoice.amount
                ) -
                totalWithoutOldPayment;

        } else {

            const currentNewTotal =
                await getInvoicePaymentTotal(
                    client,
                    newInvoiceId
                );

            availableBalance =
                Number(
                    newInvoice.amount
                ) -
                currentNewTotal;
        }

        if (
            paymentAmount >
            availableBalance + 0.00001
        ) {

            await client.query(
                "ROLLBACK"
            );

            return res.status(400).json({
                success: false,
                message:
                    `Payment exceeds invoice balance. Maximum available: ₹${Math.max(
                        availableBalance,
                        0
                    ).toLocaleString("en-IN")}`
            });
        }

        const result =
            await client.query(
                `UPDATE payments
                 SET
                    invoice_id = $1,
                    amount = $2,
                    payment_date =
                        COALESCE(
                            $3,
                            payment_date
                        ),
                    payment_method = $4
                 WHERE id = $5
                 RETURNING *`,
                [
                    newInvoiceId,
                    paymentAmount,
                    payment_date || null,
                    payment_method,
                    id
                ]
            );

        await syncInvoiceStatus(
            client,
            newInvoiceId
        );

        if (
            oldInvoiceId !==
            newInvoiceId
        ) {

            await syncInvoiceStatus(
                client,
                oldInvoiceId
            );
        }

        await client.query(
            "COMMIT"
        );

        res.json({
            success: true,
            message:
                "Payment updated successfully",
            payment: result.rows[0]
        });

    } catch (error) {

        await client.query(
            "ROLLBACK"
        );

        console.error(
            "Update payment error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update payment"
        });

    } finally {

        client.release();
    }
});


/* DELETE PAYMENT */

app.delete("/api/payments/:id", async (req, res) => {

    const client =
        await pool.connect();

    try {

        const { id } =
            req.params;

        await client.query(
            "BEGIN"
        );

        const existing =
            await client.query(
                `SELECT
                    id,
                    invoice_id
                 FROM payments
                 WHERE id = $1
                 FOR UPDATE`,
                [id]
            );

        if (
            existing.rows.length === 0
        ) {

            await client.query(
                "ROLLBACK"
            );

            return res.status(404).json({
                success: false,
                message:
                    "Payment not found"
            });
        }

        const invoiceId =
            Number(
                existing.rows[0].invoice_id
            );

        await client.query(
            `DELETE FROM payments
             WHERE id = $1`,
            [id]
        );

        await syncInvoiceStatus(
            client,
            invoiceId
        );

        await client.query(
            "COMMIT"
        );

        res.json({
            success: true,
            message:
                "Payment deleted successfully"
        });

    } catch (error) {

        await client.query(
            "ROLLBACK"
        );

        console.error(
            "Delete payment error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete payment"
        });

    } finally {

        client.release();
    }
});

/* =========================================================
   DASHBOARD
========================================================= */

app.get("/api/dashboard", async (req, res) => {
    try {

        const incomeResult =
            await pool.query(
                `SELECT
                    COALESCE(
                        SUM(amount),
                        0
                    ) AS total_income
                 FROM income`
            );

        const expenseResult =
            await pool.query(
                `SELECT
                    COALESCE(
                        SUM(amount),
                        0
                    ) AS total_expense
                 FROM expenses`
            );

        const customerResult =
            await pool.query(
                `SELECT
                    COUNT(*) AS total_customers
                 FROM customers`
            );

        const invoiceResult =
            await pool.query(
                `SELECT
                    COUNT(*) AS total_invoices
                 FROM invoices`
            );

        const paymentResult =
            await pool.query(
                `SELECT
                    COALESCE(
                        SUM(amount),
                        0
                    ) AS total_payments
                 FROM payments`
            );

        const totalIncome =
            Number(
                incomeResult.rows[0]
                    .total_income
            );

        const totalExpense =
            Number(
                expenseResult.rows[0]
                    .total_expense
            );

        const netProfit =
            totalIncome -
            totalExpense;

        const totalCustomers =
            Number(
                customerResult.rows[0]
                    .total_customers
            );

        const totalInvoices =
            Number(
                invoiceResult.rows[0]
                    .total_invoices
            );

        const totalPayments =
            Number(
                paymentResult.rows[0]
                    .total_payments
            );

        res.json({
            success: true,

            dashboard: {
                totalIncome,
                totalExpense,
                netProfit,
                totalCustomers,
                totalInvoices,
                totalPayments
            }
        });

    } catch (error) {

        console.error(
            "Dashboard error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to load dashboard"
        });
    }
});

/* =========================================================
   API 404
========================================================= */

app.use("/api", (req, res) => {

    res.status(404).json({
        success: false,
        message:
            `API route not found: ${req.method} ${req.originalUrl}`
    });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
    (error, req, res, next) => {

        console.error(
            "Unhandled server error:",
            error
        );

        if (res.headersSent) {
            return next(error);
        }

        res.status(500).json({
            success: false,
            message:
                "Internal server error"
        });
    }
);

/* =========================================================
   START SERVER
========================================================= */

const PORT =
    process.env.PORT || 5000;

const server =
    app.listen(
        PORT,
        "0.0.0.0",
        () => {

            console.log(
                `Finance Management Portal running on port ${PORT}`
            );

        }
    );

server.on(
    "error",
    (error) => {

        console.error(
            "Server error:",
            error
        );

    }
);