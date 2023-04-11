const data = require('./sampleData.json');
const mongoose = require('mongoose');
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const url = require('url');
const fs = require('fs');

const app = express();
var port = 7892
app.use(express.static("public"))
app.set("view engine","ejs")


// Define the MongoDB URI and database name
const mongoURI = 'mongodb+srv://sahil2070be20:dRCYTOzzbHCzfA70@travelsaathi.flubanq.mongodb.net/test';

// Connect to the MongoDB database
// mongoose.connect(mongoURI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('Failed to connect to MongoDB', err));

app.get("/:veiw/",(req,res)=>{
  if(fs.existsSync(__dirname+`/views/`+req.params.veiw+`.ejs`)){
    try{
      let user_data = data["userName"];
      res.render(req.params.veiw+`.ejs`,{data:user_data,url:req.url})
    }catch(err){
      res.render("/views/404.ejs",{error:err})
    }
  }else{
    res.render("/views/404.ejs",{error:"userNotfound"})
  }
})

app.get("*",(req,res)=>{
  res.render("404.ejs",{url:decodeURI(path.normalize(url.parse(req.url).pathname))})
})

app.listen(port,()=>{
  console.log("listening on port " + port)
})