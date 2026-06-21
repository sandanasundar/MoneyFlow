"use strict";

/* ==========================================
   SAVINGS PAGE STATE
========================================== */

const SAVINGS_STATE = {
    deleteGoalId: null
};

/* ==========================================
   ELEMENTS
========================================== */

const goalForm =
    document.getElementById("goalForm");

const goalName =
    document.getElementById("goalName");

const goalTarget =
    document.getElementById("goalTarget");

const goalsContainer =
    document.getElementById("goalsContainer");

const goalCount =
    document.getElementById("goalCount");

const totalSaved =
    document.getElementById("totalSaved");

const totalTarget =
    document.getElementById("totalTarget");

/* Edit Modal */

const editGoalModal =
    document.getElementById("editGoalModal");

const editGoalForm =
    document.getElementById("editGoalForm");

const editGoalId =
    document.getElementById("editGoalId");

const editGoalName =
    document.getElementById("editGoalName");

const editGoalTarget =
    document.getElementById("editGoalTarget");

const closeGoalEdit =
    document.getElementById("closeGoalEdit");

/* Delete Modal */

const deleteGoalModal =
    document.getElementById("deleteGoalModal");

const cancelGoalDelete =
    document.getElementById("cancelGoalDelete");

const confirmGoalDelete =
    document.getElementById("confirmGoalDelete");

/* ==========================================
   STORAGE HELPERS
========================================== */

function saveGoals(goals) {

    return writeStorage(
        STORAGE_KEYS.SAVINGS,
        goals
    );
}

function getGoalById(id) {

    return getSavingsGoals()
        .find(
            goal => goal.id === id
        );
}

/* ==========================================
   CREATE GOAL
========================================== */

function createGoal(event) {

    event.preventDefault();

    const name =
        goalName.value.trim();

    const targetPaise =
        rupeesToPaise(
            goalTarget.value
        );

    if (!name) {

        alert(
            "Goal name is required."
        );

        return;
    }

    if (
        targetPaise === null ||
        targetPaise <= 0
    ) {

        alert(
            "Enter a valid target amount."
        );

        return;
    }

    const timestamp =
        nowTimestamp();

    const goal = {

        id:
            generateId(),

        name,

        targetPaise,

        currentPaise: 0,

        createdAt:
            timestamp,

        updatedAt:
            timestamp
    };

    if (
        !validateSavingsGoal(
            goal
        )
    ) {

        alert(
            "Invalid goal data."
        );

        return;
    }

    const goals =
        getSavingsGoals();

    goals.push(goal);

    saveGoals(goals);

    goalForm.reset();

    refreshSavingsPage();
}

/* ==========================================
   SUMMARY
========================================== */

function updateSummary() {

    const goals =
        getSavingsGoals();

    let saved = 0;
    let target = 0;

    goals.forEach(goal => {

        saved +=
            goal.currentPaise;

        target +=
            goal.targetPaise;
    });

    goalCount.textContent =
        goals.length;

    totalSaved.textContent =
        paiseToRupees(saved);

    totalTarget.textContent =
        paiseToRupees(target);
}

/* ==========================================
   PROGRESS
========================================== */

function calculateProgress(goal) {

    if (
        goal.targetPaise <= 0
    ) {
        return 0;
    }

    return Math.min(
        100,
        (
            goal.currentPaise /
            goal.targetPaise
        ) * 100
    );
}

/* ==========================================
   ADD MONEY
========================================== */

function addMoney(id) {

    const amount =
        prompt(
            "Amount to add (₹)"
        );

    if (
        amount === null
    ) return;

    const paise =
        rupeesToPaise(amount);

    if (
        paise === null ||
        paise <= 0
    ) {

        alert(
            "Invalid amount."
        );

        return;
    }

    const goals =
        getSavingsGoals();

    const goal =
        goals.find(
            g => g.id === id
        );

    if (!goal)
        return;

    goal.currentPaise +=
        paise;

    goal.updatedAt =
        nowTimestamp();

    saveGoals(goals);

    refreshSavingsPage();
}

/* ==========================================
   REMOVE MONEY
========================================== */

function removeMoney(id) {

    const amount =
        prompt(
            "Amount to remove (₹)"
        );

    if (
        amount === null
    ) return;

    const paise =
        rupeesToPaise(amount);

    if (
        paise === null ||
        paise <= 0
    ) {

        alert(
            "Invalid amount."
        );

        return;
    }

    const goals =
        getSavingsGoals();

    const goal =
        goals.find(
            g => g.id === id
        );

    if (!goal)
        return;

    if (
        paise >
        goal.currentPaise
    ) {

        alert(
            "Cannot remove more than saved."
        );

        return;
    }

    goal.currentPaise -=
        paise;

    goal.updatedAt =
        nowTimestamp();

    saveGoals(goals);

    refreshSavingsPage();
}

/* ==========================================
   EDIT GOAL
========================================== */

function openEditGoal(id) {

    const goal =
        getGoalById(id);

    if (!goal)
        return;

    editGoalId.value =
        goal.id;

    editGoalName.value =
        goal.name;

    editGoalTarget.value =
        (
            goal.targetPaise / 100
        ).toFixed(2);

    editGoalModal
        .classList
        .remove("hidden");
}

