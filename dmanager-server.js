var net = require('net');
var dm = require ('./data-manager.js');

// Default values in case of no command line arguments.
var hostPort = {port: 9000, host: '127.0.0.1'};

// Use command line arguments to establish the listening Host and Port of this remote data manager server.
switch(process.argv.length){
    case 2: 
        console.log('DMS:\n - No command line arguments, using default host, port');        
        break;
    case 3: // Host:Port on commmand line.
        hostPort.host = (process.argv[2].split(':'))[0];
        hostPort.port = (process.argv[2].split(':'))[1];
        break;
    default:
        console.log('DMS:\n - Error: wrong command line arguments (' + process.argv.length + ')');
}

// Create the server socket, on client connections, bind event handlers
var server = net.createServer(function(socket) {
    // We have a connection, one socket object is automatically assigned to the connection
    console.log('DMS:\n - Data manager client listening on (' + socket.remoteAddress + ':' + socket.remotePort + ')');
    socket.setEncoding('utf8');

    socket.on('data', function(data) {
        var str = data.toString();
        // Socket TCP sends all data in stream way to improve the comunications performance,
        // therefore "data" may contain more than one client request. We use [>EOM<] as End Of Message token separator.
        var messages = str.split('[>EOM<]');
        // Delete the last splited string after the last [>EOM<], as it is always an empty string ''.
        messages.pop();      
        console.log('DMS:\n - Received data manager client request:');
        for (var msg in messages) {
            console.log(' --- (', msg, ') ', messages[msg]);
            handleData(socket, messages[msg]);
        }
    });

    socket.on('close', function() {
        console.log('DMS:\n - Connection closed');
    });    

    socket.on('end', function() {
        console.log('DMS:\n - Connection end');
    });    

    socket.on('timeout', function() {
        console.log('DMS:\n - Connection timeout');
    });    

    socket.on('error', function(err) {
        console.log('DMS:\n - Connection error\n --- ', JSON.stringify(err));
    });    
});

function writeData(socket, data) {
    data = data + '[>EOM<]';
    var success = !socket.write(data);
    if (!success) {
        (function(socket, data) {
            socket.once('drain', function() {
                writeData(socket, data);
            });
        })(socket, data);
    }
}

function handleData(socket, data) {
    var invo = JSON.parse(data);
    var reply = {what:invo.what, invoId:invo.invoId};
    
    switch (invo.what) {
        case 'get subject list': 
            reply.obj = dm.getSubjectList();
            break;

        case 'get public message list': 
            reply.obj = dm.getPublicMessageList(invo.sbj);
            break;

        case 'get private message list': 
            reply.obj = dm.getPrivateMessageList(invo.u1, invo.u2);
            break;

        case 'get user list': 
            reply.obj = dm.getUserList();
            break;

        case 'add user': 
            reply.obj = dm.addUser(invo.name, invo.pass);
            break;

        case 'add subject': 
            reply.obj = dm.addSubject(invo.sbj);
            break;            

        case 'login': 
            reply.obj = dm.login(invo.name, invo.pass);
            break;            

        case 'add private message': 
            dm.addPrivateMessage(invo.msg);
            break;    

        case 'add public message': 
            dm.addPublicMessage(invo.msg);
            break;    
    }
    writeData(socket, JSON.stringify(reply));
}

server.listen(hostPort, function() {
    console.log('DMS:\n - Server listening on ', server.address());
    
    server.on('close', function() {
      console.log('DMS:\n - Connection closed at server listen event');
    });

    server.on('error', function(err) {
      console.log('DMS:\n - Connection error at server listen event\n --- ', JSON.stringify(err));
    });

});
