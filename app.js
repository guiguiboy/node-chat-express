
/**
 * Module dependencies.
 */

var express = require('express')
  , chat          = require('./routes/chat')
  , http          = require('http')
  , io            = require('socket.io')
  , cookie        = require('express/node_modules/cookie')
  , connect       = require('express/node_modules/connect')
  , sanitize      = require('validator').sanitize
  , check         = require('validator').check
  , validator     = require('validator')
  , chatModule    = require('./chat')
  , sessionSecret = "sess1onS€cr3t"
  , sessionStore  = new express.session.MemoryStore({ reapInterval: 60000 * 10 })
  , path          = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({secret: sessionSecret, store: sessionStore}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//console.log(validator.validators);
//console.log(validator.validators.notRegex('lolilol', /[a-z0-9-_]+/i));


app.get('/', chat.index);
app.get('/signin', chat.getSignin);
app.post('/signin', chat.postSignin);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
var io = require('socket.io').listen(server);

var chatManager = new chatModule.Manager();
var connections = {};

io.sockets.authorization(function (handshakeData, callback) {
	// Read cookies from handshake headers
	  var cookies = cookie.parse(handshakeData.headers.cookie);
	  // We're now able to retrieve session ID
	  var sessionID;
	  if (cookies['connect.sid']) {
	    sessionID = connect.utils.parseSignedCookie(cookies['connect.sid'], sessionSecret);
	  }
	  // No session? Refuse connection
	  if (!sessionID) {
	    callback('No session', false);
	  } else {
	    // Store session ID in handshake data, we'll use it later to associate
	    // session with open sockets
		handshakeData.sessionID = sessionID;
	    // On récupère la session utilisateur, et on en extrait son username
	    sessionStore.get(sessionID, function (err, session) {
	      if (!err && session && session.username) {
	        // On stocke ce username dans les données de l'authentification, pour réutilisation directe plus tard
	        handshakeData.username = session.username;
	        // OK, on accepte la connexion
	        callback(null, true);
	      } else {
	        // Session incomplète, ou non trouvée
	        callback(err || 'User not authenticated', false);
	      }
	    });
	  }
	});

io.sockets.on('connection', function (socket) {
	chatManager.push('', socket.handshake.username + ' has joined');
	io.sockets.emit('sendMessage', '', socket.handshake.username + ' has joined');
	socket.emit('getMessages', chatManager.list());
    
    socket.on('newPost', function (post) {
    	post = sanitize(post).entityEncode().trim();
    	chatManager.push(socket.handshake.username, post);    	
    	io.sockets.emit('sendMessage', socket.handshake.username, post);
    });
    socket.on('disconnect', function () {
        if (socket.handshake.username) {
        	io.sockets.emit('sendMessage', '', socket.handshake.username + ' has left');
        }
    });
});
