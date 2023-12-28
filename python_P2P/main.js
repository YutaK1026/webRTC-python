var ws_url = "ws://127.0.0.1:8080"
var ws = new WebSocket(ws_url);

var pcs = [];
var peer_connections = 0;

var constraints = {audio: true,video: true};

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

var local_username;

$(document).ready(function(){
    local_username = makeid(5);
    ws.onopen = () => ws.send(JSON.stringify({"type":"register","username":local_username}));
})

var signal_in_progress;

ws.onmessage = async function (event) {
    var signal = JSON.parse(event.data);
    console.log(signal)
    // これってws.send()で呼んでるんだ
    if(signal.type=="create_peer"){
        username = signal.username;
        create_peer(username);
    }else if(signal.type=="offer"){
        receive_offer(signal);
    }else if(signal.type=="answer"){
        receive_answer(signal);
    }else if(signal.type=="candidate"){
        receive_candidate(signal);
    }else if(signal.type=="unregister"){
        unregister(signal);
    }
}

async function create_peer(username){
    // ペア作成　usernameはmake usernameで作成済み　乱数
    pc = new RTCPeerConnection();
    var pc_index = peer_connections; //index番号なのかな…？
    pcs[pc_index] = [username,pc];
    
    peer_connections = peer_connections+1; //待機している人の人数を+1へ
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    // ここでメディア(カメラ、マイク)の許可とかを取りに行ってる？？
    pcs[pc_index][1].addStream(stream);
    // ユーザーに対してstream実施(?)
    
    pcs[pc_index][1].onaddstream = function(event) {
        make_audio_element(event.stream,username)
        //画面上にカメラ動画を表示するためのエレメントを作成している気がする
    };
    
    console.log(pc_index);
    pcs[pc_index][1].createOffer(function(offer) {
        // RTCPeerConnectionの機能な気がする
        pcs[pc_index][1].setLocalDescription(offer, function() {
            data = {"type":"offer","from":local_username,"to":username,"offer":offer}
            console.log("Offer to: "+username);
            ws.send(JSON.stringify(data));
            // offerを指定してキーを送った。バックエンドではsend_offerが発火されているはず
        }, fail);
    }, fail);
    
    pcs[pc_index][1].onicecandidate = function(event) {
        if (event.candidate) {
            data = {"type":"candidate","from":local_username,"to":username,"candidate":event.candidate}
            ws.send(JSON.stringify(data));
            // candidateが発火されている。
        }
    };
    
    
}

async function receive_offer(signal){
    // signalってなんだ…？どこが発火しているんだ
    // おそらくこれは片方がcreate_peerを発火した後これを発火するような機能になっているのだろう
    username = signal.username;
    offer = signal.offer;
    
    pc = new RTCPeerConnection();
    pc_index = peer_connections;
    pcs[pc_index] = [username,pc];
    peer_connections = peer_connections+1;
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    pcs[pc_index][1].addStream(stream);
    
    pcs[pc_index][1].onaddstream = function(event) {
        make_audio_element(event.stream,username)
    };
    // ここまではcreate_peerの画面接続と同じ
    // create_peerでは、この後にcreateOfferを作成している

    pcs[pc_index][1].setRemoteDescription(new RTCSessionDescription(offer), function() {
        pcs[pc_index][1].createAnswer(function(answer) {
            pcs[pc_index][1].setLocalDescription(answer, function() {
                data = {"type":"answer","from":local_username,"to":username,"answer":answer}
                ws.send(JSON.stringify(data));
            }, fail);
        }, fail);
    }, fail);
    
    pcs[pc_index][1].onicecandidate = function(event) {
        if (event.candidate) {
            data = {"type":"candidate","from":local_username,"to":username,"candidate":event.candidate}
            ws.send(JSON.stringify(data));
        }
    };
    
    
    
}

async function receive_answer(signal){
    username = signal.username;
    answer = signal.answer;
    for(var i=0;i<peer_connections;i++){
        if(pcs[i][0]==username){
            console.log("Accept answer");
            console.log(username);
            console.log(i)
            pcs[i][1].setRemoteDescription(new RTCSessionDescription(answer));
        }
    }
}

async function receive_candidate(signal){
    username = signal.username;
    candidate = signal.candidate;
    for(var i=0;i<peer_connections;i++){
        if(pcs[i][0]==username){
            pcs[i][1].addIceCandidate(new RTCIceCandidate(candidate));
        }
    }
}

async function unregister(signal){
    username = signal.username;
    index = 0
    for(var i=0;i<peer_connections;i++){
        if(pcs[i][0]==username){
            pcs[i][1].close();
            document.getElementById(username).style.display = "none";
            document.getElementById(username).getElementsByTagName("video")[0].pause();
            index = i;
            break;
        }
    }
    
    pcs.splice(index, 1);
    peer_connections = peer_connections-1;
    
}


function make_audio_element(stream,username){
    var audio_container = document.createElement("div");
    audio_container.id = username;
    audio_container.classList.add("audio");
    
    var audio = document.createElement("audio");
    audio.srcObject = stream;
    audio_container.appendChild(audio);
    var username_element = document.createElement("div");
    username_element.classList.add("username");
    username_element.innerHTML = username;
    audio_container.appendChild(username_element);
    
    document.body.appendChild(audio_container);
    audio.play();
}

function fail(error){
    console.log(error);
}