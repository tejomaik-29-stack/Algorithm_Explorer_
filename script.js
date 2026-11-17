
console.log("Interactive Algorithm Explorer loaded!");

// ==================================
// 1. GLOBAL VARIABLES
// ==================================

let knapsackItems = [];
let knapsackCapacity = 0;
let algorithmResults = {};

let currentSteps = [];
let currentStepIndex = 0;
let currentAlgorithm = "";

const algorithmNames = {
    brute: "Brute Force",
    greedy: "Greedy Algorithm",
    dynamic: "Dynamic Programming",
    backtracking: "Backtracking"
};

const complexities = {
    brute: ["O(2ⁿ)", "O(n)"],
    greedy: ["O(n log n)", "O(n)"],
    dynamic: ["O(n × W)", "O(n × W)"],
    backtracking: ["O(2ⁿ)", "O(n)"]
};

// ==================================
// 2. ADD AND REMOVE ITEM ROWS
// ==================================

function addItem() {
    const container = document.getElementById("items-container");

    const row = document.createElement("div");
    row.className = "item-row";

    row.innerHTML = `
        <input type="text" class="item-name" placeholder="Item Name">
        <input type="number" class="item-weight" placeholder="Weight (kg)" min="1">
        <input type="number" class="item-value" placeholder="Value" min="0">
        <button type="button" class="remove-btn" onclick="removeItem(this)">Remove</button>
    `;

    container.appendChild(row);
    updateItemCount();
}

function removeItem(button) {
    button.parentElement.remove();
    updateItemCount();
}

function updateItemCount() {
    const count = document.querySelectorAll(".item-row").length;
    document.getElementById("item-count").textContent =
        count + (count === 1 ? " item" : " items");
}

// CREATE ONE EMPTY ROW
function createEmptyRow() {
    const container = document.getElementById("items-container");

    container.innerHTML = "";

    const row = document.createElement("div");
    row.className = "item-row";

    row.innerHTML = `
        <input type="text" class="item-name" placeholder="Item Name">
        <input type="number" class="item-weight" placeholder="Weight (kg)" min="1">
        <input type="number" class="item-value" placeholder="Value" min="0">
        <button type="button" class="remove-btn" onclick="removeItem(this)">Remove</button>
    `;

    container.appendChild(row);
    updateItemCount();
}

// ==================================
// 3. READ AND VALIDATE INPUTS
// ==================================

function readInputs() {
    const capacityText = document.getElementById("capacity").value;
    const capacity = Number(capacityText);

    const rows = document.querySelectorAll(".item-row");
    const items = [];

    if (
        capacityText === "" ||
        !Number.isInteger(capacity) ||
        capacity <= 0 ||
        capacity > 10000
    ) {
        return {
            error: "Enter a whole-number capacity between 1 and 10,000."
        };
    }

    if (rows.length === 0) {
        return { error: "Please add at least one item." };
    }

    if (rows.length > 15) {
        return { error: "Please enter no more than 15 items." };
    }

    for (const row of rows) {
        const name = row.querySelector(".item-name").value.trim();
        const weightText = row.querySelector(".item-weight").value;
        const valueText = row.querySelector(".item-value").value;

        if (!name || weightText === "" || valueText === "") {
            return { error: "Please complete every item field." };
        }

        const weight = Number(weightText);
        const value = Number(valueText);

        if (
            !Number.isInteger(weight) ||
            weight <= 0 ||
            weight > capacity ||
            !Number.isFinite(value) ||
            value < 0
        ) {
            return {
                error: "Weights must be positive whole numbers no greater than capacity. Values cannot be negative."
            };
        }

        items.push({ name, weight, value });
    }

    return { capacity, items };
}

// ==================================
// 4. SAVE ALGORITHM STEPS
// ==================================

function saveStep(steps, message, selected, weight, value) {
    if (steps.length >= 300) return;

    steps.push({
        message,
        selected: selected.map(item => item.name),
        weight,
        value
    });
}

// ==================================
// 5. BRUTE FORCE
// ==================================

