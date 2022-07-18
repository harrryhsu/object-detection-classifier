var Mpeg1Muxer, STREAM_MAGIC_BYTES, VideoStream, events, util, ws;

ws = require("ws");

util = require("util");

events = require("events");

Mpeg1Muxer = require("./mpeg1muxer");

http = require("http");

STREAM_MAGIC_BYTES = "jsmp"; // Must be 4 bytes

VideoStream = function (options) {
  this.options = options;
  this.name = options.name;
  this.streamUrl = options.streamUrl;
  this.width = options.width;
  this.height = options.height;
  this.wsPort = options.wsPort;
  this.inputStreamStarted = false;
  this.stream = undefined;
  this.wsServer = options.wsServer;
  this.path = options.path;
  this.stdio = options.stdio;
  this.lastUpdated = Date.now();
  this.pipeStreamToSocketServer();
  return this;
};

util.inherits(VideoStream, events.EventEmitter);

VideoStream.prototype.kill = function () {
  this.stop();
  this.removeAllListeners();
  return this;
};

VideoStream.prototype.stop = function () {
  if (!this.inputStreamStarted) return;
  console.log(`${this.name}: Stopping stream`);
  this.stream?.kill();
  this.stream?.removeAllListeners();
  this.mpeg1Muxer.removeAllListeners();
  this.inputStreamStarted = false;
  this.emit("stop");
  return this;
};

VideoStream.prototype.validate = function () {
  const handle = setInterval(() => {
    if (Date.now() - this.lastUpdated > 10000 && this.inputStreamStarted) {
      console.log(`${this.name}: ffmpeg timeout, exiting...`);
      this.emit("exit");
      this.stop();
      this.start();
    }
  }, 10000);

  this.on("stop", () => clearInterval(handle));
};

VideoStream.prototype.start = function () {
  if (this.inputStreamStarted) return;
  console.log(`${this.name}: Starting stream`);
  var gettingInputData, gettingOutputData, inputData, outputData;
  this.mpeg1Muxer = new Mpeg1Muxer({
    ffmpegOptions: this.options.ffmpegOptions,
    url: this.streamUrl,
    ffmpegPath:
      this.options.ffmpegPath == undefined ? "ffmpeg" : this.options.ffmpegPath,
  });
  this.stream = this.mpeg1Muxer.stream;
  this.mpeg1Muxer.on("mpeg1data", (data) => {
    return this.emit("camdata", data);
  });
  gettingInputData = false;
  inputData = [];
  gettingOutputData = false;
  outputData = [];
  this.mpeg1Muxer.on("ffmpegStderr", (data) => {
    var size;
    data = data.toString();
    if (data.indexOf("Input #") !== -1) {
      gettingInputData = true;
    }
    if (data.indexOf("Output #") !== -1) {
      gettingInputData = false;
      gettingOutputData = true;
    }
    if (data.indexOf("frame") === 0) {
      gettingOutputData = false;
    }
    if (gettingInputData) {
      inputData.push(data.toString());
      size = data.match(/\d+x\d+/);
      if (size != null) {
        size = size[0].split("x");
        if (this.width == null) {
          this.width = parseInt(size[0], 10);
        }
        if (this.height == null) {
          return (this.height = parseInt(size[1], 10));
        }
      }
    }
  });
  if (this.stdio) {
    this.mpeg1Muxer.on("ffmpegStderr", function (data) {
      return global.process.stderr.write(data);
    });
  }
  this.mpeg1Muxer.on("exit", () => {
    this.inputStreamStarted = false;
    return this.emit("exit");
  });
  this.inputStreamStarted = true;
  this.validate();
  return this;
};

VideoStream.prototype.pipeStreamToSocketServer = function () {
  this.wsServer.on("connection", (socket, request) => {
    if (request.url.startsWith(this.path)) {
      socket.url = request.url;
      return this.onSocketConnect(socket, request);
    }
  });

  return this.on("camdata", (data) => {
    this.lastUpdated = Date.now();
    return this.wsServer.broadcast(data, this.path);
  });
};

VideoStream.prototype.onSocketConnect = function (socket, request) {
  var streamHeader;
  // Send magic bytes and video size to the newly connected socket
  // struct { char magic[4]; unsigned short width, height;}
  streamHeader = new Buffer(8);
  streamHeader.write(STREAM_MAGIC_BYTES);
  streamHeader.writeUInt16BE(this.width, 4);
  streamHeader.writeUInt16BE(this.height, 6);
  socket.send(streamHeader, {
    binary: true,
  });

  socket.remoteAddress = request.connection.remoteAddress;
};

module.exports = VideoStream;
