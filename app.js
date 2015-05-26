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
    sres.contentType = 'json';
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
                sres.send(csvJSON(res.body));
                snext();
            });
        });
    });



});

//var csv is the CSV file with headers
function csvJSON(csv) {

    var lines = csv.split("\n");

    var result = [];

    // var headers = lines[0]='name';

    for (var i = 1; i < lines.length; i++) {
        var obj = {};
        var currentline = lines[i].split(",");
        if( currentline[0] == 'Gold Bullion'
        || currentline[0] == 'Silver Bullion'
        || currentline[0] == 'Platinum Bullion') {

            obj['name'] = currentline[0];
            obj['bid'] = currentline[4];
            obj['ask'] = currentline[6];
            result.push(obj);
        }


    }

    //return result; //JavaScript object
    return result; //JSON
}

var port = process.env.PORT || 8080;
server.listen(port, function() {
    console.log('%s listening at %s', server.name, server.url);
});
