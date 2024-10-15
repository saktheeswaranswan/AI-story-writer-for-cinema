import asyncio
import os

from dotenv import load_dotenv
from flask import Flask, Response, render_template, request
from instructions import INSTRUCTIONS

from openai import OpenAI
from langchain_community.chat_models import ChatOpenAI

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)
TOKEN = os.getenv('TOKEN')
HOST = os.getenv("HOST")
MODEL_NAME  =  os.getenv("MODEL_NAME")

client = OpenAI(
    api_key=TOKEN,
    base_url=f"{HOST}/serving-endpoints"
)

@app.route("/")
def landing_page():
    return render_template("index.html")

@app.route('/writer', methods=['POST'])
def writer():
    data = request.get_json()
    user_input = data.get('user_input')

    messages  = [
        {"role": "system", "content": INSTRUCTIONS},
        {"role": "user", "content": user_input},
    ]
    
    def generate_response():
        chat_completion = client.chat.completions.create(
            messages=messages,
            model=MODEL_NAME,
            stream=True
        )

        for chunk in chat_completion:
            content = chunk.choices[0].delta.content
            if content:
                yield f"data: {content}\n\n"
        
        yield "data: [DONE]\n\n"

    return Response(generate_response(), content_type='text/event-stream')


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)