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
const session = require('express-session');
const app = express();


//////////////////////////

const mongoose = require('mongoose')
const Student = require('./DB/student')
const Table = require('./DB/table')
const Subject = require('./DB/subject')

app.use(express.json());

mongoose.connect(process.env.DB_KEY)
.then(() => {
  console.log('')
  console.log('You are connected to the database!')
  console.log('To stop the connection press "ctrl + C"')
}).catch((error) => {
  console.log(error)
})



/////////student /////////

app.post('/students', async(req, res) => {
   
    const newUser = new Student({
        email: "Ahmed@parot.com",
        name: "Ahmed Hassan",
        id: "201900043",
      });
      console.log(req.body.email)
      newUser.save()
})

app.get('/students', async(req, res) => {
  try {
    const students = await Student.find({});
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({message: error.message})
  }
})

app.get('/students/:_id', async(req, res) => {
  try {
    const {id} = req.params;
    const student = await Student.findById(id);
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({message: error.message})
  }
})


////////table//////////

app.get('/table', async(req, res) => {
    try {
      const table = await Table.find({});
      res.status(200).json(table);
    } catch (error) {
      res.status(500).json({message: error.message})
    }
  })

///////////subject/////////


app.get('/subject', async(req, res) => {
    try {
      const subject = await Subject.find({});
      res.status(200).json(subject);
    } catch (error) {
      res.status(500).json({message: error.message})
    }
  })



//////////////////






app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
})); // Configure session settings

app.get('/some-route', (req, res) => {
    // Get the 'id' value from the session
    const id = req.session.id;

    // Set the 'id' value in the session
    req.session.id = 'new-id';

    console.log('ID from session:', id);
    res.send('Session variable accessed and set');
});


// Google drive test 
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// check if creds are present in json file
// load them otherwise do nothing

const PORT = process.env.PORT || 3000;

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

async function AIschedule() {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});

  

  const prompt = " (make a spreadsheet to a School takes a list of teachers names and thier subjects and thier classes as input . then make a spreedsheets for scaduale for Classes in each class spreedsheet{teachers names , thier subjects , teaching time}) INPUT({name:ahmed subject:math class:C1},{name:mohamed subject:physics class:C2},{name:Sohib subject:Chimstry class:C1},{name:Mohab subject:math class:C4}) (donot print any thing else output) OUTPUT as json file have(techername , class , subject , time)";

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();



  console.log(text);
}



async function Bot(m) {
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});
  
    const prompt = " i am a educational system named 'PAROT' the role of sening message is a student or teacher , don't give him any information about any thing other than this information 'to make a session you will go to create session page and click on create session then give your sisson code to your partner' this is a student message => "+ m ;
    const result = await model.generateContent(prompt);
    const response =  result.response;
    const text =  response.text();
    return text;
  }

  module.exports = Bot;



app.get('/runai', (req, res) => {
    // Execute the function
    AIschedule()
;
    res.send('Function executed successfully');
  });
//if (process.env.NODE_ENV === 'development') {
  /*  console.log('***** IP:', ip.address()); */
//}

 app.get('/Bot1/:message',async (req, res) => {
    me = req.params.message;
    // Execute the function
   resp1 = await Bot(me);
res.send(resp1);

});

const io = socketio(server);









// Define a route to render the EJS file
app.get('/dashboard', (req, res) => {
    const user = {
        firstName: 'Tim',
        lastName: 'Cook',
    }
    res.render('index',{
        user: user
    } ); // Pass data to the EJS file
});


// Pages routes

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,  'landing.html'));
});

app.get('/quiz', (req, res) => {
    res.sendFile(path.join(__dirname,  'quiz.html'));
});
app.get('/session', (req, res) => {
    res.sendFile(path.join(__dirname,  'session.html'));
});
app.get('/schoolpay', (req, res) => {
    res.sendFile(path.join(__dirname,  'schoolpay.html'));
});
app.get('/universitypay', (req, res) => {
    res.sendFile(path.join(__dirname,  'universitypay.html'));
});
app.get('/educationalorgpay', (req, res) => {
    res.sendFile(path.join(__dirname,  'educationalorgpay.html'));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname,  'login.html'));
});
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname,  'register.html'));
});
app.get('/forgot', (req, res) => {
    res.sendFile(path.join(__dirname,  'forgot.html'));
});
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname,  'profile.html'));
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

let data =  "https://parotedu.me/profile";

let stJson = JSON.stringify(data);
qr.toString(stJson,{type:"terminal"},function(err,code)
{
    if(err) return console.log("error");
    /*console.log(code);*/
})
qr.toFile("qr_test.png",stJson,function(err)
{
    if(err) return console.log("error");
})

server.listen(PORT, () => console.log(`Server is up and running on port ${PORT}`));
