(function () {
    require('dotenv').load();
    var sleep = require('sleep');
    var request = require('request');
    var fs = require('fs');

    var ec2 = require('./services/ec2');
    var autoscaling = require('./services/autoscaling');
    var cloudwatch = require('./services/cloudwatch');
    var elb = require('./services/elb');

    var generatorDNS = null;
    var elbDNS = null;
    var testId = 'levi';


    ec2.launchInstance('ami-562d853e', 'Load Generator')
        .then(function (dns) {
            generatorDNS = dns;
        })
    .then(elb.createELB)
        .then(function (dns) {
            elbDNS = dns;
        })
    .then(autoscaling.launchConfiguration)
    .then(autoscaling.createAutoscalingGroup)
    .then(function () {
        return autoscaling.addPolicy('Increase Group Size', 2, 150);
    })
        .then(function (policyARN) {
            cloudwatch.addAlarmHighNetworkIn(policyARN);
        })
    .then(function () {
        return autoscaling.addPolicy('Decrease Group Size', -2, 60);
    })
        .then(function (policyARN) {
            cloudwatch.addAlarmLowNetworkIn(policyARN);
        })
    .then(function () {
        warmUp(1);
    });


    function warmUp(warmUpTimes) {
        if (warmUpTimes <= 0)
            startPhase2();
        console.log("warm up " + warmUpTimes);
        request('http://' + generatorDNS + '/warmup?dns=' + elbDNS + '&testId=' + testId, function (err, res, body) {
            if (err)
                console.log(err, err.stack);
            else {
                sleep.sleep(305);
                warmUp(-- warmUpTimes);
            }
        });
    };

    function startPhase2() {
        console.log("start test...");
        request('http://' + generatorDNS + '/begin-phase-2?dns=' + elbDNS + '&testId=' + testId, function (err, res, body) {
            if (err)
                console.log(err, err.stack);
            else
                checkStatus();
        });
    };

    function checkStatus() {
        console.log("=======================checking status start========================");
        request('http://' + generatorDNS + '/view-logs?name=result_xinghul_' + testId + '.txt', function (err, res, body) {
            console.log(body);
            console.log("=======================checking status end========================");
            console.log("Waiting for next check...");
            sleep.sleep(60);
            checkStatus();
        });
    };
}());
    