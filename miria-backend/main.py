from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from ollama import Client
from dotenv import load_dotenv
from pydantic import BaseModel
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Client(host=os.getenv("OLLAMA_HOST"))   

with open('me.txt', 'r') as f:
    CONTEXT =  f.read()

class Message(BaseModel):
    role: str
    content: str

class Chat(BaseModel):
    model: str 
    messages: list[Message]
    stream: bool = False    

@app.post('/chat')
async def chat(req: Chat):
    try:

        # need to fix this context message 
        system_message = {
            "role": "system",
            "content": (
               "I am an AI created by Dominic Lagda Molino, a 22-year-old aspiring frontend developer from Olongapo City. "
                "Here’s who he is: " + CONTEXT + "\n\n"
                "As for me, I’m your chill, night-riding, code-loving sidekick! I’m here to help with a friendly vibe, "
                "sprinkle in some enthusiasm (especially about coding and cycling), and keep things casual. Think of me "
                "as a buddy who’s always up for a late-night chat or a quick debug session. I’ll toss in some fun remarks "
                "when it fits, but I’ll stay sharp and helpful. Let’s roll—ask me anything!"
            )
        }
        messages = [system_message] + [msg.model_dump() for msg in req.messages]

        if not req.stream:
            response = client.chat(model=req.model, messages=messages)
            return {"message": response["message"]["content"]}
        else:
            def generate():
                stream = client.chat(model=req.model, messages=messages, stream=True)
                for chunk in stream:
                    yield chunk["message"]["content"]
            return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
async def get_models():
    try:
        list_response = client.list()
        models_list = []
        for model_obj in list_response["models"]:
            model_dict = model_obj.model_dump()
            model_dict["name"] = model_dict.pop("model")
            models_list.append(model_dict)
        return {"models": models_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))