(function () {
    var request = require('request');
    var sleep = require('sleep');
    var Q = require('q');

    var AWS = require('aws-sdk');
    AWS.config.region = 'us-east-1';

    var cloudwatch = new AWS.CloudWatch();

    exports.addAlarmHighNetworkIn = function(policyARN) {
        var deferred = Q.defer();
        var params = {
            AlarmName: 'levi-Alarm-high-Network-In', /* required */
            ComparisonOperator: 'GreaterThanOrEqualToThreshold', /* required */
            EvaluationPeriods: 1, /* required */
            MetricName: 'NetworkIn', /* required */
            Namespace: 'AWS/EC2', /* required */
            Period: 60, /* required */
            Statistic: 'Average', /* required */
            Threshold: 36000000, /* required */
            ActionsEnabled: true,
            AlarmActions: [
                policyARN
            ],
            AlarmDescription: 'alarm-high-network-in',
            Dimensions: [
            {
                Name: 'AutoScalingGroupName', /* required */
                Value: process.env.ASG_NAME
            }
            ]
        };
        cloudwatch.putMetricAlarm(params, function(err, data) {
            if (err) 
                console.log(err, err.stack);
            else {
                console.log("Successfully created alarm of high Network in.");
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    exports.addAlarmLowNetworkIn = function(policyARN) {
        var deferred = Q.defer();
        var params = {
            AlarmName: 'levi-Alarm-low-Network-In', /* required */
            ComparisonOperator: 'LessThanOrEqualToThreshold', /* required */
            EvaluationPeriods: 2, /* required */
            MetricName: 'NetworkIn', /* required */
            Namespace: 'AWS/EC2', /* required */
            Period: 60, /* required */
            Statistic: 'Average', /* required */
            Threshold: 28000000, /* required */
            ActionsEnabled: true,
            AlarmActions: [
                policyARN
            ],
            AlarmDescription: 'alarm-low-network-in',
            Dimensions: [
            {
                Name: 'AutoScalingGroupName', /* required */
                Value: process.env.ASG_NAME
            }
            ]
        };
        cloudwatch.putMetricAlarm(params, function(err, data) {
            if (err) 
                console.log(err, err.stack);
            else {
                console.log("Successfully created alarm of low Network in.");
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    exports.describeAlarms = function () {
        var params = {
        };
        cloudwatch.describeAlarms(params, function(err, data) {
            if (err) 
                console.log(err, err.stack); // an error occurred
            else {
                console.log(data);
            }
        })
    }
}());

    

