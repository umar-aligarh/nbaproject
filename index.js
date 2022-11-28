var express = require("express")
var bodyParser = require("body-parser")
var mongoose = require("mongoose")
const port  = process.env.PORT || 3000;

const app = express()

app.use(bodyParser.json())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({
    extended:true
}))
// mongodb://0.0.0.0:27017/nba

mongoose.connect('mongodb+srv://umar:umar123@nba.uiwzmyr.mongodb.net/?retryWrites=true&w=majority',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

var db = mongoose.connection;

db.on('error',()=>console.log("Error in Connecting to Database"));
db.once('open',()=>console.log("Connected to Database"))

let enrglb;
let examglb;
let courseglb;

app.post("/create",(req,res)=>{
    let name = req.body.name;
    let enr = req.body.enr;
    let course = req.body.course;

    let data = {
        "_id" : enr,
        "name": name,
        "midsem":{

        },
        "endsem":{

        }
    }

    db.collection(course).insertOne(data,(err,collection)=>{
        if(err){
            throw err;
        }
        console.log("Record Inserted Successfully");
    });

    return res.redirect('/');

})
app.post("/select",(req,res)=>{
    enrglb = req.body.enr;
    courseglb = req.body.course;
    examglb = req.body.exam;
    return res.redirect('/insert.html')

})

app.post("/insert",async(req,res)=>{
    let co = req.body.co;
    let qid = req.body.qid;
    let marksOb = req.body.marksOb;
    let marksTotal = req.body.marksTotal;
    console.log(courseglb);
    const filter = {_id:enrglb};
    const options = { upsert: true };
    const course = db.collection(courseglb.toString());
    const marksO = `${examglb}.${co}.${qid}.marksObtained`;
    const marksT = `${examglb}.${co}.${qid}.totalMarks`;
    const updateDoc={
        $set: {
            [marksO]:marksOb,
            [marksT]:marksTotal
        }
    }
    const result = await course.updateOne(filter, updateDoc,options);
    
    return res.redirect('insert.html')

})

app.get("/",(req,res)=>{
    res.set({
        "Allow-access-Allow-Origin": '*'
    })
    return res.redirect('index.html');
}).listen(port);


console.log(`Listening on PORT ${port}`);