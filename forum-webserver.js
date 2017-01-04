var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var dm = require('./dmanager-client.js');

var hostPort = {port: 9000, host: '127.0.0.1'}; // Default values in case of no command line arguments.
// Use command line arguments to establish the Host and Port of the remote data manager server.
switch(process.argv.length){
    case 2:
        console.log('FWS:\n - No command line arguments, using default host, port'); 
        break;
    case 3: // Host:Port on commmand line.
        hostPort.host = (process.argv[2].split(':'))[0];
        hostPort.port = (process.argv[2].split(':'))[1];
        break;
    default:
        console.log('FWS:\n - Error: wrong command line arguments (' + process.argv.length + ')');
}

var viewsdir = __dirname + '/views';
app.set('views', viewsdir);

// Called on connection
function get_page(req, res) {
	console.log('FWS: - Serving request ' + req.params.page);
	res.sendFile(viewsdir + '/' + req.params.page);
}

// Called on server startup
function on_startup() {
    console.log('FWS:\n - Starting server at current directory:\n --- ' + __dirname);
    // Start data manager client to establish connection with the remote data manager server at (host:port).
    console.log('FWS:\n - Starting data manager client');
    dm.Start(hostPort.port, hostPort.host);
}

// Serve static files such as css, images, javascript
app.use('/public', express.static(__dirname + '/public'));

// Serve static html files
app.get('/', function(req, res){
	req.params.page = 'index.html'
	get_page(req, res);
});

app.get('/:page', function(req, res){
	get_page(req, res);
});

io.on('connection', function(sock) {
	console.log('FWS:\n - Client browser connected');
	
    sock.on('disconnect', function(){
		console.log('FWS:\n - Client browser disconnected');
	});

    // On messages that come from client, store them, and send them to every connected client
    sock.on('message', function(msgStr){
        console.log('FWS: - Event: message: ' + msgStr);
        var msg = JSON.parse(msgStr);
        msg.ts = new Date(); // timestamp
        if (msg.isPrivate) {
            dm.addPrivateMessage(msg, function () {
                io.emit('message', JSON.stringify(msg));
            });
        } else {
            dm.addPublicMessage(msg, function () {
                io.emit('message', JSON.stringify(msg));
            });
        }
    });

    // New subject added to storage, and broadcasted
    sock.on('new subject', function(sbj) {
        dm.addSubject(sbj, function(id) {
            console.log('FWS: - Event: new subject: ' + sbj + '-->' + id);
            if (id == -1) {
                sock.emit('new subject', 'err', 'Subject already exists', sbj);
            } else {
                sock.emit('new subject', 'ack', id, sbj);
                io.emit('new subject', 'add', id, sbj);
            }      
        });
    });

    // New subject added to storage, and broadcasted
    sock.on('new user', function(usr, pas) {
        dm.addUser(usr, pas, function(exists) {
            console.log('FWS: - Event: new user: ' + usr + '(' + pas + ')');
            if (exists) {
                sock.emit('new user', 'err', usr, 'User already exists');
            } else {
                sock.emit('new user', 'ack', usr);
                io.emit('new user', 'add', usr);      
            }
        });
    });

    // Client ask for current user list
    sock.on('get user list', function() {
        dm.getUserList(function (list) {
            console.log('FWS: - Event: get user list');  		
            sock.emit('user list', list);
        });
    });

    // Client ask for current subject list
    sock.on('get subject list', function() {
        dm.getSubjectList(function(list) {
            console.log('FWS: - Event: get subject list');  		
            sock.emit('subject list', list);
        });
    });

    // Client ask for message list
    sock.on('get message list', function(from, to, isPriv) {
        console.log('FWS: - Event: get message list: ' + from + ':' + to + '(' + isPriv + ')');  		
        if (isPriv) {
            dm.getPrivateMessageList(from, to, function (list) {
                sock.emit('message list', from, to, isPriv, list);
            });
        } else {
            dm.getPublicMessageList(to, function (list) {
                sock.emit('message list', from, to, isPriv, list);
            });
        }
    });

    // Client authenticates
    sock.on('login', function(u,p) {
        console.log('FWS: - Event: user logs in');  		
        dm.login (u, p, function(ok) {
            if (!ok) {
                console.log('FWS: - Logging error, wrong credentials: ' + u + '(' + p + ')');
                sock.emit('login', 'err', 'Wrong credentials');
            } else {
                console.log ('FWS: - User logs in: ' + u + '(' + p + ')');
                sock.emit('login', 'ack', u);	  			
            }
        });
    });
});

// Listen for connections.
http.listen(10000, on_startup);
