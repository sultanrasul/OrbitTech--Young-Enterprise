function notify_error(text, destination) {
  Toastify({
    text: text,
    duration: 3000,
    destination: "#contact",
    newWindow: false,
    destination: destination,
    close: false,
    gravity: "top", // `top` or `bottom`
    position: "center", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    className: "Toastify",
    style: {
         background: "linear-gradient(to right, #9e3434, #e66431)",
      // background: "linear-gradient(to right, #00b09b, #96c93d)",
    },
    onClick: function(){} // Callback after click
  }).showToast();
}

function notify_success(text, destination) {
  // console.log("hello");
  Toastify({
    text: text,
    duration: 3000,
    destination: destination,
    newWindow: false,
    close: false,
    gravity: "top", // `top` or `bottom`
    position: "center", // `left`, `center` or `right`
    stopOnFocus: false, // Prevents dismissing of toast on hover
    className: "Toastify",
    style: {
      background: "linear-gradient(to right, #00b09b, #96c93d)",
    },
    onClick: function(){} // Callback after click
  }).showToast();
}

function clearForm(){
  document.getElementById('nameInput').value = "";
  document.getElementById('emailInput').value = "";
  document.getElementById('messageInput').value = "";
}

function disableSubmitButton() {
  var submitButton = document.getElementById("submitButton");
  submitButton.style.cursor = "default";
  submitButton.style.opacity = "0.3";
  submitButton.disabled = true;

  setTimeout(function() {
    submitButton.disabled = false;
    submitButton.style.cursor = "pointer";
    submitButton.style.opacity = "1";
  }, 2000);
}


addEventListener('submit', submitForm);


function submitForm(event) {
  event.preventDefault();
  var name = document.getElementById('nameInput').value;
  var email = document.getElementById('emailInput').value;
  var message = document.getElementById('messageInput').value;
  disableSubmitButton();
  if (!email) {
    email = "None"; // Assign an empty string
  }

  var data = {
    "name": name,
    "contact": email,
    "message": message
  };

  if (name === '' || email === '' || message === '') {
    notify_error("Please fill out the form");
  } else {
    fetch("https://orbittech.store/message", {
      method: "POST",
      headers: {
        "Content-Type": "aptplication/json;charset=UTF-8",
      },
      body: JSON.stringify(data),
    })
      .then(function (response) {
        if (response.status === 200) {
          return response.json();
        } else if (response.status === 429) {
          // Handle the 429 status code (TOO MANY REQUESTS) here
          notify_error("Sorry, you have sent too many messages. Try again in 6 mins");
        } else {
          // Handle other non-200 status codes here
          console.error("Request failed with status:", response.status);
        }
      })
      .then(function (response) {
        if (response && response.status === 200) {
          notify_success("We have received your message!");
          clearForm();
        }
      })
      .catch(function (error) {
        console.error("Request failed with error:", error);
      });
  }
}