function bruteForce() {
    const start = performance.now();

    let bestValue = 0;
    let bestItems = [];

    const steps = [];
    const treeLines = [];

    function search(index, weight, value, selected) {
        if (treeLines.length < 80) {
            treeLines.push(
                "  ".repeat(index) +
                `Item ${index + 1}: weight ${weight}, value ${value}`
            );
        }

        saveStep(
            steps,
            `Checking a combination at item ${index + 1}. Current weight: ${weight}.`,
            selected,
            weight,
            value
        );

        if (index === knapsackItems.length) {
            if (
                weight <= knapsackCapacity &&
                value > bestValue
            ) {
                bestValue = value;
                bestItems = [...selected];
            }
            return;
        }

        const item = knapsackItems[index];

        // EXCLUDE ITEM
        search(index + 1, weight, value, selected);

        // INCLUDE ITEM
        selected.push(item);

        search(
            index + 1,
            weight + item.weight,
            value + item.value,
            selected
        );

        selected.pop();
    }

    search(0, 0, 0, []);

    return {
        selected: bestItems,
        totalValue: bestValue,
        totalWeight: bestItems.reduce((sum, item) => sum + item.weight, 0),
        time: performance.now() - start,
        timeComplexity: complexities.brute[0],
        spaceComplexity: complexities.brute[1],
        steps,
        treeLines
    };
}

// ==================================
// 6. GREEDY ALGORITHM
// ==================================

function greedyAlgorithm() {
    const start = performance.now();

    const sorted = [...knapsackItems].sort(
        (a, b) =>
            (b.value / b.weight) - (a.value / a.weight)
    );

    let selected = [];
    let totalWeight = 0;
    let totalValue = 0;

    const steps = [];

    for (const item of sorted) {
        const ratio = item.value / item.weight;

        if (totalWeight + item.weight <= knapsackCapacity) {
            selected.push(item);
            totalWeight += item.weight;
            totalValue += item.value;

            saveStep(
                steps,
                `Selected ${item.name}. Value-to-weight ratio: ${ratio.toFixed(2)}.`,
                selected,
                totalWeight,
                totalValue
            );
        } else {
            saveStep(
                steps,
                `Skipped ${item.name} because it does not fit.`,
                selected,
                totalWeight,
                totalValue
            );
        }
    }

    return {
        selected,
        totalValue,
        totalWeight,
        time: performance.now() - start,
        timeComplexity: complexities.greedy[0],
        spaceComplexity: complexities.greedy[1],
        steps,
        treeLines: []
    };
}

// ==================================
// 7. DYNAMIC PROGRAMMING
// ==================================

function dynamicProgramming() {
    const start = performance.now();

    const n = knapsackItems.length;
    const capacity = knapsackCapacity;

    const dp = Array.from(
        { length: n + 1 },
        () => Array(capacity + 1).fill(0)
    );

    const steps = [];

    for (let i = 1; i <= n; i++) {
        const item = knapsackItems[i - 1];

        for (let w = 0; w <= capacity; w++) {
            dp[i][w] = dp[i - 1][w];

            if (item.weight <= w) {
                dp[i][w] = Math.max(
                    dp[i][w],
                    item.value + dp[i - 1][w - item.weight]
                );
            }
        }

        saveStep(
            steps,
            `Completed the DP calculation for ${item.name}. Best value at full capacity: ${dp[i][capacity]}.`,
            [],
            0,
            dp[i][capacity]
        );
    }

    let selected = [];
    let w = capacity;

    for (let i = n; i > 0; i--) {
        if (dp[i][w] !== dp[i - 1][w]) {
            const item = knapsackItems[i - 1];

            selected.push(item);
            w -= item.weight;
        }
    }

    selected.reverse();

    return {
        selected,
        totalValue: dp[n][capacity],
        totalWeight: selected.reduce((sum, item) => sum + item.weight, 0),
        time: performance.now() - start,
        timeComplexity: complexities.dynamic[0],
        spaceComplexity: complexities.dynamic[1],
        steps,
        treeLines: []
    };
}

