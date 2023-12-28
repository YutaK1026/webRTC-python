import asyncio
import websockets
import json
import ssl

peers = ()
    
async def on_open(websocket,path):
    async for message in websocket:
        message = json.loads(message)
        if(message["type"]=="register"):
            await register(websocket,message["username"])
        elif(message["type"]=="offer"):
            await send_offer(websocket,message)
        elif(message["type"]=="answer"):
            await send_answer(websocket,message)
        elif(message["type"]=="candidate"):
            await send_candidate(websocket,message)
    await unregister(websocket)
            
async def register(websocket,username):
    global peers
    print(username+" logged in.")
    peers = peers + ((websocket,username),)
    for peer in peers:
        if peer[0] is not websocket:
            await websocket.send(json.dumps({"type": "create_peer","username":peer[1]}))
            print("ユーザー登録:",json.dumps({"type": "create_peer","username":peer[1]}))

async def send_offer(websocket,message):
    global peers
    offer_creator = message["from"]
    offer_receiver = message["to"]
    offer = message["offer"]
    print(offer_creator+" creates and sends offer to "+offer_receiver)
    for peer in peers:
        if(peer[1]==offer_receiver):
            await peer[0].send(json.dumps({"type": "offer","username":offer_creator,"offer":offer}))
            print("send offer周りの処理:")
            
async def send_answer(websocket,message):
    global peers
    answer_creator = message["from"]
    answer_receiver = message["to"]
    answer = message["answer"]
    print(answer_creator+" creates and sends answer to "+answer_receiver)
    for peer in peers:
        if(peer[1]==answer_receiver):
            await peer[0].send(json.dumps({"type": "answer","username":answer_creator,"answer":answer}))
            print("send answer周りの処理")
            
async def send_candidate(websocket,message):
    global peers
    candidate_creator = message["from"]
    candidate_receiver = message["to"]
    candidate = message["candidate"]
    print(candidate_creator+" send candidate packet to "+candidate_receiver)
    for peer in peers:
        if(peer[1]==candidate_receiver):
            await peer[0].send(json.dumps({"type": "candidate","username":candidate_creator,"candidate":candidate}))
            print("sedn candidate周りの処理")
async def unregister(websocket):
    global peers
    for peer_1 in peers:
        if(peer_1[0]==websocket):
            username = peer_1[1]
            print(username+" logged out.")
            for peer_2 in peers:
                if(peer_2[0] is not websocket):
                    await peer_2[0].send(json.dumps({"type": "unregister","username":username}))
                    print("unregister時点での処理")
                    
    peers_list = list(peers)
    peers_list.remove((websocket,username))
    peers = tuple(peers_list)
        
        
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context = None
start_server = websockets.serve(on_open, "127.0.0.1", 8080)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()