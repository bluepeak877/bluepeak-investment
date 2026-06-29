const API_URL =
  window.BLUEPEAK_CONFIG?.API_URL || "https://bluepeak.ng/api";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString();
}

async function loadReferralData() {
  try {
    const response = await fetch(`${API_URL}/referrals/my-referrals`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    const referralCode = data.referralCode || "NO-CODE";

    const referralLink =
      `${window.location.origin}/register.html?ref=${referralCode}`;

    document.getElementById("referralCode").innerText = referralCode;
    document.getElementById("referralLink").innerText = referralLink;
    
    const whatsappBtn =
     document.getElementById("shareWhatsapp");

    const telegramBtn =
      document.getElementById("shareTelegram");

    if (whatsappBtn) {
      whatsappBtn.href =
      `https://wa.me/?text=${encodeURIComponent(
      "Join BluePeak Investment using my referral link: " +
      referralLink
      )}`;
    }

    if (telegramBtn) {
      telegramBtn.href =
      `https://t.me/share/url?url=${encodeURIComponent(
      referralLink
      )}`;
    }
    document.getElementById("totalReferrals").innerText =
      data.totalReferrals || 0;
    document.getElementById("referralWallet").innerText =
      formatMoney(data.referralWallet);

    const history = document.getElementById("referralHistory");

    if (!data.referralTransactions || data.referralTransactions.length === 0) {
      history.innerHTML = "<p>No referral earnings yet.</p>";
      return;
    }

    history.innerHTML = data.referralTransactions
      .map((tx) => {
        const date = new Date(tx.createdAt).toLocaleDateString();

        return `
          <div class="transaction-history-card">
            <div>
              <h3>${tx.description}</h3>
              <p>${date} • ${tx.status}</p>
            </div>

            <strong class="tx-green">
              +₦${formatMoney(tx.amount)}
            </strong>
          </div>
        `;
      })
      .join("");

  } catch (error) {
    console.log(error);
    alert("Failed to load referral data");
  }
}

function copyCode() {
  const code =
    document.getElementById("referralCode").innerText;

  navigator.clipboard.writeText(code);

  showToast("Referral code copied", "success");
}

function copyLink() {
  const link =
    document.getElementById("referralLink").innerText;

  navigator.clipboard.writeText(link);

  showToast("Referral link copied", "success");
}

function copyLink() {
  const link = document.getElementById("referralLink").innerText;
  navigator.clipboard.writeText(link);
  alert("Referral link copied");
}

loadReferralData();
