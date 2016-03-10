var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var config = require('./config.js');

var visitorsData = {};

app.set('port', (process.env.PORT || 5000));

app.use(express.static(path.join(__dirname, 'public/')));

app.get(/\/(about|contact)?$/, function(req, res) {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/dashboard', function(req, res) {
  res.sendFile(path.join(__dirname, 'views/dashboard.html'));
});

io.on('connection', function(socket) {

  if (socket.handshake.headers.host === config.host
    && socket.handshake.headers.referer.indexOf(config.host + config.dashboardEndpoint) > -1) {

    io.emit('visitor-data', {
      pages: computePageCounts(),
      referrers: computeRefererCounts(),
      activeUsers: getActiveUsers()
    });

  }

  socket.on('visitor-data', function(data) {
    visitorsData[socket.id] = data;

    io.emit('visitor-data', {
      pages: computePageCounts(),
      referrers: computeRefererCounts(),
      activeUsers: getActiveUsers()
    });

  });

  socket.on('disconnect', function() {
    delete visitorsData[socket.id];

    io.emit('exit', {
      pages: computePageCounts(),
      referrers: computeRefererCounts(),
      activeUsers: getActiveUsers()
    });

  });
});

function getActiveUsers() {
  return Object.keys(visitorsData).length;
}

function computeRefererCounts() {
  var referrerCounts = {};
  for (var key in visitorsData) {
    var referringSite = visitorsData[key].referringSite || '(direct)';
    if (referringSite in referrerCounts) {
      referrerCounts[referringSite]++;
    } else {
      referrerCounts[referringSite] = 1;
    }
  }
  return referrerCounts;
}

function computePageCounts() {
  var pageCounts = {};
  for (var key in visitorsData) {
    var page = visitorsData[key].page;
    if (page in pageCounts) {
      pageCounts[page]++;
    } else {
      pageCounts[page] = 1;
    }
  }
  return pageCounts;
}


http.listen(app.get('port'), function() {
  console.log('listening on *:' + app.get('port'));
});
