/*
 * Index.js - v1.3 - Client side functionality.
 */

/*
 * Global variables 
 */
// SocketIO to talk with server. 
var socket = io();
// Popup dialogs
var dlg_new_subject;
var dlg_new_user;
// Forum state
var userName = '';     // current user name when login succeeds, '' means none
var messageArea = null;  // current message list we display

/*
 * Basic data types
 */
// A message is an object used on subjects (public) or between users (private). It has the message itself, who sends,
// destination, whether is private message and timestamp. 
function Message(msg, from, to, isPrivate, ts) {
    this.msg=msg; this.from=from; this.isPrivate=isPrivate; this.to=to; this.ts=ts;
}
// Message area holds both private messages and subject messages
function MessageArea(toId, toStr, isPrivate) {
    this.toId = toId; this.toStr = toStr; this.isPrivate=isPrivate;
}

/*
 * Incomming asynchronous messages from server
 */


// On new subject event: error while creating, ack, or add subject from the server
socket.on('new subject', function(what, data, strSbj) {
    switch (what) {
        case 'err':
            ui_setPopupError(data); // data is error message
            break;
        case 'ack': // ok, so we can close dialog
            dlg_new_subject.dialog('close');
            break;
        case 'add':
            dom_push_subject(data, strSbj); // data is id
            break;  
    }
    // enable dialog as it was previously disabled.
    ui_setEnabledPopup(true);
});

// On new subject event: error while creating, ack, or add subject from the server
socket.on('new user', function(what, strUser, data) {
    switch (what) {
        case 'err':
            ui_setPopupError(data); // data is error message
            break;
        case 'ack': // ok, so we can close dialog
            dlg_new_user.dialog('close');
            break;
        case 'add':
            dom_push_user(strUser); // data is id. for user names, its equal
            break;  
    }
    // enable dialog as it was previously disabled.
    ui_setEnabledPopup(true);
});

// When receiving the subject list, display it and ask for first subject message list
socket.on('subject list', function (data) {
    var slist = JSON.parse(data);
    for (var i in slist) {
        dom_push_subject(i, slist[i]);
    }
    // Ask messages for first subject at the first time it is loaded the forum. 
    var firstId = Object.keys(slist)[0];
    do_askMessageList(firstId, slist[firstId], false);
});

// When receiving list of users, display it
socket.on('user list', function (data) {
    var ulist = JSON.parse(data);
    for (var i in ulist) {
        dom_push_user(ulist[i]);
    }
});

// On login reply from server, if error show it, if success update UI
socket.on('login', function(what, msg) {
    switch (what) {
        case 'err':
            ui_setLoginError(msg);  // login failed for user 'msg'
            break;
        case 'ack':
            ui_setUserConnected(msg);  // msg is user name logged in
            break;
    }
});

socket.on('message list', function(from, to, isPrivate, data) {
    var ml = JSON.parse(data);
    if (isPrivate == messageArea.isPrivate && 
            (to == messageArea.toId || messageArea.toId == from)) {
        for (var i in ml) {
            ml[i].ts = new Date(ml[i].ts);
            dom_push_message(ml[i]);
        }
    }
});

// On message (private or public) from server, append it to message area.
socket.on('message', function(msgStr){
    var msg = JSON.parse(msgStr);
    msg.ts = new Date (msg.ts);
    if (messageArea.isPrivate == msg.isPrivate && 
        (messageArea.toId == msg.to || messageArea.toId == msg.from)) {
        dom_push_message(msg);
    } else {
        console.log('CLT:\n - Notice: message lost due to asynchrony: ' + msgStr);
    }
});

/*
 * Functions to update DOM with incomming data
 */
// Add subject to list
function dom_push_subject(i, s) {
    var li = $('#sl').append($('<li>').text(s));
    $('#sl li').last().data ('idx', i);  // add subject id into ui list as extra data
}

// Add user to list
function dom_push_user(u) {
    $('#ul').append($('<li>').text(u));
}

// Add message to list
function dom_push_message(msg) {
    if (msg.from == 'Wellcome') {
        var htmlCode = "<div class='cls-li-msg-header'>" + msg.msg + 
                        "</div>";
    } else {                      
        var htmlCode=   "<div class='cls-li-msg-header'>" +
                            "<span id='li-msg-who-content'>" +
                                "<span id='li-msg-who'>Author: </span>" +
                                "<span id='li-msg-who-txt'>" + msg.from + "</span></span>" +
                            "<span id='li-msg-date-content'>" +
                                "<span id='li-msg-date'>Posted on: </span>" +
                                "<span id='li-msg-date-txt'>" + msg.ts.toLocaleString() + "</span></span>" +
                        "</div>" +
                        "<hr class='msg-separator'>" +
                        "<div class='cls-li-msg-content'>" + msg.msg + 
                        "</div>";
    }
    $('#ml').append($('<li>').html(htmlCode));
    if (msg.from == userName) {
        $('#sl li').last().find('#li-msg-who-txt').css('background-color', 'green');
    }
}

