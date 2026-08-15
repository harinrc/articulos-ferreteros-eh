import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from "./firebase-init.js";
import { STORE_CONFIG } from "./config.js";
import {
  buildWhatsAppLink,
  initHeaderInteractions,
  initHeroSwiper,
  initInstallAppButton,
  registerServiceWorker,
  safeText,
  wireSocialLinks
} from "./ui.js";

const state = {
  products: [],
  filterText: "",
  selectedCategory: "todos",
  lightboxOpen: false
};

function normalizeImages(imageField) {
  if (Array.isArray(imageField)) return imageField.filter(Boolean);
  if (typeof imageField === "string" && imageField.trim()) return [imageField.trim()];
  return [];
}

function productWhatsAppMessage(product, imageUrl = "") {
  const lines = [
    `Hola, me interesa este producto de ${STORE_CONFIG.brandName}:`,
    `Producto: ${product.nombre || "Sin nombre"}`,
    `Precio: ${product.precio || "Consultar"}`,
    `Categoría: ${product.categoria || "Otros"}`
  ];

  if (product.descripcion) {
    lines.push(`Descripción: ${product.descripcion}`);
  }

  if (imageUrl) {
    lines.push(`Foto del producto: ${imageUrl}`);
  }

  return lines.join("\n");
}

function updateCardWhatsAppLink(button, product, imageUrl = "") {
  if (!button) return;
  button.href = buildWhatsAppLink(productWhatsAppMessage(product, imageUrl));
}

function ensureImageLightbox() {
  let overlay = document.getElementById("image-lightbox");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "image-lightbox";
  overlay.className = "image-lightbox";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="image-lightbox-panel" role="dialog" aria-modal="true" aria-label="Vista ampliada de producto">
      <button type="button" class="image-lightbox-close" aria-label="Cerrar vista ampliada">×</button>
      <img class="image-lightbox-img" alt="Vista ampliada del producto">
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => closeImageLightbox();
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest(".image-lightbox-close")) close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  return overlay;
}

function openImageLightbox(src, alt = "Vista ampliada del producto") {
  if (!src) return;

  const overlay = ensureImageLightbox();
  const img = overlay.querySelector(".image-lightbox-img");
  if (!img) return;

  img.src = src;
  img.alt = alt;
  overlay.hidden = false;
  overlay.classList.add("is-open");
  state.lightboxOpen = true;
  document.body.classList.add("lightbox-open");
}

function closeImageLightbox() {
  const overlay = document.getElementById("image-lightbox");
  if (!overlay) return;

  const img = overlay.querySelector(".image-lightbox-img");
  if (img) {
    img.src = "";
  }

  overlay.hidden = true;
  overlay.classList.remove("is-open");
  state.lightboxOpen = false;
  document.body.classList.remove("lightbox-open");
}

function renderProducts() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  const filtered = state.products.filter((product) => {
    const name = String(product.nombre || "").toLowerCase();
    const category = String(product.categoria || "Otros");
    const matchText = name.includes(state.filterText);
    const matchCategory = state.selectedCategory === "todos" || category === state.selectedCategory;
    return matchText && matchCategory;
  });

  if (!filtered.length) {
    grid.innerHTML = '<p class="status-msg">No se encontraron productos con esos filtros.</p>';
    return;
  }

  grid.innerHTML = filtered
    .map((product, index) => {
      const images = normalizeImages(product.imagenUrl);
      const swiperId = `product-swiper-${index}`;

      const slides = images.length
        ? images
            .map(
              (url) =>
                `<div class="swiper-slide"><img src="${safeText(url)}" alt="${safeText(product.nombre || "Producto")}" loading="lazy"></div>`
            )
            .join("")
        : '<div class="swiper-slide"><div class="image-fallback">Sin imagen</div></div>';

      const initialImage = images[0] || "";

      return `
        <article class="product-card" data-category="${safeText(product.categoria || "Otros")}">
          <div class="swiper card-swiper" id="${swiperId}">
            <div class="swiper-wrapper">${slides}</div>
            <div class="swiper-pagination"></div>
          </div>
          <div class="card-copy">
            <p class="chip">${safeText(product.categoria || "Otros")}</p>
            <h3>${safeText(product.nombre || "Sin nombre")}</h3>
            <p class="price">${safeText(product.precio || "Consultar")}</p>
            <p class="description">${safeText(product.descripcion || "")}</p>
            <a class="cta-btn js-product-wa" target="_blank" rel="noopener noreferrer" data-product-index="${index}" data-image-url="${safeText(initialImage)}" href="${buildWhatsAppLink(productWhatsAppMessage(product, initialImage))}">
              Preguntar por WhatsApp
            </a>
          </div>
        </article>
      `;
    })
    .join("");

  if (window.Swiper) {
    grid.querySelectorAll(".card-swiper").forEach((node) => {
      const card = node.closest(".product-card");
      if (!card) return;

      const button = card.querySelector(".js-product-wa");
      const productIndex = Number(button?.dataset.productIndex ?? -1);
      const product = filtered[productIndex];
      const images = product ? normalizeImages(product.imagenUrl) : [];

      if (button && product) {
        const firstImage = images[0] || "";
        button.dataset.imageUrl = firstImage;
        updateCardWhatsAppLink(button, product, firstImage);
      }

      const slideCount = node.querySelectorAll(".swiper-slide").length;
      const instance = new window.Swiper(node, {
        loop: slideCount > 1,
        autoplay: slideCount > 1
          ? {
              delay: 2800,
              disableOnInteraction: false
            }
          : false,
        pagination: {
          el: node.querySelector(".swiper-pagination"),
          clickable: true
        }
      });

      node.style.cursor = images.length ? "zoom-in" : "default";

      node.addEventListener("click", (event) => {
        const image = event.target.closest("img");
        const slideImage = images[instance.realIndex] || images[0] || "";
        if (!image && !slideImage) return;

        openImageLightbox(slideImage || image.src, product.nombre || "Producto");
      });

      if (button && product && images.length > 1) {
        instance.on("slideChange", () => {
          const imageAtSlide = images[instance.realIndex] || images[0] || "";
          button.dataset.imageUrl = imageAtSlide;
          updateCardWhatsAppLink(button, product, imageAtSlide);
        });
      }
    });
  }
}

async function loadProducts() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  grid.innerHTML = '<p class="status-msg">Cargando productos...</p>';

  try {
    const snapshot = await getDocs(collection(db, STORE_CONFIG.firebaseCollection));

    state.products = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

    if (!state.products.length) {
      grid.innerHTML = '<p class="status-msg">No hay productos aún. Agrégalos desde el panel admin.</p>';
      return;
    }

    renderProducts();
  } catch (error) {
    console.error(error);
    grid.innerHTML = '<p class="status-msg">No se pudo cargar el catálogo. Revisa Firebase config y reglas.</p>';
  }
}

function bindCatalogControls() {
  const searchInput = document.getElementById("input-buscador");
  const filterButtons = document.querySelectorAll(".filter-btn");

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      state.filterText = String(event.target.value || "").trim().toLowerCase();
      renderProducts();
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((node) => node.classList.remove("active"));
      button.classList.add("active");
      state.selectedCategory = button.dataset.category || "todos";
      renderProducts();
    });
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  ensureImageLightbox();
  initHeaderInteractions();
  initHeroSwiper();
  initInstallAppButton();
  wireSocialLinks();
  bindCatalogControls();
  registerServiceWorker();
  await loadProducts();
});
