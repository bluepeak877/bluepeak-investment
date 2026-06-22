const fundBtn = document.getElementById("fundBtn");

fundBtn.addEventListener("click", async () => {

  const token = localStorage.getItem("token");

  const amount = document.getElementById("amount").value;

  const message = document.getElementById("message");

  const generatedAccount =
    document.getElementById("generatedAccount");

  if (!amount || amount < 100) {
    message.innerText = "Minimum deposit is ₦100";
    return;
  }

  try {

    fundBtn.disabled = true;
    fundBtn.innerText = "Generating Account...";

    message.innerText = "";
    generatedAccount.innerHTML = "";

    const response = await fetch(
      "https://bluepeak.ng/api/payments/initialize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(amount),
        }),
      }
    );

    const data = await response.json();

    console.log(
      "FULL RESPONSE:",
      JSON.stringify(data, null, 2)
    );

    if (response.ok && data.success) {

      const account =
        data.data?.data?.[0];

      if (!account) {
        message.innerText =
          "Account generation failed";
        return;
      }

      generatedAccount.innerHTML = `
        <div class="generated-account-card">

          <h3>Transfer Payment</h3>

          <p>
            <strong>Bank:</strong>
            ${account.account_bank}
          </p>

          <p>
            <strong>Account Name:</strong>
            ${account.account_name}
          </p>

          <p>
            <strong>Account Number:</strong>
            ${account.account_number}
          </p>

          <p>
            <strong>Amount:</strong>
            ₦${Number(amount).toLocaleString()}
          </p>

          <p>
            <strong>Expires:</strong>
            ${Math.floor(
              account.expires / 3600
            )} Hours
          </p>

          <small>
            Transfer the exact amount above.
            Your wallet will be funded automatically
            after payment confirmation.
          </small>

        </div>
      `;

      message.innerText =
        "Account generated successfully";

    } else {

      message.innerText =
        data.message ||
        data.data?.message ||
        "Failed to generate account";

    }

  } catch (error) {

    console.log(error);

    message.innerText =
      "Something went wrong";

  } finally {

    fundBtn.disabled = false;
    fundBtn.innerText =
      "Generate Account";

  }

});