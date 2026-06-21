/* MONEYFLOW CORE ENGINE DATA INTEGRITY FIRST*/

"use strict";

/* STORAGE KEYS */

const STORAGE_KEYS = {
    TRANSACTIONS: "moneyflow_transactions",
    SAVINGS: "moneyflow_savings",
    CATEGORIES: "moneyflow_categories",
    LAST_BACKUP: "moneyflow_last_backup"
};

/* DEFAULT DATA */

const DEFAULT_CATEGORIES = [
    "Food",
    "Travel",
    "Shopping",
    "Education",
    "Health",
    "Bills",
    "Entertainment",
    "Salary",
    "Freelance",
    "Gift",
    "Investment",
    "Other"
];

/* APP STATE*/

const AppState = {
    isSubmitting: false
};

/* HELPERS*/

function nowTimestamp() {
    return Date.now();
}

function generateId() {
    return crypto.randomUUID();
}

function safeParseJSON(value, fallback) {
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInteger(value) {
    return Number.isInteger(value) && value >= 0;
}

/* MONEY FUNCTIONS*/

/*
   STORE:
   ₹100.50 => 10050 paise

   NEVER STORE FLOATS
*/

function rupeesToPaise(amountInput) {

    const amount = String(amountInput).trim();

    if (!amount) return null;

    if (!/^\d+(\.\d{1,2})?$/.test(amount))
        return null;

    const parts = amount.split(".");

    const rupees = parseInt(parts[0], 10);

    const paise =
        parts.length === 2
            ? parseInt(parts[1].padEnd(2, "0"), 10)
            : 0;

    return (rupees * 100) + paise;
}

function paiseToRupees(paise) {

    if (!Number.isInteger(paise))
        return "₹0.00";

    return `₹${(paise / 100).toFixed(2)}`;
}

/* LOCAL STORAGE WRAPPERS*/

function readStorage(key, fallback = []) {

    try {

        const raw = localStorage.getItem(key);

        if (!raw)
            return fallback;

        return safeParseJSON(raw, fallback);

    } catch {

        return fallback;
    }
}

function writeStorage(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.error(error);

        return false;
    }
}

function clearStorageKey(key) {
    localStorage.removeItem(key);
}

/* TRANSACTION VALIDATION */

function validateTransaction(transaction) {

    if (
        !transaction ||
        typeof transaction !== "object"
    ) {
        return false;
    }

    const requiredFields = [
        "id",
        "date",
        "type",
        "amountPaise",
        "category",
        "method",
        "note",
        "createdAt",
        "updatedAt"
    ];

    for (const field of requiredFields) {

        if (!(field in transaction))
            return false;
    }

    if (!isNonEmptyString(transaction.id))
        return false;

    if (
        transaction.type !== "Income" &&
        transaction.type !== "Expense"
    ) {
        return false;
    }

    if (
        !isPositiveInteger(
            transaction.amountPaise
        )
    ) {
        return false;
    }

    if (
        transaction.amountPaise <= 0
    ) {
        return false;
    }

    if (
        !isNonEmptyString(
            transaction.category
        )
    ) {
        return false;
    }

    if (
        !isNonEmptyString(
            transaction.method
        )
    ) {
        return false;
    }

    return true;
}

/*SAVINGS VALIDATION*/

function validateSavingsGoal(goal) {

    if (
        !goal ||
        typeof goal !== "object"
    ) {
        return false;
    }

    const requiredFields = [
        "id",
        "name",
        "targetPaise",
        "currentPaise",
        "createdAt",
        "updatedAt"
    ];

    for (const field of requiredFields) {

        if (!(field in goal))
            return false;
    }

    if (!isNonEmptyString(goal.id))
        return false;

    if (!isNonEmptyString(goal.name))
        return false;

    if (
        !isPositiveInteger(goal.targetPaise)
    ) {
        return false;
    }

    if (
        !isPositiveInteger(goal.currentPaise)
    ) {
        return false;
    }

    return true;
}

/*DATA REPAIR*/

function repairTransactions(rawTransactions) {

    if (!Array.isArray(rawTransactions))
        return [];

    const repaired = [];

    for (const tx of rawTransactions) {

        if (
            validateTransaction(tx)
        ) {
            repaired.push(tx);
        }
    }

    return repaired;
}

