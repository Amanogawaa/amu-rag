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
        if not req.stream:
            response = client.chat(model=req.model, messages=[msg.model_dump() for msg in req.messages])
            return {"message": response["message"]["content"]}
        else:
            def generate():
                stream = client.chat(model=req.model, messages=[msg.model_dump() for msg in req.messages], stream=True)
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