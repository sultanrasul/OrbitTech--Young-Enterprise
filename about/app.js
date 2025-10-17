// SHOPPING CART
document.addEventListener("DOMContentLoaded", function() {
  let cartIcon = document.querySelector("#cart-icon");
  let cart = document.querySelector(".cart");
  let closeCart = document.querySelector("#close-cart");

  cartIcon.onclick = () => {
    cart.classList.add("active");
  };

  closeCart.onclick = () => {
    cart.classList.remove("active");
  };
});

var customOrderCount = 0;

function ready() {
  const addcartButtons = document.querySelectorAll('.add-to-cart');
  loadCartFromCookies();

  let customOrderCount = parseInt(localStorage.getItem('customOrderCount')) || 0;

  addcartButtons.forEach((addcart) => {
    addcart.addEventListener('click', function (event) {
      const target = event.target;
      const shopProducts = target.closest('.services__card');
      const product = shopProducts.querySelector('.product-title').textContent;
      const image = shopProducts.querySelector('.services__image').src;
      const price = shopProducts.querySelector('.price').textContent;
      const colour = (image.split("/")[5]).split(".")[0];
    
      const title = `${product} - ${colour}`;
      console.log(product);
    
      if (product === "Custom" && countCustomOrders() >= 2) {
        notify_error("You can only buy up to 2 custom orders at a time.");
        return;
      }
    
      addProductToCart(title, price, image, true, 1);
      updateTotal();
    
      if (product === "Custom") {
        customOrderCount++;
        localStorage.setItem("customOrderCount", customOrderCount);
      }
    });
  });
}


document.addEventListener("DOMContentLoaded", function() {
  let buyNowElement = document.getElementById('buynow');
  buyNowElement.addEventListener("click", function() {
    let cartItems = JSON.parse(getCookie('cartItems') || '[]');
    if (cartItems.length != 0) {
       fetch('/backend/create-checkout-session', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ cartItems: cartItems }),
       })
       .then(response => {
         if (response.ok) {
           return response.json();
         }
         throw new Error('Network response was not ok.');
       })
       .then(data => {
         // Handle the response data if needed
         window.open(data.url,"_self");
       })
       .catch(error => {
         console.error('There was a problem with the fetch operation:', error);
       });
      }
    else if(cartItems.length === 0){
      notify_error("Please add something to your basket")
    }
  });
});


document.addEventListener('DOMContentLoaded', ready);



function removeCartItem(event) {
  var buttonClicked = event.target;
  var cartItem = buttonClicked.parentElement;
  cartItem.remove();
  updateTotal();
  
  const title = cartItem.querySelector(".cart-product-title").textContent;
  const price = cartItem.querySelector(".cart-price").textContent;
  const productImg = cartItem.querySelector(".cart-img").src;
  
  removeItemFromCookie(title, price, productImg);

  updateCartCount();
}

function removeItemFromCookie(title, price, productImg) {
  let cartItems = JSON.parse(getCookie('cartItems') || '[]');

  const itemIndex = cartItems.findIndex(item => item.title === title && item.price === price && item.productImg === productImg);
  if (itemIndex !== -1) {
    cartItems.splice(itemIndex, 1);
    const now = new Date();
    const expireDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    document.cookie = `cartItems=${JSON.stringify(cartItems)}; expires=${expireDate.toUTCString()}; path=/`;
  }
}

function quantityChanged(event) {
  var input = event.target;
  if (isNaN(input.value) || input.value <= 0) {
    input.value = 1;
  }

  var cartItem = input.parentElement;
  var title = cartItem.querySelector(".cart-product-title").textContent;
  var quantity = input.value;

  // Check if the item is a custom order
  if (title.toLowerCase().startsWith("custom")) {
    var customOrderCount = countCustomOrders();
    var newCustomOrderCount = customOrderCount - 1 + parseInt(quantity);

    if (newCustomOrderCount > 2) {
      notify_error("You can only buy up to 2 custom orders at a time.");
      input.value = 1; // Set the quantity to 2 if the limit is exceeded
      quantity = 1; // Update quantity to the correct value
    }
  }

  // Check if updating the quantity exceeds the total order limit (50)
  let cartItems = JSON.parse(getCookie('cartItems') || '[]');
  let totalQuantityInCart = cartItems.reduce((total, item) => total + parseInt(item.quantity), 0);

  if (totalQuantityInCart > 50) {
    notify_error("Cannot update quantity. Maximum total order quantity is 50.");
    input.value = 1; // Set the quantity to the maximum allowed value
    quantity = input.value; // Update quantity to the correct value
  }

  localStorage.setItem("customOrderCount", countCustomOrders());

  updateCookieQuantity(title, quantity);
  updateTotal();
  updateCartCount();
}

// Add event listeners for both 'input' and 'change' events
document.addEventListener('DOMContentLoaded', function() {
  var quantityInputs = document.querySelectorAll('.cart-quantity');
  quantityInputs.forEach(function(input) {
    input.addEventListener('input', quantityChanged);
    input.addEventListener('change', quantityChanged);
  });
});

