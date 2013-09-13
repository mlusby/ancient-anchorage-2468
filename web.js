var express = require("express");
var http = require("http");
var app = express();
app.use(express.logger());
app.use(express.static('public'));

var hbs = require('hbs');
var blogEngine = require('./blog');

app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(express.bodyParser());
 
app.get('/', function(req, res) {
   res.render('index', {"title":"My Blog", "entries": blogEngine.getBlogEntries()});
});

app.get('/article/:id', function(req, res) {
   var entry = blogEngine.getBlogEntry(req.params.id);
   res.render('article',{title:entry.title, blog:entry});
});

app.get('/post/', function(req, res){
	res.render('post',{title:"Create new blog entry"});
});

app.post('/post/', function(req, res){
	var options = {
	  host: process.env.BONSAI_URL,
	  port: 80,
	  path: '/blog/posts/' + req.body.postId,
	  method: 'PUT'
	};

	var elasticReq = http.request(options, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	    console.log('BODY: ' + chunk);
	  });
	});

	elasticReq.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});

	// write data to request body
	var payload = '{"author":"'+req.body.author+'","post":"';
	payload = payload + req.body.blogpost + '"}';
	elasticReq.write(payload);
	elasticReq.end();
	res.send("BonsaiURL: " + process.env.BONSAI_URL + "<br />Payload: " + payload );
});

var port = process.env.PORT || 5000 ;
app.listen(port, function() {
	console.log("Listening on " + port);
});
