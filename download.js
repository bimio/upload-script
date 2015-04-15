var needle = require('needle');
var prompt = require('prompt');
var _ = require('lodash');
fs = require('fs');

var outputDir = process.argv[2];
var bimserver = process.argv[3];
var username = process.argv[4];
var password = process.argv[5];

var options = {
  json: true
};



var download = function(rev, token, colladaSerializer, callback) {
  console.log("start download", rev.oid);
  var downloadRevisionData = {
    "token": token,
    "request": {
      "interface": "Bimsie1ServiceInterface",
      "method": "download",
      "parameters": {
        "roid": rev.oid,
        "serializerOid": colladaSerializer.oid,
        "showOwn": "false",
        "sync": "false"
      }
    }
  };
  
  // Download revision
  needle.post(bimserver + '/json', downloadRevisionData, options, function(err, resp) {
    if (err) {
      console.log(err);
      console.log(rev.oid);
      return
    }
    var downloadResult = resp.body.response.result

    var downloadResultData = {
      "token": token,
      "request":{
        "interface": "Bimsie1ServiceInterface",
        "method": "getDownloadData",
        "parameters": { "actionId": downloadResult }
      }
    };

    needle.post(bimserver + '/json', downloadResultData, options, function(err, resp) {
      var fileData = resp.body.response.result.file;
      var fileString = new Buffer(fileData, 'base64');

      fs.writeFile(outputDir + '/' + rev.oid + '.dae', fileString, function(err) {
        if (err) throw err;
        console.log('saved', rev.oid);
        callback();
      });
    });
  });
};


//

//prompt.get(['username', 'password'], function (err, result) {
  
  var loginData = { 
    "request": {
      "interface": "Bimsie1AuthInterface", 
      "method": "login", 
      "parameters": {
        "username": username,
        "password": password
      }
    }
  };

  // Log in
  needle.post(bimserver + '/json', loginData, options, function (err, resp) {
    var token = resp.body.response.result;
    console.log("token", token);

    var getProjectsData = {
      "token": token,
      "request": {
        "interface": "Bimsie1ServiceInterface", 
        "method": "getAllProjects", 
        "parameters": {
          "onlyTopLevel": "false",
          "onlyActive": "false"
        }
      }
    };

    // Get all projects
    needle.post(bimserver + '/json', getProjectsData, options, function(err, resp) {
      var projects = resp.body.response.result;


      projects.forEach(function(p, i) {
        console.log('[', i, '] ', p.name)
      })

      prompt.get(['project'], function(err, result) {
        var project = projects[result.project];

        var colladaSerializerData = { 
          "token": token,
          "request": {
            "interface": "Bimsie1ServiceInterface",
            "method": "getSerializerByContentType",
            "parameters": { "contentType": "application/collada" }
          }
        };

        // Get collada serializer
        needle.post(bimserver + '/json', colladaSerializerData, options, function(err, resp) {
          var colladaSerializer = resp.body.response.result;  
          console.log("colladaSerializer", colladaSerializer);
          // check which revisions are already there

          fs.readdir(outputDir, function(err, files) {
            var existingRoids = files.map(function(f) { return parseInt(f.split(".")[0], 10); });

            var getAllRevisionsData = {
              "token": token,
              "request": {
                "interface": "Bimsie1ServiceInterface",
                "method": "getAllRevisionsOfProject",
                "parameters": { "poid": project.oid}
              }
            };

            needle.post(bimserver + '/json', getAllRevisionsData, options, function(err, resp) {
              var revisions = resp.body.response.result;
              
              var toDownload = revisions.filter(function(rev) {
                return existingRoids.indexOf(parseInt(rev.oid, 10)) === -1;
                //return !(parseInt(rev.oid, 10) in existingRoids);
              });


              console.log(existingRoids.length, ' existing revisions found');
              console.log(existingRoids.join());
              console.log();

              console.log(revisions.length, ' revisions on bimserver found');
              console.log(revisions.map(function(r) { return r.oid }).join());

              console.log(revisions.length, ' revisions to download');
              console.log(toDownload.map(function(r) { return r.oid }).join());

              var downloadfunctions = [];

              var success = function() {
                console.log("hoera klaar");
              };

              console.log(toDownload.length)
              var downloadfn = function(n) {
                console.log(n);
                if ((n+1) === toDownload.length) {
                  return function() { download(toDownload[n], token, colladaSerializer, success) };
                } else {
                  return function() { download(toDownload[n], token, colladaSerializer, downloadfn(n+1)) } ;
                }
              }

              downloadfn(0)();
            });
          });
        });
      });
    });
  });
//});