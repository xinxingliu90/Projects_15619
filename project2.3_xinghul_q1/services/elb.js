(function () {
  var request = require('request');
  var Q = require('q');

  var AWS = require('aws-sdk');
  AWS.config.region = 'us-east-1';
  var elb = new AWS.ELB();

  exports.createELB = function () {
    console.log("Create ELB starts...");
    var deferred = Q.defer();
    var dns = null;
    var params = {
      Listeners: [
        {
          InstancePort: 80,
          LoadBalancerPort: 80,
          Protocol: 'HTTP',
          InstanceProtocol: 'HTTP',
        },
      ],
      LoadBalancerName: process.env.ELB_NAME,
      AvailabilityZones: [
        // 'us-east-1c', 
        // 'us-east-1b', 
        'us-east-1a'
      ],
      Scheme: 'internet-facing',
      SecurityGroups: [
        process.env.SECURITY_GROUP_ID,
      ],
      Tags: [
        {
          Key: 'Project',
          Value: '2.3'
        },
      ]
    };
    elb.createLoadBalancer(params, function(err, data) {
      if (err) 
        console.log(err, err.stack); // an error occurred
      else  {
        dns = data.DNSName;
        console.log("Successfully created ELB with DNS:", dns);
        console.log("Configuring Health Check for ELB starts...");
        params = {
          HealthCheck: { /* required */
            HealthyThreshold: 10, /* required */
            Interval: 30, /* required */
            Target: 'HTTP:80/heartbeat?username=xinghul', /* required */
            Timeout: 5, /* required */
            UnhealthyThreshold: 2 /* required */
          },
          LoadBalancerName: process.env.ELB_NAME
        };
        elb.configureHealthCheck(params, function(err, data) {
          if (err) 
            console.log(err, err.stack); // an error occurred
          else {
            console.log("Successfully configured Health Check:", data.HealthCheck);
            deferred.resolve(dns);
          }
        });
      }
    });
    return deferred.promise;
  };

  exports.describeELB = function () {
    var params = {
      LoadBalancerNames: [
        ELB_NAME
      ],
    };
    elb.describeLoadBalancers(params, function(err, data) {
      if (err) 
        console.log(err, err.stack); // an error occurred
      else     
        console.log(data.LoadBalancerDescriptions[0]);           // successful response
    });
  }
}());
  