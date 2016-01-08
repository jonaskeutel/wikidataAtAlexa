var querystring = require("querystring");

var WHO_IS_LEADING_QUERY = "SELECT DISTINCT ?headOfGovernment WHERE { " +
            "wd:[ITEM_ID] p:P6 ?statement . " +
            "?statement v:P6 ?headOfGovernment . " +
            "FILTER NOT EXISTS { ?statement q:P582 ?x } " +
            "}";
var BIGGEST_CITIES_WITH_FEMALE_MAYOR_QUERY = "SELECT DISTINCT ?city ?cityLabel ?mayor ?mayorLabel WHERE { " +
            "  ?city wdt:P31/wdt:P279* wd:Q515 . " +
            "  ?city wdt:P17 wd:[ITEM_ID] . " +
            "  ?city p:P6 ?statement . " +
            "  ?statement v:P6 ?mayor . " +
            "  ?mayor wdt:P21 wd:Q6581072 . " +
            "  FILTER NOT EXISTS { ?statement q:P582 ?x } " +
            "  ?city wdt:P1082 ?population . " +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language 'en' . } " +
            " } ORDER BY DESC(?population) LIMIT [NUMBER]";

var SPARQL_ENDPOINT = "https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&";


function QueryBuilder(useJson) {
	useJson = typeof a !== "undefined" ? a : true;
	this.endpoint = "https://query.wikidata.org/bigdata/namespace/wdq/sparql?";
	if (useJson)
		this.endpoint += "format=json&";
	this.allPrefixes = "PREFIX wikibase: <http://wikiba.se/ontology#>" + 
            "PREFIX wd: <http://www.wikidata.org/entity/>  " +
            "PREFIX wdt: <http://www.wikidata.org/prop/direct/> " +
            "PREFIX p: <http://www.wikidata.org/prop/> " +
            "PREFIX q: <http://www.wikidata.org/prop/qualifier/> " +
            "PREFIX v: <http://www.wikidata.org/prop/statement/> ";
    this.dateOfBirth = "SELECT ?date WHERE { " +
            "   wd:[ITEM_ID] wdt:P569 ?date . " +
            "}";
}

QueryBuilder.prototype.dateOfBirth = function() {
	return querystring.stringify({query: this.allPrefixes + this.dateOfBirth});
}

var q = new QueryBuilder();