#! /usr/bin/env python3.6

"""
server.py
Stripe Sample.
Python 3.6 or newer required.
"""
import os
from flask import Flask, request, jsonify , redirect
from pocketbase import Client
import requests
from discord_webhook import DiscordWebhook, DiscordEmbed

from dotenv import load_dotenv
import os
load_dotenv()

discordUrl = os.getenv("DISCORD-WH")
orbitTechIcon = "https://cdn.discordapp.com/attachments/743206830209237103/1159244539110891550/orbitTech.png?ex=6530519b&is=651ddc9b&hm=248f30f6aa3768d404b3f2d5494de62a93cd328a0303062d920eb1f781e1b282&"

import stripe
# This is your test secret API key.
endpoint_secret = os.getenv("WH")
# stripe.api_key = os.getenv("SK-LIVE")
stripe.api_key = os.getenv("SK-LIVE")
pocketbase_email = os.getenv("PB_EMAIL")
pocketbase_password = os.getenv("PB_PASSWORD")

price_ids = {
    'Classic - Black': os.getenv('PRICE_CLASSIC_BLACK'),
    'Classic - White': os.getenv('PRICE_CLASSIC_WHITE'),
    'Classic - Pink': os.getenv('PRICE_CLASSIC_PINK'),
    'Classic - Blue': os.getenv('PRICE_CLASSIC_BLUE'),

    'Custom - Black': os.getenv('PRICE_CUSTOM_BLACK'),
    'Custom - White': os.getenv('PRICE_CUSTOM_WHITE'),
    'Custom - Pink': os.getenv('PRICE_CUSTOM_PINK'),
    'Custom - Blue': os.getenv('PRICE_CUSTOM_BLUE'),

    'Triangle - Black': os.getenv('PRICE_TRIANGLE_BLACK'),
    'Triangle - White': os.getenv('PRICE_TRIANGLE_WHITE'),
    'Triangle - Pink': os.getenv('PRICE_TRIANGLE_PINK'),
    'Triangle - Blue': os.getenv('PRICE_TRIANGLE_BLUE'),

    'Circle - White': os.getenv('PRICE_CIRCLE_WHITE'),
    'Circle - Black': os.getenv('PRICE_CIRCLE_BLACK'),
    'Circle - Blue': os.getenv('PRICE_CIRCLE_BLUE'),
    'Circle - Pink': os.getenv('PRICE_CIRCLE_PINK')
}

price_ids_lower = {key.lower(): value for key, value in price_ids.items()}

def send_order_to_discord(order_id, name, email, total_amount):
    webhook = DiscordWebhook(url=discordUrl)
    embed = DiscordEmbed(title="New Order Received", color="03b2f8")  # Change color as needed
    embed.set_author(name="OrbitTech", url="https://orbittech.sultanrasul.com", icon_url=orbitTechIcon)
    embed.set_url("https://orbittech.sultanrasul.com")
    embed.add_embed_field(name="Order ID", value=order_id, inline=False)
    embed.add_embed_field(name="Name", value=name, inline=False)
    embed.add_embed_field(name="Email", value=email, inline=False)
    embed.add_embed_field(name="Total Amount", value=f"£{total_amount}", inline=False)
    embed.set_timestamp()

    # Adding the /getorder command information in the footer
    embed.set_footer(text=f"/getorder {order_id} to get more information")

    webhook.add_embed(embed)
    response = webhook.execute()
    return response.status_code

def generate_custom_fields(cart_items):
    custom_fields = []

    for item in cart_items:
        if item["title"].lower().startswith("custom"):
            for index in range(1, int(item["quantity"]) + 1):
                # Generate a key compatible with custom_fields restrictions
                
                key = ''.join(c if c.isalnum() or c in ['-', '_'] else '_' for c in item['title'].lower() if 'custom' in item['title'].lower()) + str(index)
                custom_fields.append({
                    "key": key,
                    "label": {"type": "custom", "custom": f"Personalized engraving {item['title'].lower()}"},
                    "type": "text",
                    'text': {'maximum_length': 4},
                })

    return custom_fields


def getLineItems(cart_items):
    line_items = []

    for item in cart_items:
        title = item["title"].lower()
        if title in price_ids_lower:
            price_id = price_ids_lower[title]
            line_items.append({
                'price': price_id,
                'quantity': item["quantity"],
            })
    return line_items

def find_custom_index(custom_fields, key):
    for i, field in enumerate(custom_fields):
        if field["key"][:-1] == key:
            return i
        elif field["key"] == key:
            return i
    return None

