var restify = require('restify');
var assert = require('assert');
// Creates a JSON client
var client = restify.createClient({
    url: 'http://www.monex.com'
});



var server = restify.createServer();

//Allow Cross Origin Requests
server.use(restify.CORS());
server.use( function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
});

server.get('/', function(sreq, sres, snext){
    sres.contentType = 'text';
    client.get('/data/pricefile.dat?_=1432600394468', function(err, req) {
        assert.ifError(err); // connection error

        req.on('result', function(err, res) {
            assert.ifError(err); // HTTP status code >= 400

            res.body = '';
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                res.body += chunk;
            });

            res.on('end', function() {
                console.log(res.body);
                sres.send(res.body);
                snext();
            });
        });
    });



});

var port = process.env.PORT || 8080;
server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);
});
