(function () {
  const pagesWithNav = new Set([
    "dashboard.html",
    "packages.html",
    "investments.html",
    "deposit.html",
    "withdraw.html",
    "transactions.html",
    "referral.html",
    "profile.html",
  ]);

  const currentPage =
    window.location.pathname.split("/").pop() || "dashboard.html";

  if (!pagesWithNav.has(currentPage)) {
    return;
  }

  document.body.classList.add("mobile-nav-page");

  if (document.querySelector(".bottom-nav")) {
    setActiveLink(document.querySelector(".bottom-nav"));
    return;
  }

  const nav = document.createElement("nav");
  nav.className = "bottom-nav";
  nav.setAttribute("aria-label", "Mobile app navigation");
  nav.innerHTML = `
    <a href="dashboard.html" data-pages="dashboard.html">
      <img src="./images/icons/dashboard.svg" alt="">
      <span>Home</span>
    </a>
    <a href="packages.html" data-pages="packages.html investments.html">
      <img src="./images/icons/chart.svg" alt="">
      <span>Invest</span>
    </a>
    <a href="deposit.html" data-pages="deposit.html withdraw.html transactions.html">
      <img src="./images/icons/wallet.svg" alt="">
      <span>Wallet</span>
    </a>
    <a href="referral.html" data-pages="referral.html">
      <img src="./images/icons/share.svg" alt="">
      <span>Referral</span>
    </a>
    <a href="profile.html" data-pages="profile.html">
      <img src="./images/icons/profile.svg" alt="">
      <span>Profile</span>
    </a>
  `;

  setActiveLink(nav);
  document.body.appendChild(nav);

  function setActiveLink(navElement) {
    navElement.querySelectorAll("a").forEach((link) => {
      const pages = (link.dataset.pages || "").split(" ");
      link.classList.toggle("active", pages.includes(currentPage));
    });
  }
})();
