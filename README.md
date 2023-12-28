# webRTC-python
webRTCのIPアドレスなどの情報をpythonで取り扱えるかテストするためのリポジトリ

## 使い方
1. python signaling.py
2. python -m http.server 8001
3. http://localhost:8001/main.htmlにアクセス

## pythonを用いたP2P通話機能の使い方
1. cd python_P2P
2. python -m http.server 8000
3. python websocket_python.py
4. http://localhost:8000/index.htmlへアクセス。この時マイクを許可してください