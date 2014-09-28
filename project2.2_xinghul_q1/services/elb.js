var request = require('request');
var sleep = require('sleep');

var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
var elb = new AWS.ELB();

exports.createELB = function () {
  var params = {
    Listeners: [ /* required */
      {
        InstancePort: 80, /* required */
        LoadBalancerPort: 80, /* required */
        Protocol: 'HTTP', /* required */
        InstanceProtocol: 'HTTP',
      },
      /* more items */
    ],
    LoadBalancerName: 'ELB-test', /* required */
    AvailabilityZones: [
      'us-east-1c', 
      'us-east-1b', 
      'us-east-1a'
    ],
    Scheme: 'internet-facing',
    SecurityGroups: [
      'sg-d3b29db6',
      /* more items */
    ],
    Tags: [
      {
        Key: 'Project', /* required */
        Value: '2.2'
      },
      /* more items */
    ]
  };
  elb.createLoadBalancer(params, function(err, data) {
    if (err) 
      console.log(err, err.stack); // an error occurred
    else  {
      console.log(data);
      params = {
        HealthCheck: { /* required */
          HealthyThreshold: 10, /* required */
          Interval: 30, /* required */
          Target: 'HTTP:80/heartbeat?username=xinghul', /* required */
          Timeout: 5, /* required */
          UnhealthyThreshold: 2 /* required */
        },
        LoadBalancerName: 'ELB-test' /* required */
      };
      elb.configureHealthCheck(params, function(err, data) {
        if (err) 
          console.log(err, err.stack); // an error occurred
        else     
          console.log(data);           // successful response
      });
    }
  });
};

exports.describeELB = function () {
  var params = {
    LoadBalancerNames: [
      'ELB-test'
    ],
  };
  elb.describeLoadBalancers(params, function(err, data) {
    if (err) 
      console.log(err, err.stack); // an error occurred
    else     
      console.log(data.LoadBalancerDescriptions[0]);           // successful response
  });
}