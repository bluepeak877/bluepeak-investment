(function () {
  const API_URL = window.BLUEPEAK_CONFIG?.API_URL || "https://bluepeak.ng/api";
  const page = window.location.pathname.split("/").pop() || "dashboard.html";
  const placementByPage = {
    "dashboard.html": "dashboard",
    "packages.html": "packages",
    "deposit.html": "wallet",
    "withdraw.html": "wallet",
    "referral.html": "referral",
  };
  const placement = placementByPage[page];

  if (!placement) return;

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
    return `${API_URL.replace("/api", "")}${path}`;
  }

  function getAdLink(ad) {
    const links = {
      packages: "packages.html",
      referral: "referral.html",
      deposit: "deposit.html",
      withdrawal: "withdraw.html",
      dashboard: "dashboard.html",
      dailyBonus: "dashboard.html#daily-bonus",
    };

    if (ad.linkType === "custom" && ad.linkValue) {
      return /^https?:\/\//i.test(ad.linkValue) ? ad.linkValue : "packages.html";
    }

    return links[ad.linkType] || "packages.html";
  }

  function findMountPoint() {
    if (page === "dashboard.html") return document.querySelector(".welcome");
    if (page === "packages.html") return document.querySelector(".available-invest-card");
    return document.querySelector("main section, main, .main");
  }

  function renderAds(advertisements) {
    if (!advertisements.length) return;

    const mountPoint = findMountPoint();
    if (!mountPoint) return;

    const slot = document.createElement("section");
    slot.className = "advertisement-slot";
    slot.innerHTML = advertisements
      .slice(0, 3)
      .map((ad) => {
        const href = getAdLink(ad);
        const target = href.startsWith("http") ? ` target="_blank" rel="noopener"` : "";

        return `
          <article class="advertisement-card">
            <img src="${getImageUrl(ad.image)}" alt="${escapeHTML(ad.title)}">
            <div>
              <h3>${escapeHTML(ad.title)}</h3>
              <p>${escapeHTML(ad.description)}</p>
              <a href="${escapeHTML(href)}" data-ad-id="${ad._id}"${target}>
                ${escapeHTML(ad.buttonText || "Learn More")}
              </a>
            </div>
          </article>
        `;
      })
      .join("");

    mountPoint.insertAdjacentElement("afterend", slot);

    advertisements.slice(0, 3).forEach((ad) => {
      fetch(`${API_URL}/advertisements/${ad._id}/view`, {
        method: "POST",
      }).catch(() => {});
    });
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-ad-id]");
    if (!link) return;

    fetch(`${API_URL}/advertisements/${link.dataset.adId}/click`, {
      method: "POST",
    }).catch(() => {});
  });

  fetch(`${API_URL}/advertisements/active?placement=${encodeURIComponent(placement)}`)
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => renderAds(data?.advertisements || []))
    .catch((error) => console.log("Advertisement load error:", error));
})();
