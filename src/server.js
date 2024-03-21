import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import SocketIO from 'socket.io';

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

// script static 해주기
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));

// express는 http를 다룸
// 같은 서버에 ws 설치함
const handleListen = () => console.log(`Listenig on http://localhost:3000`);
// app.listen(3000, handleListen);

// 같은 포트에서 webSocket, http 서버 돌리는 방법
// express.js 사용해서 WebSocket 서버 생성
const httpServer = http.createServer(app);
// server가 필수는 아님, http 서버/webSocket 서버 둘 다 돌릴 수 있게 서버 넘김
// const wss = new WebSocket.Server({ server });
// socket.io로 서버 연결하는 방법
const wsServer = SocketIO(httpServer);

function publicRooms() {
    const { 
        sockets: {
            adapter: {sids, rooms }
        }
    } = wsServer;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined){
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

function countRoom(roomName) {
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", socket => {
    // socket.io의 socket

    socket["nickname"] = "Anon";

    // socket documentaion에서 API 확인
    socket.onAny( (event) => {
        console.log(`Socket Event: ${event}`);
    })

    // 이벤트 명 그대로 받아와야 함
    // msg : 두번째 파라미터
    // done : 세번재 파라미터
    socket.on("enter_room", (roomName, done) => {
        // 채팅 방에 참가하는 방법
        socket.join(roomName);
        done();
        
        // socket.to : 나를 제외한 모든 사람에게 보냄
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
        wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => 
            socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
        );
    });
    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });
    // nickname을 socket에 저장함.
    socket.on("nickname", nickname => socket["nickname"] = nickname);
});

// 서버와 연결된 소켓 저장할 리스트
// const sockets = [];

// connection일 경우 socket 객체가 반환된다.
// 리스너가 없어도 front와 자동으로 연결됨
// wss.on("connection", (socket) => {
//     WebSocket의 socket
//     sockets.push(socket);
//     socket["nickname"] = "Anon";
//     console.log("Connected to Browser✔️");

//     브라우저 닫으면 close 리스너 실행됨
//     socket.on("close", () => { console.log("Disconnected from the Browser❌")});
    
//     message 받는 리스너
//     socket.on("message", (msg) => {
//         const message = JSON.parse(msg.toString('utf8'));
//         서버에서 message 읽을 때 buffer로 뜨는 경우 message.toString('utf8') 사용하기
//         switch(message.type){
//             case "new_message":
//                 sockets.forEach(aSocket => aSocket.send(`${socket.nickname}: ${message.payload}`)); break;
//             case "nickname":
//                 socket["nickname"] = message.payload; break;
//         }
//     })
// });

// ws://와 http:// 둘 다 사용가능
httpServer.listen(3000, handleListen);