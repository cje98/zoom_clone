const messageList = document.querySelector("ul");
const nicknameForm = document.querySelector("#nickname");
const messageForm = document.querySelector("#message");
const socket = new WebSocket(`ws://${window.location.host}`);

function makeMessage(type, payload) {
    const msg = { type, payload }
    // 반환 값 ex. {"type":"nickname","payload":"test"}
    return JSON.stringify(msg);
}

socket.addEventListener("open", () => {
    console.log("Connected to Server✔️");
});

socket.addEventListener("message", (message) => {
    console.log("New message: ", message.data);
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
});

// 서버 종료될 때 실행됨
socket.addEventListener("close", () => {
    console.log("Disconnected from Server❌")
});

// setTimeout(() => {
//     socket.send("hello from the browser!");
// }, 10000);


function handlerSubmit(event) {
    // event.preventDefault() : event의 기본 동작 취소
    event.preventDefault();
    const input = messageForm.querySelector("input");
    
    // json 형태로 보낼 수 있음
    socket.send(makeMessage("new_message", input.value));
    // const li = document.createElement("li");
    // li.innerText = `You: ${input.value}`;
    // messageList.append(li);
    input.value = "";
}

function handlerNicknameSubmit(event) {
    event.preventDefault();
    const input = nicknameForm.querySelector("input");
    socket.send(makeMessage("nickname", input.value));
    input.value = "";
}
messageForm.addEventListener("submit", handlerSubmit);
nicknameForm.addEventListener("submit", handlerNicknameSubmit);