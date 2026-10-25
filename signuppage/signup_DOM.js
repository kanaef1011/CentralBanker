(function () {
  const passwordInput = document.getElementById("passwordInput");
  const toggleBtn = document.getElementById("togglePassword");
  const toggleIcon = document.getElementById("toggleIcon");
  const confirmInput = document.getElementById("confirmPassword");
  const toggleConfirmBtn = document.getElementById("toggleConfirmPassword");
  const toggleConfirmIcon = document.getElementById("toggleConfirmIcon");
  const strengthText = document.getElementById("strengthText");

  const bars = [
    document.getElementById("bar-1"),
    document.getElementById("bar-2"),
    document.getElementById("bar-3"),
    document.getElementById("bar-4"),
  ];

  if (toggleBtn && passwordInput && toggleIcon) {
    toggleBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      toggleIcon.textContent = isPassword ? "visibility_off" : "visibility";
    });
  }

  if (toggleConfirmBtn && confirmInput && toggleConfirmIcon) {
    toggleConfirmBtn.addEventListener("click", () => {
      const isPassword = confirmInput.type === "password";
      confirmInput.type = isPassword ? "text" : "password";
      toggleConfirmIcon.textContent = isPassword
        ? "visibility_off"
        : "visibility";
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", (e) => {
      const val = e.target.value || "";

      const hasLen = val.length >= 8;
      const hasNum = /[0-9]/.test(val);
      const hasSpec = /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val);
      const hasCase = /[a-z]/.test(val) && /[A-Z]/.test(val);

      let score = 0;
      if (hasLen) score++;
      if (hasNum) score++;
      if (hasSpec) score++;
      if (hasCase) score++;

      bars.forEach((b, i) => {
        if (!b) return;
        b.className =
          "h-full w-1/4 rounded-full transition-colors duration-300";
        if (score === 0) {
          b.classList.add("bg-surface-bright");
        } else if (i < score) {
          if (score <= 1) {
            b.classList.add("bg-error");
          } else if (score === 2) {
            b.classList.add("bg-tertiary-container");
          } else if (score === 3) {
            b.classList.add("bg-primary-container");
          } else {
            b.classList.add("bg-primary");
          }
        } else {
          b.classList.add("bg-surface-bright");
        }
      });

      if (!strengthText) return;
      if (val.length === 0) {
        strengthText.textContent = "Not entered";
        strengthText.className =
          "font-label-sm text-label-sm text-on-surface-variant";
      } else if (score <= 1) {
        strengthText.textContent = "Weak entropy";
        strengthText.className = "font-label-sm text-label-sm text-error";
      } else if (score === 2) {
        strengthText.textContent = "Fair security";
        strengthText.className = "font-label-sm text-label-sm text-tertiary";
      } else if (score === 3) {
        strengthText.textContent = "Robust key";
        strengthText.className = "font-label-sm text-label-sm text-primary";
      } else {
        strengthText.textContent = "Vault-Grade";
        strengthText.className =
          "font-label-sm text-label-sm text-primary font-bold";
      }
    });
  }
})();

const form = document.querySelector("#signupForm");
const submitBtn = document.querySelector("#submitBtn");
const confirmStrengthText = document.querySelector("#confirmStrengthText"); // make sure this exists

form.addEventListener("submit", function (e) {
  e.preventDefault();

  let username = document.querySelector("#usernameInput").value.trim();
  let email = document.querySelector("#emailInput").value.trim();
  let password = document.querySelector("#passwordInput").value;
  let confirmPassword = document.querySelector("#confirmPassword").value;

  if (username === "" || email === "" || password === "") {
    alert("Please fill in all fields.");
    return;
  }

  if (confirmPassword !== password) {
    confirmStrengthText.textContent = "Passphrases do not match";
    confirmStrengthText.className = "font-label-sm text-label-sm text-error";
    return;
  } else {
    confirmStrengthText.textContent = "";
  }

  console.log(username, email, password);

  let users;
  if (localStorage.getItem("users")) {
    users = JSON.parse(localStorage.getItem("users"));
  } else {
    users = [];
  }

  location.href = "./login.html";
});