/*
 * Functions to update DOM to reflect some UI state
 */
// shows or hides login error mini-popup
function ui_setLoginError(err) {
    if (err == null) {
        $('#div-login-error' ).css('visibility', 'hidden');
        $('#tbl-user :input').removeClass('ui-state-error');
    } else {
        $('#div-login-error').css('visibility', 'visible');
        $('#txt-login-error').text(err);
    }
}

// enable or disable popup fields while we wait for server reply
function ui_setEnabledPopup(enabled) {
    if (enabled) {
        $('.ui-dialog').find('input, button').attr('disabled', false).removeClass('ui-state-disabled');
    } else {
        $('.ui-dialog').find('input, button').attr('disabled', 'disabled').addClass('ui-state-disabled');
    }
}

// When user enters invalid data on popup, show the error inside popup
function ui_setPopupError(err) {
    if (err != null) {
        $('.cls-err-popup').text (err);
        $('.cls-err-popup').css('visibility', 'visible');
    } else {
        $('.cls-err-popup').css('visibility', 'hidden');
    }
}

/*
 * Updates UI when user connects or disconnects
 * hides or shows and enables or disables some specific UI parts
 * sets global varialbe 'userName' to current user name or '' as none connected
 */
function ui_setUserConnected(user) {
    userName = user;
    if (userName == '') {  // disable most parts
        $('#tbl-user').css('visibility', 'visible');
        $('#div-current-user').css('visibility', 'hidden');
        $('#btn-login').text('Login');
        $('#btn-login').css('background-color' , '#E5FA00');
        $('#footer').find('button, textarea').attr('disabled', 'disabled').addClass('ui-state-disabled');
        $('#btn-subject').attr('disabled', 'disabled').addClass('ui-state-disabled');

    } else { // enable everything
        $('#tbl-user').css('visibility', 'hidden');
        $('#div-current-user').css('visibility', 'visible');
        $('#btn-login').css('background-color', '#FFFFFF');
        $('#btn-login').text('Logout');
        $('#txt-user').text(userName);
        $('#footer').find('button, textarea').attr('disabled', false).removeClass('ui-state-disabled');
        $('#btn-subject').attr('disabled', false).removeClass('ui-state-disabled');
    }
}

/*
 * Utility
 */
function checkLength( o, n, min, max ) {
    val = o.val().trim();
    if (val.length > max || val.length < min ) {
        return 'Length of ' + n + ' must be between ' + min + ' and ' + max + '.';
    } else {
        return null;
    }
}

/*
 * Do_xxx functions: executed on user triggered events, when we need
 * to reach the server
 */
// User wants to add a subject, if valid, send it to server
function do_addSubject() {
    var subject = $('#txt-subject');
    var err = checkLength(subject , 'Subject', 3, 40 );
    if (err == null) {
        ui_setEnabledPopup(false);    // don't allow duplicates from ui
        socket.emit ('new subject', subject.val());
        return true; // valid
    } else {
        ui_setPopupError(err);
        return false; //invalid
    }
}

// User wants to add a new user, if valid, send it to server
function do_addUser() {
    var newuser = $('#txt-newuser');
    var pass1 = $('#txt-pass1');
    var pass2 = $('#txt-pass2');
    var err = checkLength(newuser , 'user', 3, 12 );
    if (err == null) err = checkLength(pass1 , 'password', 3, 12 );
    if (err == null) {
        if (pass1.val() != pass2.val()) err = 'The passwords do not match';
    }
    if (err == null) {
        var regexp = /^[a-z\d_]{3,12}$/i; // contains a-z, 0-9, underscores.
        if (!regexp.test(newuser.val().trim())) err = 'Invalid characteres in the user name';
    }
    if (err == null) {
        ui_setEnabledPopup(false);    // don't allow duplicates from ui
        socket.emit ('new user', newuser.val(), pass1.val());
        return true; // valid
    } else {
        ui_setPopupError(err);
        return false; //invalid
    }
}

// User press "send" button to post a message
function do_sendMessage() {
    var msgStr = $('#msg').val().trim(); 
    if (msgStr != '') {
        var msg = new Message (msgStr, userName, messageArea.toId, 
                messageArea.isPrivate, '');
        socket.emit('message', JSON.stringify(msg));
    }
    $('#msg').val('');
}