// ==================================
// 8. BACKTRACKING
// ==================================

function backtracking() {
    const start = performance.now();

    let bestValue = 0;
    let bestItems = [];

    const steps = [];
    const treeLines = [];

    function search(index, weight, value, selected) {
        if (treeLines.length < 80) {
            treeLines.push(
                "  ".repeat(index) +
                `Item ${index + 1}: weight ${weight}, value ${value}`
            );
        }

        if (weight > knapsackCapacity) {
            saveStep(
                steps,
                `Pruned this branch because its weight (${weight}) exceeds capacity.`,
                selected,
                weight,
                value
            );
            return;
        }

        saveStep(
            steps,
            `Exploring item ${index + 1}. Current value: ${value}.`,
            selected,
            weight,
            value
        );

        if (index === knapsackItems.length) {
            if (value > bestValue) {
                bestValue = value;
                bestItems = [...selected];
            }
            return;
        }

        const item = knapsackItems[index];

        // EXCLUDE
        search(index + 1, weight, value, selected);

        // INCLUDE
        selected.push(item);

        search(
            index + 1,
            weight + item.weight,
            value + item.value,
            selected
        );

        selected.pop();
    }

    search(0, 0, 0, []);

    return {
        selected: bestItems,
        totalValue: bestValue,
        totalWeight: bestItems.reduce((sum, item) => sum + item.weight, 0),
        time: performance.now() - start,
        timeComplexity: complexities.backtracking[0],
        spaceComplexity: complexities.backtracking[1],
        steps,
        treeLines
    };
}

// ==================================
// 9. ALGORITHM RUNNER
// ==================================

function calculateAlgorithm(key) {
    if (key === "brute") return bruteForce();
    if (key === "greedy") return greedyAlgorithm();
    if (key === "dynamic") return dynamicProgramming();
    if (key === "backtracking") return backtracking();
}

function solveProblem() {
    const result = readInputs();
    const message = document.getElementById("message");

    message.textContent = "";

    if (result.error) {
        message.textContent = result.error;
        return;
    }

    knapsackItems = result.items;
    knapsackCapacity = result.capacity;
    algorithmResults = {};

    const keys = ["brute", "greedy", "dynamic", "backtracking"];

    for (const key of keys) {
        algorithmResults[key] = calculateAlgorithm(key);
    }

    displayResult("dynamic");
    updateComparison();
    showChampion();
    saveExperiment();
}

function runAlgorithm(key) {
    const result = readInputs();
    const message = document.getElementById("message");

    message.textContent = "";

    if (result.error) {
        message.textContent = result.error;
        return;
    }

    knapsackItems = result.items;
    knapsackCapacity = result.capacity;

    algorithmResults[key] = calculateAlgorithm(key);

    displayResult(key);
    updateComparison();
    showChampion();
}

// ==================================
// 10. DISPLAY RESULT
// ==================================

function displayResult(key) {
    const result = algorithmResults[key];

    if (!result) return;

    currentAlgorithm = key;
    currentSteps = result.steps;
    currentStepIndex = 0;

    const output = document.getElementById("output");

    const selectedNames = new Set(
        result.selected.map(item => item.name)
    );

    const rejected = knapsackItems.filter(
        item => !selectedNames.has(item.name)
    );

    output.innerHTML = `
        <h3>${algorithmNames[key]}</h3>

        <div class="result-grid">
            <div class="result-card">
                <span>Total Weight</span>
                <strong>${result.totalWeight} kg</strong>
            </div>

            <div class="result-card">
                <span>Maximum Value</span>
                <strong>${result.totalValue}</strong>
            </div>

            <div class="result-card">
                <span>Execution Time</span>
                <strong>${result.time.toFixed(4)} ms</strong>
            </div>
        </div>

        <h3>Selected Items</h3>
        <p>${result.selected.length
            ? result.selected.map(item => escapeHTML(item.name)).join(", ")
            : "No items selected"}</p>

        <h3>Rejected Items</h3>
        <p>${rejected.length
            ? rejected.map(item => escapeHTML(item.name)).join(", ")
            : "No items rejected"}</p>
    `;

    const percentage = (result.totalWeight / knapsackCapacity) * 100;

    document.getElementById("capacity-info").textContent =
        `${result.totalWeight} kg used out of ${knapsackCapacity} kg. ` +
        `${percentage.toFixed(1)}% of your bag capacity is occupied.`;

    document.getElementById("capacity-bar").style.width =
        Math.min(percentage, 100) + "%";

    updateSimulation();
    displayDecisionTree(result);
}

