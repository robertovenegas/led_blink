'use strict';
var EtherPortClient = require("etherport-client").EtherPortClient;
const five = require('johnny-five');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
let led = null;
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res, next) {
  res.sendFile(__dirname + '/index.html')
});

var board = new five.Board({
  port: new EtherPortClient({
    host: "insert your module's ip_address", //insert module ip address
    port: 80
  }),
  timeout: 1e5,
  repl: false
});
board.on("ready", function() {
  console.log("chingon and connected!");
  // Initial state for the LED light
  let state = {
    red: 1, green: 1, blue: 1
  };

  // Map pins to digital inputs on the board
  led = new five.Led.RGB({
    pins: {
      red: 0,
      green: 1,
      blue: 2
    }
  });

  // Helper function to set the colors
  let setStateColor = function(state) {
    led.color({
      red: state.red,
      blue: state.blue,
      green: state.green
    });
};

  // Listen to the web socket connection
  io.on('connection', function(client) {
    client.on('join', function(handshake) {
      console.log(handshake);
    });

    // Set initial state
    setStateColor(state);

  // Every time a 'rgb' event is sent, listen to it and grab its new values for each individual colour
    client.on('rgb', function(data) {
      state.red = data.color === 'red' ? data.value : state.red;
      state.green = data.color === 'green' ? data.value : state.green;
      state.blue = data.color === 'blue' ? data.value : state.blue;

      // Set the new colors
      setStateColor(state);

      client.emit('rgb', data);
      client.broadcast.emit('rgb', data);
    });

    // Turn on the RGB LED
    led.on();
  });
});

const port = process.env.PORT || 80;

server.listen(port);
console.log(`Server listening on http://localhost:${port}`);