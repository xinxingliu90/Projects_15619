var request = require('request');
var sleep = require('sleep');

var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';

var cloudwatch = new AWS.CloudWatch();

exports.addAlarmHighNetworkIn = function(policyARN) {
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
            Value: 'ASG-levi' /* required */
        }
        ]
    };
    cloudwatch.putMetricAlarm(params, function(err, data) {
        if (err) 
            console.log(err, err.stack);
        else {
            console.log("successfully created alarm of high Network in:");
            console.log(data); 
        }
    });
};

exports.addAlarmLowNetworkIn = function(policyARN) {
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
            Value: 'ASG-levi' /* required */
        }
        ]
    };
    cloudwatch.putMetricAlarm(params, function(err, data) {
        if (err) 
            console.log(err, err.stack);
        else {
            console.log("successfully created alarm of low Network in:");
            console.log(data); 
        }
    });
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

