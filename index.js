var WikidataSearch = require('wikidata-search').WikidataSearch;
var wikidataSearch = new WikidataSearch();
var Client = require('node-rest-client').Client;
var client = new Client();
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

// Constants
var WHO_IS_LEADING_QUERY = "PREFIX wd: <http://www.wikidata.org/entity/> " +
            "PREFIX p: <http://www.wikidata.org/prop/> " +
            "PREFIX q: <http://www.wikidata.org/prop/qualifier/> " +
            "PREFIX v: <http://www.wikidata.org/prop/statement/> " +
            "SELECT DISTINCT ?headOfGovernment WHERE { " +
            "wd:[ITEM_ID] p:P6 ?statement . " +
            "?statement v:P6 ?headOfGovernment . " +
            "FILTER NOT EXISTS { ?statement q:P582 ?x } " +
            "}";
var SPARQL_ENDPOINT = "https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&query=";


// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        //console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.[unique-value-here]") {
             context.fail("Invalid Application ID");
        }
        */

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
    name = session.attributes.person.name;
    callback({},
        buildSpeechletResponse("This is to do", 
                                "I have to figure out when " + name + " was born",
                                "", 
                                false)
        );
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

// --------------- Custom functions -----------------------


function getWikidataId(place, sessionAttributes, callbackQuery, callback) {
    wikidataSearch.set('search', place);
    wikidataSearch.search(function(result, error) {
        console.log("Results for ", place, result.results);
        var id = result.results[0].id;
        callbackQuery(id, place, sessionAttributes, callback);
    });
}

function doWhoIsLeadingQuery(id, place, sessionAttributes, callback) {
    var query = WHO_IS_LEADING_QUERY.replace("[ITEM_ID]", id);
    client.get( SPARQL_ENDPOINT + query, function(data, response) {
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