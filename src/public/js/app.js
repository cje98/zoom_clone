// io : io 함수는 알아서 socket.io를 실행하고 있는 서버와 연결시킴
const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

const call = document.getElementById("call");




call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;
let nickname;

async function getCameras() {
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            // deviceId를 가져와야 다른 장치로 바꿀 수 있음
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if (currentCamera.label === camera.label){
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        })
    }catch(e){
        console.log(e)
    }
}

// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
// == getUserMedia()
async function getMedia(deviceId) {
    const initialConstraints = {
        audio: true,
        video: {facingMode: "user"},
    };
    const cameraConstraints = {
        audio: true,
        video: { deviceId: { exact: deviceId}},
    }
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId? cameraConstraints : initialConstraints
        );
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getCameras();
        }
    }catch(e) {
        console.log(e);
    }
}

function handleMuteClick() {
    myStream
        .getAudioTracks()
        .forEach((track) => track.enabled = !track.enabled);

    if (!muted){
        muteBtn.innerText = "Unmute";
        muted = true;
    }else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

function handleCameraClick () {
    myStream
        .getVideoTracks()
        .forEach((track) => track.enabled = !track.enabled);
    if (cameraOff){
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    }else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

// camera switch
// Sender : peer로 보내진 media stream track을 컨트롤 하게 해줌
async function handleCameraChange() {
    await getMedia(camerasSelect.value);
    if (myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
                .getSenders()
                .find(sender => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// Welcome Form (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

// startMedia : media 가져가서 연결을 만들어 주는 함수
async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    roomName = input.value;
    
    // change title
    const title = document.getElementById("title");
    title.innerText = `[Room: ${roomName}]`;
    
    await initCall();
    socket.emit("join_room", input.value);
    input.value = "";
}
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code
// Peer A
socket.on("welcome", async (user) => {
    // offer 만드는 곳에서 Data Channel 생성
    myDataChannel = myPeerConnection.createDataChannel("chat");
    // 메세지 이벤트 리스너 생성
    myDataChannel.addEventListener("message", (event) => {
        addMessage(`Anon: ${event.data}`);
    });
    
    console.log("made data channel");
    addMessage(`${user} arrived!`);

    // 다른 브라우저에서 접속할 때 실행됨, 서버 필요함
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
});

// Peer B
// offer 받고 peer description 생성
socket.on("offer", async(offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        // 메세지 이벤트 리스너 생성
        myDataChannel.addEventListener("message", (event) => {
            addMessage(`Anon: ${event.data}`);
        });
    });

    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer");
});

// Peer A
// answer
socket.on("answer", answer => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", ice => {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
});

// RTC Code
function makeConnection() {
    myPeerConnection = new RTCPeerConnection();
    // myStream.getTracks() : 영상과 비디오 데이터 가져오는 메소드
    // 각 브라우저에 따로 구성
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

// iceCandidate : webRTC에 필요한 프로토콜, 멀리 떨어진 장치와 소통할 수 있게 해줌
// 브라우저끼리 주고받음
function handleIce(data) {
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
}

// peer 브라우저에서 비디오, 오디오 데이터를 컨트롤 할 수 있음(remote stream)
function handleAddStream(data) {
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}

// chat
const chatForm = document.getElementById("chatForm");
const chatInput = chatForm.querySelector("input");
chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = chatInput.value;
    addMessage(`You: ${message}`);
    myDataChannel.send(message);
});

// Add Message
function addMessage(message) {
    console.log(message);
    const ul = document.getElementById("chat");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
    chatInput.value = "";
}
