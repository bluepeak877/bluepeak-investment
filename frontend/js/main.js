const API_URL = "http://localhost:3001/api";
const token = localStorage.getItem("token");

function showToast(message, type = "success") {

  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.className = "";

  toast.innerText = message;

  toast.classList.add("show");
  toast.classList.add(type);

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

if (!token) {
  window.location.href = "login.html";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString();
}

function setAvatar(fullName) {
  const avatar = document.getElementById("userAvatar");
  if (!avatar) return;

  avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    fullName || "BluePeak User"
  )}&background=2563eb&color=fff`;
}

async function authorizedFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    logoutUser();
    return null;
  }

  return response;
}

async function loadDashboardData() {
  try {
    const profileRes = await authorizedFetch("/auth/profile");
    if (!profileRes) return;

    const user = await profileRes.json();
    const availableBalance =
      (user.depositWallet || 0) +
      (user.referralWallet || 0) +
      (user.withdrawableWallet || 0);

    setText("userName", user.fullName || "BluePeak User");
    setAvatar(user.fullName);
    setText("totalBalance", formatMoney(user.totalBalance));
    setText("depositWallet", formatMoney(user.depositWallet));
    setText("referralWallet", formatMoney(user.referralWallet));
    setText("withdrawableWallet", formatMoney(user.withdrawableWallet));
    setText("lockedDailyBonus", formatMoney(user.lockedDailyBonus));
    setText("lockedProfit", formatMoney(user.lockedProfit));
    setText("availableBalance", formatMoney(availableBalance));
    setText("profitWallet", formatMoney(user.lockedProfit));
    setText("bonusWallet", formatMoney(user.referralWallet));
    setText("referralCode", user.referralCode || "NO-CODE");
    setText("userLevel", user.level || "Bluepeak Starter");
    if (document.getElementById("userLevelCard")) {

      setText("userLevelCard", user.level || "BluePeak Starter");

      setText("totalInvested",formatMoney(user.totalInvested || 0));

      updateLevelProgress(
        user.totalInvested || 0,
        user.level || "BluePeak Starter"
      );
    }
    
    localStorage.setItem("user", JSON.stringify(user));

    await Promise.all([loadInvestmentsSummary(), loadLatestTransaction()]);
  } catch (error) {
    console.log("Dashboard load error:", error);
  }
}

async function loadInvestmentsSummary() {
  const investmentRes = await authorizedFetch("/investments/my-investments");
  if (!investmentRes) return;

  const investmentData = await investmentRes.json();
  const investments = investmentData.investments || [];
  const activeInvestmentBox = document.querySelector(".empty-investment");

  if (activeInvestmentBox && investments.length > 0) {
    const latest = investments[0];

    activeInvestmentBox.innerHTML = `
      <div>*</div>
      <p><strong>${latest.packageName}</strong></p>
      <p>&#8358;${formatMoney(latest.amount)} - ${latest.dailyROI}% Daily</p>
      <a href="investments.html">View Plan</a>
    `;
  }

  const totalInvested = investments.reduce(
  (sum, inv) => sum + (inv.amount || 0),
  0
  );

  const totalProfit = investments.reduce(
    (sum, inv) => sum + (inv.profitEarned || 0),
    0
  );

  const activePlans = investments.filter(
  inv => inv.status === "active"
  ).length;

  setText("profitWallet", formatMoney(totalProfit));
  setText("activePlansCount", activePlans)

if (document.getElementById("totalInvested")) {
  setText(
    "totalInvested",
    formatMoney(totalInvested)
  );
}

if (document.getElementById("userLevelCard")) {

  let level = "BluePeak Starter";

  if (totalInvested >= 1000000) {
    level = "BluePeak Legend";
  } else if (totalInvested >= 200000) {
    level = "BluePeak Prime";
  } else if (totalInvested >= 50000) {
    level = "BluePeak Elite";
  } else if (totalInvested >= 10000) {
    level = "BluePeak Pro";
  }

  setText("userLevelCard", level);

  updateLevelProgress(
    totalInvested,
    level
  );
}
}

async function loadLatestTransaction() {
  const transactionRes = await authorizedFetch("/transactions/my-transactions");
  if (!transactionRes) return;

  const transactionData = await transactionRes.json();
  const transactions = transactionData.transactions || [];
  const transactionCards = document.querySelectorAll(".transaction");

  if (transactionCards.length > 0 && transactions.length > 0) {
    const latestTx = transactions[0];

    transactionCards[0].innerHTML = `
      <img src="./images/icons/transactions.svg" alt="">
      <div>
        <h4>${latestTx.description}</h4>
        <p>${latestTx.type} - ${latestTx.status}</p>
      </div>
      <strong>&#8358;${formatMoney(latestTx.amount)}</strong>
    `;
  }
}

function updateGreeting() {
  const hour = new Date().getHours();
  let text = "Good Night";

  if (hour >= 5 && hour < 12) text = "Good Morning";
  else if (hour >= 12 && hour < 17) text = "Good Afternoon";
  else if (hour >= 17 && hour < 21) text = "Good Evening";

  setText("greeting", text);
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("show");
}

function copyReferral() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  navigator.clipboard.writeText(user.referralCode || "NO-CODE");
  showToast("Referral code copied successfully","success");
}

function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

async function verifyPendingPayment() {
  const transactionReference = localStorage.getItem("transactionReference");
  if (!transactionReference) return;

  try {
    const response = await authorizedFetch(
      `/payments/verify/${encodeURIComponent(transactionReference)}`
    );
    if (!response) return;

    const data = await response.json();

    if (response.ok) {
      localStorage.removeItem("transactionReference");
      localStorage.removeItem("paymentReference");
      showToast(data.message || "Wallet funded successfully", "success");
      loadDashboardData();
    }
  } catch (error) {
    console.log("Verification error:", error);
  }
}

async function claimDailyBonus() {
  try {
    const response = await authorizedFetch("/auth/daily-bonus", {
      method: "POST",
    });

    if (!response) return;

    const data = await response.json();

    showToast(
      data.message,
      response.ok ? "success" : "warning"
    );

    if (response.ok) {
      loadDashboardData();
    }

  } catch (error) {
    console.log(error);

    showToast(
      "Failed to claim daily bonus",
      "error"
    );
  }
}

async function loadNotifications() {
  try {
    const res = await authorizedFetch("/notifications");
    if (!res) return;

    const data = await res.json();
    const notifications = data.notifications || [];
    const list = document.getElementById("notificationList");

    setText("notificationCount", notifications.length);
    if (!list) return;

    if (notifications.length === 0) {
      list.innerHTML = "<p>No notifications</p>";
      return;
    }

    list.innerHTML = notifications
      .slice(0, 5)
      .map(
        (n) => `
          <div class="notification-item">
            <h5>${n.title}</h5>
            <p>${n.message}</p>
          </div>
        `
      )
      .join("");
  } catch (error) {
    console.log("Notification error:", error);
  }
}

const claimBtn = document.getElementById("claimBonusBtn");
if (claimBtn) {
  claimBtn.addEventListener("click", claimDailyBonus);
}

const bell = document.getElementById("notificationBell");
const dropdown = document.getElementById("notificationDropdown");
if (bell && dropdown) {
  bell.addEventListener("click", () => dropdown.classList.toggle("show"));
}

function updateLevelProgress(totalInvested, level) {

  let target = 10000;
  let nextLevel = "BluePeak Pro";
  let previous = 0;

  if (level === "BluePeak Pro") {
    previous = 10000;
    target = 50000;
    nextLevel = "BluePeak Elite";
  }

  if (level === "BluePeak Elite") {
    previous = 50000;
    target = 200000;
    nextLevel = "BluePeak Prime";
  }

  if (level === "BluePeak Prime") {
    previous = 200000;
    target = 1000000;
    nextLevel = "BluePeak Legend";
  }

  if (level === "BluePeak Legend") {

    document.getElementById("levelProgress").style.width = "100%";

    document.getElementById("nextLevelText").innerText =
      "Maximum level achieved";

    return;
  }

  const progress =
    ((totalInvested - previous) /
    (target - previous)) * 100;

 const progressBar =
  document.getElementById("levelProgress");

  if (progressBar) {
    progressBar.style.width =
    `${Math.max(0, Math.min(progress, 100))}%`;
  }

  const remaining = target - totalInvested;

  const nextLevelText =
  document.getElementById("nextLevelText");

  if (nextLevelText) {
    nextLevelText.innerText =
    `₦${formatMoney(remaining)} remaining for ${nextLevel}`;
  }
}

async function loadLatestWithdrawal() {

  try {

    const response = await fetch(
      `${API_URL}/withdrawals/latest-announcement`
    );

    const data = await response.json();

    const box =
      document.getElementById("latestWithdrawal");

    if (!box) return;

    if (!data.announcement) {

      box.innerHTML =
        "<p>No withdrawals yet.</p>";

      return;
    }

    const name =
      data.announcement.fullName;

    const maskedName =
      name.substring(0, 3) + "***";

    box.innerHTML = `
      <div class="withdraw-announcement">
        🎉 ${maskedName} withdrew
        ₦${formatMoney(
          data.announcement.amount
        )}
        <small>Recently Approved</small>
      </div>
    `;

  } catch (error) {

    console.log(
      "Latest withdrawal error:",
      error
    );

  }
}


function closeWelcomeModal() {

  const modal =
    document.getElementById("welcomeModal");

  if (modal) {
    modal.style.display = "none";
  }

  localStorage.setItem(
    "bluepeakWelcomeSeen",
    "true"
  );
}

window.addEventListener("load", () => {

  const seen =
    localStorage.getItem(
      "bluepeakWelcomeSeen"
    );

  const modal =
    document.getElementById(
      "welcomeModal"
    );

  if (!modal) return;

  if (seen === "true") {
    modal.style.display = "none";
  }

});

updateGreeting();
loadDashboardData();
loadNotifications();
verifyPendingPayment();
loadLatestWithdrawal();