const express = require('express');
const app = express();
const http = require('http').createServer(app);
const setupSocketIO = require('./socket');
// const ContestRoutes = require('./router/contest')
// const ParticipantsRoutes = require('./router/participants')
// const ProfileRoutes = require('./router/profile')
// const auth = require('./router/auth')

// serve static files
app.use(express.static('public'));
// create a route
// app.use('/contest',ContestRoutes)
// app.use('/participants',ParticipantsRoutes)
// app.use('/profile',ProfileRoutes)
// app.use('/auth',auth)

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'))

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html')) // relative path
    })
}

app.get('/', (req, res) => {
res.send('server is listening')
});



// set up Socket.IO
setupSocketIO(http);

// start the server
const port = process.env.PORT || 5000;
http.listen(port, () => {
  console.log('listening on *:' + port);
});