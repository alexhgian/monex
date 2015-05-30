var restify = require('restify');
var assert = require('assert');
var cheerio = require('cheerio');

// Creates a client for monex.com
var client = restify.createClient({
    url: 'http://www.monex.com'
});

// Creates a client for jmbullion 3rd party service
var client2 = restify.createClient({
    url: 'http://integration.nfusionsolutions.biz'
});

// Create our server so we can access the processed data
var server = restify.createServer();

//Allow Cross Origin Requests
server.use(restify.CORS());
server.use( function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
});


// Scrapper for JMBullion
// Returns an array with 4 objects
// Gold, Silver, Platinum and Bitcoin
server.get('/jm', function(sreq, sres, snext){
    sres.contentType = 'json';
    client2.get('/client/jmbullion/module/largehistoricalchart2/nflargehist?metal=gold&xdm_e=http%3A%2F%2Fwww.jmbullion.com&xdm_c=default4389&xdm_p=1', function(err, req) {
        assert.ifError(err); // connection error

        req.on('result', function(err, res) {
            assert.ifError(err); // HTTP status code >= 400

            res.body = '';
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                res.body += chunk;
            });

            res.on('end', function() {
                var tmp = [];

                // Create a javascript DOM since node doesn't have one
                var $ = cheerio.load(res.body);
                var metals = $('.metals');

                // Loop through each li element which contains the data we need
                metals.children('li').each(function(i, elem){
                    // Parse the string into a proper JSON object
                    var parsedMetal = JSON.parse($(this).attr('data-quote'));
                    console.log(parsedMetal);
                    tmp.push(parsedMetal);
                });

                // Send it out to our app to use
                sres.send(tmp);
                snext();
            });
        });
    });
});


// Monex.com which returns a CSV file named .dat which has live bidding prices
server.get('/mx', function(sreq, sres, snext){
    sres.contentType = 'json';
    client.get('/data/pricefile.dat?_='+Date.now(), function(err, req) {
        assert.ifError(err); // connection error

        req.on('result', function(err, res) {
            assert.ifError(err); // HTTP status code >= 400

            res.body = '';
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                res.body += chunk;
            });

            res.on('end', function() {
                sres.send(csvJSON(res.body));
                snext();
            });
        });
    });
});

//CSV to JSON used in the monex scrapper
function csvJSON(csv) {

    var lines = csv.split("\n");

    var result = [];

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
    return result; //JSON
}

// Start the server
var port = process.env.PORT || 8080;
server.listen(port, function() {
    console.log('%s listening at %s', server.name, server.url);
});
