var express = require("express");
var http = require("http");
var	fs = require('fs');
var app = express();
app.use(express.logger());
app.use(express.static('public'));

var hbs = require('hbs');
var blogEngine = require('./blog');
var bonsaiHost;
var bonsaiUser;
var bonsaiPass;

var getLocalBonsaiURL = function(){
	var localBonsaiURL;
	fs.readFile('bonsaiurl.txt', 'utf8', function (err,data) {
		if (err) {
			return console.log(err);
		}
		parseBonsaiParams(data);
	});
}
var setBonsaiConnectionSettings = function() {
	BonsaiURL = process.env.BONSAI_URL;
	if (BonsaiURL) {
		parseBonsaiParams(BonsaiURL);
	} else {
		getLocalBonsaiURL();
	}
}
var parseBonsaiParams = function(url) {
	var hostRegex = /http:\/\/([^:]*):([^\@]*)\@(.*)/	
	var hostParams = url.match(hostRegex);
	bonsaiUser = hostParams[1];
	bonsaiPass = hostParams[2];
	bonsaiHost = hostParams[3];
}

setBonsaiConnectionSettings();
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

app.get('/getposts/', function(req, res){
	options = {
	  host: bonsaiHost,
	  port: 80,
	  path: '/blog/posts/_search',
	  method: 'GET',
	  headers: {
	     'Authorization': 'Basic ' + new Buffer( bonsaiUser + ':' + bonsaiPass).toString('base64')
	   }    
	};
	http.get(options, function(eRes) {
		eRes.on("data", function(chunk) {
			var data = JSON.parse(chunk);
			var entries = data.hits.hits;
			//res.send(entries);
			res.render('index', {"title": "Elastic Entries", "entries": entries});
		});	
	}).on('error', function(e) {
		res.send("Got error: " + e.message);
	});
});

app.get('/post/', function(req, res){
	res.render('post',{title:"Create new blog entry"});
});

app.post('/post/', function(req, res){
	var options = {
	  host: bonsaiHost,
	  port: 80,
	  path: '/blog/posts/' + req.body.postId,
	  method: 'PUT',
	  headers: {
	     'Authorization': 'Basic ' + new Buffer( bonsaiUser + ':' + bonsaiPass).toString('base64')
	   }    
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
	res.send("BonsaiURL: " + host + "<br />Payload: " + payload );
});

var port = process.env.PORT || 5000 ;
app.listen(port, function() {
	console.log("Listening on " + port);
});
