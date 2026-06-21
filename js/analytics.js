"use strict";

/* ==========================================
   ANALYTICS STATE
========================================== */

const ANALYTICS = {
    expensePieChart: null,
    methodPieChart: null,
    monthlyExpenseChart: null,
    monthlyIncomeChart: null
};

/* ==========================================
   ELEMENTS
========================================== */

const analyticsRange =
    document.getElementById("analyticsRange");

const startDateInput =
    document.getElementById("startDate");

const endDateInput =
    document.getElementById("endDate");

const analyticsIncome =
    document.getElementById("analyticsIncome");

const analyticsExpense =
    document.getElementById("analyticsExpense");

const analyticsBalance =
    document.getElementById("analyticsBalance");

const analyticsSavingsGoals =
    document.getElementById("analyticsSavingsGoals");

const analyticsTransactions =
    document.getElementById("analyticsTransactions");

const mostSpentCategory =
    document.getElementById("mostSpentCategory");

const leastSpentCategory =
    document.getElementById("leastSpentCategory");

const mostUsedMethod =
    document.getElementById("mostUsedMethod");

const largestExpense =
    document.getElementById("largestExpense");

const largestIncome =
    document.getElementById("largestIncome");

const insightsContainer =
    document.getElementById("insightsContainer");

/* ==========================================
   DATE FILTERS
========================================== */

function getFilteredAnalyticsTransactions() {

    const transactions =
        getTransactions();

    const range =
        analyticsRange.value;

    const now =
        new Date();

    return transactions.filter(tx => {

        const txDate =
            new Date(tx.date);

        switch (range) {

            case "thisMonth":

                return (
                    txDate.getMonth() ===
                        now.getMonth() &&
                    txDate.getFullYear() ===
                        now.getFullYear()
                );

            case "lastMonth": {

                const lastMonth =
                    new Date();

                lastMonth.setMonth(
                    now.getMonth() - 1
                );

                return (
                    txDate.getMonth() ===
                        lastMonth.getMonth() &&
                    txDate.getFullYear() ===
                        lastMonth.getFullYear()
                );
            }

            case "thisYear":

                return (
                    txDate.getFullYear() ===
                    now.getFullYear()
                );

            case "custom": {

                if (
                    !startDateInput.value ||
                    !endDateInput.value
                ) {
                    return false;
                }

                const start =
                    new Date(
                        startDateInput.value
                    );

                const end =
                    new Date(
                        endDateInput.value
                    );

                end.setHours(
                    23,
                    59,
                    59,
                    999
                );

                return (
                    txDate >= start &&
                    txDate <= end
                );
            }

            case "allTime":
            default:
                return true;
        }
    });
}

/* ==========================================
   SUMMARY
========================================== */

