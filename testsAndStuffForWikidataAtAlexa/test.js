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
            "SELECT DISTINCT ?leading WHERE { " +
            "wd:??? p:P6 ?statement . " +
            "?statement v:P6 ?leading . " +
            "FILTER NOT EXISTS { ?statement q:P582 ?x } " +
            "}";
var WHO_IS_LEADING_STATE_QUERY = "PREFIX wd: <http://www.wikidata.org/entity/> " +
            "PREFIX p: <http://www.wikidata.org/prop/> " +
            "PREFIX q: <http://www.wikidata.org/prop/qualifier/> " +
            "PREFIX v: <http://www.wikidata.org/prop/statement/> " +
            "SELECT DISTINCT ?leading WHERE { " +
            "wd:??? p:P35 ?statement . " +
            "?statement v:P35 ?leading . " +
            "FILTER NOT EXISTS { ?statement q:P582 ?x } " +
            "}";
var SPARQL_ENDPOINT = "https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&query=";


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

    console.log(speechOutput);
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


// --------------- Custom functions -----------------------

function getWikidataId(name, callback) {
    wikidataSearch.set('search', name);
    wikidataSearch.search(function(result, error) {
        var id = result.results[0].id;
        callback(id, false);
    });
}

function doWhoIsLeadingQuery(id, useHeadOfState) {
    var query = useHeadOfState ? WHO_IS_LEADING_STATE_QUERY.replace("???", id) : WHO_IS_LEADING_QUERY.replace("???", id);
    console.log(useHeadOfState);
    console.log(query);
    if (!useHeadOfState) {
        client.get( SPARQL_ENDPOINT + query, parseWhoIsLeadingResponse);
    } else {
        client.get( SPARQL_ENDPOINT + query, parseWhoIsLeadingStateResponse);
    }

}

function parseWhoIsLeadingResponse(data, response) {
    console.log("try government");
    var textChunk = JSON.parse(decoder.write(data));
    console.log(textChunk.results.bindings);
    if (textChunk.results.bindings.length == 0) {
        doWhoIsLeadingQuery("Q739", true);
        return;
    }
    var resultURI = textChunk.results.bindings[0].headOfGovernment.value;
    var resultId = resultURI.substring(resultURI.search('Q'), resultURI.length);

    wikidataSearch.set('search', resultId);
    wikidataSearch.search(function(result, error) {
        var label = result.results[0].label;
        speechOutput = label + " is leading " + name;
        console.log(speechOutput);
    });
}

function parseWhoIsLeadingStateResponse(data, response) {
    console.log("try state");
    var textChunk = JSON.parse(decoder.write(data));
    console.log(textChunk);
    if (textChunk.results.bindings.length == 0) {
        console.log("I couldn't find an anwer. Maybe google it and then add it to Wikidata, so I can find it next time?");
        return;
    }
    var resultURI = textChunk.results.bindings[0].headOfState.value;
    var resultId = resultURI.substring(resultURI.search('Q'), resultURI.length);

    wikidataSearch.set('search', resultId);
    wikidataSearch.search(function(result, error) {
        var label = result.results[0].label;
        speechOutput = label + " is leading " + name;
        console.log(speechOutput);
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


//-----------------------------TEST-CODE------------------------------------//
var intent = process.argv[2];
var name = process.argv[3];
intent = {
    slots: {
        Name: {
            value: name
        }
    }
};

whoIsLeading(intent, null, null);