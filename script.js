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

// ---------- TAB ----------
window.showTab = function(tab, btn) {
    document.querySelectorAll('.tab').forEach(t => t.style.display = 'none');
    document.getElementById(tab).style.display = 'block';

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
};

window.onload = () => showTab('inventory');

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

// ---------- INVENTORY CLEAR ----------
window.clearInventory = async function() {
    const snapshot = await getDocs(collection(db, "inventory"));

    const confirmClear = confirm("Are you sure you want to clear inventory?");
    if (!confirmClear) return;

    snapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, "inventory", docSnap.id));
    });
};

// ---------- UI HELPERS ----------
document.getElementById("item").addEventListener("input", () => {
    const item = document.getElementById("item").value.toLowerCase();
    const unitField = document.getElementById("unit");

    if (item === "milk") {
        unitField.value = "packets";
        unitField.disabled = true;
    } else {
        unitField.disabled = false;
    }
});

document.getElementById("type").addEventListener("change", () => {
    const type = document.getElementById("type").value;
    const note = document.getElementById("consumeNote");

    note.style.display = type === "consume" ? "block" : "none";
});

// ---------- SHOPPING VIEW ----------
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
    await updateDoc(doc(db, "shopping", id), { bought: !current });
};

window.clearShopping = async function() {
    const snapshot = await getDocs(shoppingRef);

    const confirmClear = confirm("Clear entire shopping list?");
    if (!confirmClear) return;

    snapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, "shopping", docSnap.id));
    });
};

// ---------- INVENTORY ----------
const inventoryRef = collection(db, "inventory");

window.addEntry = async function() {
    let item = document.getElementById("item").value.trim();
    let quantity = Number(document.getElementById("quantity").value);
    let unit = document.getElementById("unit").value.trim();
    const type = document.getElementById("type").value;
    const expiry = document.getElementById("expiry").value;

    if (!item || !quantity) {
        alert("Fill all fields");
        return;
    }

    if (item.toLowerCase() === "milk") {
        unit = "packets";
    }

    if (!unit) {
        alert("Unit required");
        return;
    }

    if (type === "stock" && !expiry) {
        alert("Expiry required");
        return;
    }

    await addDoc(inventoryRef, {
        item: item.toLowerCase(),
        quantity,
        unit,
        type,
        expiry: type === "stock" ? expiry : null,
        timestamp: Date.now()
    });

    document.getElementById("item").value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("unit").value = "";
    document.getElementById("expiry").value = "";
};

// ---------- INVENTORY VIEW ----------
onSnapshot(inventoryRef, (snapshot) => {
    const container = document.getElementById("inventoryList");
    container.innerHTML = "";

    const items = {};

    snapshot.forEach(docSnap => {
        const data = docSnap.data();

        if (!items[data.item]) items[data.item] = [];
        items[data.item].push(data);
    });

    Object.keys(items).forEach(item => {

        let batches = [];

        items[item]
            .sort((a, b) => a.timestamp - b.timestamp)
            .forEach(entry => {

                if (entry.type === "stock") {
                    batches.push({
                        quantity: entry.quantity,
                        expiry: entry.expiry,
                        unit: entry.unit
                    });
                }

                if (entry.type === "consume") {
                    let remaining = entry.quantity;

                    batches.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

                    for (let batch of batches) {
                        if (remaining <= 0) break;

                        if (batch.quantity <= remaining) {
                            remaining -= batch.quantity;
                            batch.quantity = 0;
                        } else {
                            batch.quantity -= remaining;
                            remaining = 0;
                        }
                    }

                    batches = batches.filter(b => b.quantity > 0);
                }
            });

        const div = document.createElement("div");
        div.className = "item-card";
        div.innerHTML = `<strong>${item}</strong>`;

        batches.forEach(batch => {
            const today = new Date();
            const exp = new Date(batch.expiry);
            const days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

            const p = document.createElement("div");
            p.className = "batch";

            if (days < 0) {
                p.innerHTML = `🔴 ${batch.quantity} ${batch.unit} (EXPIRED)`;
            } else if (days <= 1) {
                p.innerHTML = `⚠️ ${batch.quantity} ${batch.unit} (Use today/tomorrow)`;
            } else if (days <= 2) {
                p.innerHTML = `🟡 ${batch.quantity} ${batch.unit} (${days} days left)`;
            } else {
                p.innerHTML = `🟢 ${batch.quantity} ${batch.unit} (${days} days left)`;
            }

            div.appendChild(p);
        });

        container.appendChild(div);
    });
});

// SERVICE WORKER
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}