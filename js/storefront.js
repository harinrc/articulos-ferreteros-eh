import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from "./firebase-init.js";
import { STORE_CONFIG } from "./config.js";
import { buildWhatsAppLink, initHeaderInteractions, initHeroSwiper, safeText, wireSocialLinks } from "./ui.js";

const state = {
  products: [],
  filterText: "",
  selectedCategory: "todos"
};

function normalizeImages(imageField) {
  if (Array.isArray(imageField)) return imageField.filter(Boolean);
  if (typeof imageField === "string" && imageField.trim()) return [imageField.trim()];
  return [];
}

function productWhatsAppMessage(product) {
  const lines = [
    `Hola, me interesa este producto de ${STORE_CONFIG.brandName}:`,
    `Producto: ${product.nombre || "Sin nombre"}`,
    `Precio: ${product.precio || "Consultar"}`,
    `Categoria: ${product.categoria || "Otros"}`
  ];

  if (product.descripcion) {
    lines.push(`Descripcion: ${product.descripcion}`);
  }

  return lines.join("\n");
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
            <a class="cta-btn" target="_blank" rel="noopener noreferrer" href="${buildWhatsAppLink(productWhatsAppMessage(product))}">
              Preguntar por WhatsApp
            </a>
          </div>
        </article>
      `;
    })
    .join("");

  if (window.Swiper) {
    grid.querySelectorAll(".card-swiper").forEach((node) => {
      const slideCount = node.querySelectorAll(".swiper-slide").length;
      new window.Swiper(node, {
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
      grid.innerHTML = '<p class="status-msg">No hay productos aun. Agregalos desde el panel admin.</p>';
      return;
    }

    renderProducts();
  } catch (error) {
    console.error(error);
    grid.innerHTML = '<p class="status-msg">No se pudo cargar el catalogo. Revisa Firebase config y reglas.</p>';
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

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    } catch (error) {
      console.error("Service Worker registration failed", error);
    }
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  initHeaderInteractions();
  initHeroSwiper();
  wireSocialLinks();
  bindCatalogControls();
  registerServiceWorker();
  await loadProducts();
});
