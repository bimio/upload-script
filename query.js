var needle = require('needle');
var prompt = require('prompt');
var _ = require('lodash');
fs = require('fs');

var type = process.argsv[2];
var bimserver = process.argv[3];
var username = process.argv[4];
var password = process.argv[5];


var options = {
  json: true
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
      console.log(resp.body.response)

      projects.forEach(function(p, i) {
        console.log('[', i, '] ', p.name)
      })

      prompt.get(['project'], function(err, result) {
        var project = projects[result.project];

        var ifcSerializerData = { 
          "token": token,
          "request": {
            "interface": "Bimsie1ServiceInterface",
            "method": "getSerializerByContentType",
            "parameters": { "contentType": "application/ifc" }
          }
        };

        // Get ifc deserializer
        needle.post(bimserver + '/json', ifcSerializerData, options, function(err, resp) {
          var ifcSerializer = resp.body.response.result;

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
            var latestRev = revisions[revisions.length-1];

            var getQueryEngineData = {
              "token": token,
              "request": {
                "interface": "Bimsie1ServiceInterface",
                "method": "getQueryEngineByName",
                "parameters": { "name": "BimQL Engine Geometry"}
              }
            };

            needle.post(bimserver + '/json', getQueryEngineData, options, function(err, resp) {
              var queryEngine = resp.body.response.result;
              var downloadQueryData = {
                "token": token,
                "request": {
                  "interface": "Bimsie1ServiceInterface",
                  "method": "downloadQuery",
                  "parameters": { 
                    "roid": latestRev.oid,
                    "qeid": queryEngine.oid,
                    "code": "Select $Var1 Where $Var1.EntityType = " + type,
                    "sync": "true",
                    "serializerOid": ifcSerializer.oid
                  }
                }
              };

              needle.post(bimserver + '/json', downloadQueryData, options, function(err, resp) {
                var actionId = resp.body.response.result;
                var getDownloadDataData = {
                  "token": token,
                  "request": {
                    "interface": "Bimsie1ServiceInterface",
                    "method": "getDownloadData",
                    "parameters": { "actionId": actionId}
                  }
                };

                needle.post(bimserver + '/json', getDownloadDataData, options, function(err, resp) {
                  var file = resp.body.response.result.file;
                  var fileString = new Buffer(file, 'base64').toString('binary');
                  console.log(fileString);
                });
              });
            });
          });
        });
      });
    });
  });
//});