function repairSavings(rawGoals) {

    if (!Array.isArray(rawGoals))
        return [];

    const repaired = [];

    for (const goal of rawGoals) {

        if (
            validateSavingsGoal(goal)
        ) {
            repaired.push(goal);
        }
    }

    return repaired;
}

/* LOAD DATA SAFELY*/

function getTransactions() {

    const data = readStorage(
        STORAGE_KEYS.TRANSACTIONS,
        []
    );

    const repaired =
        repairTransactions(data);

    if (
        repaired.length !== data.length
    ) {

        writeStorage(
            STORAGE_KEYS.TRANSACTIONS,
            repaired
        );
    }

    return repaired;
}

function getSavingsGoals() {

    const data = readStorage(
        STORAGE_KEYS.SAVINGS,
        []
    );

    const repaired =
        repairSavings(data);

    if (
        repaired.length !== data.length
    ) {

        writeStorage(
            STORAGE_KEYS.SAVINGS,
            repaired
        );
    }

    return repaired;
}

function getCategories() {

    let categories = readStorage(
        STORAGE_KEYS.CATEGORIES,
        null
    );

    if (
        !Array.isArray(categories)
    ) {

        categories =
            [...DEFAULT_CATEGORIES];

        writeStorage(
            STORAGE_KEYS.CATEGORIES,
            categories
        );
    }

    return categories;
}

/*SAVE TRANSACTION*/

function saveTransaction(
    transaction
) {

    if (
        !validateTransaction(
            transaction
        )
    ) {
        return false;
    }

    const transactions =
        getTransactions();

    transactions.push(
        transaction
    );

    return writeStorage(
        STORAGE_KEYS.TRANSACTIONS,
        transactions
    );
}

/*UPDATE TRANSACTION*/

function updateTransaction(
    updatedTransaction
) {

    const transactions =
        getTransactions();

    const index =
        transactions.findIndex(
            tx =>
                tx.id ===
                updatedTransaction.id
        );

    if (index === -1)
        return false;

    transactions[index] =
        updatedTransaction;

    return writeStorage(
        STORAGE_KEYS.TRANSACTIONS,
        transactions
    );
}

/*DELETE TRANSACTION*/

function deleteTransaction(id) {

    const transactions =
        getTransactions();

    const filtered =
        transactions.filter(
            tx => tx.id !== id
        );

    return writeStorage(
        STORAGE_KEYS.TRANSACTIONS,
        filtered
    );
}

/* CALCULATIONS*/

function calculateTotals() {

    const transactions =
        getTransactions();

    let income = 0;
    let expense = 0;

    for (const tx of transactions) {

        if (
            tx.type === "Income"
        ) {
            income +=
                tx.amountPaise;
        }

        if (
            tx.type === "Expense"
        ) {
            expense +=
                tx.amountPaise;
        }
    }

    const balance =
        income - expense;

    return {
        income,
        expense,
        balance
    };
}

/* DUPLICATE DETECTION*/

function isDuplicateTransaction(
    candidate
) {

    const transactions =
        getTransactions();

    return transactions.some(
        tx =>
            tx.date ===
                candidate.date &&
            tx.type ===
                candidate.type &&
            tx.amountPaise ===
                candidate.amountPaise &&
            tx.category ===
                candidate.category &&
            tx.method ===
                candidate.method &&
            tx.note ===
                candidate.note
    );
}

/*CATEGORY MANAGEMENT */

function addCategory(
    categoryName
) {

    if (
        !isNonEmptyString(
            categoryName
        )
    ) {
        return false;
    }

    const categories =
        getCategories();

    const trimmed =
        categoryName.trim();

    const exists =
        categories.some(
            c =>
                c.toLowerCase() ===
                trimmed.toLowerCase()
        );

    if (exists)
        return false;

    categories.push(trimmed);

    return writeStorage(
        STORAGE_KEYS.CATEGORIES,
        categories
    );
}

/* ==========================================
   BACKUP DATE
========================================== */

function getLastBackupDate() {

    return localStorage.getItem(
        STORAGE_KEYS.LAST_BACKUP
    );
}

function setLastBackupDate() {

    localStorage.setItem(
        STORAGE_KEYS.LAST_BACKUP,
        String(Date.now())
    );
}
/* ==========================================
   DOM ELEMENTS
========================================== */

