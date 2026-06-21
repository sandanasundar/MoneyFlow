"use strict";

/* ==========================================
   SETTINGS STATE
========================================== */

const SETTINGS = {
    selectedFile: null,
    pendingAction: null
};

/* ==========================================
   ELEMENTS
========================================== */

const exportBtn =
    document.getElementById("exportBtn");

const importBtn =
    document.getElementById("importBtn");

const importFile =
    document.getElementById("importFile");

const backupStatus =
    document.getElementById("backupStatus");

const backupError =
    document.getElementById("backupError");

const transactionCountEl =
    document.getElementById(
        "settingsTransactionCount"
    );

const goalCountEl =
    document.getElementById(
        "settingsGoalCount"
    );

const lastBackupDisplay =
    document.getElementById(
        "lastBackupDisplay"
    );

const clearTransactionsBtn =
    document.getElementById(
        "clearTransactionsBtn"
    );

const clearGoalsBtn =
    document.getElementById(
        "clearGoalsBtn"
    );

const resetAppBtn =
    document.getElementById(
        "resetAppBtn"
    );

const confirmModal =
    document.getElementById(
        "settingsConfirmModal"
    );

const confirmText =
    document.getElementById(
        "settingsConfirmText"
    );

const confirmBtn =
    document.getElementById(
        "settingsConfirmBtn"
    );

const cancelBtn =
    document.getElementById(
        "settingsCancelBtn"
    );

/* ==========================================
   UI HELPERS
========================================== */

function hideMessages() {

    backupStatus.classList.add(
        "hidden"
    );

    backupError.classList.add(
        "hidden"
    );
}

function showStatus(message) {

    hideMessages();

    backupStatus.textContent =
        message;

    backupStatus.classList.remove(
        "hidden"
    );
}

function showError(message) {

    hideMessages();

    backupError.textContent =
        message;

    backupError.classList.remove(
        "hidden"
    );
}

/* ==========================================
   STATS
========================================== */

function updateStats() {

    transactionCountEl.textContent =
        getTransactions().length;

    goalCountEl.textContent =
        getSavingsGoals().length;

    const lastBackup =
        getLastBackupDate();

    if (!lastBackup) {

        lastBackupDisplay.textContent =
            "Never";

        return;
    }

    const date =
        new Date(
            Number(lastBackup)
        );

    lastBackupDisplay.textContent =
        date.toLocaleDateString();
}

/* ==========================================
   EXPORT
========================================== */

