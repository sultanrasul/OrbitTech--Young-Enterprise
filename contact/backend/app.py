from flask import Flask, request, jsonify , redirect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import datetime
import json
import urllib.parse
# from discord_webhook import DiscordWebhook
from time import sleep
from dotenv import load_dotenv
import os
from discord_webhook import DiscordWebhook, DiscordEmbed


load_dotenv()

from google_auth_oauthlib.flow import Flow

app = Flask(__name__)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["5 per 6 minutes"],
    strategy="fixed-window", # or "moving-window"
)
discordUrl = os.getenv("DISCORD-URL")

orbitTechIcon = "https://cdn.discordapp.com/attachments/743206830209237103/1159244539110891550/orbitTech.png?ex=6530519b&is=651ddc9b&hm=248f30f6aa3768d404b3f2d5494de62a93cd328a0303062d920eb1f781e1b282&"

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response


@app.route('/message', methods=['POST'])
@limiter.limit("5 per 6 minutes")
def receive_data():
    data = request.get_json()
    name = data['name']
    contact = data['contact']
    message = data['message']
    client_ip = request.headers.get('X-Real-IP') or request.headers.get('X-Forwarded-For') or request.remote_addr
    print(f"Name: {name} - Contact: {contact} - Message: {message} - IP: {client_ip}")
    logs(name, contact, message, client_ip)
    URL = "https://www.funkypanda.me"
    statusCode = sendMessage(name, contact, message)
    response = {'status': statusCode}
    return jsonify(response)



def sendMessage(name, contact, message):
    webhook = DiscordWebhook(url=discordUrl)
    embed = DiscordEmbed(title="Website Messages", color="03b2f8")
    embed.set_author(name="OrbitTech", url="https://orbittech.store", icon_url=orbitTechIcon)
    embed.set_url("https://orbittech.store")
    embed.add_embed_field(name="Name: ", value=name,inline=False)
    embed.add_embed_field(name="Contact Details: ", value=contact,inline=False)
    embed.add_embed_field(name="Message: ", value=message,inline=False)
    embed.set_timestamp()

    webhook.add_embed(embed)
    response = webhook.execute()
    return response.status_code

def logs(name, contact, message, client_ip):
    with open("messages.csv", "a") as file:
        file.write(f"Name: {name} - Contact: {contact} - Message: {message} - IP: {str(client_ip)}\n")

if __name__ == '__main__':
    app.run(port=8358)