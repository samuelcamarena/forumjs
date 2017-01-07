#Forum JS#

This project is aimed to practice about distributed services and applications. It is a forum fully developed on javascript, as it provides the posibility to implements functionality, in a dynamic manner in both client and server side. The project is divided in three main sections: client side, web server and data server. 

##Development technologies:##

###Frontend:###
* HTML5
* CSS3
* jQuery, JQuery.ui
* Socket.io

###Backend (Web server):###
* Node.js
* Express4
* Socket.io
* Net
* 0MQ (update)

###Backend (Data server):###
* Node.js
* Net
* FS persistence
* 0MQ (update)

##Known Browser Support:##
* Chrome 55+
* Firefox 50+
* IE 11+

##Live demo project##
This project has been hosted at heroku to allow a quick review through a live demo.  
[forumjs live demo](http://website-samuelcamarena.herokuapp.com/forumjs/)

##Installation##
Forumjs uses Node.js/npm (this assumes you have Node.js/npm installed already):

`  git clone https://github.com/samuelcamarena/forumjs.git`  
`  cd forumjs/`  
`  npm install`  

##Usage##
In order to usage forumjs, you first need to start up the data server:  

`  node` [dmanager-server.js](https://github.com/samuelcamarena/forumjs/blob/master/dmanager-server.js)  

This starts the server at default connection parameters listenning at *Localhost:9000*.  
It also accepts connection paramaters host:port.  

`  node` [dmanager-server.js](https://github.com/samuelcamarena/forumjs/blob/master/dmanager-server.js)  127.0.0.1:5500

Next start up the web server:  

`  node` [forum-webserver.js](https://github.com/samuelcamarena/forumjs/blob/master/forum-webserver.js)  

This starts the http web server with a set of two default connection parameters:  
 - First parameter *Localhost:9000* to stablish connection with data server, this must match data server's host/port  
 - Second parameter *Localhost:10000* for client browser requests  

It also accepts 1 or 2 connection parameters: input *1 argument* to data server *host:port* or *2 arguments* to data server *host:port* and http *port*.

`  node` [forum-webserver.js](https://github.com/samuelcamarena/forumjs/blob/master/forum-webserver.js)  127.0.0.1:1100 5500