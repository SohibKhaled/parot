const path = require('path');
const express = require('express')
const http = require('http')
const moment = require('moment');
const socketio = require('socket.io');
const qr = require("qrcode");
const ip = require('ip');
require("dotenv").config();
const ExcelJS = require('exceljs');
const fs = require('fs');
const { google } =  require("googleapis");

// Google drive test 
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// check if creds are present in json file
// load them otherwise do nothing

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
app.set('view engine', 'ejs');

try{
    const creds = fs.readFileSync("creds.json");
    oauth2Client.setCredentials(JSON.parse(creds));

}catch (err) {
    console.log(`Error reading credentials: err`);
}

app.get("/auth/google" , (req , res) => {
    const url =  oauth2Client.generateAuthUrl({ 
        access_type: "offline", 
        scope : ["https://www.googleapis.com/auth/userinfo.profile" ,
         "https://www.googleapis.com/auth/drive",
        ],  
     });
       res.redirect(url);

});

app.get('/google/redirect' , async (req ,res) => {
    // get the code from google and exchange it for tokens
    
        const { code } = req.query;
        const {tokens} = await oauth2Client.getToken(code);
        oauth2Client.setCredentials({
            access_token: tokens,
        });
        fs.writeFileSync("creds.json" , JSON.stringify(tokens)) ;
        res.send("success");
   
})


app.get('/savetextdrive/:textt',async(req,res) => {
    const drive =  google.drive({version:'v3' , auth :oauth2Client});
    const sometxt = req.params.textt;
   await drive.files.create({
        requestBody:{
            name :"mytextfile.txt" ,
            mimeType:"text/plain"
        },
         media : {
            mimeType  : 'text/plain' ,
            body : sometxt
         }

    })
    return "done";
})
// Create a new workbook






const { GoogleGenerativeAI } = require("@google/generative-ai");
// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function AIscaduale() {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});

  

  const prompt = " (make a spreedsheet to a School takes a list of teachers names and thier subjects and thier classes as input . then make a spreedsheets for scaduale for Classes in each class spreedsheet{teachers names , thier subjects , teaching time}) INPUT({name:ahmed subject:math class:C1},{name:mohamed subject:physics class:C2},{name:Sohib subject:Chimstry class:C1},{name:Mohab subject:math class:C4}) (donot print any thing else output) OUTPUT as json file have(techername , class , subject , time)";

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();



  console.log(text);
}





app.get('/runai', (req, res) => {
    // Execute the function
    AIscaduale()
;
    res.send('Function executed successfully');
  });
//if (process.env.NODE_ENV === 'development') {
    console.log('***** IP:', ip.address());
//}

const io = socketio(server);
let data =  "http://"+ip.address()+":3000/profile.html";

let stJson = JSON.stringify(data);
qr.toString(stJson,{type:"terminal"},function(err,code)
{
    if(err) return console.log("error");
    console.log(code);
})
qr.toFile("qr_test.png",stJson,function(err)
{
    if(err) return console.log("error");
})








// Define a route to render the EJS file
app.get('/', (req, res) => {
    res.render('index', ); // Pass data to the EJS file
});









app.use(express.static(path.join(__dirname, '.')));

let rooms = {};
let socketroom = {};
let socketname = {};
let micSocket = {};
let videoSocket = {};
let roomBoard = {};


io.on('connect', socket => {

    socket.on("join room", (roomid, username) => {

        socket.join(roomid);
        socketroom[socket.id] = roomid;
        socketname[socket.id] = username;
        micSocket[socket.id] = 'on';
        videoSocket[socket.id] = 'on';

        if (rooms[roomid] && rooms[roomid].length > 0) {
            rooms[roomid].push(socket.id);
            socket.to(roomid).emit('message', `${username} joined the room.`, 'Bot', moment().format(
                "h:mm a"
            ));
            io.to(socket.id).emit('join room', rooms[roomid].filter(pid => pid != socket.id), socketname, micSocket, videoSocket);
        }
        else {
            rooms[roomid] = [socket.id];
            io.to(socket.id).emit('join room', null, null, null, null);
        }

        io.to(roomid).emit('user count', rooms[roomid].length);

    });

    socket.on('action', msg => {
        if (msg == 'mute')
            micSocket[socket.id] = 'off';
        else if (msg == 'unmute')
            micSocket[socket.id] = 'on';
        else if (msg == 'videoon')
            videoSocket[socket.id] = 'on';
        else if (msg == 'videooff')
            videoSocket[socket.id] = 'off';

        socket.to(socketroom[socket.id]).emit('action', msg, socket.id);
    })

    socket.on('video-offer', (offer, sid) => {
        socket.to(sid).emit('video-offer', offer, socket.id, socketname[socket.id], micSocket[socket.id], videoSocket[socket.id]);
    })

    socket.on('video-answer', (answer, sid) => {
        socket.to(sid).emit('video-answer', answer, socket.id);
    })

    socket.on('new icecandidate', (candidate, sid) => {
        socket.to(sid).emit('new icecandidate', candidate, socket.id);
    })

    socket.on('message', (msg, username, roomid) => {
        io.to(roomid).emit('message', msg, username, moment().format(
            "h:mm a"
        ));
    })

    socket.on('getCanvas', () => {
        if (roomBoard[socketroom[socket.id]])
            socket.emit('getCanvas', roomBoard[socketroom[socket.id]]);
    });

    socket.on('draw', (newx, newy, prevx, prevy, color, size) => {
        socket.to(socketroom[socket.id]).emit('draw', newx, newy, prevx, prevy, color, size);
    })

    socket.on('clearBoard', () => {
        socket.to(socketroom[socket.id]).emit('clearBoard');
    });

    socket.on('store canvas', url => {
        roomBoard[socketroom[socket.id]] = url;
    })

    socket.on('disconnect', () => {
        if (!socketroom[socket.id]) return;
        socket.to(socketroom[socket.id]).emit('message', `${socketname[socket.id]} left the chat.`, `Bot`, moment().format(
            "h:mm a"
        ));
        socket.to(socketroom[socket.id]).emit('remove peer', socket.id);
        var index = rooms[socketroom[socket.id]].indexOf(socket.id);
        rooms[socketroom[socket.id]].splice(index, 1);
        io.to(socketroom[socket.id]).emit('user count', rooms[socketroom[socket.id]].length);
        delete socketroom[socket.id];
        console.log('--------------------');
        console.log(rooms[socketroom[socket.id]]);

        //toDo: push socket.id out of rooms
    });
})


server.listen(PORT, () => console.log(`Server is up and running on port ${PORT}`));