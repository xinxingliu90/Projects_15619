(function () {
    require('dotenv').load();
    var sleep = require('sleep');
    var request = require('request');
    var fs = require('fs');
    var Q = require('q');

    var ec2 = require('./services/ec2');
    var autoscaling = require('./services/autoscaling');
    var cloudwatch = require('./services/cloudwatch');
    var elb = require('./services/elb');

    var generatorDNS = null;
    var elbDNS = null;
    var testId = 'levi';

    Q.all([ec2.createInstance('ami-562d853e', 'Load Generator'), elb.createELB(), autoscaling.createASG()])
    .then(function (dns_result) {
        generatorDNS = dns_result[0];
        elbDNS = dns_result[1];
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
    