// ESCAPE USER TEXT BEFORE INSERTING IT INTO HTML
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// ==================================
// 11. STEP-BY-STEP SIMULATION
// ==================================

function updateSimulation() {
    const step = currentSteps[currentStepIndex];

    if (!step) {
        document.getElementById("step-counter").textContent =
            "No simulation available.";
        document.getElementById("simulation-step").textContent =
            "Select an algorithm to begin.";
        return;
    }

    document.getElementById("step-counter").textContent =
        `Step ${currentStepIndex + 1} of ${currentSteps.length}`;

    document.getElementById("simulation-step").innerHTML = `
        <h3>${escapeHTML(algorithmNames[currentAlgorithm])}</h3>
        <p>${escapeHTML(step.message)}</p>
        <p><strong>Current selected items:</strong>
        ${step.selected.length
            ? step.selected.map(escapeHTML).join(", ")
            : "None"}</p>
        <p><strong>Current weight:</strong> ${step.weight} kg</p>
        <p><strong>Current value:</strong> ${step.value}</p>
    `;
}

function nextStep() {
    if (currentStepIndex < currentSteps.length - 1) {
        currentStepIndex++;
        updateSimulation();
    }
}

function previousStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        updateSimulation();
    }
}

// ==================================
// 12. DECISION TREE
// ==================================

function displayDecisionTree(result) {
    const container = document.getElementById("decision-tree");

    if (!result.treeLines.length) {
        container.textContent =
            "Decision tree is available for Brute Force and Backtracking.";
        return;
    }

    container.innerHTML = `
        <p>Showing up to 80 explored decision nodes:</p>
        ${result.treeLines.map(line =>
            `<div class="tree-line">${escapeHTML(line)}</div>`
        ).join("")}
    `;
}

// ==================================
// 13. ALGORITHM CHAMPION
// ==================================

function showChampion() {
    const available = Object.entries(algorithmResults);

    if (available.length === 0) return;

    const bestValue = Math.max(
        ...available.map(([key, result]) => result.totalValue)
    );

    const champions = available.filter(
        ([key, result]) => result.totalValue === bestValue
    );

    const championNames = champions.map(
        ([key]) => algorithmNames[key]
    );

    const fastest = [...available].sort(
        (a, b) => a[1].time - b[1].time
    )[0];

    document.getElementById("champion").innerHTML = `
        <div class="champion-result">
            <h3>Highest Value: <strong>${bestValue}</strong></h3>
            <p><strong>Optimal result found by:</strong>
            ${championNames.map(escapeHTML).join(", ")}</p>
            <p><strong>Fastest in this run:</strong>
            ${escapeHTML(algorithmNames[fastest[0]])}</p>
            <p>
                The champion is based on the highest achievable value.
                The fastest algorithm and the algorithm with the highest
                value are not necessarily the same.
            </p>
        </div>
    `;
}

// ==================================
// 14. COMPARISON TABLE
// ==================================

