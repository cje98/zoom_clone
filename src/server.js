import express from 'express';
import http from 'http';
import WebSocket from 'ws';


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
const server = http.createServer(app);
// server가 필수는 아님, http 서버/webSocket 서버 둘 다 돌릴 수 있게 서버 넘김
const wss = new WebSocket.Server({ server });

// 서버와 연결된 소켓 저장할 리스트
const sockets = [];

// connection일 경우 socket 객체가 반환된다.
// 리스너가 없어도 front와 자동으로 연결됨
wss.on("connection", (socket) => {
    sockets.push(socket);
    socket["nickname"] = "Anon";
    console.log("Connected to Browser✔️");

    // 브라우저 닫으면 close 리스너 실행됨
    socket.on("close", () => { console.log("Disconnected from the Browser❌")});
    
    // message 받는 리스너
    socket.on("message", (msg) => {
        const message = JSON.parse(msg.toString('utf8'));
        // 서버에서 message 읽을 때 buffer로 뜨는 경우 message.toString('utf8') 사용하기
        switch(message.type){
            case "new_message":
                sockets.forEach(aSocket => aSocket.send(`${socket.nickname}: ${message.payload}`)); break;
            case "nickname":
                socket["nickname"] = message.payload; break;
        }
    })
});

// ws://와 http:// 둘 다 사용가능
server.listen(3000, handleListen);