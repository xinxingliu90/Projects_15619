require('dotenv').load();
var instance = require('./instance');
var sleep = require('sleep');
var request = require('request');
var fs = require('fs');

var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';

var ec2 = new AWS.EC2();

var generatorDNS = null;
var dataDNS = [];
var testId = 'levi';

//launch Load Generator
console.log("Launching Load Generator...");
instance.launch('ami-1810b270', 'Load Generator', function (dns1) {
    console.log("Load Generator", dns1);
    generatorDNS = dns1;

    console.log("Launching Data Center...");
    instance.launch('ami-324ae85a', 'Data Center', function (dns2) {
        console.log("Data Center", dns2);
        dataDNS.push(dns2);
        request('http://' + generatorDNS + '/part/one/i/want/more?dns=' + dns2 + '&testId=' + testId, function (err, res, body) {
            if (err)
                console.log(err, err.stack);
            else {
                sleep.sleep(65);
                checkRPS();
            }
        });
    });
});

//launch Data Center


function checkRPS() {
    console.error("=======================checking RPS start========================");
    request('http://' + generatorDNS + '/view-logs?name=result_xinghul_' + testId + '.txt', function (err, res, body) {
        var sum = 0;
        dataDNS.forEach(function (dns) {
            var str = dns + ": Requests per second:";
            var rps = body.substring(body.lastIndexOf(str) + str.length);
            console.log(dns, parseFloat(rps));
            sum += parseFloat(rps);
        });
        console.log("sum", sum);
        if (sum < 3600) {
            console.warn("Needs more data centers.");
            instance.launch('ami-324ae85a', 'Data Center', function (dns) {
                dataDNS.push(dns);
                console.log("Registering", dns);
                request('http://' + generatorDNS + '/part/one/i/want/more?dns=' + dns + '&testId=' + testId, function (err, res, body) {
                    if (!err) {
                        console.log(dns, "has been registered on Load Generator!");
                        console.error("=======================checking RPS end========================");
                        console.warn("Waiting for next check...");
                        sleep.sleep(120);
                        checkRPS();
                    }
                });
            });
        }
        else {
            console.warn("Goal reached with sum", sum);
            console.warn("Here's the full log:");
            console.log(body);
            fs.writeFile("result", body, function (err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("The file was saved!");
                }
            }); 
        }
    });
}





