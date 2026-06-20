const fundBtn = document.getElementById("fundBtn");

fundBtn.addEventListener("click", async () => {

  const token = localStorage.getItem("token");

  const amount = document.getElementById("amount").value;

  const message = document.getElementById("message");

  if (!amount || amount < 100) {
    message.innerText = "Minimum deposit is ₦100";
    return;
  }

  try {

    fundBtn.disabled = true;
    fundBtn.innerText = "Generating Account...";

    const response = await fetch(
      "https://bluepeak-api-ooxc.onrender.com/api/payments/initialize",
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

    console.log(data.responseBody);

    if (response.ok && data.requestSuccessful) {

      const account = data.responseBody;

      if (!account) {
        message.innerText =
          "Account generation failed";
        return;
      }

      document.getElementById("generatedAccount").innerHTML = `
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
        "Failed to generate account";

    }

  } catch (error) {

    console.log(error);

    message.innerText =
      "Something went wrong";

  } finally {

    fundBtn.disabled = false;
    fundBtn.innerText = "Generate Account";

  }

});