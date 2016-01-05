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

function doSomething(par1, par2) {
	var query = WHO_IS_LEADING_QUERY.replace("[ITEM_ID]", "Q64");
	var a = "qweqweqweqweqwe";
	client.get( SPARQL_ENDPOINT + query, function(data, response) {
		console.log("inside callback that pisses me off");
		console.log("third parameter is: " +  a);
	});
}


function parseWhoIsLeadingResponse(data, response, par) {
	console.log("inside callback that pisses me off");
	console.log("third parameter is: " +  par);
    /*var textChunk = JSON.parse(decoder.write(data));
    var resultURI = textChunk.results.bindings[0].headOfGovernment.value;
    var resultId = resultURI.substring(resultURI.search('Q'), resultURI.length);

    wikidataSearch.set('search', resultId);
    wikidataSearch.search(function(result, error) {
        var label = result.results[0].label;
        speechOutput = label + " is leading Berlin";
        console.log(speechOutput);
        //callback(sessionAttributes,
        //    buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });*/

}


doSomething("234234", "asdsad");