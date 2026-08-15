import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth } from "./firebase-init.js";

window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const message = document.getElementById("login-message");

  if (!form || !message) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = form.email.value.trim();
    const password = form.password.value;

    message.textContent = "Validando acceso...";

    try {
      await signInWithEmailAndPassword(auth, email, password);
      message.textContent = "Acceso correcto. Redirigiendo...";
      window.location.href = "./admin.html";
    } catch (error) {
      console.error(error);
      message.textContent = "No se pudo iniciar sesión. Revisa correo y contraseña.";
    }
  });
});
