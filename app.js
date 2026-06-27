import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXUICStUS4WnSlD8KIfvV_lvWBQtZovNw",
  authDomain: "scantitancompany.firebaseapp.com",
  projectId: "scantitancompany",
  storageBucket: "scantitancompany.firebasestorage.app",
  messagingSenderId: "238095636116",
  appId: "1:238095636116:web:3cd2a1b1a0bf9703694681"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function detectCourier(resi) {
  if (resi.startsWith("SPXID")) return "Shopee Express";
  if (resi.startsWith("JX")) return "J&T";
  if (resi.startsWith("TG") || resi.startsWith("JNEB")) return "JNE";
  if (resi.startsWith("NJVTT")) return "Ninja";
  return "Unknown";
}

window.saveResi = async function () {
  const resi = document.getElementById("resiInput").value.trim();
  const status = document.getElementById("statusInput").value;

  if (!resi) return alert("Resi kosong");

  const q = query(collection(db, "shipments"), where("resi", "==", resi));
  const existing = await getDocs(q);

  if (!existing.empty && status === "inbound") {
    alert("Duplicate Resi Terdeteksi");
    return;
  }

  if (!existing.empty && status === "outbound") {
    const docRef = existing.docs[0];
    await updateDoc(doc(db, "shipments", docRef.id), {
      status: "outbound",
      outbound_at: new Date()
    });

    alert("Outbound berhasil");
    loadData();
    return;
  }

  await addDoc(collection(db, "shipments"), {
    resi,
    kurir: detectCourier(resi),
    status,
    printed: false,
    created_at: new Date()
  });

  alert("Inbound berhasil");
  loadData();
};

window.printLabel = async function (id) {
  await updateDoc(doc(db, "shipments", id), {
    printed: true,
    printed_at: new Date()
  });

  window.print();
  loadData();
};

async function loadData() {
  const snapshot = await getDocs(collection(db, "shipments"));
  const table = document.getElementById("historyTable");
  const reconTable = document.getElementById("reconTable");
  const duplicateList = document.getElementById("duplicateList");

  table.innerHTML = "";
  reconTable.innerHTML = "";
  duplicateList.innerHTML = "";

  let inbound = 0;
  let outbound = 0;
  let pending = 0;
  let recon = 0;

  const resiMap = {};

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    if (data.status === "inbound") inbound++;
    if (data.status === "outbound") outbound++;
    if (data.status === "inbound") pending++;

    if (data.printed === true && data.status !== "outbound") {
      recon++;
      reconTable.innerHTML += `
        <tr>
          <td>${data.resi}</td>
          <td>${data.kurir}</td>
          <td>${data.status}</td>
        </tr>
      `;
    }

    if (!resiMap[data.resi]) {
      resiMap[data.resi] = 1;
    } else {
      resiMap[data.resi]++;
    }

    table.innerHTML += `
      <tr>
        <td>${data.resi}</td>
        <td>${data.kurir}</td>
        <td>${data.status}</td>
        <td>${data.printed ? "YES" : "NO"}</td>
        <td>
          <button onclick="printLabel('${docSnap.id}')">Print</button>
        </td>
      </tr>
    `;
  });

  for (let key in resiMap) {
    if (resiMap[key] > 1) {
      duplicateList.innerHTML += `<p>${key} (${resiMap[key]}x)</p>`;
    }
  }

  document.getElementById("inboundCount").innerText = inbound;
  document.getElementById("outboundCount").innerText = outbound;
  document.getElementById("pendingCount").innerText = pending;
  document.getElementById("reconCount").innerText = recon;
}

window.searchResi = async function () {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#historyTable tr");

  rows.forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(keyword)
      ? ""
      : "none";
  });
};

loadData();
