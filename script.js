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

// ---------- SHOPPING (UNCHANGED) ----------
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
    await updateDoc(doc(db, "shopping", id), { bought: !current });
};

window.clearShopping = async function() {
    const snapshot = await getDocs(shoppingRef);
    if (!confirm("Clear entire shopping list?")) return;

    snapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, "shopping", docSnap.id));
    });
};

// ---------- INVENTORY ----------
const inventoryRef = collection(db, "inventory");

// unit step rules
function getStep(unit) {
    if (unit === "kg") return 0.1;
    if (unit === "grams") return 50;
    if (unit === "packets") return 1;
    if (unit === "nos") return 1;
    return 1;
}

// add item
window.addItemToInventory = async function() {
    const item = document.getElementById("item").value.trim().toLowerCase();
    const quantity = Number(document.getElementById("quantity").value);
    const unit = document.getElementById("unit").value;

    if (!item || !quantity) {
        alert("Fill all fields");
        return;
    }

    await addDoc(inventoryRef, {
        item,
        quantity,
        unit
    });

    document.getElementById("item").value = "";
    document.getElementById("quantity").value = "";
};

// increment / decrement
window.updateQty = async function(id, unit, currentQty, direction) {
    const step = getStep(unit);
    let newQty = currentQty + (direction * step);

    if (newQty < 0) newQty = 0;

    await updateDoc(doc(db, "inventory", id), {
        quantity: Number(newQty.toFixed(2))
    });
};

// clear inventory
window.clearInventory = async function() {
    const snapshot = await getDocs(inventoryRef);
    if (!confirm("Clear entire inventory?")) return;

    snapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, "inventory", docSnap.id));
    });
};

// render inventory
onSnapshot(inventoryRef, (snapshot) => {
    const container = document.getElementById("inventoryList");
    container.innerHTML = "";

    snapshot.forEach(docSnap => {
        const data = docSnap.data();

        const row = document.createElement("div");
        row.className = "inventory-row";

        row.innerHTML = `
            <span>${data.item}</span>
            <span>${data.quantity}</span>
            <span>${data.unit}</span>

            <button onclick="updateQty('${docSnap.id}','${data.unit}',${data.quantity},1)">+</button>
            <button onclick="updateQty('${docSnap.id}','${data.unit}',${data.quantity},-1)">-</button>
        `;

        container.appendChild(row);
    });
});