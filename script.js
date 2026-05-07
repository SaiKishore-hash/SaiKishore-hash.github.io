import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ---------- TABS ----------
window.showTab = function(tab, btn) {

    document.querySelectorAll(".tab")
        .forEach(t => t.style.display = "none");

    document.getElementById(tab).style.display = "block";

    document.querySelectorAll(".tab-btn")
        .forEach(b => b.classList.remove("active"));

    if (btn) btn.classList.add("active");
};

window.onload = () => showTab("inventory");

// ---------- QUICK FILL ----------
window.quickFill = function(item, unit) {

    document.getElementById("item").value = item;
    document.getElementById("unit").value = unit;

    if (unit === "kg") {
        document.getElementById("quantity").step = 0.1;
    }

    if (unit === "grams") {
        document.getElementById("quantity").step = 50;
    }

    if (unit === "packets" || unit === "nos") {
        document.getElementById("quantity").step = 1;
    }
};

// ---------- SHOPPING ----------
const shoppingRef = collection(db, "shopping");

window.addItem = async function() {

    const input = document.getElementById("itemInput");

    const value = input.value.trim();

    if (!value) return;

    await addDoc(shoppingRef, {
        name: value.toLowerCase(),
        bought: false
    });

    input.value = "";
};

onSnapshot(shoppingRef, (snapshot) => {

    const list = document.getElementById("shoppingList");

    list.innerHTML = "";

    snapshot.forEach(docSnap => {

        const data = docSnap.data();

        const li = document.createElement("li");

        li.innerHTML = `
            <input type="checkbox"
            ${data.bought ? "checked" : ""}
            onchange="toggleItem('${docSnap.id}', ${data.bought})">

            <span>${data.name}</span>
        `;

        list.appendChild(li);
    });
});

window.toggleItem = async function(id, current) {

    await updateDoc(doc(db, "shopping", id), {
        bought: !current
    });
};

window.clearShopping = async function() {

    const snapshot = await getDocs(shoppingRef);

    if (!confirm("Clear shopping list?")) return;

    snapshot.forEach(async (docSnap) => {

        await deleteDoc(doc(db, "shopping", docSnap.id));
    });
};

// ---------- INVENTORY ----------
const inventoryRef = collection(db, "inventory");

// ---------- STEP RULES ----------
function getStep(unit) {

    if (unit === "kg") return 0.1;

    if (unit === "grams") return 50;

    if (unit === "packets") return 1;

    if (unit === "nos") return 1;

    return 1;
}

// ---------- ADD ITEM ----------
window.addItemToInventory = async function() {

    const item = document.getElementById("item")
        .value.trim()
        .toLowerCase();

    const quantity = Number(
        document.getElementById("quantity").value
    );

    const unit = document.getElementById("unit").value;

    if (!item || !quantity) {

        alert("Fill all fields");

        return;
    }

    await addDoc(inventoryRef, {
        item,
        quantity,
        unit,
        updatedAt: Date.now()
    });

    document.getElementById("item").value = "";
    document.getElementById("quantity").value = "";
};

// ---------- UPDATE QTY ----------
window.updateQty = async function(
    id,
    unit,
    currentQty,
    direction
) {

    const step = getStep(unit);

    let newQty = currentQty + (direction * step);

    if (newQty < 0) newQty = 0;

    await updateDoc(doc(db, "inventory", id), {
        quantity: Number(newQty.toFixed(2)),
        updatedAt: Date.now()
    });
};

// ---------- CLEAR INVENTORY ----------
window.clearInventory = async function() {

    const snapshot = await getDocs(inventoryRef);

    if (!confirm("Clear inventory?")) return;

    snapshot.forEach(async (docSnap) => {

        await deleteDoc(doc(db, "inventory", docSnap.id));
    });
};

// ---------- RENDER ----------
onSnapshot(inventoryRef, (snapshot) => {

    const container = document.getElementById("inventoryList");

    container.innerHTML = "";

    snapshot.forEach(docSnap => {

        const data = docSnap.data();

        let statusClass = "healthy";

        if (data.quantity <= getStep(data.unit) * 2) {
            statusClass = "low";
        }

        if (data.quantity === 0) {
            statusClass = "empty";
        }

        const card = document.createElement("div");

        card.className = `inventory-card ${statusClass}`;

        const updatedText = data.updatedAt
            ? new Date(data.updatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            })
            : "";

        card.innerHTML = `
            <div class="card-top">

                <div class="item-name">
                    ${data.item}
                </div>

                <div class="updated">
                    Updated ${updatedText}
                </div>

            </div>

            <div class="quantity-display">
                ${data.quantity} ${data.unit}
            </div>

            <div class="action-buttons">

                <button
                onclick="updateQty(
                    '${docSnap.id}',
                    '${data.unit}',
                    ${data.quantity},
                    -1
                )">
                    -
                </button>

                <button
                onclick="updateQty(
                    '${docSnap.id}',
                    '${data.unit}',
                    ${data.quantity},
                    1
                )">
                    +
                </button>

            </div>
        `;

        container.appendChild(card);
    });
});

// ---------- SERVICE WORKER ----------
if ("serviceWorker" in navigator) {

    navigator.serviceWorker
        .register("./service-worker.js");
}