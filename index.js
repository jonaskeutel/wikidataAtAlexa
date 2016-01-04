var WikidataSearch = require('wikidata-search').WikidataSearch;
var wikidataSearch = new WikidataSearch();
var Client = require('node-rest-client').Client;
var client = new Client();
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');



var WHO_IS_LEADING_QUERY = "PREFIX wd: <http://www.wikidata.org/entity/> " +
            "PREFIX p: <http://www.wikidata.org/prop/> " +
            "PREFIX q: <http://www.wikidata.org/prop/qualifier/> " +
            "PREFIX v: <http://www.wikidata.org/prop/statement/> " +
            "SELECT DISTINCT ?headOfGovernment WHERE { " +
            "wd:??? p:P6 ?statement . " +
            "?statement v:P6 ?headOfGovernment . " +
            "FILTER NOT EXISTS { ?statement q:P582 ?x } " +
            "}";
var SPARQL_ENDPOINT = "https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&query=";


// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

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
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("BirthdateIntent" === intentName) {
        getBirthdate(intent, session, callback);
    } else if ("WhoIsLeadingIntent" === intentName) {
        whoIsLeading(callback);
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
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome to Wikidata";
    var speechOutput = "Welcome to Wikidata. How can I help you?";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "You can ask me when a certain person was born. " +
        "For more information please have a look at the cards at the Alexa App."; //TODO
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

}

function whoIsLeading(intent, session, callback) {
    var cardTitle = "Leader:";
    var nameSlot = intent.slots.Name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if (!nameSlot) {
        console.log("I didn't get the name, sorry.");
        return;
    }

    var name = nameSlot.value;
    getWikidataId(name, doWhoIsLeadingQuery);
}

//TODO: FIX HOLE METHOD
function getBirthdate(intent, session, callback) {
    var cardTitle = intent.name;
    var nameSlot = intent.slots.Name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if (nameSlot) {
        var name = nameSlot.value;

        var id = result.results[0].id;
        var label = result.results[0].label;
        wikidataSearch.getEntities([id], true, function(result, err) {
            var claims = result.entities[0].claims;
            var dateOfBirth;
            for (var i = 0; i < claims.length; i++) {
                if (claims[i].property === "place of birth") {
                    dateOfBirth = claims[i].value;
                    break;
                }
            }
            buildBirthdateResponse(sessionAttributes, cardTitle, label, dateOfBirth, callback);
        });
    } else {
        speechOutput = "I didn't get the name of the person. Please try again";
        repromptText = "You can ask: When is the birthdate of Barack Obama";
        console.log(speechOutput);
    }
}

// --------------- Custom functions -----------------------


function getWikidataId(name, callback) {
    wikidataSearch.set('search', 'name');
    wikidataSearch.search(function(result, error) {
        var id = result.results[0].id;
        callback(id);
    });
}

function doWhoIsLeadingQuery(id) {
    var query = WHO_IS_LEADING_QUERY.replace("???", id);
    client.get( SPARQL_ENDPOINT + query, parseWhoIsLeadingResponse);
}

function parseWhoIsLeadingResponse(data, response) {
    var textChunk = JSON.parse(decoder.write(data));
    var resultURI = textChunk.results.bindings[0].headOfGovernment.value;
    var resultId = resultURI.substring(resultURI.search('Q'), resultURI.length);

    wikidataSearch.set('search', resultId);
    wikidataSearch.search(function(result, error) {
        var label = result.results[0].label;
        speechOutput = label + " is leading " + name;
        console.log(speechOutput);
        callback(sessionAttributes,
            buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });
}


//TODO FIX
function buildBirthdateResponse(sessionAttributes, cardTitle, name, birthdate, callback) {
    speechOutput = name + " was born here: " + birthdate;
    console.log(speechOutput);
    repromptText = "Do you want to know something different about this person?";
    shouldEndSession = false;

    console.log(speechOutput);
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