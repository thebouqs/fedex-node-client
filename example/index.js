var fedexAPI = require('../lib/index');
var util = require('util');
var fs = require('fs');

var fedex = new fedexAPI({
  environment: 'sandbox', // or live
  debug: true,
  key: 'KEY',
  password: 'DEVPASSWORD',
  account_number: 'ACCOUNT#',
  meter_number: 'METER#',
  imperial: true // set to false for metric
});

/**
 *  Rates
 */
fedex.rates({
  ReturnTransitAndCommit: true,
  CarrierCodes: ['FDXE','FDXG'],
  RequestedShipment: {
    DropoffType: 'REGULAR_PICKUP',
    //ServiceType: 'FEDEX_GROUND',
    PackagingType: 'YOUR_PACKAGING',
    Shipper: {
      Contact: {
        PersonName: 'Sender Name',
        CompanyName: 'Company Name',
        PhoneNumber: '5555555555'
      },
      Address: {
        StreetLines: [
          'Address Line 1'
        ],
        City: 'Collierville',
        StateOrProvinceCode: 'TN',
        PostalCode: '38017',
        CountryCode: 'US'
      }
    },
    Recipient: {
      Contact: {
        PersonName: 'Recipient Name',
        CompanyName: 'Company Receipt Name',
        PhoneNumber: '5555555555'
      },
      Address: {
        StreetLines: [
          'Address Line 1'
        ],
        City: 'Charlotte',
        StateOrProvinceCode: 'NC',
        PostalCode: '28202',
        CountryCode: 'US',
        Residential: false
      }
    },
    ShippingChargesPayment: {
      PaymentType: 'SENDER',
      Payor: {
        ResponsibleParty: {
          AccountNumber: fedex.options.account_number
        }
      }
    },
    PackageCount: '1',
    RequestedPackageLineItems: {
      SequenceNumber: 1,
      GroupPackageCount: 1,
      Weight: {
        Units: 'LB',
        Value: '50.0'
      },
      Dimensions: {
        Length: 108,
        Width: 5,
        Height: 5,
        Units: 'IN'
      }
    }
  }
}, function(err, res) {
  if(err) {
    return console.log(err);
  }

  console.log(res);
});

/**
 * Tracking
 */
fedex.track({
  SelectionDetails: {
    PackageIdentifier: {
      Type: 'TRACKING_NUMBER_OR_DOORTAG',
      Value: '123456789012'
    }
  }
}, function(err, res) {
  if(err) {
    return console.log(err);
  }

  console.log(res);
});

/**
 * Ship
 */
var date = new Date();
fedex.ship({
  RequestedShipment: {
    ShipTimestamp: new Date(date.getTime() + (24*60*60*1000)).toISOString(),
    DropoffType: 'REGULAR_PICKUP',
    ServiceType: 'FEDEX_GROUND',
    PackagingType: 'YOUR_PACKAGING',
    Shipper: {
      Contact: {
        PersonName: 'Sender Name',
        CompanyName: 'Company Name',
        PhoneNumber: '5555555555'
      },
      Address: {
        StreetLines: [
          'Address Line 1'
        ],
        City: 'Collierville',
        StateOrProvinceCode: 'TN',
        PostalCode: '38017',
        CountryCode: 'US'
      }
    },
    Recipient: {
      Contact: {
        PersonName: 'Recipient Name',
        CompanyName: 'Company Receipt Name',
        PhoneNumber: '5555555555'
      },
      Address: {
        StreetLines: [
          'Address Line 1'
        ],
        City: 'Charlotte',
        StateOrProvinceCode: 'NC',
        PostalCode: '28202',
        CountryCode: 'US',
        Residential: false
      }
    },
    ShippingChargesPayment: {
      PaymentType: 'SENDER',
      Payor: {
        ResponsibleParty: {
          AccountNumber: fedex.options.account_number
        }
      }
    },
    LabelSpecification: {
      LabelFormatType: 'COMMON2D',
      ImageType: 'PDF',
      LabelStockType: 'PAPER_4X6'
    },
    PackageCount: '1',
    RequestedPackageLineItems: [{
      SequenceNumber: 1,
      GroupPackageCount: 1,
      Weight: {
        Units: 'LB',
        Value: '50.0'
      },
      Dimensions: {
        Length: 108,
        Width: 5,
        Height: 5,
        Units: 'IN'
      }
    }]
  }
}, function(err, res) {
  if(err) {
    return console.log(util.inspect(err, {depth: null}));
  }

  console.log(util.inspect(res, {depth: null}));
});

/**
 * Freight Rates
 */
fedex.freight_rates({

}, function(err, res) {
  if(err) {
    return console.log(err);
  }

  console.log(res);
});

/**
 * Address Validation Service
 * NOTE:  The Address Validation Service requires you to complete the certification process before it can be enabled
 * for your account. Contact FedEx Customer Support to initiate the process. Additional details are located within the
 * FedEx Developer center.
 */
fedex.addressvalidation({
  InEffectAsOfTimestamp: new Date(new Date().getTime() + (24 * 60 * 60 * 1000)).toISOString(),
  AddressesToValidate: [
    {
      Address: {
        StreetLines: [
          '9325 Center Lake Dr',
          'Suite 100'
        ],
        City: 'Charlotte',
        StateOrProvinceCode: 'NC',
        PostalCode: '28216',
        CountryCode: 'US'
      }
    },
    {
      Address: {
        StreetLines: [
          '601 S College St'
        ],
        City: 'Charlotte',
        StateOrProvinceCode: 'NC',
        PostalCode: '28202',
        CountryCode: 'US'
      }
    }
  ]
}, function (err, res) {
  if (err) {
    return console.log(util.inspect(err, {depth: null}));
  }

  console.log(util.inspect(res, {depth: 4}));
});

/**
 * Close
 */

fedex.groundclose({
  TimeUpToWhichShipmentsAreToBeClosed: new Date().toISOString()
}, function(err, res) {
  if (err) {
    return console.log(util.inspect(err, {depth: null}));
  }

  console.log(util.inspect(res, {depth: 4}));
});

fedex.smartpostclose({
  HubId: '5751',
  DestinationCountryCode: 'US', // Always US
  PickUpCarrier: 'FXSP' // Or FDXG
}, function(err, res) {
  if (err) {
    return console.log(util.inspect(err, {depth: null}));
  }

  console.log(util.inspect(res, {depth: 4}));
});

/**
 * Delete
 */

fedex.deleteshipment({
    TrackingId: {
        TrackingIdType: 'GROUND', // EXPRESS || FEDEX || GROUND || USPS
        TrackingNumber: '123456789012'
    },
    DeletionControl: 'DELETE_ALL_PACKAGES' // or DELETE_ONE_PACKAGE or LEGACY
}, function(err, res) {
  if (err) {
    return console.log(util.inspect(err, {depth: null}));
  }

  console.log(util.inspect(res, {depth: 4}));
});