const transactionForm =
    document.getElementById(
        "transactionForm"
    );

const dateInput =
    document.getElementById(
        "date"
    );

const typeInput =
    document.getElementById(
        "type"
    );

const amountInput =
    document.getElementById(
        "amount"
    );

const categoryInput =
    document.getElementById(
        "category"
    );

const methodInput =
    document.getElementById(
        "method"
    );

const noteInput =
    document.getElementById(
        "note"
    );

const saveButton =
    document.getElementById(
        "saveTransactionBtn"
    );

const errorBox =
    document.getElementById(
        "formError"
    );

const successBox =
    document.getElementById(
        "formSuccess"
    );

const balanceElement =
    document.getElementById(
        "currentBalance"
    );

const incomeElement =
    document.getElementById(
        "totalIncome"
    );

const expenseElement =
    document.getElementById(
        "totalExpense"
    );

const recentTransactionsContainer =
    document.getElementById(
        "recentTransactions"
    );

const categoryAddButton =
    document.getElementById(
        "addCategoryBtn"
    );

const newCategoryInput =
    document.getElementById(
        "newCategory"
    );

const backupReminder =
    document.getElementById(
        "backupReminder"
    );

/* ==========================================
   ALERT HELPERS
========================================== */

function hideMessages() {

    if (errorBox) {
        errorBox.classList.add(
            "hidden"
        );
        errorBox.textContent = "";
    }

    if (successBox) {
        successBox.classList.add(
            "hidden"
        );
        successBox.textContent = "";
    }
}

function showError(message) {

    if (!errorBox) return;

    errorBox.textContent =
        message;

    errorBox.classList.remove(
        "hidden"
    );

    successBox?.classList.add(
        "hidden"
    );
}

function showSuccess(message) {

    if (!successBox) return;

    successBox.textContent =
        message;

    successBox.classList.remove(
        "hidden"
    );

    errorBox?.classList.add(
        "hidden"
    );
}

/* ==========================================
   CATEGORY DROPDOWN
========================================== */

function populateCategoryDropdown() {

    if (!categoryInput)
        return;

    const categories =
        getCategories();

    categoryInput.innerHTML =
        `<option value="">Select</option>`;

    categories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                category;

            option.textContent =
                category;

            categoryInput.appendChild(
                option
            );
        }
    );
}

/* ==========================================
   ADD CATEGORY
========================================== */

function handleAddCategory() {

    const category =
        newCategoryInput.value.trim();

    if (!category) {

        showError(
            "Enter a category name."
        );

        return;
    }

    const success =
        addCategory(category);

    if (!success) {

        showError(
            "Category already exists."
        );

        return;
    }

    populateCategoryDropdown();

    newCategoryInput.value = "";

    showSuccess(
        "Category added."
    );
}

/* ==========================================
   SUMMARY CARDS
========================================== */

function updateSummaryCards() {

    const totals =
        calculateTotals();

    if (balanceElement)
        balanceElement.textContent =
            paiseToRupees(
                totals.balance
            );

    if (incomeElement)
        incomeElement.textContent =
            paiseToRupees(
                totals.income
            );

    if (expenseElement)
        expenseElement.textContent =
            paiseToRupees(
                totals.expense
            );
}

/* ==========================================
   RECENT TRANSACTIONS
========================================== */

function renderRecentTransactions() {

    if (
        !recentTransactionsContainer
    ) {
        return;
    }

    const transactions =
        getTransactions()
            .sort(
                (a, b) =>
                    b.createdAt -
                    a.createdAt
            )
            .slice(0, 5);

    if (
        transactions.length === 0
    ) {

        recentTransactionsContainer.innerHTML =
            `
            <div class="empty-state">
                No transactions yet.
            </div>
        `;

        return;
    }

    recentTransactionsContainer.innerHTML =
        "";

    transactions.forEach(
        transaction => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "transaction-item";

            const amountClass =
                transaction.type ===
                "Income"
                    ? "amount-income"
                    : "amount-expense";

            const sign =
                transaction.type ===
                "Income"
                    ? "+"
                    : "-";

            div.innerHTML =
                `
                <div class="transaction-info">
                    <div class="transaction-title">
                        ${transaction.category}
                    </div>

                    <div class="transaction-meta">
                        ${transaction.date}
                        •
                        ${transaction.method}
                    </div>
                </div>

                <div class="transaction-amount ${amountClass}">
                    ${sign}
                    ${paiseToRupees(
                        transaction.amountPaise
                    )}
                </div>
            `;

            recentTransactionsContainer.appendChild(
                div
            );
        }
    );
}

