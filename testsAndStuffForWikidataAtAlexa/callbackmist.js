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


var BIGGEST_CITIES_WITH_MAYOR = "PREFIX wd: <http://www.wikidata.org/entity/>  " +
"PREFIX wdt: <http://www.wikidata.org/prop/direct/> " +
"PREFIX p: <http://www.wikidata.org/prop/> " +
"PREFIX q: <http://www.wikidata.org/prop/qualifier/> " +
"PREFIX v: <http://www.wikidata.org/prop/statement/> " +
"SELECT DISTINCT ?city ?mayor WHERE { " +
"  ?city wdt:P31/wdt:P279* wd:Q515 . " +
"  ?city wdt:P17 wd:Q183 . " +
"  ?city p:P6 ?statement . " +
"  ?statement v:P6 ?mayor . " +
"  ?mayor wdt:P21 wd:Q6581072 . " +
"  FILTER NOT EXISTS { ?statement q:P582 ?x } " +
"  ?city wdt:P1082 ?population . " +
" } ORDER BY DESC(?population) LIMIT 3";



function doSomething(par1, par2) {
	//var query = WHO_IS_LEADING_QUERY.replace("[ITEM_ID]", "Q64");
	var query = BIGGEST_CITIES_WITH_MAYOR;
	client.get( SPARQL_ENDPOINT + query, function(data, response) {
		console.log(data);
		console.log(decoder.write(data));
		var textChunk = JSON.parse(decoder.write(data));
		var resultURI = textChunk.results.bindings[0].city.value;
    	var resultId = resultURI.substring(resultURI.search('Q'), resultURI.length);
    	console.log(resultId);
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