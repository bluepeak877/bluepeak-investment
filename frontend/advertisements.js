const API_URL =
  `${window.BLUEPEAK_CONFIG?.API_URL || "/api"}/advertisements`;
const token = localStorage.getItem("token");
const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

const table = document.getElementById("advertisementTable");
const modal = document.getElementById("advertisementModal");
const addBtn = document.getElementById("addBtn");
const form = document.getElementById("advertisementForm");
const modalTitle = document.getElementById("modalTitle");
const imageInput = document.getElementById("image");
const imagePreview = document.getElementById("imagePreview");

let advertisements = [];

if (!token) {
  window.location.href = "login.html";
}

if (!savedUser.isAdmin) {
  alert("Admin access required");
  window.location.href = "dashboard.html";
}

function escapeHTML(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function getImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${window.BLUEPEAK_CONFIG?.API_URL?.replace("/api", "") || ""}${path}`;
}

function formatDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function getAdvertisementStatus(ad) {
  const now = new Date();
  const startDate = ad.startDate ? new Date(ad.startDate) : null;
  const endDate = ad.endDate ? new Date(ad.endDate) : null;

  if (!ad.isActive) {
    return { label: "Inactive", className: "inactive" };
  }

  if (startDate && startDate > now) {
    return { label: "Scheduled", className: "scheduled" };
  }

  if (endDate && endDate < now) {
    return { label: "Expired", className: "expired" };
  }

  return { label: "Live", className: "active" };
}

function getPreviewLink(ad) {
  const links = {
    dashboard: "dashboard.html",
    packages: "packages.html",
    wallet: "deposit.html",
    referral: "referral.html",
    all: "dashboard.html",
  };

  return links[ad.placement] || "dashboard.html";
}

async function adminFetch(url, options = {}) {
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    alert("Admin session expired or unauthorized");
    window.location.href = "login.html";
    return null;
  }

  return response;
}

function resetForm() {
  form.reset();
  document.getElementById("advertisementId").value = "";
  document.getElementById("displayOrder").value = "1";
  document.getElementById("isActive").checked = true;
  imagePreview.style.display = "none";
  imagePreview.src = "";
  modalTitle.innerText = "Add Advertisement";
}

function openModal(ad = null) {
  resetForm();

  if (ad) {
    document.getElementById("advertisementId").value = ad._id;
    document.getElementById("title").value = ad.title || "";
    document.getElementById("description").value = ad.description || "";
    document.getElementById("buttonText").value = ad.buttonText || "";
    document.getElementById("linkValue").value = ad.linkValue || "";
    document.getElementById("placement").value = ad.placement || "dashboard";
    document.getElementById("linkType").value = ad.linkType || "packages";
    document.getElementById("displayOrder").value = ad.displayOrder || 1;
    document.getElementById("isActive").checked = Boolean(ad.isActive);
    document.getElementById("startDate").value = formatDateInput(ad.startDate);
    document.getElementById("endDate").value = formatDateInput(ad.endDate);
    imagePreview.src = getImageUrl(ad.image);
    imagePreview.style.display = "block";
    modalTitle.innerText = "Edit Advertisement";
  }

  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

addBtn.addEventListener("click", () => openModal());

window.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

imageInput.addEventListener("change", () => {
  const image = imageInput.files[0];
  if (!image) return;

  imagePreview.src = URL.createObjectURL(image);
  imagePreview.style.display = "block";
});

async function loadAdvertisements() {
  try {
    const res = await adminFetch(API_URL);
    if (!res) return;

    const data = await res.json();
    table.innerHTML = "";

    if (!data.success) {
      alert(data.message || "Unable to load advertisements.");
      return;
    }

    advertisements = data.advertisements || [];

    if (advertisements.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="6" class="empty-cell">No advertisements found.</td>
        </tr>
      `;
      return;
    }

    table.innerHTML = advertisements
      .map(
        (ad) => {
          const status = getAdvertisementStatus(ad);

          return `
          <tr>
            <td>
              <img
                src="${getImageUrl(ad.image)}"
                alt="${escapeHTML(ad.title)}"
                class="ad-thumb"
              >
            </td>
            <td>
              <strong>${escapeHTML(ad.title)}</strong>
              <small>${escapeHTML(ad.buttonText || "Learn More")}</small>
            </td>
            <td>${escapeHTML(ad.placement)}</td>
            <td>
              <span class="${status.className}">${status.label}</span>
              <small>${Number(ad.views || 0)} views - ${Number(ad.clicks || 0)} clicks</small>
            </td>
            <td>${Number(ad.displayOrder || 1)}</td>
            <td class="action-cell">
              <a class="previewBtn" href="${getPreviewLink(ad)}" target="_blank">Preview</a>
              <button class="editBtn" data-id="${ad._id}">Edit</button>
              <button class="deleteBtn" data-id="${ad._id}">Delete</button>
            </td>
          </tr>
        `;
        }
      )
      .join("");
  } catch (error) {
    console.error(error);
    alert("Unable to load advertisements.");
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("advertisementId").value;
  const image = imageInput.files[0];

  if (!id && !image) {
    alert("Please select an image.");
    return;
  }

  const formData = new FormData();
  if (image) formData.append("image", image);
  formData.append("title", document.getElementById("title").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("buttonText", document.getElementById("buttonText").value);
  formData.append("linkValue", document.getElementById("linkValue").value);
  formData.append("placement", document.getElementById("placement").value);
  formData.append("linkType", document.getElementById("linkType").value);
  formData.append("displayOrder", document.getElementById("displayOrder").value);
  formData.append("isActive", document.getElementById("isActive").checked);
  formData.append("startDate", document.getElementById("startDate").value);
  formData.append("endDate", document.getElementById("endDate").value);

  try {
    const res = await adminFetch(id ? `${API_URL}/${id}` : API_URL, {
      method: id ? "PUT" : "POST",
      body: formData,
    });
    if (!res) return;

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Unable to save advertisement.");
      return;
    }

    alert(data.message || "Advertisement saved successfully.");
    closeModal();
    resetForm();
    loadAdvertisements();
  } catch (error) {
    console.error(error);
    alert("Unable to save advertisement.");
  }
});

table.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".editBtn");
  const deleteBtn = e.target.closest(".deleteBtn");

  if (editBtn) {
    const ad = advertisements.find((item) => item._id === editBtn.dataset.id);
    if (ad) openModal(ad);
    return;
  }

  if (!deleteBtn) return;

  const id = deleteBtn.dataset.id;
  if (!confirm("Delete this advertisement?")) return;

  try {
    const res = await adminFetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!res) return;

    const data = await res.json();
    alert(data.message || "Advertisement deleted.");
    loadAdvertisements();
  } catch (error) {
    console.error(error);
    alert("Unable to delete advertisement.");
  }
});

loadAdvertisements();
