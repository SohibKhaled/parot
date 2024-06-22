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
const fse = require('fs-extra')
const { google } =  require("googleapis");
const session = require('express-session');
const app = express();
const say = require ('say');
const cookieParser = require("cookie-parser");
const passport = require("passport");
const requestIp = require('request-ip')
var multer  = require('multer');
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const bodyParser = require('body-parser');
const process = require('process');
const { CohereClient } = require("cohere-ai");
const mongoose = require('mongoose')
const Student = require('./DB/student')
const Table = require('./DB/table')
const Subject = require('./DB/subject')
const cohere = new CohereClient({
  token:  process.env.AI_TOKEN, // This is your trial API key
});
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("express-session")({
    secret: "Rusty is a dog",
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());

app.use(express.json());
mongoose.connect(process.env.DB_KEY)
.then(() => {
  console.log('')
  console.log('You are connected to the database!')
  console.log('To stop the connection press "ctrl + C"')
}).catch((error) => {
  console.log(error)
})
app.get('/students', async(req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
    studentNames = [];
    students.forEach(student => studentNames.push(student.name , student.teacherName));
    console.log(studentNames)
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
      console.log(table)
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
  app.use(cookieParser());
//////////////////
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: true,
    saveUninitialized: true
}));
// Configure session settings
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
for (i=1 ; i < 5 ; i++){
  newtime = Math.floor(Math.random() * (15 - 8)) + 8;
  console.log(newtime)

  const timeintable = await Table.findOne({index : i});
  timeintable.Time = newtime;
  await timeintable.save();
}
  //const model = genAI.getGenerativeModel({ model: "gemini-pro"});
  //const prompt = "Generate a JSON schedule for a school using the provided list of teachers, their subjects, and their classes. For each class, create a schedule that includes the teacher's name, their subject, and the teaching time. Use the following input format:INPUT:{name: ahmed, subject: math, class: C1},{name: mohamed, subject physics, class: C2}, {name: Sohib, subject: chemistry, class: C1}, {name: Mohab, subject: math, class: C4} Generate the output in JSON format with the following structure for each class schedule: OUTPUT:{teacherName: ahmed, class: C1, subject: math, time: time_slot_here}, {teacherName: mohamed, class: C2, subject: physics, time: time_slot_here}, {teacherName: Sohib, class: C1, subject: chemistry, time: time_slot_here},  {teacherName: Mohab, class: C4, subject: math, time: time_slot_here} Ensure that the JSON output only includes the fields: teacherName, class, subject, and time. Do not print any other text.";
  //const result = await model.generateContent(prompt);
  //const response = await result.response;
  //const text = response.text();
  //console.log(text);
}

app.post('/qrcode', (req, res) => {
  const qrCode = req.body.qrCode;

  if (qrCode) {
      console.log(`Received QR code: ${qrCode}`);
      res.status(200).send({ message: 'QR code received successfully' });
  } else {
      res.status(400).send({ message: 'QR code is missing' });
  }
});

async function Bot(m) {
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro"}); 
    const prompt = " i am a educational system named 'PAROT' the role of sening message is a student or teacher , don't give him any information about any thing other than this information 'to make a session you will go to create session page and click on create session then give your session code to your partner','to go to the Quizes you need to go to the Quiz tap on the left side of your screen', 'to go to the Assignments you need to go to the Assignments tap on the left side of your screen' and if he greets you, you can greet them back,  this is a student message => "+ m ;
    const result = await model.generateContent(prompt);
    const response =  result.response;
    const text =  response.text();
    return text;
  }
  async function ASKAI(m) {
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro"}); 
    const prompt =  m ;
    const result = await model.generateContent(prompt);
    const response =  result.response;
    const text =  response.text();
    return text;
  }
  module.exports = Bot;
app.get('/runai', (req, res) => {
    // Execute the function
    AIschedule();
    res.send('Function executed successfully');
  });
 app.get('/Bot1/:message',async (req, res) => {
    me = req.params.message;
    // Execute the function
   resp1 = await Bot(me);
res.send(resp1);
});
app.get('/Bot2/:message',async (req, res) => {
  me = req.params.message;
  // Execute the function
 resp1 = await ASKAI(me);
res.send(resp1);
});
const io = socketio(server);
// Define a route to render the EJS file

passport.use(new LocalStrategy(Student.authenticate()));
passport.serializeUser(Student.serializeUser());
passport.deserializeUser(Student.deserializeUser());

app.get('/dashboard',isLoggedIn,async function  (req, res)  {
    const table = await Table.find();
    //const user = await Student.find();
     res.render ('index',{
        table: table,
        user: req.session.user
    } ); // Pass data to the EJS file
});