function countCustomOrders() {
  let cartItems = JSON.parse(getCookie('cartItems') || '[]');

  var customOrderCount = 0;
  for (var i = 0; i < cartItems.length; i++) {
    var title = cartItems[i].title;
    var quantity = cartItems[i].quantity;

    if (title.toLowerCase().startsWith("custom")) {
      customOrderCount += quantity;
    }
  }

  return customOrderCount;
}


function updateCookieQuantity(title, quantity) {
  let cartItems = JSON.parse(getCookie('cartItems') || '[]');

  const existingItemIndex = cartItems.findIndex(item => item.title === title);

  if (existingItemIndex !== -1) {
    cartItems[existingItemIndex].quantity = quantity;

    const now = new Date();
    const expireDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    document.cookie = `cartItems=${JSON.stringify(cartItems)}; expires=${expireDate.toUTCString()}; path=/`;
  }
}



function addProductToCart(title, price, productImg, notify, quantity) {
  var cartItems = document.getElementsByClassName("cart-content")[0].getElementsByClassName("cart-box");

  let cartItemsCookie = JSON.parse(getCookie('cartItems') || '[]');
  let totalQuantityInCart = cartItemsCookie.reduce((total, item) => total + parseInt(item.quantity), 0);

  // Check if adding the new item will exceed the total order limit (50)
  if (totalQuantityInCart + parseInt(quantity) > 50 && notify === true) {
    notify_error("Cannot add more items. Maximum total order quantity is 50.");
    return;
  }

  for (var i = 0; i < cartItems.length; i++) {
    var cartBoxTitle = cartItems[i].getElementsByClassName("cart-product-title")[0].innerText;

    if (cartBoxTitle.toUpperCase() === title.toUpperCase()) {
      var cartQuantityInput = cartItems[i].getElementsByClassName("cart-quantity")[0];
      var newQuantity = parseInt(cartQuantityInput.value) + parseInt(quantity);
      cartQuantityInput.value = newQuantity;

      updateCookieQuantity(title, newQuantity);
      
      if (notify === true) {
        notify_success(`Updated ${title}`);
      }
      
      updateTotal();
      updateCartCount();
      return;
    }
  }

  var cartShopBox = document.createElement("div");
  cartShopBox.classList.add("cart-box");

  var cartBoxContent = `
    <img src="${productImg}" alt="" class="cart-img" >
    <div class="details-box">
      <div class="cart-product-title">${title}</div>
      <div class="cart-price">${price}</div>
      <input type="number" value="${quantity}" class="cart-quantity">
    </div>
    <i class='bx bxs-trash-alt cart-remove'></i>
  `;

  cartShopBox.innerHTML = cartBoxContent;
  document.getElementsByClassName("cart-content")[0].append(cartShopBox);

  cartShopBox.getElementsByClassName("cart-remove")[0].addEventListener("click", removeCartItem);
  cartShopBox.getElementsByClassName("cart-quantity")[0].addEventListener("change", quantityChanged);
  
  saveToCookie(title, price, productImg, quantity);

  if (notify === true) {
    notify_success(`${title} added to basket`);
  }

  updateTotal();
  updateCartCount();
}

function updateCartCount() {
  let cartItems = JSON.parse(getCookie('cartItems') || '[]');
  let totalQuantity = cartItems.reduce((total, item) => total + parseInt(item.quantity), 0);
  console.log(totalQuantity)
  let cartCountElement = document.getElementById('cart-count');
  if (cartCountElement) {
    if (totalQuantity > 0) {
      cartCountElement.style.display = 'block';
      cartCountElement.innerText = totalQuantity;
    } else {
      cartCountElement.style.display = 'none';
    }
  }
}

// SAVING TO COOKIE

function saveToCookie(title, price, productImg, quantity) {
  let cartItems = JSON.parse(getCookie('cartItems') || '[]');

  const existingItemIndex = cartItems.findIndex(
    item => item.title === title && item.price === price && item.productImg === productImg
  );

  if (existingItemIndex !== -1) {
    // Update the quantity if the item already exists in the cart
    cartItems[existingItemIndex].quantity = parseInt(quantity); // Ensure quantity is parsed to an integer
  } else {
    // Add a new item with the specified quantity
    const newItem = { title, price, productImg, quantity: parseInt(quantity) }; // Convert quantity to an integer
    cartItems.push(newItem);
  }

  const now = new Date();
  const expireDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  document.cookie = `cartItems=${JSON.stringify(cartItems)}; expires=${expireDate.toUTCString()}; path=/`;
}



function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function loadCartFromCookies() {
  const cartItemsString = getCookie('cartItems');

  if (cartItemsString) {
    try {
      const cartItems = JSON.parse(cartItemsString);

      console.log('Retrieved cart items:', cartItems);

      for (var i = 0; i < cartItems.length; i++) {
        const title = cartItems[i]["title"];
        const price = cartItems[i]["price"];
        const image = cartItems[i]["productImg"];
        const quantity = parseInt(cartItems[i]["quantity"]); // Ensure quantity is parsed as an integer


        addProductToCart(title, price, image, false, quantity);
        updateTotal();
        updateCartCount()
      }
    } catch (error) {
      console.error("Error parsing cartItems JSON:", error);
    }
  } else {
    updateCartCount()
  }
}




