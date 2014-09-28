require('dotenv').load();
var ec2 = require('./services/ec2');
var autoscaling = require('./services/autoscaling');
var cloudwatch = require('./services/cloudwatch');
var elb = require('./services/elb');
var sleep = require('sleep');
var request = require('request');
var fs = require('fs');

var generatorDNS = null;
var dataDNS = [];
var testId = 'levi';
var elbDNS = "ELB-levi-1450627284.us-east-1.elb.amazonaws.com";

elb.createELB();

// cloudwatch.describeAlarms();
// autoscaling.describePolicies();
autoscaling.launchConfiguration(autoscaling.createAutoscalingGroup);
var warmUpTimes = 1;
//launch Load Generator
console.log("Launching Load Generator...");
ec2.launch('ami-562d853e', 'Load Generator', function (dns1) {
    console.log("Load Generator", dns1);
    generatorDNS = dns1;
    warmUp();
});
// warmUp();
// startPhase2();

function warmUp() {
    console.log("warm up " + warmUpTimes);
    request('http://' + generatorDNS + '/warmup?dns=' + elbDNS + '&testId=' + testId, function (err, res, body) {
        if (err)
            console.log(err, err.stack);
        else {
            sleep.sleep(305);
            if (warmUpTimes -- > 1) {
                warmUp();
            }
            else {
                startPhase2();
            }
        }
    });
}

function startPhase2() {
    console.log("start test...");
    request('http://' + generatorDNS + '/begin-phase-2?dns=' + elbDNS + '&testId=' + testId, function (err, res, body) {
        if (err)
            console.log(err, err.stack);
        else
            checkStatus();
    });
}

function checkStatus() {
    console.log("=======================checking status start========================");
    request('http://' + generatorDNS + '/view-logs?name=result_xinghul_' + testId + '.txt', function (err, res, body) {
        console.log(body);
        console.log("=======================checking status end========================");
        console.log("Waiting for next check...");
        sleep.sleep(60);
        checkStatus();
    });
}

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





