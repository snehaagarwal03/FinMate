function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function showToast(message, type = "default") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const toastIcon = document.createElement("span");
  toastIcon.className = "toast-icon";

  switch (type) {
    case "success":
      toastIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
      break;
    case "error":
      toastIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
      break;
    case "warning":
      toastIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      toastIcon.innerHTML = '<i class="fas fa-info-circle"></i>';
  }

  const toastMessage = document.createElement("span");
  toastMessage.className = "toast-message";
  toastMessage.textContent = message;

  toast.appendChild(toastIcon);
  toast.appendChild(toastMessage);

  const toastContainer = document.querySelector(".toast-container");
  if (toastContainer) {
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

function initializeSidebar() {
  const navbarToggle = document.getElementById("navbar-toggle");
  const sideNav = document.getElementById("sidenav");

  if (navbarToggle && sideNav) {
    navbarToggle.addEventListener("click", function () {
      sideNav.classList.toggle("active");
    });
  }
}

function initializeProfileDropdown() {
  const profileToggle = document.getElementById("profile-toggle");
  const profileMenu = document.getElementById("profile-menu");
  const logoutBtn = document.getElementById("logout-btn");

  if (profileToggle && profileMenu) {
    profileToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      profileMenu.classList.toggle("active");
    });

    document.addEventListener("click", function (e) {
      if (
        profileMenu.classList.contains("active") &&
        !profileMenu.contains(e.target) &&
        e.target !== profileToggle
      ) {
        profileMenu.classList.remove("active");
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();

      firebase
        .auth()
        .signOut()
        .then(() => {
          window.location.href = "login.html";
        })
        .catch((error) => {
          console.error("Error signing out:", error);
          showToast("Error signing out. Please try again.", "error");
        });
    });
  }
}

function setDashboardGreeting() {
  const greetingElem =
    document.getElementById("dashboard-greeting") ||
    document.getElementById("welcome-message");
  if (greetingElem) {
    firebase.auth().onAuthStateChanged(async function (user) {
      if (user) {
        try {
          const userDoc = await firebase
            .firestore()
            .collection("users")
            .doc(user.uid)
            .get();
          let name = "User";
          if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData.name) name = userData.name;
          }
          greetingElem.textContent = `Hey, ${name}!`;
        } catch (error) {
          greetingElem.textContent = "Hey, User!";
        }
      }
    });
  }
}

firebase.auth().onAuthStateChanged(async function (user) {
  if (user) {
    const profileName = document.getElementById("profile-name");
    const profileEmail = document.getElementById("profile-email");
    if (profileEmail) profileEmail.textContent = user.email;
    try {
      const userDoc = await firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (profileName) profileName.textContent = userData.name || "User";
      }
    } catch (error) {
      if (profileName) profileName.textContent = "User";
    }
  }
});

function prefillProfileName() {
  firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
      try {
        const userDoc = await firebase
          .firestore()
          .collection("users")
          .doc(user.uid)
          .get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const nameInput = document.getElementById("profile-name-input");
          if (nameInput) nameInput.value = userData.name || "";
        }
      } catch (error) {}
    }
  });
}

if (window.location.pathname.endsWith("profile.html")) {
  document.addEventListener("DOMContentLoaded", prefillProfileName);
}

if (window.location.pathname.endsWith("dashboard.html")) {
  document.addEventListener("DOMContentLoaded", setDashboardGreeting);
}

function showLoading(show) {
  const loadingSpinner = document.getElementById("loading-spinner");
  if (loadingSpinner) {
    loadingSpinner.style.display = show ? "flex" : "none";
  }
}

function getCategoryIcon(category) {
  switch (category.toLowerCase()) {
    case "food":
      return "fas fa-utensils";
    case "shopping":
      return "fas fa-shopping-bag";
    case "transportation":
      return "fas fa-car";
    case "entertainment":
      return "fas fa-film";
    case "utilities":
      return "fas fa-lightbulb";
    case "housing":
      return "fas fa-home";
    case "healthcare":
      return "fas fa-medkit";
    case "education":
      return "fas fa-graduation-cap";
    case "travel":
      return "fas fa-plane";
    case "personal":
      return "fas fa-user";
    case "salary":
      return "fas fa-money-check-alt";
    case "investment":
      return "fas fa-chart-line";
    case "gift":
      return "fas fa-gift";
    case "other":
      return "fas fa-box";
    default:
      return "fas fa-receipt";
  }
}

function getCategories() {
  return [
    "Food",
    "Shopping",
    "Transportation",
    "Entertainment",
    "Utilities",
    "Housing",
    "Healthcare",
    "Education",
    "Travel",
    "Personal",
    "Salary",
    "Investment",
    "Gift",
    "Other",
  ];
}

function generateChartColors(count) {
  const baseColors = [
    "#00BCD4",
    "#4CAF50",
    "#F44336",
    "#FFC107",
    "#9C27B0",
    "#FF9800",
    "#3F51B5",
    "#2196F3",
    "#009688",
    "#E91E63",
    "#673AB7",
    "#CDDC39",
    "#795548",
    "#607D8B",
  ];

  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  const colors = [...baseColors];

  for (let i = baseColors.length; i < count; i++) {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);

    colors.push(`rgb(${r}, ${g}, ${b})`);
  }

  return colors;
}
