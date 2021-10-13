var simpleStatistics = require("simple-statistics");

module.exports = function(RED) {
    function outlier(config) {
        RED.nodes.createNode(this,config);
        this.numberOfSamples = config.numberOfSamples;
        this.mode_input = config.mode_input;
        this.mode_outlier = config.mode_outlier;
        this.mode_output = config.mode_output;
        this.max_allowed_outlier_percentage = config.max_allowed_outlier_percentage;
        var node = this;

        this.on('close', function() {
            var context = node.context();
            context.set('valueArray',new Array(0));
        });

        node.on('input', function(msg) {
            var hasValidInput = (node.mode_input == "array" && node.checkInputArray(msg))
                || (node.mode_input == "batch_number" && node.checkInputBatch(msg));

            if (!hasValidInput)
                return;

            var valueArray = node.parseInput(msg.payload);
            
            if (node.mode_input == "array" || valueArray.length >= node.numberOfSamples)
            {
                var filteredArray = node.filterOutliers(valueArray, node.mode_outlier);
                if (filteredArray.length == 0)
                {
                    node.setError("Error filtering outliers. No value left!");
                    return;
                }

                var minLength = (1.0 - node.max_allowed_outlier_percentage) * valueArray.length;
                var maxLength = node.max_allowed_outlier_percentage * valueArray.length;
                var tooManyOutliers = (filteredArray.length < minLength && node.mode_outlier == "remove")
                    || (filteredArray.length > maxLength && node.mode_outlier == "get")
                if (tooManyOutliers)
                    node.setError("Too many outliers! " + (node.max_allowed_outlier_percentage * 100) + "%!");
                else 
                    node.setOutput(msg, filteredArray, node.mode_output);
                    
                valueArray = new Array(0);
            }

            if (node.mode_input == "batch_number")
                node.setContextArray(valueArray);

            node.setStatus(msg, valueArray);
        });

        node.checkInputArray = function(msg)
        {
            if (!Array.isArray(msg.payload))
            {
                node.setError("msg.payload should be an array!");
                return false;
            }
            else if(msg.payload.length == 0)
            {
                node.setError("msg.payload array is empty!");
                return false;
            }
            return true;
        }

        node.checkInputBatch = function(msg)
        {
            if (msg == null || !msg.hasOwnProperty("payload"))
            {
                node.setError("msg.payload invalid or does not exist!");
                return false;
            }

            var distance = parseFloat(msg.payload);
            if (isNaN(distance))
            {
                node.setError("msg.payload is not a number!");
                return false;
            }

            return true;
        };


        node.parseInput = function(input)
        {
            if (node.mode_input == "array")
            {
                if (input.length == 0)
                {
                    node.setError("msg.payload is an empty array!");
                    return new Array(0);
                }

                var firstValue = input[0];
                if (typeof firstValue === 'string' || firstValue instanceof String)
                    return input.map(i=>Number(i))
                else
                    return input;
            }

            else if (node.mode_input == "batch_number")
            {
                var distance = parseFloat(input);

                var valueArray = node.getContextArray();
                valueArray.push(distance);
                return valueArray;
            }
            
        }

        node.setError = function(textMessage)
        {
            node.status({fill:"red",shape:"ring", text: textMessage});
            node.warn(textMessage);
        };

        node.getContextArray = function()
        {
            var context = node.context();
            return context.get('valueArray')||new Array(0);
        };

        node.setContextArray = function(valueArray)
        {
            var context = node.context();
            context.set('valueArray',valueArray);
        };

        node.filterOutliers = function(valueArray, mode)
        {
            // simple median
            var median = simpleStatistics.median(valueArray);

            // https://mathworld.wolfram.com/Outlier.html
            // max allowed distance is 1.5 times the interquartileRange above third quartile or below first quartile
            var maxAllowedDistance = 1.5 * simpleStatistics.interquartileRange(valueArray);
            var firstQuartile = simpleStatistics.quantile(valueArray, 0.25);
            var thirdQuartile = simpleStatistics.quantile(valueArray, 0.75);
            if (mode == "remove")
            {
                var filteredArray = valueArray.filter(x => (x < thirdQuartile + maxAllowedDistance) && (x > firstQuartile - maxAllowedDistance));
                return filteredArray;
            }
            else if (mode == "get")
            {
                var filteredArray = valueArray.filter(x => (x > thirdQuartile + maxAllowedDistance) || (x < firstQuartile - maxAllowedDistance));
                return filteredArray;
            }
            else
            {
                node.setError("invalid outlier mode " +  mode + "!");
                return valueArray;
            }
        }

        node.setOutput = function(msg, valueArray, mode)
        {
            if (mode == "median"){
                var value = simpleStatistics.median(valueArray);
                msg.payload = value;
            }
            else if (mode == "array"){
                msg.payload = valueArray;
            }
            node.send(msg);
        }

        node.setStatus = function(msg, valueArray)
        {
            var outputText = ""
            if (node.mode_input == "batch_number"){
                outputText = valueArray.length + "/" + node.numberOfSamples;
                if (valueArray.length == 0){
                    if (node.mode_output == "median")
                        outputText = "Median: " + msg.payload;
                    else if (node.mode_output == "array")
                        outputText = "Output length: " + msg.payload.length;
                }
            }
            else if(node.mode_input == "array")
                outputText = "Output length: " + msg.payload.length;

            node.status({fill:"green",shape:"ring", text: outputText});
        }
    }
    RED.nodes.registerType("outlier",outlier);
}
