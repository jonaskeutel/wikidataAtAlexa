var WikidataSearch = require('wikidata-search').WikidataSearch;
var wikidataSearch = new WikidataSearch();
var Client = require('node-rest-client').Client;
var client = new Client();
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
var querystring = require("querystring");

// Constants
var WHO_IS_LEADING_QUERY = "SELECT DISTINCT ?headOfGovernment WHERE { " +
            "wd:Q90 p:P6 ?statement . " +
            "?statement v:P6 ?headOfGovernment . " +
            "FILTER NOT EXISTS { ?statement q:P582 ?x } " +
            "}";
var DATE_OF_BIRTH_QUERY = "SELECT ?date WHERE { " +
            "   wd:Q76 wdt:P569 ?date . " +
            "}";
var BIGGEST_CITIES_WITH_FEMALE_MAYOR_QUERY = "SELECT DISTINCT ?city ?cityLabel ?mayor ?mayorLabel WHERE { " +
            "  ?city wdt:P31/wdt:P279* wd:Q515 . " +
            "  ?city wdt:P17 wd:Q183 . " +
            "  ?city p:P6 ?statement . " +
            "  ?statement v:P6 ?mayor . " +
            "  ?mayor wdt:P21 wd:Q6581072 . " +
            "  FILTER NOT EXISTS { ?statement q:P582 ?x } " +
            "  ?city wdt:P1082 ?population . " + 
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language 'en' . } " +
            " } ORDER BY DESC(?population) LIMIT 5";

var SPARQL_ENDPOINT = "https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&";

// TODO (BIG ONE): Make label lookup work!!!
var ALL_PREFIXES = "PREFIX wikibase: <http://wikiba.se/ontology#>" + 
            "PREFIX wd: <http://www.wikidata.org/entity/>  " +
            "PREFIX wdt: <http://www.wikidata.org/prop/direct/> " +
            "PREFIX p: <http://www.wikidata.org/prop/> " +
            "PREFIX q: <http://www.wikidata.org/prop/qualifier/> " +
            "PREFIX v: <http://www.wikidata.org/prop/statement/> ";

function testQuery(query) {
    //var url = encodeURIComponent(SPARQL_ENDPOINT + ALL_PREFIXES + query);
    var url = querystring.stringify({query: ALL_PREFIXES + query});
    url = SPARQL_ENDPOINT + url;
    console.log(url);
	client.get( url, function(data, response) {
		//console.log(data);
		console.log(decoder.write(data));
		var textChunk = JSON.parse(decoder.write(data));
		var resultURI = textChunk.results.bindings[0].city.value;
    	var resultId = resultURI.substring(resultURI.search('Q'), resultURI.length);
    	//console.log(resultId);
	});
}

testQuery(BIGGEST_CITIES_WITH_FEMALE_MAYOR_QUERY);