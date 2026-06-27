import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
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
  if (resi.startsWith("JX")) return "J&T Express";
  if (resi.startsWith("TG") || resi.startsWith("JNEB")) return "JNE";
  if (resi.startsWith("NJVTT")) return "Ninja Express";
  return "Unknown";
}

window.saveResi = async function () {
  const resi = document.getElementById("resiInput").value;
  const status = document.getElementById("statusInput").value;
  const kurir = detectCourier(resi);

  await addDoc(collection(db, "shipments"), {
    resi: resi,
    kurir: kurir,
    status: status,
    createdAt: new Date()
  });

  alert("Data berhasil disimpan");
  loadHistory();
};

async function loadHistory() {
  const querySnapshot = await getDocs(collection(db, "shipments"));
  const historyDiv = document.getElementById("history");
  historyDiv.innerHTML = "";

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    historyDiv.innerHTML += `
      <div class="item">
        ${data.resi} - ${data.kurir} - ${data.status}
      </div>
    `;
  });
}

loadHistory();
