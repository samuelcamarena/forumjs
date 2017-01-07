var net = require('net');

var client = new net.Socket();
var hostPort = {};
var callbacks = {}; // Hash of callbacks. Key is invoId
var invoCounter = 0; // Current invocation number is key to access 'callbacks'.

exports.Start = function (port, host, cb) {
	hostPort.port = port;
	hostPort.host = host;
	client.connect(hostPort, function() {
    	console.log('DMC:\n - Connected to: ' + hostPort.host + ':' + hostPort.port);
    	this.setEncoding('utf8');
    	if (cb != null) cb();
	});
}

/*
 * Whenever data comes from server, it is a reply from our previous request, therefore
 * we extract the reply, find the callback, and call it.
 */
client.on('data', function(data) {
    // Socket TCP sends all data in stream way to improve the comunications performance,
    // therefore "data" may contain more than one client request. We use [>EOM<] as End Of Message token separator.
    var str = data.toString();
    var messages = str.split('[>EOM<]');
    // Delete the last splited string after the last [>EOM<], as it is always an empty string ''.
    messages.pop();
	console.log('DMC:\n - Received data manager server response:');
    for (var msg in messages) {
        console.log(' --- (', msg, ') ', messages[msg]);
		handleData(messages[msg]);
	}
});
// Add a 'close' event handler for the client socket
client.on('close', function() {
    console.log('DMC:\n - Connection closed');
});

// Error event handler for the client socket
client.on('error', function(err) {
    console.log('DMC:\n - Connection error\n --- ', JSON.stringify(err));
});

client.on('timeout', function() {
    console.log('DMC: \n - Connection timeout');
});

client.on('end', function() {
    console.log('DMC: \n - Connection end');
});

function writeData(socket, data) {
	console.log('DMC:\n - Sending request to data manager server (', data.what, ')');
	var str = JSON.stringify(data);
	// Socket TCP sends all data in stream way, therefore we use [>EOM<] as End Of Message token separator
	str = str + '[>EOM<]';
	var success = socket.write(str);
	if (!success) {
		(function(socket, data) {
			socket.once('drain', function() {
				writeData(socket, data);
			});
		})(socket, data);
	}
}

function handleData(data) {
	var reply = JSON.parse(data);			
	
	switch (reply.what) {
		// Invocations with one argument callbacks.
		case 'get private message list':
		case 'get public message list':
		case 'get subject list':
		case 'get user list':
		case 'add user':
		case 'add subject':
		case 'login':
			callbacks[reply.invoId](reply.obj); // call the stored callback, one argument
			delete callbacks[reply.invoId]; // remove from hash
			break;
		case 'add private message':
		case 'add public message':
			callbacks[reply.invoId](); // call the stored callback, no arguments
			delete callbacks [reply.invoId]; // remove from hash
			break;
				
		default:
			console.log ('DMC:\n - Wrong reply option received from data manager server\n --- ', JSON.stringify(reply.what));
	}
}

/*
 * On each invocation we store the command to execute (what) and the invocation Id (invoId).
 * InvoId is used to execute the proper callback when reply comes back.
 */
function Invo (str, cb) {
	this.what = str;
	this.invoId = ++invoCounter;
	callbacks[invoCounter] = cb;
}

/*
 * Exported functions as data manager 'interface'.
 */
exports.addUser = function (userName, userPass, cb) {
	var invo = new Invo ('add user', cb);
	invo.name = userName;
	invo.pass = userPass;
	writeData(client, invo);
}

exports.addSubject = function (newSubject, cb) {
	var invo = new Invo ('add subject', cb);
	invo.sbj = newSubject;
	writeData(client, invo);
}

exports.addPrivateMessage = function (newPrivMsg, cb) {
	var invo = new Invo ('add private message', cb);
	invo.msg = newPrivMsg;
	writeData(client, invo);
}

exports.addPublicMessage = function (newPubMsg, cb) {
	var invo = new Invo ('add public message', cb);
	invo.msg = newPubMsg;
	writeData(client, invo);
}

exports.login = function (userName, userPass, cb) {
	var invo = new Invo ('login', cb);
	invo.name = userName;
	invo.pass = userPass;
	writeData(client, invo);
}

exports.getUserList = function(cb) {
	var invo = new Invo('get user list', cb);
	writeData(client, invo);
}

exports.getSubjectList = function(cb) {
	var invo = new Invo('get subject list', cb);
	writeData(client, invo);
}

exports.getPublicMessageList = function(sbj, cb) {
	var invo = new Invo ('get public message list', cb);	
	invo.sbj = sbj;
	writeData(client, invo);
}

exports.getPrivateMessageList = function(u1, u2, cb) {
	var invo = new Invo ('get private message list', cb);
	invo.u1 = u1;
	invo.u2 = u2;
	writeData(client, invo);
}