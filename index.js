let express = require("express")
let bodyParser = require("body-parser")
let mongoose = require("mongoose")
let { Parser } = require('json2csv')
let csv2json = require('csv2json')
let fs = require('fs')
const { parse } = require("path")
const multer = require('multer');
const uploadedData = require('./mydata');

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

let enrglobal;
let examglobal;
let courseglobal;

app.post("/createstudent",(req,res)=>{  //add new student
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

    db.collection(course).save(data,(err,collection)=>{
        if(err){
            throw err;
        }
        console.log(`${enr} inserted successfully in ${course}`);
    });

    return res.redirect('/addstudent.html');

})
app.post("/updatestudent",(req,res)=>{  //update student
    enrglobal = req.body.enr;
    courseglobal = req.body.course;
    examglobal = req.body.exam;
    return res.redirect('/updatestudent.html')

})

app.post("/addquestion",async(req,res)=>{
    let co = req.body.co;
    let qid = req.body.qid;
    let marksOb = req.body.marksOb;
    let marksTotal = req.body.marksTotal;
    console.log(courseglobal);
    const filter = {_id:enrglobal};
    const options = { upsert: true };
    const course = db.collection(courseglobal.toString());
    const marksO = `${examglobal}.${co}.${qid}.marksObtained`;
    const marksT = `${examglobal}.${co}.${qid}.totalMarks`;
    const updateDoc={
        $set: {
            [marksO]:marksOb,
            [marksT]:marksTotal
        }
    }
    const result = await course.updateOne(filter, updateDoc,options);
    
    return res.redirect('updatestudent.html')

})


app.post("/createcsv",async(req,res)=>{
    courseglobal = req.body.course;
    examglobal = req.body.exam;
    const filter = {_id:`${examglobal}schema`};
    const options = { upsert: true };
    const course = db.collection(courseglobal.toString());
    const updateDoc={
        $set: {
            _id:`${examglobal}schema`,
            "name": "name"
        }
    }
    const result = await course.updateOne(filter, updateDoc,options);
    return res.redirect('/updatecsv.html');
})

app.post("/updatecsv",async(req,res)=>{
    let co = req.body.co;
    let qid = req.body.qid;
    const filter = {_id:`${examglobal}schema`};
    const options = { upsert: true };
    const course = db.collection(courseglobal.toString());
    const marksObkey = `${qid}Ob`;
    const marksTkey = `${qid}T`;
    const marksObvalue = `${examglobal}.co${co}.${qid}.marksObtained`;
    const marksTvalue = `${examglobal}.co${co}.${qid}.totalMarks`;
    const updateDoc={
        $set: {
            [marksObkey]:marksObvalue,
            [marksTkey]:marksTvalue
        }
    }
    const result = await course.updateOne(filter, updateDoc,options);
    
    return res.redirect('updatecsv.html')

})


app.get('/exportcsv',async(req,res)=>{
    let parserObj = new Parser();
    const doc = await db.collection(courseglobal.toString()).findOne(
    {
        _id:`${examglobal}schema`
    },
    (err,result)=>{
        if(err) throw err;
        console.log(result);
        let csv = parserObj.parse(result);
        console.log(csv);
        fs.writeFile('./data.csv',csv,callback);
        function callback()
        {
            return res.redirect('/csvdownload');
        }
    })
});


app.get('/csvdownload', (req, res) => {
    const filePath = `${__dirname}/data.csv`;

    const stream = fs.createReadStream(filePath);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'inline; filename="mydata.csv"');

    stream.pipe(res);
});

const csvStorage = multer.diskStorage({
    // Destination to store csv     
    destination: 'csv', 
      filename: (req, file, cb) => {
        cb(null, 'myupload.csv')
    }
});
const csvUpload = multer({
    storage: csvStorage,
    limits: {
      fileSize: 5000000 //5MB
    }
})

app.post('/upload_csv', csvUpload.single('csvupload'), (req, res) => {
    
    courseglobal = req.body.course;
    return res.redirect("/csv_2_json");
})

app.get("/csv_2_json",(req,res)=>{
    fs.createReadStream(`${__dirname}/csv/myupload.csv`)
    .pipe(csv2json({
    separator:','
}))
    .pipe(fs.createWriteStream('mydata.json'));
    return res.redirect("/upload_json_database");
})

app.get("/upload_json_database",async(req,res)=>{
    console.log(uploadedData);
    const length = uploadedData.length
    for(let i=0;i<length;i++)
    {
        await db.collection(courseglobal).save(uploadedData[i],{ checkKeys: false },(err,collection)=>{
            if(err){
                throw err;
            }
            console.log(`json data inserted successfully in ${courseglobal}`);
        });

    }
    return res.redirect('addcsv.html');
})


app.get("/",(req,res)=>{
    res.set({
        "Allow-access-Allow-Origin": '*'
    })
    return res.redirect('home.html');
}).listen(port);

console.log(`Listening on PORT ${port}`);

