var express = require("express");
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

var port = process.env.PORT || 5000 ;
app.listen(port, function() {
	console.log("Listening on " + port);
});
