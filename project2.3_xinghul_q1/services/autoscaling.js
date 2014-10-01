(function () {
    var request = require('request');
    var Q = require('q');
    var cloudwatch = require('./cloudwatch');

    var AWS = require('aws-sdk');
    AWS.config.region = 'us-east-1';

    var autoscaling = new AWS.AutoScaling();

    exports.createASG = function () {
        return launchConfiguration()
        .then(createAutoscalingGroup)
        .then(function () {
            return addPolicy('Increase Group Size', 2, 150);
        })
            .then(function (policyARN) {
                cloudwatch.addAlarmHighNetworkIn(policyARN);
            })
        .then(function () {
            return addPolicy('Decrease Group Size', -2, 60);
        })
            .then(function (policyARN) {
                cloudwatch.addAlarmLowNetworkIn(policyARN);
            });
    };

    var launchConfiguration = function () {
        console.log("Create Launch Configuration starts...");
        var deferred = Q.defer();
        var params = {
            LaunchConfigurationName: process.env.LAUNCH_CONFIGURARION_NAME,
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
            InstanceType: process.env.INSTANCE_TYPE,
            KeyName: process.env.KEY_NAME,
            SecurityGroups: [
                process.env.SECURITY_GROUP_ID,
            ]
        };
        autoscaling.createLaunchConfiguration(params, function (err, data) {
            if (err) 
                console.log(err, err.stack); // an error occurred
            else {
                console.log("Successfully created Launch Configuration.");
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    var describeConfiguration = function () {
        var params = {
            LaunchConfigurationNames: [
                LAUNCH_CONFIGURARION_NAME
            ]
        };
        autoscaling.describeLaunchConfigurations(params, function(err, data) {
            if (err) 
                console.log(err, err.stack); // an error occurred
            else     
                console.log(data.LaunchConfigurations);           // successful response
        });
    };

    var createAutoscalingGroup = function () {
        console.log("Create ASG starts...");
        var deferred = Q.defer();
        var params = {
            AutoScalingGroupName: process.env.ASG_NAME,
            MaxSize: 5, /* required */
            MinSize: 0, /* required */
            DesiredCapacity: 0,
            AvailabilityZones: [
                // 'us-east-1b', 
                'us-east-1a',
                // 'us-east-1c'
            ],
            DefaultCooldown: 300,
            HealthCheckGracePeriod: 60,
            HealthCheckType: 'ELB',
            LaunchConfigurationName: process.env.LAUNCH_CONFIGURARION_NAME,
            LoadBalancerNames: [
                process.env.ELB_NAME,
            ],
            Tags: [
            { 
                ResourceId: process.env.ASG_NAME,
                Key: 'Project',
                Value: '2.3',
                PropagateAtLaunch: true 
            }
            ],
        };
        autoscaling.createAutoScalingGroup(params, function(err, data) {
            if (err) 
                console.log(err, err.stack); // an error occurred
            else  {
                console.log("Successfully created ASG.");
                console.log("Configuring Metrics for ASG starts...");
                var params = {
                    AutoScalingGroupName: process.env.ASG_NAME, /* required */
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
                        console.log("Successfully configured Metrics for ASG.");
                        deferred.resolve();
                    }
                });
                // addPolicy('Increase Group Size', 2, 150, cloudwatch.addAlarmHighNetworkIn);
                // addPolicy('Decrease Group Size', -2, 60, cloudwatch.addAlarmLowNetworkIn)
            }
        });
        return deferred.promise;
    };

    var addPolicy = function (policyName, scalingAdjustment, cooldown) {
        console.log("Adding policy " + policyName + " starts...");
        var deferred = Q.defer();
        var params = {
            AdjustmentType: 'ChangeInCapacity', /* required */
            AutoScalingGroupName: process.env.ASG_NAME, /* required */
            PolicyName: policyName, /* required */
            ScalingAdjustment: scalingAdjustment, /* required */
            Cooldown: cooldown
        };
        autoscaling.putScalingPolicy(params, function (err, data) {
            if (err) 
                console.log(err, err.stack); // an error occurred
            else {
                console.log("Successfully added policy " + policyName + ":", data.PolicyARN);
                deferred.resolve(data.PolicyARN);
            }
        });
        return deferred.promise;
    };

    exports.describeAutoscalingGroup = function () {
        var params = {
            AutoScalingGroupNames: [
                process.env.ASG_NAME
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
            AutoScalingGroupName: process.env.ASG_NAME
        };
        autoscaling.describePolicies(params, function(err, data) {
            if (err) 
                console.log(err, err.stack); // an error occurred
            else     
                console.log(data);           // successful response
        });
    }
}());
    



