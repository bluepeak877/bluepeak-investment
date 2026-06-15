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
    fundBtn.innerText = "Processing...";

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

    console.log(data);

    if (response.ok && data.requestSuccessful) {

      localStorage.setItem(
        "paymentReference",
        data.responseBody.paymentReference
      );

      localStorage.setItem(
        "transactionReference",
        data.responseBody.transactionReference
      );

      window.location.href =
        data.responseBody.checkoutUrl;

    } else {

      message.innerText =
        data.message ||
        data.responseMessage ||
        "Payment initialization failed";

      fundBtn.disabled = false;
      fundBtn.innerText = "Fund Wallet";
    }

  } catch (error) {

    console.log(error);

    message.innerText =
      "Something went wrong";

    fundBtn.disabled = false;
    fundBtn.innerText = "Fund Wallet";
  }

});