//console.log(module.paths); 模块的额路径 module path
//console.log(process.argv);

//eee=1&bbb=2
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var server = require('http').createServer(app);

app.use(bodyParser.urlencoded({    
  extended: true
}));

app.post('/priest', function (req, res) {
  // console.log(req);
  // console.log(req.method);
  // console.log(req.baseurl);
  // console.log(req.path);
  // console.log(req.headers['user-agent']);
  // console.log(req.get('user-agent'));
  // console.log(req.query);
  // console.log(req.query.id);
  // console.log(req.body);
  // console.log(req.body.id);
  console.log(req.body);
  var transCode=req.body.transCode;
  var requestBody=req.body.requestBody;
  console.log('transCode:'+transCode);
  console.log('requestBody:'+requestBody);


  // var mainEntry = require('../core/mainEntry');
  // var response = h.submit(transCode,requestBody);
  // res.send(response);

  res.send(requestBody);

});

var PORT = process.env.PORT || 3000;
server.listen(PORT);



//反射 碉堡了
/*function Cat(name){  
    this.name = name;  
    this.toString = function(){  
        return "This cat name is " + this.name;  
    }  
}  
function Dog(color){  
    this.color = color;  
    this.toString = function(){  
        return "This is " + this.color + " dog!";  
    }  
}  
function getAnimal(clazz, args){  
    return new clazz(args);  
}  
  
alert(getAnimal(Cat, 'uspcat'));  
alert(getAnimal(Dog, 'black')); */