# 🛒 OrbitTech — E-Commerce Website (Frontend & Backend)

A full-featured, responsive **e-commerce platform** for selling customizable tech accessories.  
Built with **JavaScript (Frontend)** and **Flask + Stripe + PocketBase (Backend)** to provide a seamless shopping, checkout, and order management experience.

🔗 **Live Site:** [OrbitTech](https://orbittech.sultanrasul.com)  
🔗 **Admin Panel:** [PocketBase Dashboard](https://admin.orbittech.sultanrasul.com)

---

## ✨ Features

- **Add-to-Cart System 🛍️:**  
  Interactive cart with cookies + localStorage persistence. Items remain saved even after page reload.

- **Dynamic Product Cards:**  
  Each product has selectable colours (Blue, Pink, White, Black) that instantly update product images.  

- **Smart Quantity Management:**  
  - Maximum total quantity: **50 items per order**  
  - Custom orders limited to **2 at a time**  
  - Real-time validation on add/update/remove actions  

- **Custom Engraving Orders ✏️:**  
  Special handling for "Custom" products that generate personalized engraving fields during Stripe Checkout.  

- **Persistent Cart Data 💾:**  
  Uses cookies (`cartItems`) to store title, price, image, and quantity for up to 7 days.  

- **Stripe Checkout Integration 💳:**  
  Secure checkout with dynamic shipping rates, address collection, and success redirection.  

- **Shipping Calculation 🚚:**  
  Automatic pricing based on quantity tiers (1–3 items, 4–6, 7–15, 16+).  

- **Order Confirmation & Success Page ✅:**  
  - Displays confirmation message with buyer’s name & email  
  - Clears cookies after purchase  
  - Option to continue shopping  

- **Admin & Notifications 🔔:**  
  - All completed orders are sent to a **Discord channel** via Webhook  
  - Orders stored automatically in **PocketBase** (with address, line items, and custom fields)  

---

## 🛠️ Tech Stack

### **Frontend**
- **Core:** Vanilla JavaScript  
- **UI / Styling:** HTML5, CSS3, Toastify.js  
- **Data Persistence:** Cookies + LocalStorage  
- **Animations / Effects:** Toast notifications for success & error states  

### **Backend**
- **Framework:** Flask (Python 3.6+)  
- **Payment Gateway:** Stripe Checkout  
- **Database / Admin:** PocketBase  
- **Notifications:** Discord Webhook API  
- **Environment Config:** `dotenv` for managing keys & URLs  

---

## 🧩 Key Integrations

- **Stripe Checkout Session**
  - Dynamically generated `line_items` and `custom_fields`
  - Auto-redirects on success → `/backend/success`
  - Auto-redirects on cancel → main site

- **PocketBase Database**
  - Stores orders, addresses, products, and items
  - Automatically links `order_id` → `order_items` → `order_products`

- **Discord Notifications**
  - Each completed payment triggers an embedded message:
    - Order ID, Customer Name, Email, Total Amount  
    - Quick admin command: `/getorder {order_id}`  

---

## ⚙️ How It Works (Simplified Flow)

1. **User Browses Products** → Chooses a colour → Adds to cart  
2. **Cart Saved to Cookies** (client-side persistence)  
3. **“Buy Now” Click** → Sends cart data to `/backend/create-checkout-session`  
4. **Flask Server**
   - Calculates shipping
   - Builds Stripe Checkout session
   - Generates custom engraving fields if needed  
5. **Payment Completed (Webhook Triggered)**  
   - Order saved to PocketBase  
   - Discord notification sent  
6. **User Redirected to Success Page**  
   - Confirmation message shown  
   - Cart cleared automatically  

---

## 🧠 Developer Notes

- Cart data stored as `cartItems` JSON in cookies  
- All cookies expire after 7 days  
- `customOrderCount` tracked via localStorage  
- Maximum limits enforced both on **add** and **quantity change** events  
- Uses `Toastify.js` for instant feedback  

---

## 🚀 Deployment

- **Frontend Hosting:** [Vercel / Custom domain (orbittech.sultanrasul.com)]  
- **Backend Hosting:** Flask server (port `4050`)  
- **Admin / Database:** PocketBase Cloud  
- **Payment Processor:** Stripe Live Mode  

---
