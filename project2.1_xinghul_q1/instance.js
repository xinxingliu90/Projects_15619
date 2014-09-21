require('dotenv').load();
var request = require('request');
var sleep = require('sleep');

var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';

var ec2 = new AWS.EC2();

// launch the instance
exports.launch = function (imageId, instanceName, __next) {
    var params = {
        ImageId: imageId, 
        InstanceType: process.env.INSTANCE_TYPE,
        MinCount: 1, 
        MaxCount: 1,
        KeyName: process.env.KEY_NAME,
        SecurityGroups: [process.env.SECURITY_GROUP_NAME]
    };
    ec2.runInstances(params, function (err, data) {

        console.log("Using " + imageId + " to launch instance.");
        if (err) { 
            console.log("Could not launch instance", err); 
            return; 
        }

        var instanceId = data.Instances[0].InstanceId;
        console.log("Created instance", instanceId);

        // Add tags to the instance
        params = {
            Resources: [instanceId], 
            Tags: [
                {Key: 'Project', Value: '2.1'},
                {Key: 'Name', Value: instanceName}
            ]
        };
        ec2.createTags(params, function (err) {
            console.log("Tagging instance " + instanceId, err ? "failure" : "success");
            if (!err) {
                console.log("Waiting for instance " + instanceId, "to start running...")
                statusCheck(instanceId, function () {
                    activate(instanceId, function (dns) {
                        __next(dns);
                    });
                });
            }
        });
        
    });
};

function statusCheck (instanceId, __next) {
    var param = {
        InstanceIds: [
            instanceId
        ],
    };
    ec2.describeInstanceStatus(param, function (err, data) {
        if (err)
            console.log(err, err.stack);
        else {
            if (data.InstanceStatuses[0] == undefined || 
                data.InstanceStatuses[0].InstanceStatus.Status !== "ok") {
                sleep.sleep(10);
                statusCheck(instanceId, __next);
            }
            else {
                console.log("done.")
                return __next();
            }
        }
    });  
}

function activate (instanceId, __next) {
    console.log("Activating instance", instanceId);
    var param = {
        InstanceIds: [
            instanceId
        ],
    };
    ec2.describeInstances(param, function (err, data) {
        if (err)
            console.log(err, err.stack);
        else {
            var dns = data.Reservations[0].Instances[0].PublicDnsName;
            if ([undefined, null].indexOf(dns) == -1) {
                request('http://' + dns + '/username?username=xinghul', function (err, res, body) {
                    if (err) {
                        console.log(err, err.stack);
                    }
                    else {
                        console.log("Activated by xinghul:", dns);
                        __next(dns);
                    }
                });
            }
        }
    });
};
