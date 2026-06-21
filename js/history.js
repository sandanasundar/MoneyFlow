"use strict";

/* ==========================================
   HISTORY PAGE
========================================== */

const HISTORY = {
    currentPage: 1,
    itemsPerPage: 10,
    filteredTransactions: [],
    deleteId: null
};

/* ==========================================
   ELEMENTS
========================================== */

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");
const methodFilter = document.getElementById("methodFilter");
const monthFilter = document.getElementById("monthFilter");
const sortSelect = document.getElementById("sortSelect");

const tableBody = document.getElementById("historyTableBody");
const emptyHistory = document.getElementById("emptyHistory");
const paginationContainer = document.getElementById("pagination");

const filteredIncome = document.getElementById("filteredIncome");
const filteredExpense = document.getElementById("filteredExpense");
const transactionCount = document.getElementById("transactionCount");

const editModal = document.getElementById("editModal");
const deleteModal = document.getElementById("deleteModal");

const editForm = document.getElementById("editForm");

const editId = document.getElementById("editId");
const editDate = document.getElementById("editDate");
const editType = document.getElementById("editType");
const editAmount = document.getElementById("editAmount");
const editCategory = document.getElementById("editCategory");
const editMethod = document.getElementById("editMethod");
const editNote = document.getElementById("editNote");

const closeEditModal =
    document.getElementById("closeEditModal");

const cancelDelete =
    document.getElementById("cancelDelete");

const confirmDelete =
    document.getElementById("confirmDelete");

/* ==========================================
   CATEGORY OPTIONS
========================================== */

function populateCategories() {

    const categories =
        getCategories();

    categoryFilter.innerHTML =
        `<option value="">All Categories</option>`;

    editCategory.innerHTML = "";

    categories.forEach(category => {

        const filterOption =
            document.createElement("option");

        filterOption.value = category;
        filterOption.textContent = category;

        categoryFilter.appendChild(
            filterOption
        );

        const editOption =
            document.createElement("option");

        editOption.value = category;
        editOption.textContent = category;

        editCategory.appendChild(
            editOption
        );
    });
}

/* ==========================================
   FILTERING
========================================== */

function getFilteredTransactions() {

    let transactions =
        [...getTransactions()];

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const type =
        typeFilter.value;

    const category =
        categoryFilter.value;

    const method =
        methodFilter.value;

    const month =
        monthFilter.value;

    if (search) {

        transactions =
            transactions.filter(tx => {

                return (
                    tx.category
                        .toLowerCase()
                        .includes(search) ||

                    tx.method
                        .toLowerCase()
                        .includes(search) ||

                    tx.note
                        .toLowerCase()
                        .includes(search)
                );
            });
    }

    if (type) {

        transactions =
            transactions.filter(
                tx => tx.type === type
            );
    }

    if (category) {

        transactions =
            transactions.filter(
                tx =>
                    tx.category === category
            );
    }

    if (method) {

        transactions =
            transactions.filter(
                tx =>
                    tx.method === method
            );
    }

    if (month) {

        transactions =
            transactions.filter(tx =>
                tx.date.startsWith(month)
            );
    }

    applySorting(transactions);

    return transactions;
}

/* ==========================================
   SORTING
========================================== */

function applySorting(transactions) {

    const sort =
        sortSelect.value;

    switch (sort) {

        case "newest":

            transactions.sort(
                (a, b) =>
                    b.createdAt -
                    a.createdAt
            );

            break;

        case "oldest":

            transactions.sort(
                (a, b) =>
                    a.createdAt -
                    b.createdAt
            );

            break;

        case "amountDesc":

            transactions.sort(
                (a, b) =>
                    b.amountPaise -
                    a.amountPaise
            );

            break;

        case "amountAsc":

            transactions.sort(
                (a, b) =>
                    a.amountPaise -
                    b.amountPaise
            );

            break;
    }
}

/* ==========================================
   SUMMARY
========================================== */

function updateSummary() {

    let income = 0;
    let expense = 0;

    HISTORY.filteredTransactions
        .forEach(tx => {

            if (
                tx.type === "Income"
            ) {

                income +=
                    tx.amountPaise;

            } else {

                expense +=
                    tx.amountPaise;
            }
        });

    filteredIncome.textContent =
        paiseToRupees(income);

    filteredExpense.textContent =
        paiseToRupees(expense);

    transactionCount.textContent =
        HISTORY.filteredTransactions.length;
}

/* ==========================================
   TABLE
========================================== */

function renderTable() {

    tableBody.innerHTML = "";

    const start =
        (HISTORY.currentPage - 1) *
        HISTORY.itemsPerPage;

    const end =
        start +
        HISTORY.itemsPerPage;

    const pageData =
        HISTORY.filteredTransactions
            .slice(start, end);

    if (
        HISTORY.filteredTransactions
            .length === 0
    ) {

        emptyHistory.classList.remove(
            "hidden"
        );

        renderPagination();

        return;
    }

    emptyHistory.classList.add(
        "hidden"
    );

    pageData.forEach(tx => {

        const row =
            document.createElement("tr");

        const amountClass =
            tx.type === "Income"
                ? "amount-income"
                : "amount-expense";

        row.innerHTML = `
            <td>${tx.date}</td>
            <td>${tx.type}</td>
            <td>${tx.category}</td>
            <td>${tx.method}</td>

            <td class="${amountClass}">
                ${paiseToRupees(
                    tx.amountPaise
                )}
            </td>

            <td>${escapeHTML(
                tx.note || ""
            )}</td>

            <td>

                <button
                    class="secondary-btn edit-btn"
                    data-id="${tx.id}">
                    Edit
                </button>

                <button
                    class="danger-btn delete-btn"
                    data-id="${tx.id}">
                    Delete
                </button>

            </td>
        `;

        tableBody.appendChild(row);
    });

    attachActionButtons();

    renderPagination();
}