function exportBackup() {

    try {

        const backup = {

            version: 1,

            exportedAt:
                nowTimestamp(),

            transactions:
                getTransactions(),

            savings:
                getSavingsGoals(),

            categories:
                getCategories()
        };

        const json =
            JSON.stringify(
                backup,
                null,
                2
            );

        const blob =
            new Blob(
                [json],
                {
                    type:
                    "application/json"
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const a =
            document.createElement(
                "a"
            );

        const date =
            new Date()
            .toISOString()
            .split("T")[0];

        a.href = url;

        a.download =
            `moneyflow-backup-${date}.json`;

        document.body.appendChild(
            a
        );

        a.click();

        document.body.removeChild(
            a
        );

        URL.revokeObjectURL(
            url
        );

        setLastBackupDate();

        updateStats();

        showStatus(
            "Backup exported successfully."
        );

    } catch (error) {

        console.error(error);

        showError(
            "Failed to export backup."
        );
    }
}

/* ==========================================
   IMPORT VALIDATION
========================================== */

function validateBackupData(data) {

    if (
        !data ||
        typeof data !== "object"
    ) {
        return false;
    }

    if (
        !Array.isArray(
            data.transactions
        )
    ) {
        return false;
    }

    if (
        !Array.isArray(
            data.savings
        )
    ) {
        return false;
    }

    if (
        !Array.isArray(
            data.categories
        )
    ) {
        return false;
    }

    for (
        const tx of
        data.transactions
    ) {

        if (
            !validateTransaction(
                tx
            )
        ) {
            return false;
        }
    }

    for (
        const goal of
        data.savings
    ) {

        if (
            !validateSavingsGoal(
                goal
            )
        ) {
            return false;
        }
    }

    return true;
}

/* ==========================================
   IMPORT
========================================== */

async function importBackup() {

    hideMessages();

    const file =
        SETTINGS.selectedFile;

    if (!file) {

        showError(
            "Select a backup file first."
        );

        return;
    }

    try {

        const text =
            await file.text();

        const data =
            JSON.parse(text);

        const valid =
            validateBackupData(
                data
            );

        if (!valid) {

            showError(
                "Backup file is invalid or corrupted."
            );

            return;
        }

        writeStorage(
            STORAGE_KEYS.TRANSACTIONS,
            data.transactions
        );

        writeStorage(
            STORAGE_KEYS.SAVINGS,
            data.savings
        );

        writeStorage(
            STORAGE_KEYS.CATEGORIES,
            data.categories
        );

        showStatus(
            "Backup imported successfully."
        );

        updateStats();

    } catch (error) {

        console.error(error);

        showError(
            "Import failed. Invalid JSON file."
        );
    }
}

/* ==========================================
   CONFIRM MODAL
========================================== */

function openConfirmModal(
    text,
    action
) {

    SETTINGS.pendingAction =
        action;

    confirmText.textContent =
        text;

    confirmModal.classList.remove(
        "hidden"
    );
}

function closeConfirmModal() {

    SETTINGS.pendingAction =
        null;

    confirmModal.classList.add(
        "hidden"
    );
}

/* ==========================================
   DATA ACTIONS
========================================== */

function clearTransactions() {

    writeStorage(
        STORAGE_KEYS.TRANSACTIONS,
        []
    );

    showStatus(
        "Transactions cleared."
    );

    updateStats();
}

function clearGoals() {

    writeStorage(
        STORAGE_KEYS.SAVINGS,
        []
    );

    showStatus(
        "Savings goals cleared."
    );

    updateStats();
}

function resetApp() {

    writeStorage(
        STORAGE_KEYS.TRANSACTIONS,
        []
    );

    writeStorage(
        STORAGE_KEYS.SAVINGS,
        []
    );

    writeStorage(
        STORAGE_KEYS.CATEGORIES,
        [...DEFAULT_CATEGORIES]
    );

    clearStorageKey(
        STORAGE_KEYS.LAST_BACKUP
    );

    showStatus(
        "Application reset successfully."
    );

    updateStats();
}

/* ==========================================
   CONFIRM ACTION
========================================== */

function executeAction() {

    switch (
        SETTINGS.pendingAction
    ) {

        case "transactions":
            clearTransactions();
            break;

        case "goals":
            clearGoals();
            break;

        case "reset":
            resetApp();
            break;
    }

    closeConfirmModal();
}

/* ==========================================
   EVENTS
========================================== */

function attachEvents() {

    exportBtn.addEventListener(
        "click",
        exportBackup
    );

    importFile.addEventListener(
        "change",
        event => {

            SETTINGS.selectedFile =
                event.target.files[0];
        }
    );

    importBtn.addEventListener(
        "click",
        importBackup
    );

    clearTransactionsBtn
        .addEventListener(
            "click",
            () =>
                openConfirmModal(
                    "Delete ALL transactions?",
                    "transactions"
                )
        );

    clearGoalsBtn
        .addEventListener(
            "click",
            () =>
                openConfirmModal(
                    "Delete ALL savings goals?",
                    "goals"
                )
        );

    resetAppBtn
        .addEventListener(
            "click",
            () =>
                openConfirmModal(
                    "Reset the entire application?",
                    "reset"
                )
        );

    confirmBtn
        .addEventListener(
            "click",
            executeAction
        );

    cancelBtn
        .addEventListener(
            "click",
            closeConfirmModal
        );
}

/* ==========================================
   INIT
========================================== */

function initializeSettings() {

    if (!exportBtn)
        return;

    attachEvents();

    updateStats();
}

document.addEventListener(
    "DOMContentLoaded",
    initializeSettings
);