function closeEditGoal() {

    editGoalModal
        .classList
        .add("hidden");
}

function saveGoalEdit(event) {

    event.preventDefault();

    const goals =
        getSavingsGoals();

    const goal =
        goals.find(
            g =>
                g.id ===
                editGoalId.value
        );

    if (!goal)
        return;

    const targetPaise =
        rupeesToPaise(
            editGoalTarget.value
        );

    if (
        targetPaise === null ||
        targetPaise <= 0
    ) {

        alert(
            "Invalid target amount."
        );

        return;
    }

    goal.name =
        editGoalName.value.trim();

    goal.targetPaise =
        targetPaise;

    goal.updatedAt =
        nowTimestamp();

    if (
        !validateSavingsGoal(
            goal
        )
    ) {

        alert(
            "Invalid goal."
        );

        return;
    }

    saveGoals(goals);

    closeEditGoal();

    refreshSavingsPage();
}

/* ==========================================
   DELETE GOAL
========================================== */

function openDeleteGoal(id) {

    SAVINGS_STATE
        .deleteGoalId = id;

    deleteGoalModal
        .classList
        .remove("hidden");
}

function closeDeleteGoal() {

    SAVINGS_STATE
        .deleteGoalId = null;

    deleteGoalModal
        .classList
        .add("hidden");
}

function confirmDeleteGoalAction() {

    if (
        !SAVINGS_STATE
            .deleteGoalId
    ) {
        return;
    }

    const goals =
        getSavingsGoals()
        .filter(
            goal =>
                goal.id !==
                SAVINGS_STATE
                    .deleteGoalId
        );

    saveGoals(goals);

    closeDeleteGoal();

    refreshSavingsPage();
}

/* ==========================================
   GOAL CARDS
========================================== */

function renderGoals() {

    const goals =
        getSavingsGoals();

    if (
        goals.length === 0
    ) {

        goalsContainer.innerHTML =
        `
        <div class="empty-state">
            No savings goals yet.
        </div>
        `;

        return;
    }

    goalsContainer.innerHTML =
        "";

    goals.forEach(goal => {

        const progress =
            calculateProgress(
                goal
            );

        const remaining =
            Math.max(
                0,
                goal.targetPaise -
                goal.currentPaise
            );

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "goal-card";

        card.innerHTML =
        `
        <div class="goal-header">

            <h3>
                ${goal.name}
            </h3>

            <div>

                <button
                class="secondary-btn edit-goal-btn"
                data-id="${goal.id}">
                Edit
                </button>

                <button
                class="danger-btn delete-goal-btn"
                data-id="${goal.id}">
                Delete
                </button>

            </div>

        </div>

        <p>
            Saved:
            ${paiseToRupees(
                goal.currentPaise
            )}
        </p>

        <p>
            Target:
            ${paiseToRupees(
                goal.targetPaise
            )}
        </p>

        <p>
            Remaining:
            ${paiseToRupees(
                remaining
            )}
        </p>

        <p>
            Completion:
            ${progress.toFixed(1)}%
        </p>

        <div class="progress">
            <div
            class="progress-fill"
            style="width:${progress}%">
            </div>
        </div>

        <br>

        <button
            class="primary-btn add-money-btn"
            data-id="${goal.id}">
            Add Money
        </button>

        <br><br>

        <button
            class="secondary-btn remove-money-btn"
            data-id="${goal.id}">
            Remove Money
        </button>
        `;

        goalsContainer
            .appendChild(card);
    });

    attachGoalButtons();
}

/* ==========================================
   BUTTON EVENTS
========================================== */

function attachGoalButtons() {

    document
        .querySelectorAll(
            ".add-money-btn"
        )
        .forEach(btn => {

            btn.addEventListener(
                "click",
                () =>
                    addMoney(
                        btn.dataset.id
                    )
            );
        });

    document
        .querySelectorAll(
            ".remove-money-btn"
        )
        .forEach(btn => {

            btn.addEventListener(
                "click",
                () =>
                    removeMoney(
                        btn.dataset.id
                    )
            );
        });

    document
        .querySelectorAll(
            ".edit-goal-btn"
        )
        .forEach(btn => {

            btn.addEventListener(
                "click",
                () =>
                    openEditGoal(
                        btn.dataset.id
                    )
            );
        });

    document
        .querySelectorAll(
            ".delete-goal-btn"
        )
        .forEach(btn => {

            btn.addEventListener(
                "click",
                () =>
                    openDeleteGoal(
                        btn.dataset.id
                    )
            );
        });
}

/* ==========================================
   REFRESH
========================================== */

function refreshSavingsPage() {

    updateSummary();

    renderGoals();
}

/* ==========================================
   INIT
========================================== */

function initializeSavings() {

    if (!goalForm)
        return;

    goalForm.addEventListener(
        "submit",
        createGoal
    );

    editGoalForm.addEventListener(
        "submit",
        saveGoalEdit
    );

    closeGoalEdit.addEventListener(
        "click",
        closeEditGoal
    );

    cancelGoalDelete
        .addEventListener(
            "click",
            closeDeleteGoal
        );

    confirmGoalDelete
        .addEventListener(
            "click",
            confirmDeleteGoalAction
        );

    refreshSavingsPage();
}

document.addEventListener(
    "DOMContentLoaded",
    initializeSavings
);