// Call this function to load cart items from cookies on page load

// SAVING TO COOKIE

function updateTotal() {
  var cartContent = document.getElementsByClassName("cart-content")[0];
  var cartBoxes = cartContent.getElementsByClassName("cart-box");

  if (cartBoxes.length === 0) {
    document.getElementsByClassName("total-price")[0].innerText = "£0.00";
    return;
  }

  var total = 0;
  for (var i = 0; i < cartBoxes.length; i++) {
    var cartBox = cartBoxes[i];
    var priceElement = cartBox.getElementsByClassName("cart-price")[0];
    var quantityElement = cartBox.getElementsByClassName("cart-quantity")[0];
    var price = parseFloat(priceElement.innerText.replace("£", ""));
    var quantity = quantityElement.value;
    total = total + price * quantity;
  }

  total = Math.round(total * 100) / 100;
  document.getElementsByClassName("total-price")[0].innerText = "£" + total;
}



document.addEventListener("DOMContentLoaded", function () {
  const servicesCards = document.querySelectorAll('.services__card');
  const cardsArray = Array.from(servicesCards); // Convert NodeList to Array

  servicesCards.forEach(card => {
    const buttons = card.querySelectorAll('.colours');
    let selectedButton = card.querySelector('.colours');

    buttons.forEach(button => {
      button.addEventListener('click', function() {
        card.querySelectorAll('.colours').forEach(btn => {
          btn.style.transform = 'scale(1)';
        });

        selectedButton = button;
        selectedButton.style.transform = 'scale(1.5)';

        const serviceCard = this.closest('.services__card');
        const selectedColour = this.style.backgroundColor;

        const cardIndex = cardsArray.indexOf(serviceCard); // Use the array to find index
        colourChange(selectedColour,cardIndex)
      });
    });
  });
});


function colourChange(selectedColour, cardIndex) {
  const servicesCards = document.querySelectorAll('.services__card')[cardIndex];
  const image = servicesCards.querySelector('.services__image');

  const productTitleElement = servicesCards.querySelector('.product-title');
  const productTitle = productTitleElement.textContent.toLowerCase(); // Retrieve text content and convert to lowercase

  const blue = "rgb(26, 52, 85)";
  const pink = "rgb(250, 44, 140)";
  const white = "rgb(160, 158, 158)";
  const black = "rgb(44, 44, 44)";


  if (selectedColour === pink) {
    image.src = `/products/${productTitle}/pink.png`;
  } else if (selectedColour === blue) {
    image.src = `/products/${productTitle}/blue.png`;
  } else if (selectedColour === white) {
    image.src = `/products/${productTitle}/white.png`;
  } else if (selectedColour === black){
    image.src = `/products/${productTitle}/black.png`;
  }
}

// SHOPPING CART


function notify_error(letters) {
  Toastify({
    text: letters,
    duration: 3000,
    newWindow: false,
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

function notify_success(letters) {
  // console.log("hello");
  Toastify({
    text: letters,
    duration: 3000,
    newWindow: false,
    close: false,
    gravity: "top", // `top` or `bottom`
    position: "center", // `left`, `center` or `right`
    stopOnFocus: false, // Prevents dismissing of toast on hover
    className: "Toastify",
    style: {
      background: "linear-gradient(to right, #00b09b, #96c93d)",
      //  background: "linear-gradient(to right, #9e3434, #e66431)",
    },
    onClick: function(){} // Callback after click
  }).showToast();
}
 


// SUCCESS CARD

document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const name = urlParams.get('name');
  const email = urlParams.get('email');
  
  if (name && email) {
    window.history.replaceState({}, document.title, "/"); //removes code from url w/o refreshing
    document.cookie = 'cartItems=; Max-Age=-99999999;'; // Setting a negative time clears the cookies
    loadCartFromCookies();

    const cartContent = document.querySelector('.cart-content');
    cartContent.innerHTML = ''; // Clear the content of the cart

    // Update the total price
    updateTotal();

    document.getElementById('success').style.display = 'block'; 

    document.getElementById('message').innerText = `Thank you, ${name}! Your confirmation will be sent to ${email} in a few minutes.`;
    
    const elementsToHide = document.querySelectorAll('body > *:not(#success):not(header):not(footer)');

    elementsToHide.forEach(element => {
      element.style.display = 'none';
    });

    
    // Handle "Continue" button click
    const continueButton = document.getElementById('contBtn');
    continueButton.addEventListener('click', function() {
      // Revert changes when "Continue" is clicked
      document.getElementById('success').style.display = 'none'; // Hide the success div

      // Revert display property for the hidden elements
      elementsToHide.forEach(element => {
        element.style.display = 'block';
      });
    });
  }
});
