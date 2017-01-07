// Messages are objects with some specific fields
// the message itself, who sends, destination, whether is private message, timestamp 
function Message (msg, from, to, isPrivate, ts) {
    this.msg=msg; this.from=from; this.isPrivate=isPrivate; this.to=to; this.ts=ts;
}

function Post (msg, from, ts) {
	this.msg=msg; this.from=from; this.ts=ts;
}

var subjects = {id0: 'Forum guidelines', id1: 'Animals', id2:'Travel', id3:'Cars'};
var users = {
	Anders: '123',
	Bindertee: '123',
	ChromeRoll: '123',
	Develon: '123'
};

var publicMessages = {
	id0: [
		new Post ('<h3>Wellcome to Forum JS</h3>', 'Wellcome', 'no date'),
		new Post ('<br>In order to use this app, you can access as a guest or as a registered user.' + 
					' As a guest user you can read contents inside of any subjet (right side) and create a new user.'+
					' As a registered user you can read/write subject and private messages and create new subjects.' +
					'<br><br>In order to send a private messages, first login, then select one user from user\'s list,' +
					' (private messages will be shown), and you will be able to send a new one' +
					' through an input textfield at website footer (bottom side).' +
					'<br><br>To access as a registered user, you can introduce one of user\'s names (left side) and 123 password, or create a new user.' +
					'<br><br>Thank you for your attention.' , 'Wellcome', 'no date')],
	id1: [
		new Post ('Probably the most common pets are cats and dogs', 'Anders', new Date()),
		new Post ('I take the same view as Anders, almost everyone that I know has a cat or dog.', 'Bindertee', new Date()),
		new Post ('Indeed, on my building there are living ten families and all of them have a little dog.', 'Anders', new Date())],
	id2: [
		new Post ('One of my favourites means of travel is by bicycle.<br>Really comfortable!!', 'ChromeRoll', new Date()),
  		new Post ('A very good choice if you want to enjoy an eco-tour.', 'Bindertee', new Date())],
	id3: [
		new Post ('I strongly belive that the new electric sports cars'+
  				  ', are the most effectively improved cars for many years.', 'Develon', new Date()),
  		new Post ('Unfortunately, we will have to wait a little longer to those cars being more affordables.', 'Anders', new Date())]
};
// first field name is nick1_nick2, where nick1 is less than nick2 in alpahabetic order
var privateMessages = {
	Anders_Anders: [
		new Post ('I am both users, the sender and receiver :)', 'Anders', new Date())],
	Anders_Bindertee: [
		new Post ('Hey Bindertee!', 'Anders', new Date()),
		new Post ('Hello Anders', 'Bindertee', new Date()),
		new Post ('Have you received the photo of my neighbor\'s cat?', 'Anders', new Date()),
		new Post ('Sure, I am looking it right now :)', 'Bindertee', new Date())],
 	Bindertee_ChromeRoll: [
 		new Post ('Hello Bindertee', 'ChromeRoll', new Date()),
		new Post ('Can you give me the brand of your favourite bicycle?', 'ChromeRoll', new Date()),
		new Post ('I would like to buy a similar one.', 'ChromeRoll', new Date()),
		new Post ('Of course, here it is...', 'Bindertee', new Date())],
 	Anders_Develon: [
 		new Post ('Have you seen the last news of Tesla cars?', 'Develon', new Date()),
		new Post ('I did, in fact, the presentation of their last model was so amazing!!', 'Anders', new Date())]
};

// true if already exists
exports.addUser = function(u,p) {
	var lower = u.toLowerCase();
	var exists = false;
	for (var i in users) {
		if (i.toLowerCase() == lower) { exists = true; break; }
	}
	if (!exists) users[u] = p;
	return exists;
}

// Adds a new subject to subject list. Returns -1 if already exists, id on success
exports.addSubject = function(s) {
	var lower = s.toLowerCase();
	for (var i in subjects) {
		if (subjects[i].toLowerCase() == lower) {return -1;}
	}
	var len = Object.keys(subjects).length;
	var idlen = 'id' + len;
	subjects[idlen] = s;
	return idlen;
}

exports.addPrivateMessage = function(msg) {
	// lower user us always first
	var u1=msg.from;
	var u2=msg.to;
	var k = (u1.toLowerCase().localeCompare(u2.toLowerCase())<0) ? u1+'_'+u2:u2+'_'+u1;
	var ml = privateMessages [k];
	if (!ml) privateMessages [k] = [];
	privateMessages[k].push(msg);
}

// adds a public message to storage
exports.addPublicMessage = function(msg){
	var ml = publicMessages[msg.to];
	if (!ml) publicMessages[msg.to] = [];
	publicMessages[msg.to].push(msg);
}

// Tests if credentials are valid, returns true on success
exports.login = function(u, p) {
	var lower = u.toLowerCase();
	for (var i in users) {
		if (i.toLowerCase() == lower) {return (users[u] == p);}
	}
	return false; // user not found
}

exports.getUserList = function() {
	var usersList = [];
	for (var i in users) {
		usersList.push(i);
	}
	return JSON.stringify(usersList);
}

exports.getSubjectList = function() {
	return JSON.stringify(subjects);
}

exports.getPublicMessageList = function(sbj) {
	return JSON.stringify(publicMessages[sbj]);
}

exports.getPrivateMessageList = function(u1, u2) {
	var key = u1 + '_' + u2; // user1 may be sorted alphabetically before user2 
	if (u1.toLowerCase().localeCompare(u2.toLowerCase()) > 0) {   
		key = u2 + '_' + u1; // user2 is sorted before user2
	}
	return JSON.stringify(privateMessages[key]);
}