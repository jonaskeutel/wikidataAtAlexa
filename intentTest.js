var index = require('./index.js');

var femaleMayors = {
    "session": {
        "sessionId": "SessionId.d3b48bf5-04bf-4a6d-8b6e-21244b768ed1",
        "application": {
          "applicationId": "amzn1.echo-sdk-ams.app.8384313e-ff45-4ee3-aca5-ef42c1f09739"
        },
        "user": {
          "userId": "amzn1.echo-sdk-account.AFLRKROTE4EXHDNXQNTCM5GAAB77QCP2Y7XUHKMQPUNHD5KWI6FJY"
        },
        "new": true
        },
    "request": {
        "type": "IntentRequest",
        "requestId": "EdwRequestId.a9cb3910-4f55-46af-a9c1-0f37e39b7ccd",
        "timestamp": "2016-01-10T07:39:27Z",
        "intent": {
          "name": "BiggestCitiesWithFemaleMayorIntent",
          "slots": {
            "Number": {
              "name": "Number",
              "value": "5"
            },
            "Country": {
              "name": "Country",
              "value": "germany"
            }
          }
        }
    }   
};

var birthdateAfterLeading = {
  "session": {
    "sessionId": "SessionId.d3b48bf5-04bf-4a6d-8b6e-21244b768ed1",
    "application": {
      "applicationId": "amzn1.echo-sdk-ams.app.8384313e-ff45-4ee3-aca5-ef42c1f09739"
    },
    "attributes": {
      "person": {
        "name": "Li Keqiang",
        "id": "Q18111"
      }
    },
    "user": {
      "userId": "amzn1.echo-sdk-account.AFLRKROTE4EXHDNXQNTCM5GAAB77QCP2Y7XUHKMQPUNHD5KWI6FJY"
    },
    "new": false
  },
  "request": {
    "type": "IntentRequest",
    "requestId": "EdwRequestId.9443ddca-f784-4cf2-b004-7d414a701350",
    "timestamp": "2016-01-10T08:07:39Z",
    "intent": {
      "name": "BirthdateIntent",
      "slots": {
        "Name": {
          "name": "Name",
          "value": "he"
        }
      }
    }
  }
}


var leading = {
  "session": {
    "sessionId": "SessionId.d3b48bf5-04bf-4a6d-8b6e-21244b768ed1",
    "application": {
      "applicationId": "amzn1.echo-sdk-ams.app.8384313e-ff45-4ee3-aca5-ef42c1f09739"
    },
    "attributes": {},
    "user": {
      "userId": "amzn1.echo-sdk-account.AFLRKROTE4EXHDNXQNTCM5GAAB77QCP2Y7XUHKMQPUNHD5KWI6FJY"
    },
    "new": true
  },
  "request": {
    "type": "IntentRequest",
    "requestId": "EdwRequestId.cd0b4f7e-2608-4a8a-a68a-feaf4a2f8582",
    "timestamp": "2016-01-10T08:06:57Z",
    "intent": {
      "name": "WhoIsLeadingIntent",
      "slots": {
        "Name": {
          "name": "Name",
          "value": "china"
        }
      }
    }
  }
}

var succeed = function(response) {
    console.log(response);
}

var fail = function(error) {
    console.log(error);
}

var context = {
    succeed: succeed,
    fail: fail
}

index.handler(leading, context);