// User wants to login
function do_login() {
    var uname = $('#txt-username');
    var upass = $('#txt-password');
    var err = checkLength(uname , 'user', 3, 12 );
    if (err == null) err = checkLength(upass , 'password', 3, 12 );
    if (err == null) {
        // login completes when we will receive a 'login' asynchronous event. 
        socket.emit('login', uname.val(), upass.val());
    } else {
        ui_setLoginError('Wrong credentials');
    }
}

function do_logout() {
    ui_setUserConnected(''); // No user connected or user logging out
    if (messageArea != null) {
        if (messageArea.isPrivate) {
            $('#ml-title').html('_'); // Delete private messages on user logout.
            $('#ml-title').css('color', '#607D8B');
            $('#ml').html('');     
        }
    }
}

function do_askMessageList(toId, toStr, isPrivate) {
    messageArea = new MessageArea(toId, toStr, isPrivate);
    $('#ml').html('');
    if (isPrivate) toStr += ' ( private messages )';
    $('#ml-title').html(toStr);
    socket.emit('get message list', userName, toId, isPrivate);
}

/*
 * When DOM is ready we create popup dialogs, register events on DOM elemenets
 * and ask data to the server that will fill up UI
 */
$(function() {
    // Create simple popup to create one subject
    dlg_new_subject = $('#dialog-new-subject').dialog({
        autoOpen: false,
        height: 200,
        width: 350,
        modal: true,
        buttons: {
            'Create': do_addSubject,
            'Cancel': function() {
                dlg_new_subject.dialog('close');
            }
        },
        close: function() {
            $('#frm-subject').trigger('reset');    
        }   
    });

    // Create simple popup to add new user 
    dlg_new_user = $('#dialog-new-user').dialog({
        autoOpen: false,
        height: 300,
        width: 380,
        modal: true,
        buttons: {
            "Create": do_addUser,
            "Cancel": function() {
                dlg_new_user.dialog('close');
            }
        },
        close: function() {
            $('#frm-user').trigger('reset');    
        }   
    });

    // On user login, send credentials to server
    $('#frm-login').submit(function(event) {
        event.preventDefault();      // Do not send GET
        if (userName == '') do_login();
        else do_logout(); // button logout clicked.
        return false;
    });


    // On user message submission, send message to server
    $('#frm-message').submit(function(event) {
        event.preventDefault();      // Do not send GET
        do_sendMessage();
        return false;
    });

    // Open popup to create new subject
    $('#btn-subject').button().on('click', function() {
        ui_setPopupError(null);
        dlg_new_subject.dialog('open');
    });

    // Popup is submitted, so add subject
    $('#frm-subject').submit(function(event) {
        event.preventDefault();      // Do not send GET
        do_addSubject();
        return false;
    });

    // Open popup to create new subject
    $('#btn-user').button().on('click', function() {
        ui_setPopupError(null);
        dlg_new_user.dialog('open');
    });

    // Popup is submitted, so add subject
    $('#frm-user').submit(function(event){
        event.preventDefault();      // Do not send GET
        do_addUser();
        return false;
    });

    // Subject list effects
    // on click, ask for message list
    $('#sl').on('click', 'li', function() {
        var sid = $(this).data('idx');
        if (messageArea != null) {
            if (!messageArea.isPrivate && messageArea.toId == sid) return; // same
        }
        do_askMessageList(sid, $(this).text(), false);
    });

    $('#sl').on('mouseenter', 'li', function() {
        $(this).addClass('cls-li-mouseover');
    });


    $('#sl').on('mouseleave', 'li', function() {
        $(this).removeClass('cls-li-mouseover');
    });

    // User list effects
    // on click ask for message list
    $('#ul').on('click', 'li', function() {
        if (userName == '') return;
        var toId = $(this).text();
        if (messageArea != null) {
            if (messageArea.isPrivate && messageArea.toId == toId) return; // same
        }
        do_askMessageList (toId, toId, true);
    });

    $('#ul').on('mouseenter', 'li', function() {
        if (userName == '') return;
        $(this).addClass('cls-li-mouseover');
    });

    $('#ul').on('mouseleave', 'li', function() {
        if (userName == '') return;
        $(this).removeClass('cls-li-mouseover');
    });

    // When user/password fields receive focus, remove/hide login error mini-popup
    $('#tbl-user :input').focus(function () {
        ui_setLoginError(null);
    });

    // update UI to reflect wheter user is initially connected
    ui_setUserConnected(userName); 

    // Ask for dynamic data. We need DOM to be ready and all DOM listerners installed
    socket.emit('get subject list');
    socket.emit('get user list');
});