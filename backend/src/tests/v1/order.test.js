import config from '../../config/test.json';
import { orderFormCreateRequest } from '../wrapper';

const port = config.port;
const url = config.url;


describe('POST /v1/order/create/form', () => {
  const validParams = {
    "order": {
      "note": "Information text for the whole order",
      "documentCurrencyCode": "SEK",
      "accountingCostCode": "Project123",
      "validityEndDate": "2010-01-31",
      "quotationDocumentReferenceId": "QuoteID123",
      "orderDocumentReferenceId": "RejectedOrderID123",
      "originatorDocumentReferenceId": "MAFO",
      "contractType": "FrameworkAgreementID123",
      "contractId": 34322
    },
    "buyer": {
      "buyerId": "7300070011115",
      "name": "Johnssons byggvaror",
      "postalAddress": {
        "postBox": "PoBox123",
        "streetName": "Rådhusgatan",
        "additionalStreetName": "2nd floor",
        "buildingNumber": "5",
        "department": "Purchasing department",
        "cityName": "Stockholm",
        "postalZone": "11000",
        "countrySubentity": "RegionX",
        "countryCode": "SE"
      },
      "taxScheme": "VAT",
      "contact": {
        "telephone": "123456",
        "telefax": "123456",
        "email": "pelle@johnsson.se"
      },
      "person": {
        "firstName": "Pelle",
        "middleName": "X",
        "familyName": "Svensson",
        "jobTitle": "Boss"
      },
      "deliveryContact": {
        "name": "Eva Johnsson",
        "telephone": "123456",
        "telefax": "123455",
        "email": "eva@johnsson.se"
      }
    },
    "seller": {
      "sellerId": "7304231321341",
      "name": "Moderna Produkter AB",
      "postalAddress": {
        "postBox": "321",
        "streetName": "Kungsgatan",
        "additionalStreetName": "suite12",
        "buildingNumber": "22",
        "department": "Sales department",
        "cityName": "Stockholm",
        "postalZone": "11000",
        "countrySubentity": "RegionX",
        "countryCode": "SE"
      },
      "contact": {
        "telephone": "34557",
        "telefax": "3456767",
        "email": "lars@moderna.se"
      },
      "person": {
        "firstName": "Lars",
        "middleName": "M",
        "familyName": "Petersen",
        "jobTitle": "Sales Manager"
      }
    },
    "delivery": {
      "deliveryAddress": {
        "postBox": "321",
        "streetName": "Avon Way",
        "additionalStreetName": "2nd floor",
        "buildingName": "Thereabouts",
        "buildingNumber": "56A",
        "department": "Purchasing department",
        "cityName": "Bridgtow",
        "postalZone": "ZZ99 1ZZ",
        "countrySubentity": "RegionX",
        "countryCode": "SE"
      },
      "requestedDeliveryPeriod": {
        "startDate": "2005-06-29",
        "endDate": "2005-06-29"
      },
      "deliveryParty": {
        "deliveryPartyId": 67654328394567,
        "name": "Swedish Trucking",
        "telephone": "987098709",
        "email": "bill@svetruck.se",
        "telefax": "34673435"
      }
    },
    "monetaryTotal": {
      "lineExtensionAmount": "6225",
      "taxTotal": "100",
      "allowanceCharge": [
        {
          "chargeIndicator": "true",
          "allowanceChargeReason": "Transport Documents",
          "amount": 100
        },
        {
          "chargeIndicator": "false",
          "allowanceChargeReason": "Total order value discount",
          "amount": 100
        }
      ]
    },
    "orderLines": [
      {
        "note": "Freetext note on line 1",
        "lineItem": {
          "quantity": 120,
          "totalTaxAmount": 10,
          "price": 50,
          "baseQuantity": {
            "quantity": 1,
            "unitCode": "LTR"
          },
          "item": {
            "itemId": "SItemNo011",
            "description": "Red paint",
            "name": "Falu Rödfärg",
            "properties": {
              "paintType": "Acrylic",
              "solvent": "Water"
            }
          }
        }
      },
      {
        "note": "Freetext note on line 2",
        "lineItem": {
          "quantity": 15,
          "totalTaxAmount": 10,
          "price": 15,
          "baseQuantity": {
            "quantity": 1,
            "unitCode": "C62"
          },
          "item": {
            "itemId": "SItemNo001",
            "description": "Very good pencils for red paint.",
            "name": "Pensel 20 mm",
            "properties": {
              "hairColor": "Black",
              "width": "20mm"
            }
          }
        }
      }
    ],
    "additionalDocumentReference": [
      {
        "documentType": "Timesheet",
        "attachment": {
          "uri": "http://www.suppliersite.eu/sheet001.html"
        }
      },
      {
        "documentType": "Drawing",
        "attachment": {
          "binaryObject": "UjBsR09EbGhjZ0dTQUxNQUFBUUNBRU1tQ1p0dU1GUXhEUzhi",
          "mimeCode": "application/pdf"
        }
      }
    ]
  }

  test('should return 200 and an orderId', async () => {
    const res = await orderFormCreateRequest(validParams); // Await the request
    const body = JSON.parse(res.body.toString());

    expect(res.statusCode).toBe(200);
    expect(body).toHaveProperty('orderId');
    expect(typeof body.orderId).toBe('number');
    expect(Number.isInteger(body.orderId)).toBe(true);
  });
});
