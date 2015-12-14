var Sync = require("../index.js");

var sync = new Sync({
  host: "hosted.datascope.reuters.com",
  port: "21",
  user: "r9008238",
  pass: "iwail_C18",
  debugMode: false
});

doSync("./inbound","./reports");
var counter=0;
function doSync(local,remote){
  sync.sync(local, remote).fail(function(err){console.log(err);}).done(function(result){
    console.log("Sleeping for 5000, and repeat. ",counter++);
    setTimeout(function(){doSync(local,remote);},99999);
  });
}
// sync.sync("./inbound", "./reports").fail(function(err){console.log(err);}).done(function(result){
//   console.log("done");
// });
