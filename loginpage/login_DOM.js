import app from "../config.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
} from "firebase/auth";

const auth = getAuth(app);

// Password visibility toggle
const toggleBtn = document.getElementById("togglePasswordBtn");
const pwdInput = document.getElementById("passwordInput");
const pwdIcon = document.getElementById("pwdToggleIcon");

// Đã đăng nhập Firebase rồi thì vào thẳng game.
// (Trước đây kiểm tra localStorage "email"; nếu phiên Firebase đã hết mà email vẫn còn,
// trang game đá về login, login lại đá sang game → lặp vô tận.)
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = "/simulatorpage/simulator.html";
});

if (toggleBtn && pwdInput && pwdIcon) {
  toggleBtn.addEventListener("click", function () {
    const isPassword = pwdInput.getAttribute("type") === "password";
    pwdInput.setAttribute("type", isPassword ? "text" : "password");
    pwdIcon.textContent = isPassword ? "visibility" : "visibility_off";
  });
}

// Hardware Passkey Trigger simulation
const bioBtn = document.getElementById("biometricBtn");
if (bioBtn) {
  bioBtn.addEventListener("click", function () {
    const originalHtml = bioBtn.innerHTML;
    bioBtn.innerHTML = `
          <div class="flex items-center gap-2 w-full justify-center text-primary font-label-md">
            <span class="material-symbols-outlined animate-spin text-[18px]">sync</span>
            <span>Verifying Hardware Security Key...</span>
          </div>
        `;
    setTimeout(() => {
      bioBtn.innerHTML = `
            <div class="flex items-center gap-2 w-full justify-center text-tertiary font-label-md">
              <span class="material-symbols-outlined text-[18px]">check_circle</span>
              <span>FIDO2 Authenticated. Connecting...</span>
            </div>
          `;
      setTimeout(() => {
        bioBtn.innerHTML = originalHtml;
      }, 2400);
    }, 1200);
  });
}

// Form submit feedback
function handleAuthSubmit() {
  const btn = document.getElementById("submitBtn");
  const text = document.getElementById("btnText");
  const icon = document.getElementById("btnIcon");

  if (!btn) return;
  btn.disabled = true;
  text.textContent = "Authenticating Terminal Node...";
  icon.textContent = "sync";
  icon.classList.add("animate-spin");

  setTimeout(() => {
    text.textContent = "Handshake Established";
    icon.classList.remove("animate-spin");
    icon.textContent = "check";
    setTimeout(() => {
      btn.disabled = false;
      text.textContent = "Access Terminal";
      icon.textContent = "arrow_forward";
    }, 1800);
  }, 1400);
}

// login.html gọi hàm này từ onsubmit, nên module phải gắn nó lên window
window.handleAuthSubmit = handleAuthSubmit;

let emailInput = document.querySelector("#emailInput");
let passwordInput = document.querySelector("#passwordInput");
let submitBtn = document.querySelector("#submitBtn");
let loginForm = document.querySelector("#loginForm");

const errorMessageDiv = document.getElementById("errorMessage");

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  try {
    await signInWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value,
    );
    localStorage.setItem("email", JSON.stringify(emailInput.value));
    window.location.href = "/simulatorpage/simulator.html";
  } catch (error) {
    console.error("Error signing in with email and password:", error);
    errorMessageDiv.textContent =
      "Invalid email or password. Please try again.";
  }
});