/* ==========================================
   BACKUP REMINDER
========================================== */

function checkBackupReminder() {

    if (!backupReminder)
        return;

    const lastBackup =
        getLastBackupDate();

    if (!lastBackup) {

        backupReminder.classList.remove(
            "hidden"
        );

        return;
    }

    const THIRTY_DAYS =
        30 *
        24 *
        60 *
        60 *
        1000;

    const elapsed =
        Date.now() -
        Number(lastBackup);

    if (
        elapsed >= THIRTY_DAYS
    ) {

        backupReminder.classList.remove(
            "hidden"
        );

    } else {

        backupReminder.classList.add(
            "hidden"
        );
    }
}

/* ==========================================
   FORM VALIDATION
========================================== */

function validateForm() {

    const date =
        dateInput.value.trim();

    const type =
        typeInput.value.trim();

    const amount =
        amountInput.value.trim();

    const category =
        categoryInput.value.trim();

    const method =
        methodInput.value.trim();

    if (!date) {
        showError(
            "Date is required."
        );
        return false;
    }

    if (!type) {
        showError(
            "Select Income or Expense."
        );
        return false;
    }

    if (!amount) {
        showError(
            "Amount is required."
        );
        return false;
    }

    const paise =
        rupeesToPaise(amount);

    if (
        paise === null ||
        paise <= 0
    ) {
        showError(
            "Enter a valid amount."
        );
        return false;
    }

    if (!category) {
        showError(
            "Select category."
        );
        return false;
    }

    if (!method) {
        showError(
            "Select payment method."
        );
        return false;
    }

    return true;
}

/* ==========================================
   RESET FORM
========================================== */

function resetForm() {

    transactionForm.reset();

    dateInput.value =
        new Date()
            .toISOString()
            .split("T")[0];
}

/* ==========================================
   CREATE TRANSACTION OBJECT
========================================== */

function buildTransaction() {

    const timestamp =
        nowTimestamp();

    return {

        id: generateId(),

        date:
            dateInput.value,

        type:
            typeInput.value,

        amountPaise:
            rupeesToPaise(
                amountInput.value
            ),

        category:
            categoryInput.value,

        method:
            methodInput.value,

        note:
            noteInput.value.trim(),

        createdAt:
            timestamp,

        updatedAt:
            timestamp
    };
}

/* ==========================================
   SUBMIT TRANSACTION
========================================== */

async function handleSubmit(
    event
) {

    event.preventDefault();

    hideMessages();

    if (
        AppState.isSubmitting
    ) {
        return;
    }

    if (!validateForm())
        return;

    AppState.isSubmitting =
        true;

    saveButton.disabled =
        true;

    try {

        const transaction =
            buildTransaction();

        if (
            isDuplicateTransaction(
                transaction
            )
        ) {

            showError(
                "Possible duplicate transaction detected."
            );

            return;
        }

        const success =
            saveTransaction(
                transaction
            );

        if (!success) {

            showError(
                "Unable to save transaction."
            );

            return;
        }

        updateSummaryCards();

        renderRecentTransactions();

        resetForm();

        showSuccess(
            "Transaction saved successfully."
        );

    } catch (error) {

        console.error(error);

        showError(
            "Unexpected error occurred."
        );

    } finally {

        AppState.isSubmitting =
            false;

        saveButton.disabled =
            false;
    }
}

/* ==========================================
   INITIALIZE PAGE
========================================== */

function initializeHomePage() {

    if (!transactionForm)
        return;

    populateCategoryDropdown();

    updateSummaryCards();

    renderRecentTransactions();

    checkBackupReminder();

    dateInput.value =
        new Date()
            .toISOString()
            .split("T")[0];

    transactionForm.addEventListener(
        "submit",
        handleSubmit
    );

    categoryAddButton?.addEventListener(
        "click",
        handleAddCategory
    );
}

/*PAGE START*/

document.addEventListener(
    "DOMContentLoaded",
    () => {

        try {

            initializeHomePage();

        } catch (error) {

            console.error(
                "Initialization Error:",
                error
            );
        }
    }
);