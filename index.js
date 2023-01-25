const express = require("express")
const app= express();
const cors = require("cors");
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const fileUpload = require("express-fileupload");

const cloudinary = require("cloudinary").v2;
cloudinary.config({ 
    cloud_name: 'ds6hpyvsw', 
    api_key: '175966656926666', 
    api_secret: 'E2Z8nD1PUrmkW5NwxM_vMsB1Vb0' 
  });
app.use(cors())
app.use(fileUpload({
    useTempFiles:true
}))

app.use(bodyParser.json())



const blogSchema = new mongoose.Schema({
    title:  String, 
    body:   String,
    image:{type:String,required:true},
    date: { type: Date, default: Date.now }})

const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    blogs:[blogSchema]
    
})


const User = mongoose.model('User', userSchema);            

const CONNECTION_URL="mongodb+srv://admin-angela:test123@cluster0.emczz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
const PORT = process.env.PORT || 5000





app.get("/",(req,res)=>{
    res.send("hi")
})
app.post("/createpost",(req,res)=>{
    const {id,postName,postBody}=req.body
    const image = req.files.image
    
    cloudinary.uploader.upload(image.tempFilePath,(err,result)=>{
        
        if(result){
            
            User.findOneAndUpdate({_id:id},
            {$push:{blogs:{title:postName,body:postBody,image:result.url}}},
            (err,results)=>{
                if(!err){
                    res.status(200)
                }else{
                    console.log(err)
                }
            }
                )
        }
    })
})
app.post("/user",(req,res)=>{
    const{name,email,password}=req.body

    User.findOne({email:email},(err,results)=>{
        if(results){
            res.send({message:"user is already registered"})
        }else{
            bcrypt.hash(password, saltRounds, function(err, hash) {
                user=new User({
                    name:name,
                    email:email,
                    password:hash,
                })
                user.save()
                
            });

            res.status(200).send({message:"registered successfully please log in"})
        }
    })

    
})


app.post("/login",(req,res)=>{
    const {email,password}=req.body
    User.findOne({email:email},(err,results)=>{
        if(results){
        const hash=results.password
        bcrypt.compare(password, hash, function(err, docs) {
            // result == true
            if(docs){
                res.status(200).send(results)
            }
        });
    }else{
        res.status(401).send({message:"User not found"})
    }
    })
    
})







app.get("/user/",(req,res)=>{
    const id = req.query.id
    User.findOne({_id:id},(err,results)=>{
        res.send(results.blogs)
    })
})




app.get("/blog",(req,res)=>{
    const {id,user} = req.query
    User.findOne({_id:user},{blogs:{$elemMatch:{_id:id}}},(err,results)=>{
        if(!err){
            res.send(results)
        }
    })


})

app.get("/allposts",(req,res)=>{
    User.find({"blogs.id":{}},(err,results)=>{
        res.send(results)
        
    })
})

app.delete("/blog",(req,res)=>{
    const{id,user}=req.query
    User.updateOne({_id:user},{$pull:{blogs:{_id:id}}},(err,results)=>{
        if(!err){
            res.send({message:"Deleted successfully"})
        }else{
            res.send({message:"You can delete post only created by you"})
        }
    })
})
mongoose.connect(CONNECTION_URL)
    .then(()=>app.listen(PORT,()=>{console.log("server is up and running")}))
    .catch((err)=>console.log(err.message))




