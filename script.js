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

window.editShoppingItem = async function(id, currentName) {

    const newName = prompt("Edit item", currentName);

    if (!newName) return;

    await updateDoc(doc(db, "shopping", id), {
        name: newName.toLowerCase()
    });
};

window.deleteShoppingItem = async function(id) {

    if (!confirm("Delete shopping item?")) return;

    await deleteDoc(doc(db, "shopping", id));
};

onSnapshot(shoppingRef, (snapshot) => {

    const list = document.getElementById("shoppingList");

    list.innerHTML = "";

    snapshot.forEach(docSnap => {

        const data = docSnap.data();

        const li = document.createElement("li");

        li.innerHTML = `
            <div class="shopping-left">

                <input type="checkbox"
                ${data.bought ? "checked" : ""}
                onchange="toggleItem('${docSnap.id}', ${data.bought})">

                <span>${data.name}</span>

            </div>

            <div class="mini-actions">

                <button onclick="editShoppingItem('${docSnap.id}','${data.name}')">
                    ✏️
                </button>

                <button onclick="deleteShoppingItem('${docSnap.id}')">
                    🗑
                </button>

            </div>
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

function getStep(unit) {

    if (unit === "kg") return 0.1;

    if (unit === "grams") return 50;

    if (unit === "packets") return 1;

    if (unit === "nos") return 1;

    return 1;
}

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

window.editInventoryItem = async function(
    id,
    currentItem,
    currentQty,
    currentUnit
) {

    const newItem = prompt("Edit item", currentItem);
    if (!newItem) return;

    const newQty = prompt("Edit quantity", currentQty);
    if (!newQty) return;

    const newUnit = prompt("Edit unit", currentUnit);
    if (!newUnit) return;

    await updateDoc(doc(db, "inventory", id), {
        item: newItem.toLowerCase(),
        quantity: Number(newQty),
        unit: newUnit,
        updatedAt: Date.now()
    });
};

window.deleteInventoryItem = async function(id) {

    if (!confirm("Delete inventory item?")) return;

    await deleteDoc(doc(db, "inventory", id));
};

window.clearInventory = async function() {

    const snapshot = await getDocs(inventoryRef);

    if (!confirm("Clear inventory?")) return;

    snapshot.forEach(async (docSnap) => {

        await deleteDoc(doc(db, "inventory", docSnap.id));
    });
};

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

            <div class="mini-actions inventory-mini-actions">

                <button onclick="
                    editInventoryItem(
                        '${docSnap.id}',
                        '${data.item}',
                        ${data.quantity},
                        '${data.unit}'
                    )
                ">
                    ✏️
                </button>

                <button onclick="
                    deleteInventoryItem('${docSnap.id}')
                ">
                    🗑
                </button>

            </div>
        `;

        container.appendChild(card);
    });
});

// ---------- PURCHASES ----------
const purchasesRef = collection(db, "purchases");

window.addPurchase = async function() {

    const item = document.getElementById("purchaseItem").value.trim();

    const quantity = document.getElementById("purchaseQty").value.trim();

    const cost = document.getElementById("purchaseCost").value.trim();

    const store = document.getElementById("purchaseStore").value.trim();

    const date = document.getElementById("purchaseDate").value;

    if (!item || !quantity || !cost || !store || !date) {

        alert("Fill all purchase fields");

        return;
    }

    await addDoc(purchasesRef, {
        item,
        quantity,
        cost,
        store,
        date,
        timestamp: Date.now()
    });

    document.getElementById("purchaseItem").value = "";
    document.getElementById("purchaseQty").value = "";
    document.getElementById("purchaseCost").value = "";
    document.getElementById("purchaseStore").value = "";
};

window.editPurchase = async function(
    id,
    item,
    quantity,
    cost,
    store,
    date
) {

    const newItem = prompt("Edit item", item);
    if (!newItem) return;

    const newQuantity = prompt("Edit quantity", quantity);
    if (!newQuantity) return;

    const newCost = prompt("Edit cost", cost);
    if (!newCost) return;

    const newStore = prompt("Edit store", store);
    if (!newStore) return;

    const newDate = prompt("Edit date (YYYY-MM-DD)", date);
    if (!newDate) return;

    await updateDoc(doc(db, "purchases", id), {
        item: newItem,
        quantity: newQuantity,
        cost: newCost,
        store: newStore,
        date: newDate
    });
};

window.deletePurchase = async function(id) {

    if (!confirm("Delete purchase?")) return;

    await deleteDoc(doc(db, "purchases", id));
};

onSnapshot(purchasesRef, (snapshot) => {

    const container = document.getElementById("purchaseList");

    container.innerHTML = "";

    const grouped = {};

    snapshot.forEach(docSnap => {

        const data = docSnap.data();

        if (!grouped[data.date]) {
            grouped[data.date] = [];
        }

        grouped[data.date].push({
            id: docSnap.id,
            ...data
        });
    });

    Object.keys(grouped)
        .sort((a, b) => new Date(b) - new Date(a))
        .forEach(date => {

            const section = document.createElement("div");

            section.className = "purchase-section";

            section.innerHTML = `
                <div class="purchase-date">
                    ${date}
                </div>
            `;

            grouped[date].forEach(item => {

                const row = document.createElement("div");

                row.className = "purchase-row";

                row.innerHTML = `
                    <div>
                        • ${item.item} - ${item.quantity}
                        - ₹${item.cost} - ${item.store}
                    </div>

                    <div class="mini-actions">

                        <button onclick="
                            editPurchase(
                                '${item.id}',
                                '${item.item}',
                                '${item.quantity}',
                                '${item.cost}',
                                '${item.store}',
                                '${item.date}'
                            )
                        ">
                            ✏️
                        </button>

                        <button onclick="
                            deletePurchase('${item.id}')
                        ">
                            🗑
                        </button>

                    </div>
                `;

                section.appendChild(row);
            });

            container.appendChild(section);
        });
});

// ---------- SERVICE WORKER ----------
if ("serviceWorker" in navigator) {

    window.addEventListener("load", async () => {

        const registration = await navigator.serviceWorker.register(
            "./service-worker.js?v=9"
        );

        registration.update();

    });
}