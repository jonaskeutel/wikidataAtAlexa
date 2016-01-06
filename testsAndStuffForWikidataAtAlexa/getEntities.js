var cityIdArray = [ 'Q365', 'Q2103', 'Q2795', 'Q2910', 'Q3764' ];
var WikidataSearch = require('wikidata-search').WikidataSearch;
var wikidataSearch = new WikidataSearch();

wikidataSearch.getEntities(cityIdArray, false, function(result, error) {
            speechOutput = "The " + "five" + " biggest cities in " + "germany" + "that are fun by a female are ";
            var cityLabelArray = [];
            //console.log(result);
            for (var i = 0; i < result.entities.length; i++) {
                cityLabelArray[i] = result.entities[i].label;
            };
            //console.log(cityLabelArray);
            for (var i = 0; i < cityLabelArray.length - 1; i++) {
                speechOutput += cityLabelArray[i] + ", ";
            };

            speechOutput += "and " + cityLabelArray[cityLabelArray.length - 1];
            console.log(speechOutput);
            //callback(sessionAttributes,
               // buildSpeechletResponse("", speechOutput, "", false));
        });