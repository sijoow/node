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

//리액트 파일 추가 하기  ejs 파일 뿐만아니라 리액트 파일도 함꼐 사용하기 
const path = require('path');
app.use(express.static(path.join(__dirname, 'blog/build')));

app.get('/react', function (요청, 응답) {
  응답.sendFile(path.join(__dirname, '/blog/build/index.html'));
});


/*
app.get('/',function(req,res){
  res.render('index.ejs')
})
*/

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
      if(err){return console.log(err)} //err찾기
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

//편집하기
app.get('/edit/:id',function(req,res){
  db.collection('post').findOne({_id:parseInt(req.params.id)},function(err,result){
    res.render('edit.ejs',{edit:result})
  })
})

//put 요청 수정요청 하기

app.put('/edit',function(req,res){
  //서버로 PUT요청이 들어오면 폼에담긴 제목또는 날짜 데이터를 가지고 db.collection에 업데이트 해주세요
  db.collection('post').updateOne({_id:parseInt(req.body.id)},{ $set:{제목:req.body.title,날짜:req.body.date}},function(err,result){
    console.log('수정완료');
    //페이지 이동 
    res.redirect('/list')
  })
})

//상품별 링크 추가 하기 완료
app.get('/detail/:id',function(req,res){
  db.collection('post').findOne({_id:parseInt(req.params.id)},function(err,result){
    res.render('detail.ejs',{detail:result})
  })
})



//회원가입 세팅 방법
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
//app use 미들웨어(웹사이트 요청 응답해주는 머신을 미들웨어라고 한다.)
app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login',function(요청,응답){
  응답.render('login.ejs')
})

app.post('/login',passport.authenticate('local',{
  failureRedirect : '/fall' //사용자가 로그인 실패시 가는 경로 설정
}),function(요청,응답){
  //성공했을땐 메인페이지로 보내라
  응답.redirect('/');
})

//인증하는 방법 
passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
  //console.log(입력한아이디, 입력한비번);
  db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러)
    //done 1.서버오류,2사용자 데이터를 보내는거 3.에러메세지 넣는곳
    if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
    if (입력한비번 == 결과.pw) {
      return done(null, 결과)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));
//id를 이용해서 세션을 저장시키는 코드 로그인성공시 결과==user
passport.serializeUser(function(user,done){
  done(null,user.id)
});
//마이페이지 접속시 발동 user.id==section아이디<<인거다
passport.deserializeUser(function(아이디,done){
  //디비에서 user.id로 유저를 찾은 뒤에 유저 정보를 {}<<여기에 넣어서 설정해주는 방식
  db.collection('login').findOne({id:아이디},function(err,result){
    done(null,result)
  })

})
//req요청 res응답

//마이페이지 
app.get('/mypage', 로그인했니, function (요청, 응답) {
  console.log(요청.user);
  응답.render('mypage.ejs', { 사용자: 요청.user })
}) 
//로그인 여부 확인
function 로그인했니(요청,응답,next){
    if(요청.user){
      //다음으로 통과시켜주세요 라는 함수 next()
      next()
    }else{
      응답.send('로그인먼저 페이지로 이동시켜버리기')
    }
}
//회원가입 하기
app.post('/register',function(요청,응답){
  db.collection('login').insertOne({id:요청.body.id,pw:요청.body.pw},function(err,result){
    응답.redirect('/');
  })
})


app.get('/search',(req,res)=>{
  var 검색조건 =[
    {
      $search : {
        index :'titleSearch',
        text : {
          query:req.query.value,
          path:'제목',
        }
      }
    },
  ]
  db.collection('post').aggregate(검색조건).toArray((err,result)=>{
    res.render('search.ejs',{list:result})
  })
})


app.get('/search',(req,res)=>{
  var 검색조건 = [
    $search={
      index:'textSea',
      text:{
        query:req.query.value,
        path:'제목',
      }
    }
  ]
})