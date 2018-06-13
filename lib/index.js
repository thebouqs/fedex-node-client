/*

 Built by
   __                   ____
  / /___  ______  ___  / __/___  ____
 / __/ / / / __ \/ _ \/ /_/ __ \/ __ \
/ /_/ /_/ / /_/ /  __/ __/ /_/ / /_/ /
\__/\__, / .___/\___/_/  \____/\____/
 /____/_/
 */

var https = require('https');
var extend = require('extend');
var parser = require('xml2js');
var soap = require('soap');
var path = require('path');
var util = require('util');

function FedEx(args) {
  var $scope = this;
  $scope.hosts = {
    sandbox: 'https://wsbeta.fedex.com',
    live: 'https://ws.fedex.com'
  };
  var defaults = {
      imperial: true, // for inches/lbs, false for metric cm/kgs
      currency: 'USD',
      language: 'en-US',
      environment: 'sandbox',
      key: '',
      password: '',
      account_number: '',
      meter_number: '',
      debug: false,
      pretty: false,
      user_agent: 'uh-sem-blee, Co | typefoo'
    };
  $scope.service_types = {
    "PRIORITY_OVERNIGHT": "FedEx Priority Overnight",
    "PRIORITY_OVERNIGHT_SATURDAY_DELIVERY": "FedEx Priority Overnight Saturday Delivery",
    "FEDEX_2_DAY": "FedEx 2 Day",
    "FEDEX_2_DAY_AM": "FedEx 2 Day AM Delivery",
    "FEDEX_2_DAY_SATURDAY_DELIVERY": "FedEx 2 Day Saturday Delivery",
    "STANDARD_OVERNIGHT": "FedEx Standard Overnight",
    "FIRST_OVERNIGHT": "FedEx First Overnight",
    "FIRST_OVERNIGHT_SATURDAY_DELIVERY": "FedEx First Overnight Saturday Delivery",
    "FEDEX_EXPRESS_SAVER": "FedEx Express Saver",
    "FEDEX_1_DAY_FREIGHT": "FedEx 1 Day Freight",
    "FEDEX_1_DAY_FREIGHT_SATURDAY_DELIVERY": "FedEx 1 Day Freight Saturday Delivery",
    "FEDEX_2_DAY_FREIGHT": "FedEx 2 Day Freight",
    "FEDEX_2_DAY_FREIGHT_SATURDAY_DELIVERY": "FedEx 2 Day Freight Saturday Delivery",
    "FEDEX_3_DAY_FREIGHT": "FedEx 3 Day Freight",
    "FEDEX_3_DAY_FREIGHT_SATURDAY_DELIVERY": "FedEx 3 Day Freight Saturday Delivery",
    "INTERNATIONAL_PRIORITY": "FedEx International Priority",
    "INTERNATIONAL_PRIORITY_SATURDAY_DELIVERY": "FedEx International Priority Saturday Delivery",
    "INTERNATIONAL_ECONOMY": "FedEx International Economy",
    "INTERNATIONAL_FIRST": "FedEx International First",
    "INTERNATIONAL_PRIORITY_FREIGHT": "FedEx International Priority Freight",
    "INTERNATIONAL_ECONOMY_FREIGHT": "FedEx International Economy Freight",
    "GROUND_HOME_DELIVERY": "FedEx Ground Home Delivery",
    "FEDEX_GROUND": "FedEx Ground",
    "INTERNATIONAL_GROUND": "FedEx International Ground",
    "SMART_POST": "FedEx SmartPost",
    "FEDEX_FREIGHT_PRIORITY": "FedEx Freight Priority",
    "FEDEX_FREIGHT_ECONOMY": "FedEx Freight Economy"
  };

  $scope.config = function(args) {
    $scope.options = extend(defaults, args);
    return $scope;
  };

  $scope.dimensionalWeight = function(weight, length, width, height) {
    var dimWeight = (length * width * height) / ($scope.options.imperial ? dimensional_weight_values.imperial : dimensional_weight_values.metric);
    if(dimWeight > weight) {
      return parseInt(dimWeight, 10);
    } else {
      return weight;
    }
  };

  $scope.density = function(weight, length, width, height) {
    return (weight / ((length * width * height) / 1728));
  };

  function handleResponseError(err, callback) {
    try {
      return callback(err.root.Envelope.Body.Fault, null);
    } catch(e) {
      if($scope.options.debug) {
        console.log(util.inspect(err, {depth: null}));
      }
      return callback(err, null);
    }
  }

  function generateAuthentication(data, resource, options) {
    var params = {
      WebAuthenticationDetail: {
        UserCredential: {
          Key: $scope.options.key,
          Password: $scope.options.password
        }
      },
      ClientDetail: {
        AccountNumber: $scope.options.account_number,
        MeterNumber: $scope.options.meter_number
      }
    };

    if(resource && resource.version) {
      params['Version'] = {
        ServiceId: resource.version.ServiceId,
        Major: resource.version.Major,
        Intermediate: resource.version.Intermediate,
        Minor: resource.version.Minor
      };
    }

    return extend(params, data);
  }

  function buildRatesRequest(data, options, resource, callback) {
    soap.createClient(path.join(__dirname,  'wsdl', resource.wsdl), {endpoint: $scope.hosts[$scope.options.environment] + resource.path}, function(err, client) {
      if (err) {
        return callback(err, null);
      }

      var params = generateAuthentication(data, resource, options);

      client.getRates(params, function(err, result) {
        if($scope.options.debug) {
          parser.parseString(client.lastRequest, {explicitArray: false}, function(err, debug) {
            console.log(util.inspect(debug, {depth: null}));
          });
        }
        if(err) {
          return handleResponseError(err, callback);
        }

        return callback(err, result);
      });
    });
  }

  function handleRatesResponse(res, callback) {
    return callback(null, res);
  }

  function buildShipRequest(data, options, resource, callback) {
    soap.createClient(path.join(__dirname,  'wsdl', resource.wsdl), {endpoint: $scope.hosts[$scope.options.environment] + resource.path}, function(err, client) {
      if (err) {
        return callback(err, null);
      }

      var params = generateAuthentication(data, resource, options);

      client.processShipment(params, function(err, result) {
        if($scope.options.debug) {
          parser.parseString(client.lastRequest, {explicitArray: false}, function(err, debug) {
            console.log(util.inspect(debug, {depth: null}));
          });
        }

        if(err) {
          return handleResponseError(err, callback);
        }

        return callback(err, result);
      });
    });
  }

  function handleShipResponse(res, callback) {
    return callback(null, res);
  }

  function buildTrackingRequest(data, options, resource, callback) {
    soap.createClient(path.join(__dirname,  'wsdl', resource.wsdl), {endpoint: $scope.hosts[$scope.options.environment] + resource.path}, function(err, client) {
      if (err) {
        return callback(err, null);
      }

      var params = generateAuthentication(data, resource, options);

      client.track(params, function(err, result) {
        if($scope.options.debug) {
          parser.parseString(client.lastRequest, {explicitArray: false}, function(err, debug) {
            console.log(util.inspect(debug, {depth: null}));
          });
        }

        if(err) {
          return handleResponseError(err, callback);
        }

        return callback(err, result);
      });
    });
  }

  function handleTrackingResponse(res, callback) {
    return callback(null, res);
  }

  function buildFreightRatesRequest(data, options, resource, callback) {
    /**
      *
      * TBA
      *
      **/
  }

  function handleFreightRatesResponse(res, callback) {
    return callback(null, res);
  }

  function buildServiceAvailabilityRequest(data, options, resource, callback) {

    soap.createClient(path.join(__dirname,  'wsdl', resource.wsdl), {endpoint: $scope.hosts[$scope.options.environment] + resource.path}, function(err, client) {
      if (err) {
        return callback(err, null);
      }

      var params = generateAuthentication(data, resource, options);

      client.serviceAvailability(params, function(err, response){
        if($scope.options.debug) {
          parser.parseString(client.lastRequest, {explicitArray: false}, function(err, debug) {
            console.log(util.inspect(debug, {depth: null}));
          });
        }

        if(err) {
          return handleResponseError(err, callback);
        }
        return callback(err, response);
      });
    });
  }

  function handleServiceAvailabilityResponse(res, callback){
    return callback(null, res);
  }

  function buildAddressValidationRequest(data, options, resource, callback) {

    soap.createClient(path.join(__dirname,  'wsdl', resource.wsdl), {endpoint: $scope.hosts[$scope.options.environment] + resource.path}, function(err, client) {
      if (err) {
        return callback(err, null);
      }

      var params = generateAuthentication(data, resource, options);

      client.addressValidation(params, function(err, result) {
        if($scope.options.debug) {
          parser.parseString(client.lastRequest, {explicitArray: false}, function(err, debug) {
            console.log(util.inspect(debug, {depth: null}));
          });
        }

        if(err) {
          return handleResponseError(err, callback);
        }

        return callback(err, result);
      });
    });
  }

  function handleAddressValidationResponse(res, callback) {
    return callback(null, res);
  }

  function buildGroundCloseRequest(data, options, resource, callback) {

    soap.createClient(path.join(__dirname,  'wsdl', resource.wsdl), {endpoint: $scope.hosts[$scope.options.environment] + resource.path}, function(err, client) {
      if (err) {
        return callback(err, null);
      }

      var params = generateAuthentication(data, resource, options);

      client.groundClose(params, function(err, result) {
        if($scope.options.debug) {
          parser.parseString(client.lastRequest, {explicitArray: false}, function(err, debug) {
            console.log(util.inspect(debug, {depth: null}));
          });
        }
        if(err) {
          return handleResponseError(err, callback);
        }

        return callback(err, result);
      });
    });
  }

  function handleGroundCloseResponse(res, callback) {
    return callback(null, res);
  }

  function buildSmartPostCloseRequest(data, options, resource, callback) {

    soap.createClient(path.join(__dirname,  'wsdl', resource.wsdl), {endpoint: $scope.hosts[$scope.options.environment] + resource.path}, function(err, client) {
      if (err) {
        return callback(err, null);
      }

      var params = generateAuthentication(data, resource, options);

      client.smartPostClose(params, function(err, result) {
        if($scope.options.debug) {
          parser.parseString(client.lastRequest, {explicitArray: false}, function(err, debug) {
            console.log(util.inspect(debug, {depth: null}));
          });
        }
        if(err) {
          return handleResponseError(err, callback);
        }

        return callback(err, result);
      });
    });
  }

  function handleSmartPostCloseResponse(res, callback) {
    return callback(null, res);
  }

  function buildDeleteShipmentRequest(data, options, resource, callback) {
    soap.createClient(path.join(__dirname,  'wsdl', resource.wsdl), {endpoint: $scope.hosts[$scope.options.environment] + resource.path}, function(err, client) {
      if (err) {
        return callback(err, null);
      }

      var params = generateAuthentication(data, resource, options);

      client.deleteShipment(params, function(err, result) {
        if($scope.options.debug) {
          parser.parseString(client.lastRequest, {explicitArray: false}, function(err, debug) {
            console.log(util.inspect(debug, {depth: null}));
          });
        }
        if(err) {
          return handleResponseError(err, callback);
        }

        return callback(err, result);
      });
    });
  }

  function handleDeleteShipmentResponse(res, callback) {
    return callback(null, res);
  }

  var resources = {
    rates: {f: buildRatesRequest, r: handleRatesResponse, wsdl: 'RateService_v22.wsdl', path: '/web-services', version: {ServiceId: 'crs', Major: 22, Intermediate: 0, Minor: 0}},
    ship: {f: buildShipRequest, r: handleShipResponse, wsdl: 'ShipService_v15.wsdl', path: '/web-services', version: {ServiceId: 'ship', Major: 15, Intermediate: 0, Minor: 0}},
    track: {f: buildTrackingRequest, r: handleTrackingResponse, wsdl: 'TrackService_v9.wsdl', path: '/web-services', version: {ServiceId: 'trck', Major: 9, Intermediate: 1, Minor: 0}},
    freight_rates: {f: buildFreightRatesRequest, r: handleFreightRatesResponse, wsdl: 'RateService_v16.wsdl', path: '/web-services', version: {ServiceId: 'crs', Major: 16, Intermediate: 0, Minor: 0}},
    addressvalidation: {f: buildAddressValidationRequest, r: handleAddressValidationResponse, wsdl: 'AddressValidationService_v3.wsdl', path: '/web-services', version: {ServiceId: 'aval', Major: 3, Intermediate: 0, Minor: 0}},
    groundclose: {f: buildGroundCloseRequest, r: handleGroundCloseResponse, wsdl: 'CloseService_v4.wsdl', path: '/web-services', version: {ServiceId: 'clos', Major: 4, Intermediate: 0, Minor: 0}},
    smartpostclose: {f: buildSmartPostCloseRequest, r: handleSmartPostCloseResponse, wsdl: 'CloseService_v4.wsdl', path: '/web-services', version: {ServiceId: 'clos', Major: 4, Intermediate: 0, Minor: 0}},
    deleteshipment: {f: buildDeleteShipmentRequest, r: handleDeleteShipmentResponse, wsdl: 'ShipService_v15.wsdl', path: '/web-services', version: {ServiceId: 'ship', Major: 15, Intermediate: 0, Minor: 0}},
    serviceAvailability: {f: buildServiceAvailabilityRequest, r: handleServiceAvailabilityResponse, wsdl: 'ValidationAvailabilityAndCommitmentService_v8.wsdl', path: '/web-services', version: {ServiceId: 'vacs', Major: 8, Intermediate: 0, Minor: 0}}
  };

  function buildResourceFunction(i, resources) {
    return function(data, options, callback) {
      if(!callback) {
        callback = options;
        options = undefined;
      }

      resources[i].f(data, options, resources[i], function(err, res) {
        if(err) {
          return callback(err, null);
        }
        resources[i].r(res, callback);
      });
    }
  }

  for(var i in resources) {
    $scope[i] = buildResourceFunction(i, resources);
  }

  return $scope.config(args);
}

module.exports = FedEx;