function updateComparison() {
    const body = document.getElementById("comparison-body");

    body.innerHTML = "";

    const keys = ["brute", "greedy", "dynamic", "backtracking"];

    for (const key of keys) {
        const result = algorithmResults[key];

        if (!result) continue;

        const row = document.createElement("tr");

        const values = [
            algorithmNames[key],
            result.timeComplexity,
            result.spaceComplexity,
            result.totalValue,
            result.time.toFixed(4)
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        body.appendChild(row);
    }

    drawChart();
}

// ==================================
// 15. EXECUTION TIME CHART
// ==================================

function drawChart() {
    const canvas = document.getElementById("performance-chart");
    const ctx = canvas.getContext("2d");

    const width = canvas.clientWidth || 600;
    const height = 300;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    const keys = ["brute", "greedy", "dynamic", "backtracking"];
    const available = keys.filter(key => algorithmResults[key]);

    if (available.length === 0) return;

    const values = available.map(
        key => algorithmResults[key].time
    );

    const maxTime = Math.max(...values, 0.01);
    const barWidth = Math.min(65, width / 8);
    const gap = width / (available.length + 1);

    ctx.font = "12px Arial";
    ctx.textAlign = "center";

    available.forEach((key, index) => {
        const time = algorithmResults[key].time;
        const barHeight = (time / maxTime) * 185;
        const x = gap * (index + 1);
        const y = 220 - barHeight;

        ctx.fillStyle = "#42d6c5";
        ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);

        ctx.fillStyle = "#ffffff";
        ctx.fillText(time.toFixed(3), x, y - 8);
        ctx.fillText(
            algorithmNames[key].split(" ")[0],
            x,
            245
        );
    });

    ctx.fillStyle = "#9aaac0";
    ctx.fillText("Execution time (milliseconds)", width / 2, 280);
}

// ==================================
// 16. EXPERIMENT HISTORY
// ==================================

function getHistory() {
    try {
        return JSON.parse(
            localStorage.getItem("algorithmExplorerHistory") || "[]"
        );
    } catch (error) {
        return [];
    }
}

function saveExperiment() {
    const history = getHistory();

    const championValue = Math.max(
        ...Object.values(algorithmResults).map(
            result => result.totalValue
        )
    );

    history.unshift({
        date: new Date().toLocaleString(),
        capacity: knapsackCapacity,
        itemCount: knapsackItems.length,
        bestValue: championValue
    });

    localStorage.setItem(
        "algorithmExplorerHistory",
        JSON.stringify(history.slice(0, 10))
    );

    displayHistory();
}

function displayHistory() {
    const history = getHistory();
    const container = document.getElementById("history-list");

    if (history.length === 0) {
        container.textContent = "No saved experiments yet.";
        return;
    }

    container.innerHTML = history.map((entry, index) => `
        <div class="history-entry">
            <strong>Experiment ${index + 1}</strong>
            <p>Date: ${escapeHTML(entry.date)}</p>
            <p>Capacity: ${entry.capacity} kg</p>
            <p>Number of items: ${entry.itemCount}</p>
            <p>Best value: ${entry.bestValue}</p>
        </div>
    `).join("");
}

function clearHistory() {
    if (confirm("Are you sure you want to clear experiment history?")) {
        localStorage.removeItem("algorithmExplorerHistory");
        displayHistory();
    }
}

// ==================================
// 17. RESET INPUTS AND RESULTS
// ==================================

function resetKnapsack() {
    document.getElementById("capacity").value = "";

    createEmptyRow();

    knapsackItems = [];
    knapsackCapacity = 0;
    algorithmResults = {};

    currentSteps = [];
    currentStepIndex = 0;
    currentAlgorithm = "";

    document.getElementById("message").textContent = "";

    document.getElementById("output").textContent =
        "Your selected items and results will appear here.";

    document.getElementById("capacity-info").textContent =
        "Enter your packing details to see capacity usage.";

    document.getElementById("capacity-bar").style.width = "0%";

    document.getElementById("champion").textContent =
        "Run the algorithms to discover the champion.";

    document.getElementById("step-counter").textContent =
        "No simulation available yet.";

    document.getElementById("simulation-step").textContent =
        "Select an algorithm to begin the simulation.";

    document.getElementById("decision-tree").textContent =
        "Run Brute Force or Backtracking to view its decision tree.";

    document.getElementById("comparison-body").innerHTML =
        `<tr><td colspan="5">Run algorithms to see comparison.</td></tr>`;

    drawChart();
}

// ==================================
// 18. INITIAL PAGE SETUP
// ==================================

createEmptyRow();
displayHistory();
drawChart();