/* ==========================================
   PAGINATION
========================================== */

function renderPagination() {

    paginationContainer.innerHTML = "";

    const pages =
        Math.ceil(
            HISTORY.filteredTransactions
                .length /
            HISTORY.itemsPerPage
        );

    if (pages <= 1)
        return;

    for (
        let i = 1;
        i <= pages;
        i++
    ) {

        const button =
            document.createElement(
                "button"
            );

        button.textContent = i;

        button.className =
            i === HISTORY.currentPage
                ? "primary-btn"
                : "secondary-btn";

        button.addEventListener(
            "click",
            () => {

                HISTORY.currentPage = i;

                renderTable();
            }
        );

        paginationContainer
            .appendChild(button);
    }
}

/* ==========================================
   ESCAPE HTML
========================================== */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}

/* ==========================================
   REFRESH
========================================== */

function refreshHistory() {

    HISTORY.filteredTransactions =
        getFilteredTransactions();

    HISTORY.currentPage = 1;

    updateSummary();

    renderTable();
}

/* ==========================================
   EDIT MODAL
========================================== */

function openEditModal(id) {

    const transaction =
        getTransactions()
        .find(
            tx => tx.id === id
        );

    if (!transaction)
        return;

    editId.value =
        transaction.id;

    editDate.value =
        transaction.date;

    editType.value =
        transaction.type;

    editAmount.value =
        (
            transaction.amountPaise / 100
        ).toFixed(2);

    editCategory.value =
        transaction.category;

    editMethod.value =
        transaction.method;

    editNote.value =
        transaction.note || "";

    editModal.classList.remove(
        "hidden"
    );
}

function closeEdit() {

    editModal.classList.add(
        "hidden"
    );
}

/* ==========================================
   SAVE EDIT
========================================== */

function saveEdit(event) {

    event.preventDefault();

    const id =
        editId.value;

    const transactions =
        getTransactions();

    const existing =
        transactions.find(
            tx => tx.id === id
        );

    if (!existing)
        return;

    const paise =
        rupeesToPaise(
            editAmount.value
        );

    if (
        paise === null ||
        paise <= 0
    ) {

        alert(
            "Invalid amount."
        );

        return;
    }

    const updated = {

        ...existing,

        date:
            editDate.value,

        type:
            editType.value,

        amountPaise:
            paise,

        category:
            editCategory.value,

        method:
            editMethod.value,

        note:
            editNote.value.trim(),

        updatedAt:
            nowTimestamp()
    };

    if (
        !validateTransaction(
            updated
        )
    ) {

        alert(
            "Invalid transaction."
        );

        return;
    }

    updateTransaction(
        updated
    );

    closeEdit();

    refreshHistory();
}

/* ==========================================
   DELETE
========================================== */

function openDeleteModal(id) {

    HISTORY.deleteId = id;

    deleteModal.classList.remove(
        "hidden"
    );
}

function closeDelete() {

    HISTORY.deleteId = null;

    deleteModal.classList.add(
        "hidden"
    );
}

function confirmDeleteTransaction() {

    if (
        !HISTORY.deleteId
    ) {
        return;
    }

    deleteTransaction(
        HISTORY.deleteId
    );

    closeDelete();

    refreshHistory();
}

/* ==========================================
   BUTTON EVENTS
========================================== */

function attachActionButtons() {

    document
        .querySelectorAll(
            ".edit-btn"
        )
        .forEach(btn => {

            btn.addEventListener(
                "click",
                () => {

                    openEditModal(
                        btn.dataset.id
                    );
                }
            );
        });

    document
        .querySelectorAll(
            ".delete-btn"
        )
        .forEach(btn => {

            btn.addEventListener(
                "click",
                () => {

                    openDeleteModal(
                        btn.dataset.id
                    );
                }
            );
        });
}

/* ==========================================
   FILTER EVENTS
========================================== */

function attachFilters() {

    [
        searchInput,
        typeFilter,
        categoryFilter,
        methodFilter,
        monthFilter,
        sortSelect
    ]
    .forEach(element => {

        element.addEventListener(
            "input",
            refreshHistory
        );

        element.addEventListener(
            "change",
            refreshHistory
        );
    });
}

/* ==========================================
   INIT
========================================== */

function initializeHistory() {

    if (!tableBody)
        return;

    populateCategories();

    attachFilters();

    refreshHistory();

    editForm.addEventListener(
        "submit",
        saveEdit
    );

    closeEditModal
        .addEventListener(
            "click",
            closeEdit
        );

    cancelDelete
        .addEventListener(
            "click",
            closeDelete
        );

    confirmDelete
        .addEventListener(
            "click",
            confirmDeleteTransaction
        );
}

document.addEventListener(
    "DOMContentLoaded",
    initializeHistory
);