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
const state = {
  editingImages: [],
  selectedFiles: [],
  previewObjectUrls: []
};

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
  dom.imagePreview = document.getElementById("image-preview");
  dom.imagePreviewNote = document.getElementById("image-preview-note");
}

function showMessage(text) {
  if (!dom.message) return;
  dom.message.textContent = text;
}

function normalizeImages(imageField) {
  if (Array.isArray(imageField)) return imageField.filter(Boolean);
  if (typeof imageField === "string" && imageField.trim()) return [imageField.trim()];
  return [];
}

function renderImagePreview(existingImages = [], selectedFiles = []) {
  if (!dom.imagePreview) return;

  state.previewObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  state.previewObjectUrls = [];

  const existing = normalizeImages(existingImages);
  const fileItems = Array.from(selectedFiles || []).map((file) => ({
    name: file.name,
    src: URL.createObjectURL(file),
    kind: "new"
  }));

  state.previewObjectUrls = fileItems.map((item) => item.src);

  const existingItems = existing.map((src) => ({
    name: "Imagen existente",
    src,
    kind: "existing"
  }));

  const items = [...existingItems, ...fileItems];

  if (!items.length) {
    dom.imagePreview.innerHTML = '<p class="image-preview-empty">Todavía no hay imágenes para previsualizar.</p>';
    if (dom.imagePreviewNote) {
      dom.imagePreviewNote.textContent = "Agrega una o varias imágenes para ver la previsualización.";
    }
    return;
  }

  if (dom.imagePreviewNote) {
    dom.imagePreviewNote.textContent = `${existingItems.length} existentes y ${fileItems.length} nuevas imágenes.`;
  }

  dom.imagePreview.innerHTML = items
    .map(
      (item, index) => `
        <figure class="image-preview-item ${item.kind}">
          <button type="button" class="image-preview-remove" data-kind="${item.kind}" data-index="${item.kind === "existing" ? existingItems.indexOf(item) : fileItems.indexOf(item)}" aria-label="Quitar imagen ${index + 1}">×</button>
          <img src="${item.src}" alt="Vista previa ${index + 1}">
          <figcaption>${safeText(item.kind === "existing" ? "Existente" : "Nueva")}${item.name && item.kind === "new" ? ` · ${safeText(item.name)}` : ""}</figcaption>
        </figure>
      `
    )
    .join("");
}

function syncFileInputFromState() {
  const dataTransfer = new DataTransfer();
  state.selectedFiles.forEach((file) => dataTransfer.items.add(file));
  dom.images.files = dataTransfer.files;
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
  state.editingImages = [];
  state.selectedFiles = [];
  renderImagePreview();
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
      dom.list.innerHTML = '<p class="status-msg">No hay productos en el catálogo.</p>';
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
  state.editingImages = normalizeImages(product.imagenUrl);
  state.selectedFiles = [];
  dom.productId.value = id;
  dom.name.value = product.nombre || "";
  dom.price.value = product.precio || "";
  dom.category.value = product.categoria || "Otros";
  dom.description.value = product.descripcion || "";

  dom.formTitle.textContent = "Editar producto";
  dom.cancelEditButton.hidden = false;
  renderImagePreview(state.editingImages);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function removeProduct(id) {
  const approved = window.confirm("¿Deseas eliminar este producto?");
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
    let imageUrls = [...state.editingImages];

    if (files.length > 0) {
      const newImageUrls = await uploadImageFiles(files);
      imageUrls = editingId ? [...imageUrls, ...newImageUrls] : newImageUrls;
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
    showMessage("No se pudo guardar el producto. Revisa configuración Firebase.");
  } finally {
    dom.saveButton.disabled = false;
  }
}

function bindEvents() {
  dom.form.addEventListener("submit", onSubmit);
  dom.cancelEditButton.addEventListener("click", resetForm);
  dom.images.addEventListener("change", () => {
    state.selectedFiles = Array.from(dom.images.files || []);
    renderImagePreview(state.editingImages, state.selectedFiles);
  });
  dom.imagePreview.addEventListener("click", (event) => {
    const button = event.target.closest(".image-preview-remove");
    if (!button) return;

    const kind = button.dataset.kind;
    const index = Number(button.dataset.index);

    if (kind === "existing") {
      state.editingImages.splice(index, 1);
      renderImagePreview(state.editingImages, state.selectedFiles);
      return;
    }

    if (kind === "new") {
      state.selectedFiles.splice(index, 1);
      syncFileInputFromState();
      renderImagePreview(state.editingImages, state.selectedFiles);
    }
  });
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
