var simpleStatistics = require("simple-statistics");

module.exports = function(RED) {
    function outlier(config) {
        RED.nodes.createNode(this,config);
        this.numberOfSamples = config.numberOfSamples;
        this.mode_input = config.mode_input;
        this.mode_outliers = config.mode_outliers;
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
                var filteredArray = node.filterOutliers(valueArray, node.mode_outliers);
                if (filteredArray.length == 0)
                {
                    node.setError("Error filtering outliers. No value left!");
                    return;
                }
                var value = simpleStatistics.mean(filteredArray);
                node.log("Output mean value: " + value);
                msg.payload = value;
                node.send(msg);
                valueArray = new Array(0);
            }

            if (node.mode_input == "batch_number")
                node.setContextArray(valueArray);

            var outputText = ""
            if (node.mode_input == "batch_number")
            {
                outputText = valueArray.length + "/" + node.numberOfSamples;
                if (valueArray.length == 0)
                    outputText = "Mean: " + msg.payload;
            }
            else if(node.mode_input == "array")
                outputText = "";

            node.status({fill:"green",shape:"ring", text: outputText});
        });

        node.checkInputArray = function(msg)
        {
            if (Array.isArray(msg.payload))
            {
                node.setError("msg.payload should be an array!");
                return true;
            }
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
                var filteredArray = valueArray.filter(x => x < thirdQuartile + maxAllowedDistance);
                filteredArray = filteredArray.filter(x => x > firstQuartile - maxAllowedDistance);
                return filteredArray;
            }
            else if (mode == "get")
            {
                var filteredArray = valueArray.filter(x => x > thirdQuartile + maxAllowedDistance);
                filteredArray = filteredArray.filter(x => x < firstQuartile - maxAllowedDistance);
                return filteredArray;
            }
            else
            {
                node.setError("invalid outlier mode " +  mode + "!");
                return valueArray;
            }
        }
    }
    RED.nodes.registerType("outlier",outlier);
}
