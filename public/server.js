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
const say = require ('say');
const bodyParser = require('body-parser');
const { createOrder } = require('./binancePay');
const { CohereClient } = require("cohere-ai");

const cohere = new CohereClient({
  token: "Bf8TUvRK2qCn5PodOnu2TtUmQPlJbqfasfOLwKNr", // This is your trial API key
});
var stream
var x
(async  () => {
   stream = await cohere.chatStream({
    model: "command-r-plus",
    message: " (make a spreadsheet to a School takes a list of teachers names and thier subjects and thier classes as input . then make a spreedsheets for scaduale for Classes in each class spreedsheet{teachers names , thier subjects , teaching time}) INPUT({name:ahmed subject:math class:C1},{name:mohamed subject:physics class:C2},{name:Sohib subject:Chimstry class:C1},{name:Mohab subject:math class:C4}) (donot print any thing else output) OUTPUT as a json code only have(techername , class , subject , time)",
    temperature: 0.3,
    chatHistory: [],
    promptTruncation: "AUTO",
    connectors: [{"id":"web-search"}]
  });

  for await (const chat of stream) {
      if (chat.eventType === "text-generation") {
         x = process.stdout.write(chat.text);
      }
  }
})();


app.use(bodyParser.json());

app.post('/create-order', async (req, res) => {
  const { totalFee, currency, productDetail, productName } = req.body;

  const orderParams = {
    merchantTradeNo: `tradeNo-${Date.now()}`, // Ensure the trade number is unique
    totalFee,
    currency ,
    productDetail,
    productName,
  };

  try {
    const result = await createOrder(orderParams);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.post('/webhook', (req, res) => {
  const payload = req.body;
  // Validate and process the payload here

  res.status(200).send('OK');
});















say.export('You moved to Dashboard page', '', 0.75, 'dashboard.wav', (err) => {
  if (err) {
    return console.error(err)
  }
 
  console.log('Text has been saved to dashboard.wav.')
})



const { equal } = require('looks-same'); // Or require('pixelmatch')

function comparePhotos(path1, path2, callback) {
  // Read image files asynchronously
  fs.readFile(path1, (err1, data1) => {
    if (err1) {
      return callback(err1);
    }

    fs.readFile(path2, (err2, data2) => {
      if (err2) {
        return callback(err2);
      }


//this code will be a code soluation



      // Use chosen library for comparison
     // equal(data1, data2, (error, result) => {
      //  if (error) {
      //    return callback(error);
      //  }

     //   callback(null, result); // true if same, false otherwise
    //  });
///////////////////////////////////////////////////////////////////////




      // OR with pixelmatch (adjust threshold as needed)
      // pixelmatch(data1, data2, null, width, height, { threshold: 0.1 }, (err, numChangedPixels) => {
      //   if (err) {
      //     return callback(err);
      //   }

      //   const samePerson = numChangedPixels <= threshold; // Adjust threshold for allowed variations
      //   callback(null, samePerson);
      // });
    });
  });
}

// Example usage
const photo1Path = '1.jpeg';
const photo2Path = '1.jpeg';

comparePhotos(photo1Path, photo2Path, (err, isSamePerson) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Photos are of the same person:', isSamePerson);
  }
});




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
      table.forEach(table => Sname1.push(table.Sname , table.Day));
      console.log(Sname1)
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
  
    const prompt = " i am a educational system named 'PAROT' the role of sening message is a student or teacher , don't give him any information about any thing other than this information 'to make a session you will go to create session page and click on create session then give your session code to your partner','to go to the Quizes you need to go to the Quiz tap on the left side of your screen', 'to go to the Assignments you need to go to the Assignments tap on the left side of your screen' and if he greets you, you can greet them back,  this is a student message => "+ m ;
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
app.get('/dashboard', async (req, res) => {
    const table = await Table.find();

    
    const user = {
        firstName: 'Tim',
        lastName: 'Cook',
    }
     res.render ('index',{
        table: table,
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
app.get('/Payment', (req, res) => {
    res.sendFile(path.join(__dirname,  'Payment.html'));
});
app.get('/forgot', (req, res) => {
    res.sendFile(path.join(__dirname,  'forgot.html'));
});
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname,  'profile.html'));
});

app.get('/lec' ,(req, res) => {
    res.sendFile(path.join(__dirname,  'lec.html'));
});
app.get('/login', (req, res) => {
  res.render("login");
});
app.get('/register', (req, res) => {
  res.render("register");
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