def add_to_database(line_items,contact_details,custom_fields,shipping_details,amount_total,payment_intent):

    client = Client('https://admin.orbittech.sultanrasul.com')
    admin_data = client.admins.auth_with_password(pocketbase_email, pocketbase_password)
    
    amount_total = float("{:.2f}".format(amount_total / 100.0))
    new_order_id = {
        "name": contact_details["name"],
        "email": contact_details["email"],
        "phone_number": str(contact_details["phone"]),
        "total_amount_paid": amount_total,
        "stripe_id": payment_intent,
    }
    order_id = client.collection("order_id").create(new_order_id)

    new_address = {
        "id": order_id.id,
        "shipping_name": shipping_details["name"],
        "city": shipping_details["address"]["city"],
        "country": shipping_details["address"]["country"],
        "Address_line_1": shipping_details["address"]["line1"],
        "Address_line_2": shipping_details["address"]["line2"],
        "postal_code": shipping_details["address"]["postal_code"],
        "state": shipping_details["address"]["state"],
    }
    address = client.collection("address").create(new_address)

    total_quantity = sum(item['quantity'] for item in line_items)  # Calculate total quantity
    new_order_items = {
        "id": order_id.id,
        "quantity": total_quantity,
        "Confirmed": False
    }
    order_items = client.collection("order_items").create(new_order_items)

    custom_text_value = ""
    for i in range(len(line_items)):
        custom_text_value = ""
        product_description = line_items[i].get("description")
        product = product_description.split("-")[0].strip()
        colour = product_description.split("-")[1].strip()

        product_key = ''.join(c if c.isalnum() or c in ['-', '_'] else '_' for c in product_description.lower())
        if product_key.startswith("custom"):
            if line_items[i]["quantity"] > 1:
                for i in range(line_items[i]["quantity"]):
                    custom_index = find_custom_index(custom_fields, f"{product_key}{i+1}")
                    new_order_product = {
                    "order_id": order_id.id,
                    "order_items": order_items.id,
                    "product": product,
                    "colour": colour,
                    "custom_text": custom_fields[custom_index]["text"]["value"],
                    "quantity": 1
                    }
                    order_product = client.collection("order_products").create(new_order_product)


            else:
                custom_index = find_custom_index(custom_fields, product_key)
                if custom_index is not None:
                    custom_text_value = custom_fields[custom_index]["text"]["value"]
                else:
                    custom_text_value = ""

                new_order_product = {
                    "order_id": order_id.id,
                    "order_items": order_items.id,
                    "product": product,
                    "colour": colour,
                    "custom_text": custom_text_value,
                    "quantity": line_items[i]["quantity"]
                }
                order_product = client.collection("order_products").create(new_order_product)
        else:
            new_order_product = {
                    "order_id": order_id.id,
                    "order_items": order_items.id,
                    "product": product,
                    "colour": colour,
                    "custom_text": custom_text_value,
                    "quantity": line_items[i]["quantity"]
                }
            order_product = client.collection("order_products").create(new_order_product)
        

    send_order_to_discord(order_id.id, contact_details["name"], contact_details["email"], amount_total)



app = Flask(__name__)

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

YOUR_DOMAIN = 'https://orbittech.sultanrasul.com'

def getShippingCost(totalQuantity):
    if totalQuantity <= 3:
        return 159
    elif totalQuantity <= 6:
        return 318
    elif totalQuantity <= 15:
        return 449
    else:
        return 599
    
    print(totalQuantity)


@app.route('/backend/create-checkout-session', methods=['POST'])
def create_checkout_session():
    cart_items = request.json.get('cartItems')

    total_quantity = sum(int(item['quantity']) for item in cart_items)

    shippingCost = getShippingCost(total_quantity)

    line_items = getLineItems(cart_items)
    custom_fields = generate_custom_fields(cart_items)
    checkout_session = stripe.checkout.Session.create(
        shipping_address_collection={
          'allowed_countries': ['GB'],
        }, 
        shipping_options=[
            {
            "shipping_rate_data": {
                "type": "fixed_amount",
                "fixed_amount": {"amount": shippingCost, "currency": "GBP"},
                "display_name": "Shipping",
                "delivery_estimate": {
                "minimum": {"unit": "business_day", "value": 3},
                "maximum": {"unit": "business_day", "value": 5},
                },
            },
            },
        ],
        line_items=line_items,
        custom_fields=custom_fields,
        invoice_creation={"enabled": True},
        phone_number_collection={"enabled": True},
        mode='payment',
        success_url="https://orbittech.sultanrasul.com/backend/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=YOUR_DOMAIN,
    )
    return jsonify({'url': checkout_session.url})

@app.route('/backend/success', methods=['GET'])
def order_success():
    session_id = request.args.get('session_id')
    session = stripe.checkout.Session.retrieve(session_id)
    name = session["customer_details"]["name"]
    email = session["customer_details"]["email"]

    redirect_url = f'https://orbittech.sultanrasul.com?name={name}&email={email}'

    return redirect(redirect_url)


@app.route('/backend/webhook', methods=['POST'])
def webhook():
    payload = request.data
    sig_header = request.headers['Stripe-Signature'] 

    event = stripe.Webhook.construct_event(
        payload, sig_header, endpoint_secret
    )

    if event['type'] == 'checkout.session.completed':
        session = stripe.checkout.Session.retrieve(
            event['data']['object']['id']
        )
        
        line_items = stripe.checkout.Session.list_line_items(session,limit=100).data

        contact_details = session.customer_details
        custom_fields = session.custom_fields
        shipping_details = session.shipping_details
        amount_total = session.amount_total
        payment_intent = session.payment_intent

        add_to_database(line_items,contact_details,custom_fields,shipping_details,amount_total,payment_intent)

    else:
        print('Unhandled event type {}'.format(event['type']))

    return jsonify(success=True)

if __name__ == '__main__':
    app.run(port=4050)