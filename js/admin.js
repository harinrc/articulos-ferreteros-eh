import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getDownloadURL,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
import { auth, db, storage } from "./firebase-init.js";
import { STORE_CONFIG } from "./config.js";
import { safeText } from "./ui.js";

const dom = {};

function cacheDom() {
  dom.form = document.getElementById("product-form");
  dom.productId = document.getElementById("product-id");
  dom.name = document.getElementById("product-name");
  dom.price = document.getElementById("product-price");
  dom.category = document.getElementById("product-category");
  dom.description = document.getElementById("product-description");
  dom.images = document.getElementById("product-images");
  dom.message = document.getElementById("admin-message");
  dom.formTitle = document.getElementById("form-title");
  dom.saveButton = document.getElementById("save-button");
  dom.cancelEditButton = document.getElementById("cancel-edit-button");
  dom.list = document.getElementById("admin-product-list");
  dom.logoutButton = document.getElementById("logout-button");
}

function showMessage(text) {
  if (!dom.message) return;
  dom.message.textContent = text;
}

async function uploadImageFiles(files) {
  const urls = [];
  for (const file of files) {
    const path = `productos/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, path);
    const uploadResult = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(uploadResult.ref);
    urls.push(url);
  }
  return urls;
}

function resetForm() {
  dom.form.reset();
  dom.productId.value = "";
  dom.formTitle.textContent = "Agregar producto";
  dom.cancelEditButton.hidden = true;
  showMessage("");
}

async function loadProducts() {
  if (!dom.list) return;
  dom.list.innerHTML = '<p class="status-msg">Cargando productos...</p>';

  try {
    const snapshot = await getDocs(
      query(collection(db, STORE_CONFIG.firebaseCollection), orderBy("createdAt", "desc"))
    );

    if (snapshot.empty) {
      dom.list.innerHTML = '<p class="status-msg">No hay productos en el catalogo.</p>';
      return;
    }

    dom.list.innerHTML = snapshot.docs
      .map((item) => {
        const product = item.data();
        return `
          <div class="admin-product-item" data-id="${item.id}">
            <div>
              <h3>${safeText(product.nombre || "Sin nombre")}</h3>
              <p>${safeText(product.precio || "Consultar")}</p>
              <small>${safeText(product.categoria || "Otros")}</small>
            </div>
            <div class="row-actions">
              <button class="muted-btn" data-action="edit" data-id="${item.id}">Editar</button>
              <button class="danger-btn" data-action="delete" data-id="${item.id}">Eliminar</button>
            </div>
          </div>
        `;
      })
      .join("");

    dom.list.querySelectorAll("button[data-action='edit']").forEach((button) => {
      button.addEventListener("click", () => startEdit(button.dataset.id));
    });

    dom.list.querySelectorAll("button[data-action='delete']").forEach((button) => {
      button.addEventListener("click", () => removeProduct(button.dataset.id));
    });
  } catch (error) {
    console.error(error);
    dom.list.innerHTML = '<p class="status-msg">No se pudo cargar la lista.</p>';
  }
}

async function startEdit(id) {
  const snap = await getDoc(doc(db, STORE_CONFIG.firebaseCollection, id));
  if (!snap.exists()) return;

  const product = snap.data();
  dom.productId.value = id;
  dom.name.value = product.nombre || "";
  dom.price.value = product.precio || "";
  dom.category.value = product.categoria || "Otros";
  dom.description.value = product.descripcion || "";

  dom.formTitle.textContent = "Editar producto";
  dom.cancelEditButton.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function removeProduct(id) {
  const approved = window.confirm("Deseas eliminar este producto?");
  if (!approved) return;

  await deleteDoc(doc(db, STORE_CONFIG.firebaseCollection, id));
  showMessage("Producto eliminado.");
  await loadProducts();
}

async function onSubmit(event) {
  event.preventDefault();

  const editingId = dom.productId.value;
  const files = Array.from(dom.images.files || []);

  dom.saveButton.disabled = true;
  showMessage("Guardando...");

  try {
    let imageUrls = [];

    if (files.length > 0) {
      imageUrls = await uploadImageFiles(files);
    } else if (editingId) {
      const existing = await getDoc(doc(db, STORE_CONFIG.firebaseCollection, editingId));
      imageUrls = Array.isArray(existing.data()?.imagenUrl) ? existing.data().imagenUrl : [];
    }

    const payload = {
      nombre: dom.name.value.trim(),
      precio: dom.price.value.trim(),
      categoria: dom.category.value,
      descripcion: dom.description.value.trim(),
      imagenUrl: imageUrls,
      updatedAt: serverTimestamp()
    };

    if (editingId) {
      await updateDoc(doc(db, STORE_CONFIG.firebaseCollection, editingId), payload);
      showMessage("Producto actualizado correctamente.");
    } else {
      await addDoc(collection(db, STORE_CONFIG.firebaseCollection), {
        ...payload,
        createdAt: serverTimestamp()
      });
      showMessage("Producto agregado correctamente.");
    }

    resetForm();
    await loadProducts();
  } catch (error) {
    console.error(error);
    showMessage("No se pudo guardar el producto. Revisa configuracion Firebase.");
  } finally {
    dom.saveButton.disabled = false;
  }
}

function bindEvents() {
  dom.form.addEventListener("submit", onSubmit);
  dom.cancelEditButton.addEventListener("click", resetForm);
  dom.logoutButton.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "./login.html";
  });
}

window.addEventListener("DOMContentLoaded", () => {
  cacheDom();

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "./login.html";
      return;
    }

    bindEvents();
    await loadProducts();
  });
});
