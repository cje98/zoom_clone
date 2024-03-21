// io : io 함수는 알아서 socket.io를 실행하고 있는 서버와 연결시킴
const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

// room 숨기기
room.hidden = true;

let roomName;

function addMessage(message) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function handleMessageSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value;
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
}

function handleNicknameSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#name input");
    socket.emit("nickname", input.value);
}

function showRoom() {
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    const msgForm = room.querySelector("#msg");
    const nameForm = room.querySelector("#name");
    msgForm.addEventListener("submit", handleMessageSubmit);
    nameForm.addEventListener("submit", handleNicknameSubmit);
}

function handleRoomSubmit(event) {
    event.preventDefault();
    const input = form.querySelector("input");

    // socket.io에서는 보낼 때 emit을 사용함
    // 첫번째 인수 : 이벤트 명을 원하는 값으로 할 수 있음
    // 두번째 인수 : 객체 가능
    // 세번째 인수 : 함수 가능
    // WebSocket은 String만 받을 수 있지만, socket은 객체도 받을 수 있음
    socket.emit("enter_room", input.value, showRoom);
    roomName= input.value;
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

// emit으로 보낸 인자값을 그대로 받아서 사용하면 됨
socket.on("welcome", (user, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${user} arrived!`);
});

socket.on("bye", (left, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${left} left.`);
});

socket.on("new_message", addMessage);

// socket.on("room_change", (msg) => console.log(msg)) 와 같음
socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    if (rooms.length === 0) {
        return;
    }
    rooms.forEach(room => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    })
});

// const messageList = document.querySelector("ul");
// const nicknameForm = document.querySelector("#nickname");
// const messageForm = document.querySelector("#message");
// const socket = new WebSocket(`ws://${window.location.host}`);

// function makeMessage(type, payload) {
//     const msg = { type, payload }
//     반환 값 ex. {"type":"nickname","payload":"test"}
//     return JSON.stringify(msg);
// }

// socket.addEventListener("open", () => {
//     console.log("Connected to Server✔️");
// });

// socket.addEventListener("message", (message) => {
//     console.log("New message: ", message.data);
//     const li = document.createElement("li");
//     li.innerText = message.data;
//     messageList.append(li);
// });

// 서버 종료될 때 실행됨
// socket.addEventListener("close", () => {
//     console.log("Disconnected from Server❌")
// });

// // setTimeout(() => {
// //     socket.send("hello from the browser!");
// // }, 10000);


// function handlerSubmit(event) {
//     event.preventDefault() : event의 기본 동작 취소
//     event.preventDefault();
//     const input = messageForm.querySelector("input");
    
//     json 형태로 보낼 수 있음
//     socket.send(makeMessage("new_message", input.value));
//     const li = document.createElement("li");
//     li.innerText = `You: ${input.value}`;
//     messageList.append(li);
//     input.value = "";
// }

// function handlerNicknameSubmit(event) {
//     event.preventDefault();
//     const input = nicknameForm.querySelector("input");
//     socket.send(makeMessage("nickname", input.value));
//     input.value = "";
// }
// messageForm.addEventListener("submit", handlerSubmit);
// nicknameForm.addEventListener("submit", handlerNicknameSubmit);