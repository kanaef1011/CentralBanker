// Password visibility toggle
const toggleBtn = document.getElementById("togglePasswordBtn");
const pwdInput = document.getElementById("passwordField");
const pwdIcon = document.getElementById("pwdToggleIcon");

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

let emailInput = document.querySelector("#emailinput");
let passwordInput = document.querySelector("#passwordinput");
let submitBtn = document.querySelector("#submitBtn");

submitBtn.addEventListener("click", function (event) {
  console.log(emailInput.value);
  console.log(passwordInput.value);
});