app.get('/room',isLoggedIn,async function  (req, res)  {

  res.render ('room',{
    user: req.session.user
} );

})
// Pages routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,  'landing.html'));
});
app.get('/ParotAI', (req, res) => {
  res.sendFile(path.join(__dirname,  'AskAI.html'));
});
app.get('/quiz',isLoggedIn, function (req, res) {
    res.sendFile(path.join(__dirname,  'quiz.html'));
});
app.get('/session',isLoggedIn, function (req, res) {
  res.render ('session',{
    user: req.session.user
} );});
app.get('/Payment', (req, res) => {
    res.sendFile(path.join(__dirname,  'Payment.html'));
});
app.get('/forgot', (req, res) => {
    res.sendFile(path.join(__dirname,  'forgot.html'));
});
app.get('/profile', (req, res) => {
  var clientIp = requestIp.getClientIp(req)
  console.log(clientIp)
  res.sendFile(path.join(__dirname,  'profile.html'));
});
app.get('/Pomodoro', (req, res) => {
  res.sendFile(path.join(__dirname,  'Pomodoro.html'));
});
app.get('/Assignment', (req, res) => {
  res.render ('Assignment' , {
    user: req.session.user
})
});
app.get('/Announcement', (req, res) => {
  res.sendFile(path.join(__dirname,  'Announcement.html'));
});
app.get('/Report', (req, res) => {
  res.sendFile(path.join(__dirname,  'Report.html'));
});
app.get('/grades', (req, res) => {
  res.render ('grades',{
    user: req.session.user
} );});
app.get('/withfriends', (req, res) => {
  res.render ('session',{
    user: req.session.user
} )});
app.get('/lec' ,(req, res) => {
  res.render ('lec',{
    user: req.session.user
} );});
app.get('/Study' ,(req, res) => {
  res.render ('study',{
    user: req.session.user
} );});
app.get('/Office' ,(req, res) => {
  res.sendFile(path.join(__dirname,  'office.html'));
});
app.get('/login', (req, res) => {
  res.render("login");
});
app.get('/sub', (req, res) => {
  res.render("subject");
});
app.get('/register',isLoggedIn, function (req, res) {
 if (req.session.user == 'admin'){
  res.render("register");}
  else{
    res.redirect("/dashboard")
  }
});
app.get('/404', (req, res) => {
  res.sendFile(path.join(__dirname,  '404.html'));
});

var storage = multer.diskStorage({
  destination: function (req, file, callback) {
      var dir = './files';
      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir);
      }
      callback(null, dir);
  },
  filename: function (req, file, callback) {
      callback(null, file.originalname);
  }
});
var upload = multer({storage: storage}).array('files', 12);

app.post('/upload', function (req, res, next) {
  upload(req, res, function (err) {
      if (err) {
        console.log(err)
          return res.end("Something went wrong:(");

      }
      res.end("Upload completed.");
  });
})






















const uploadDir = path.join(__dirname, 'files');
app.post('/savefile',(req , res)=>{
filesave = req.body.myFile;
fse.move(filesave, "files/c.png", (err) => { 
  if (err) return console.log(err); 
  console.log(`File successfully moved!!`); 
}); 
})

auth = false;
idnum = 2000
app.post("/register", async (req, res) => {
  idnum = idnum+1 
  idstr = idnum.toString()
  const user = await Student.create({
    
    email: req.body.email,
    password: req.body.password,
    id: idstr
  });
 
  res.redirect("/login")
});
app.post("/dashboard", async function(req, res){
  try {
      // check if the user exists
      const user = await Student.findOne({ email: req.body.email });
      if (user) {
        //check if password matches
        const result = req.body.password === user.password;
        if (result) {
          req.session.user = user;
          req.session.isLoggedIn = true;
          req.session.save();
           res.redirect("/dashboard")
             } else {
          res.status(400).json({ error: "Password doesn't match" });
        }
      } else {
        res.status(400).json({ error: "Email doesn't exist" });
      }
    } catch (error) {
      res.redirect("/404")
    }
});
app.get("/logout", function (req, res) {
  req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/login');
    });
});
function isLoggedIn(req, res, next) {
  if (req.session.isLoggedIn) return next();
  res.redirect("/login");
}
app.use(express.static(path.join(__dirname, '.')));
let rooms = {};
let socketroom = {};
let socketname = {};
let micSocket = {};
let videoSocket = {};
let roomBoard = {};
io.on('connect', socket  => {
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