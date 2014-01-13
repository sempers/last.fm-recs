/**
 * Module dependencies
 */

var express = require('express'), routes = require('./routes'), api = require('./routes/api'), http = require('http'), path = require('path'), ejs = require('ejs');

var app = module.exports = express();

/**
 * Configuration
 */

// all environments
app.engine('html', ejs.renderFile);
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/public/views');
app.set('view engine', 'ejs');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// development only
if (app.get('env') === 'development') {
    app.use(express.errorHandler());
}

// production only
if (app.get('env') === 'production') {
    // TODO
}

// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);

// JSON API
app.get('/api/tags/:name', api.tags);
app.get('/api/sk', api.sk);
app.get('/api/name', api.name);
app.get('/api/recs', api.recs);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);

/**
 * Start Server
 */

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
