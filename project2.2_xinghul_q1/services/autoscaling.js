var request = require('request');
var sleep = require('sleep');
var cloudwatch = require('./cloudwatch');

var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';

var autoscaling = new AWS.AutoScaling();

exports.launchConfiguration = function (__next) {
    var params = {
        LaunchConfigurationName: 'ASG-Configuration-levi',
        BlockDeviceMappings :
        [ { 
            VirtualName: 'ephemeral0', 
            DeviceName: '/dev/sdb' 
        },
        { 
            DeviceName: '/dev/sda1',
            Ebs: 
            { 
                VolumeSize: 30, 
                VolumeType: 'gp2', 
                DeleteOnTermination: true 
            } 
        } ],
        EbsOptimized: false,
        ImageId: 'ami-ec14ba84',
        InstanceMonitoring: {
            Enabled: true
        },
        InstanceType: 'm3.medium',
        KeyName: 'project1',
        SecurityGroups: [
            'sg-d3b29db6',
        ]
    };
    autoscaling.createLaunchConfiguration(params, function (err, data) {
        if (err) 
            console.log(err, err.stack); // an error occurred
        else {
            console.log("successfully created launch configuration:");
            console.log(data);           // successful response
            __next(params.LaunchConfigurationName);
        }
    });
};

exports.describeConfiguration = function () {
    var params = {
        LaunchConfigurationNames: [
            'ASG-30sec',
            'ASG-Configuration-levi'
        /* more items */
        ]
    };
    autoscaling.describeLaunchConfigurations(params, function(err, data) {
        if (err) 
            console.log(err, err.stack); // an error occurred
        else     
            console.log(data.LaunchConfigurations);           // successful response
    });
};

exports.createAutoscalingGroup = function (configurationName) {
    var params = {
        AutoScalingGroupName: 'ASG-levi',
        MaxSize: 5, /* required */
        MinSize: 3, /* required */
        AvailabilityZones: [
            'us-east-1b', 
            'us-east-1a',
            'us-east-1c'
        ],
        DefaultCooldown: 300,
        // DesiredCapacity: 1,
        HealthCheckGracePeriod: 60,
        HealthCheckType: 'ELB',
        LaunchConfigurationName: configurationName,
        LoadBalancerNames: [
            'ELB-levi',
        ],
        Tags: [
        { 
            ResourceId: 'ASG-levi',
            Key: 'Project',
            Value: '2.2',
            PropagateAtLaunch: true 
        }
        /* more items */
        ],
        // VPCZoneIdentifier: 'subnet-9e7487c7'
    };
    autoscaling.createAutoScalingGroup(params, function(err, data) {
        if (err) 
            console.log(err, err.stack); // an error occurred
        else  {
            console.log("successfully created AutoScaling Group:");
            console.log(data);           // successful response
            var params = {
                AutoScalingGroupName: 'ASG-levi', /* required */
                Granularity: '1Minute', /* required */
                Metrics: [
                    'GroupPendingInstances', 
                    'GroupDesiredCapacity', 
                    'GroupMinSize', 
                    'GroupMaxSize', 
                    'GroupTerminatingInstances', 
                    'GroupInServiceInstances', 
                    'GroupTotalInstances'
                ]
            };
            autoscaling.enableMetricsCollection(params, function(err, data) {
                if (err) 
                    console.log(err, err.stack); // an error occurred
                else {
                    console.log("successfully added metrics:");
                    console.log(data);           // successful response
                }
            });
            addPolicy('Increase Group Size', 2, 150, cloudwatch.addAlarmHighNetworkIn);
            addPolicy('Decrease Group Size', -2, 60, cloudwatch.addAlarmLowNetworkIn)
        }
    });
};

var addPolicy = function (policyName, scalingAdjustment, cooldown, __next) {
    var params = {
        AdjustmentType: 'ChangeInCapacity', /* required */
        AutoScalingGroupName: 'ASG-levi', /* required */
        PolicyName: policyName, /* required */
        ScalingAdjustment: scalingAdjustment, /* required */
        Cooldown: cooldown
    };
    autoscaling.putScalingPolicy(params, function (err, data) {
        if (err) 
            console.log(err, err.stack); // an error occurred
        else {
            console.log("successfully added policy of " + policyName + ":");
            console.log(data); 
            __next(data.PolicyARN);
        }
    });
};

exports.describeAutoscalingGroup = function (asgName) {
    var params = {
        AutoScalingGroupNames: [
            'ASG-30sec-test'
        ]
    };
    autoscaling.describeAutoScalingGroups(params, function(err, data) {
        if (err) 
            console.log(err, err.stack); // an error occurred
        else     
            console.log(data.AutoScalingGroups[0]);           // successful response
    });
};

exports.describePolicies = function () {
    var params = {
        AutoScalingGroupName: 'ASG-levi'
    };
    autoscaling.describePolicies(params, function(err, data) {
        if (err) 
            console.log(err, err.stack); // an error occurred
        else     
            console.log(data);           // successful response
    });
}



