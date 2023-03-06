const express= require('express');
const app = express();
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended:true}))
app.set('view engine','ejs')
const MongoClient = require('mongodb').MongoClient
//수정하기
const methodOverride = require('method-override');
const Collection = require('mongodb/lib/collection');
app.use(methodOverride('_method'))

app.get('/',function(req,res){
  res.render('index.ejs')
})

MongoClient.connect('mongodb+srv://sai:sai@cluster0.fivip1p.mongodb.net/?retryWrites=true&w=majority',function(err,client){
  if(err)return console.log(err);
  db = client.db('todoapp');
  app.listen(8181,function(){
    console.log('listening on 8181 로연결된다')
  });
})


app.get('/write',function(req,res){
  res.render('write.ejs')
})

app.post('/add',function(req,res){
  res.send('sucsess');
  db.collection('counter').findOne({name:'게시물갯수'},function(err,result){
    var totalPost = result.totalPost;
    db.collection('post').insertOne({_id:totalPost+1,제목:req.body.title,날짜:req.body.date});
    db.collection('counter').updateOne({name:'게시물갯수'},{$inc:{totalPost:1}},function(err,result){
      if(err){return console.log(err)} //에러찾기
    })
  })
})

app.get('/list',function(req,res){
  db.collection('post').find().toArray(function(err,result){
    res.render('list.ejs',{list:result})
  })
})

app.delete('/delete',function(req,res){
  req.body._id = parseInt(req.body._id)
  db.collection('post').deleteOne(req.body,function(err,result){
    res.status(200).send({message:'성공'})
  })
})