function updateSummary() {

    const transactions =
        getFilteredAnalyticsTransactions();

    let income = 0;
    let expense = 0;

    transactions.forEach(tx => {

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

    analyticsIncome.textContent =
        paiseToRupees(income);

    analyticsExpense.textContent =
        paiseToRupees(expense);

    analyticsBalance.textContent =
        paiseToRupees(
            income - expense
        );

    analyticsTransactions.textContent =
        transactions.length;

    analyticsSavingsGoals.textContent =
        getSavingsGoals().length;
}

/* ==========================================
   STATISTICS
========================================== */

function updateStatistics() {

    const transactions =
        getFilteredAnalyticsTransactions();

    const expenses =
        transactions.filter(
            tx =>
                tx.type === "Expense"
        );

    const incomes =
        transactions.filter(
            tx =>
                tx.type === "Income"
        );

    const categoryMap = {};
    const methodMap = {};

    expenses.forEach(tx => {

        categoryMap[
            tx.category
        ] =
            (
                categoryMap[
                    tx.category
                ] || 0
            ) +
            tx.amountPaise;
    });

    transactions.forEach(tx => {

        methodMap[
            tx.method
        ] =
            (
                methodMap[
                    tx.method
                ] || 0
            ) + 1;
    });

    const categoryEntries =
        Object.entries(
            categoryMap
        );

    if (
        categoryEntries.length
    ) {

        categoryEntries.sort(
            (a, b) =>
                b[1] - a[1]
        );

        mostSpentCategory.textContent =
            categoryEntries[0][0];

        leastSpentCategory.textContent =
            categoryEntries[
                categoryEntries.length - 1
            ][0];

    } else {

        mostSpentCategory.textContent =
            "-";

        leastSpentCategory.textContent =
            "-";
    }

    const methodEntries =
        Object.entries(
            methodMap
        );

    if (
        methodEntries.length
    ) {

        methodEntries.sort(
            (a, b) =>
                b[1] - a[1]
        );

        mostUsedMethod.textContent =
            methodEntries[0][0];

    } else {

        mostUsedMethod.textContent =
            "-";
    }

    if (expenses.length) {

        const largest =
            [...expenses].sort(
                (a, b) =>
                    b.amountPaise -
                    a.amountPaise
            )[0];

        largestExpense.textContent =
            `${largest.category} (${paiseToRupees(
                largest.amountPaise
            )})`;

    } else {

        largestExpense.textContent =
            "-";
    }

    if (incomes.length) {

        const largest =
            [...incomes].sort(
                (a, b) =>
                    b.amountPaise -
                    a.amountPaise
            )[0];

        largestIncome.textContent =
            `${largest.category} (${paiseToRupees(
                largest.amountPaise
            )})`;

    } else {

        largestIncome.textContent =
            "-";
    }
}

/* ==========================================
   CHART HELPERS
========================================== */

function destroyCharts() {

    [
        ANALYTICS.expensePieChart,
        ANALYTICS.methodPieChart,
        ANALYTICS.monthlyExpenseChart,
        ANALYTICS.monthlyIncomeChart
    ]
    .forEach(chart => {

        if (chart)
            chart.destroy();
    });
}

function createPieChart(
    canvasId,
    labels,
    values,
    chartRefName
) {

    const ctx =
        document
            .getElementById(
                canvasId
            )
            .getContext("2d");

    ANALYTICS[
        chartRefName
    ] =
        new Chart(ctx, {

            type: "pie",

            data: {

                labels,

                datasets: [{
                    data: values
                }]
            },

            options: {
                responsive: true
            }
        });
}

function createBarChart(
    canvasId,
    labels,
    values,
    chartRefName,
    title
) {

    const ctx =
        document
            .getElementById(
                canvasId
            )
            .getContext("2d");

    ANALYTICS[
        chartRefName
    ] =
        new Chart(ctx, {

            type: "bar",

            data: {

                labels,

                datasets: [{
                    label: title,
                    data: values
                }]
            },

            options: {

                responsive: true,

                scales: {

                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
}

/* ==========================================
   CHART DATA
========================================== */

function renderCharts() {

    destroyCharts();

    const transactions =
        getFilteredAnalyticsTransactions();

    /* Expense Categories */

    const expenseMap = {};

    transactions
        .filter(
            tx =>
                tx.type === "Expense"
        )
        .forEach(tx => {

            expenseMap[
                tx.category
            ] =
                (
                    expenseMap[
                        tx.category
                    ] || 0
                ) +
                tx.amountPaise;
        });

    createPieChart(
        "expensePieChart",
        Object.keys(
            expenseMap
        ),
        Object.values(
            expenseMap
        ),
        "expensePieChart"
    );

    /* Payment Methods */

    const methodMap = {};

    transactions.forEach(tx => {

        methodMap[
            tx.method
        ] =
            (
                methodMap[
                    tx.method
                ] || 0
            ) + 1;
    });

    createPieChart(
        "methodPieChart",
        Object.keys(
            methodMap
        ),
        Object.values(
            methodMap
        ),
        "methodPieChart"
    );

    /* Monthly Aggregation */

    const monthlyExpense = {};
    const monthlyIncome = {};

    transactions.forEach(tx => {

        const month =
            tx.date.slice(0, 7);

        if (
            tx.type === "Expense"
        ) {

            monthlyExpense[
                month
            ] =
                (
                    monthlyExpense[
                        month
                    ] || 0
                ) +
                tx.amountPaise;

        } else {

            monthlyIncome[
                month
            ] =
                (
                    monthlyIncome[
                        month
                    ] || 0
                ) +
                tx.amountPaise;
        }
    });

    createBarChart(
        "monthlyExpenseChart",
        Object.keys(
            monthlyExpense
        ),
        Object.values(
            monthlyExpense
        ).map(
            value =>
                value / 100
        ),
        "monthlyExpenseChart",
        "Expenses"
    );

    createBarChart(
        "monthlyIncomeChart",
        Object.keys(
            monthlyIncome
        ),
        Object.values(
            monthlyIncome
        ).map(
            value =>
                value / 100
        ),
        "monthlyIncomeChart",
        "Income"
    );
}

/* ==========================================
   INSIGHTS
========================================== */

function generateInsights() {

    const transactions =
        getFilteredAnalyticsTransactions();

    const expenses =
        transactions.filter(
            tx =>
                tx.type === "Expense"
        );

    if (
        expenses.length === 0
    ) {

        insightsContainer.innerHTML =
            `
            <div class="empty-state">
                No insights available.
            </div>
        `;

        return;
    }

    let totalExpense = 0;

    const categoryMap = {};

    expenses.forEach(tx => {

        totalExpense +=
            tx.amountPaise;

        categoryMap[
            tx.category
        ] =
            (
                categoryMap[
                    tx.category
                ] || 0
            ) +
            tx.amountPaise;
    });

    const topCategory =
        Object.entries(
            categoryMap
        )
        .sort(
            (a, b) =>
                b[1] - a[1]
        )[0];

    const percentage =
        (
            topCategory[1] /
            totalExpense
        ) * 100;

    let insights = [];

    insights.push(
        `You spent ${percentage.toFixed(
            1
        )}% of your expenses on ${topCategory[0]}.`
    );

    const methodCount = {};

    transactions.forEach(tx => {

        methodCount[
            tx.method
        ] =
            (
                methodCount[
                    tx.method
                ] || 0
            ) + 1;
    });

    const topMethod =
        Object.entries(
            methodCount
        )
        .sort(
            (a, b) =>
                b[1] - a[1]
        )[0];

    if (topMethod) {

        insights.push(
            `Your most used payment method is ${topMethod[0]}.`
        );
    }

    insightsContainer.innerHTML =
        insights
        .map(
            item =>
                `<div class="badge">${item}</div>`
        )
        .join("<br>");
}

/* ==========================================
   REFRESH
========================================== */

function refreshAnalytics() {

    updateSummary();

    updateStatistics();

    renderCharts();

    generateInsights();
}

/* ==========================================
   EVENTS
========================================== */

function attachEvents() {

    analyticsRange
        .addEventListener(
            "change",
            refreshAnalytics
        );

    startDateInput
        .addEventListener(
            "change",
            refreshAnalytics
        );

    endDateInput
        .addEventListener(
            "change",
            refreshAnalytics
        );
}

/* ==========================================
   INIT
========================================== */

function initializeAnalytics() {

    if (!analyticsRange)
        return;

    attachEvents();

    refreshAnalytics();
}

document.addEventListener(
    "DOMContentLoaded",
    initializeAnalytics
);