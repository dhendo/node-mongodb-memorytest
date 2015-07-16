var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var logStats = function () {
    console.log("\n\n")




    var current = process.memoryUsage();

    var rss = current.rss;
    var heap = current.heapTotal;
    var delta = rss - initialMem;
    var heapdelta = delta - initialHeap;
    console.log((i / 1000).toFixed(2) + "k Collections")
    console.log((heap / (1024 * 1024)).toFixed(2) + "MB Heap");
    console.log((rss / (1024 * 1024)).toFixed(2) + "MB RSS");
    console.log("------------------");

    console.log((heapdelta / (1024 * 1024)).toFixed(2) + "MB Heap Delta");
    console.log((((heapdelta / (1024 * 1024)) * 1000) / i).toFixed(2) + "MB Heap / 1000 collections");
    console.log("------------------");
    console.log((delta / (1024 * 1024)).toFixed(2) + "MB RSS Delta");
    console.log((((delta / (1024 * 1024)) * 1000) / i).toFixed(2) + "MB RSS / 1000 collections");
    console.log("------------------");
    console.log(current);

};

var i = 0;
var shouldExit = false;

var collections = ["test1", "test2", "test3"];
var memwatch = require("memwatch");

var initialMem, initialHeap, hd;

var connection;
var connect = function () {
    MongoClient.connect("mongodb://127.0.0.1:27017/memorytest", function (err, conn) {
        hd = new memwatch.HeapDiff();


        // Take a baseline
        var memoryUsage = process.memoryUsage()
        initialMem = memoryUsage.rss;
        initialHeap = memoryUsage.heapTotal;
        connection = conn;

        // Now start getting collections
        runNext();
    });

};

function runNext() {
    if(i && i % 10000 === 0) {
        logStats();
    }

    if(i == 50000) {
        shouldExit = true;

        var diff = hd.end();
        console.log(require("util").inspect(diff, true, null));

        process.reallyExit();
    }
    if(!shouldExit) {
        var collName = collections.shift()
        i++;
        //console.log("Opening: " + collName);

        var db = connection.db("memorytests_" + collName);
        var coll = db.collection(collName);
        coll.insert({a: i}, function () {


            //console.log("Opened: " + collName);

            collections.push(collName);
            setTimeout(runNext, 0);
        });

    }
}

connect();

/*
 *
 * Shutdown Cleanup
 *
 */

var closeInterval = setInterval(function () {
    if(shouldExit) {

        clearInterval(closeInterval);
        // Now tear down the web connections
        console.log('Exiting...');
        process.reallyExit();
    }
}, 1000);

var shutdownRequested = function () {
    shouldExit = true;
};

process.on('SIGINT', shutdownRequested);
process.on('SIGTERM', shutdownRequested);
