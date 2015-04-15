var needle = require('needle');

var projectName = process.argv[2];
var bimserver = process.argv[3];
var username = process.argv[4];
var password = process.argv[5];

var options = {
  json: true
};


//

//prompt.get(['username', 'password'], function (err, result) {
  
  // log in

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

  needle.post(bimserver + '/json', loginData, options, function (err, resp) {
    if (err) {
      console.log(err)
    }
    var token = resp.body.response.result;
    var createProjectData = {
      "token": token,
      "request": {
        "interface": "Bimsie1ServiceInterface", 
        "method": "addProject", 
        "parameters": {
          "projectName": projectName,
          "schema": "ifc2x3tc1"
        }
      }
    };
    console.log("logged in", resp.body)

    needle.post(bimserver + '/json', createProjectData, options, function(err, resp) {
      console.log(resp.body)
    });
  });
//});