var WikidataSearch = require('wikidata-search').WikidataSearch;
var wikidataSearch = new WikidataSearch();
var Client = require('node-rest-client').Client;
var client = new Client();
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
var querystring = require("querystring");

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        //console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.8384313e-ff45-4ee3-aca5-ef42c1f09739") {
             context.fail("Invalid Application ID");
        }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    //console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
    //    ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    //console.log("onLaunch requestId=" + launchRequest.requestId +
    //    ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    //console.log("onIntent requestId=" + intentRequest.requestId +
    //    ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("WhoIsLeadingIntent" === intentName) {
        whoIsLeading(intent, session, callback);
    } else if ("BirthdateIntent" === intentName) {
        if (session.attributes && session.attributes.person) {
            getBirthdate(intent, session, callback);
        } else {
           rickAstley(intent, session, callback); 
        }
    } else if ("BiggestCitiesWithFemaleMayorIntent" === intentName) {
        biggestCitiesWithFemaleMayor(intent, session, callback);    
    } else if ("HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    //console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
    //    ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    var sessionAttributes = {};
    var cardTitle = "Welcome to Wikidata";
    var speechOutput = "Welcome to Wikidata. How can I help you?";
    var repromptText = "You can ask me when a certain person was born. " +
        "For more information please have a look at the cards at the Alexa App."; //TODO
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

}

function rickAstley(intent, session, callback) {
    callback({},
        buildSpeechletResponse("Fool you!", 
                                "Never gonna give you up, never gonna let you down, Never gonna run around and . desert you . Never gonna make you cry, never gonna say goodbye . Never gonna tell a lie . and hurt you", 
                                "Sorry, maybe you should try asking who is leading China.", 
                                false)
        );
}

function getBirthdate(intent, session, callback) {
    var sessionAttributes = session.attributes;
    var name = sessionAttributes.person.name;
    var id = sessionAttributes.person.id;
    var query = DATE_OF_BIRTH_QUERY.replace("[ITEM_ID]", id);
    client.get( SPARQL_ENDPOINT + querystring.stringify({query: ALL_PREFIXES + query}), function(data, response) {
        var jsonResponse = JSON.parse(decoder.write(data));
        if (jsonResponse.results.bindings.length == 0) {
            speechOutput = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
                            "You would do me a big favour if you could look it up and add it to Wikidata."
            callback(sessionAttributes,
                buildSpeechletResponse("", speechOutput, "", false));
            return;
        }

        var resultDate = jsonResponse.results.bindings[0].date.value;
        resultDate = resultDate.substring(0, resultDate.search('T'));
        var speechOutput = name + " was born on " + resultDate;
        callback(sessionAttributes,
            buildSpeechletResponse("", speechOutput, "", false));
    });
    
}

function whoIsLeading(intent, session, callback) {
    var cardTitle = "Leader:";
    var nameSlot = intent.slots.Name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if (!nameSlot) {
        callback({},
                buildSpeechletResponse("", "I didn't get the name, sorry.", "Please try it again", false));
        return;
    }

    var name = nameSlot.value;
    getWikidataId(name, sessionAttributes, doWhoIsLeadingQuery, callback);
}

function biggestCitiesWithFemaleMayor(intent, session, callback) {
    var cardTitle = "Biggest Cities:";
    var countrySlot = intent.slots.Country;
    var numberSlot = intent.slots.Number;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    // TODO: Make world the fallback
    if (!countrySlot) {
        callback({},
                buildSpeechletResponse("", "I didn't get country. Could you please try again?", "Please try it again", false));
        return;
    }

    var number;
    if (!numberSlot) {
        number =  3; // default to 3
    } else {
        number = numberSlot.value;
    }
    console.log("Trying to clean variable");
    cleanVariable(countrySlot.value, function(country) {   
        console.log("Successfully cleaned varibale");     
        sessionAttributes.number = number; //TODO: Find a better way to keep track of variables OR make it consitent this way
        getWikidataId(country, sessionAttributes, doBiggestCityWithFemaleMayorQuery, callback);
    });
}

// --------------- Custom functions -----------------------


function getWikidataId(place, sessionAttributes, callbackQuery, callback) {
    wikidataSearch.set('search', place);
    wikidataSearch.search(function(result, error) {
        console.log("Inside getWikidataId; results for ", place, result.results);
        var id = result.results[0].id;
        callbackQuery(id, place, sessionAttributes, callback);
    });
}

function doWhoIsLeadingQuery(id, place, sessionAttributes, callback) {
    var query = WHO_IS_LEADING_QUERY.replace("[ITEM_ID]", id);
    var url = SPARQL_ENDPOINT + querystring.stringify({query: ALL_PREFIXES + query});
    console.log(url);
    client.get( url, function(data, response) {
        var jsonResponse = JSON.parse(decoder.write(data));
        if (jsonResponse.results.bindings.length == 0) {
            speechOutput = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
                            "You would do me a big favour if you could look it up and add it to Wikidata."
            callback(sessionAttributes,
                buildSpeechletResponse("", speechOutput, "", false));
            return;
        }

        var resultURI = jsonResponse.results.bindings[0].headOfGovernment.value;
        var resultId = resultURI.substring(resultURI.search('Q'), resultURI.length);

        wikidataSearch.set('search', resultId);
        wikidataSearch.search(function(result, error) {
            var label = result.results[0].label;
            sessionAttributes.person = {
                name: label,
                id: resultId
            }
            speechOutput = label + " is leading " + place;
            callback(sessionAttributes,
                buildSpeechletResponse("", speechOutput, "", false));
        });
    });
}

function doBiggestCityWithFemaleMayorQuery(id, place, sessionAttributes, callback) {
    var query = BIGGEST_CITIES_WITH_FEMALE_MAYOR_QUERY.replace("[ITEM_ID]", id).replace("[NUMBER]", sessionAttributes.number);
    client.get( SPARQL_ENDPOINT + querystring.stringify({query: ALL_PREFIXES + query}), function(data, response) {
        var jsonResponse = JSON.parse(decoder.write(data));
        console.log(jsonResponse);
        if (jsonResponse.results.bindings.length == 0) {
            speechOutput = "Sorry, I didn't find an answer on Wikidata. Maybe its data is incomplete. " +
                            "You would do me a big favour if you could look it up and add it to Wikidata."
            callback(sessionAttributes,
                buildSpeechletResponse("", speechOutput, "", false));
            return;
        }

        var resultArray = jsonResponse.results.bindings;
        var cityIdArray = [];
        for (var i = 0; i < resultArray.length; i++) {
            cityIdArray[i] = resultArray[i].city.value.substring(resultArray[i].city.value.search('Q'), resultArray[i].city.value.length);
        };
        console.log(cityIdArray);
        wikidataSearch.getEntities(cityIdArray, false, function(result, error) {
            speechOutput = "The " + sessionAttributes.number + " biggest cities in " + place + " that are run by a female are ";
            var cityLabelArray = [];

            for (var i = 0; i < result.entities.length; i++) {
                cityLabelArray[i] = result.entities[i].label;
            };

            for (var i = 0; i < cityLabelArray.length - 1; i++) {
                speechOutput += cityLabelArray[i] + ", ";
            };

            speechOutput += "and " + cityLabelArray[cityLabelArray.length - 1];
            
            callback(sessionAttributes,
                buildSpeechletResponse("", speechOutput, "", false));
        });
    });
}

// --------------- Custom helpers -----------------------
function cleanVariable(val, callback) {
    console.log(val);
    val = val.replace(/ /g,'').replace(/\./g,'').replace('the','');
    console.log("Inside clean variable: ", val);
    callback(val);
}

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}