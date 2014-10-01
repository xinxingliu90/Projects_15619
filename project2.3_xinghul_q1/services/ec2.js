(function () {
    var request = require('request');
    var Q = require('q');

    var AWS = require('aws-sdk');
    AWS.config.region = 'us-east-1';

    var ec2 = new AWS.EC2();

    exports.createInstance = function (imageId, instanceName) {
        return runInstance(imageId, instanceName)
            .then(function (instanceId) {
                return tagInstance(instanceId, instanceName);
            })
            .then(function (instanceId) {
                return activateInstance(instanceId);
            });
    };
    function runInstance (imageId, instanceName) {
        console.log("Using " + imageId + " to launch instance", instanceName);
        var deferred = Q.defer();
        var params = {
            ImageId: imageId, 
            InstanceType: process.env.INSTANCE_TYPE,
            MinCount: 1, 
            MaxCount: 1,
            KeyName: process.env.KEY_NAME,
            SecurityGroups: [process.env.SECURITY_GROUP_NAME]
        };
        ec2.runInstances(params, function (err, data) {
            if (err) { 
                deferred.reject(err);
            }
            else {
                var instanceId = data.Instances[0].InstanceId;
                console.log("Instance created:", instanceId);
                deferred.resolve(instanceId);
            }
        });
        return deferred.promise;
    };

    function tagInstance (instanceId, instanceName) {
        console.log("Tagging instance", instanceId);
        var deferred = Q.defer();
        params = {
            Resources: [instanceId], 
            Tags: [
                {Key: 'Project', Value: '2.2'},
                {Key: 'Name', Value: instanceName}
            ]
        };
        ec2.createTags(params, function (err) {
            if (err) {
                deferred.reject(err);
            }
            else {
                console.log("Waiting for instance " + instanceId, "to finish status check...");
                Q.delay(300000).then(function () {
                    deferred.resolve(instanceId);
                });
            }
        });
        return deferred.promise;
    };

    function activateInstance (instanceId) {
        console.log("Activating instance", instanceId);
        var deferred = Q.defer();
        var param = {
            InstanceIds: [
                instanceId
            ],
        };
        ec2.describeInstances(param, function (err, data) {
            if (err)
                deferred.reject(err);
            else {
                var dns = data.Reservations[0].Instances[0].PublicDnsName;
                if ([undefined, null].indexOf(dns) == -1) {
                    request('http://' + dns + '/username?username=xinghul', function (err, res, body) {
                        if (err) {
                            console.log(err, err.stack);
                        }
                        else {
                            console.log("Activated:", body);
                            deferred.resolve(dns);
                        }
                    });
                }
            }
        });
        return deferred.promise;
    };
}());
    
