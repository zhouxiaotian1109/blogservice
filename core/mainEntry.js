
function submit(clazz, args){
	return new clazz(args).xxx;
}
function test(){
	console.log('hello,test');
}
exports.submit = submit;
exports.test = test;


// var h = require('./core');
// h.submit(clazz,'snandy');