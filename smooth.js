var simpleStatistics = require("simple-statistics");

module.exports = function(RED) {
    function smooth(config) {
        RED.nodes.createNode(this,config);
        this.numberOfSamples = config.numberOfSamples;
        var node = this;

        this.on('close', function() {
            var context = node.context();
            context.set('valueArray',new Array(0));
        });

        node.on('input', function(msg) {
            
            var hasValidInput = node.checkInput(msg);
            if (!hasValidInput)
                return;

            var distance = parseFloat(msg.payload);

            var valueArray = node.getContextArray();
            valueArray.push(distance);
            
            if (valueArray.length >= node.numberOfSamples)
            {
                var filteredArray = node.removeOutliers(valueArray);
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
            node.setContextArray(valueArray);

            var outputText = valueArray.join(',');
            node.status({fill:"green",shape:"ring", text: valueArray.length});
        });

        node.checkInput = function(msg)
        {
            if (msg == null || !msg.hasOwnProperty("payload"))
            {
                node.setError("msg.payload invalid or does not exist!");
                return false;
            }

            var distance = parseFloat(msg.payload);
            if (distance == NaN)
            {
                node.setError("msg.payload is not a number!");
                return false;
            }

            return true;
        };

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

        node.removeOutliers = function(valueArray)
        {
            // simple median
            var median = simpleStatistics.median(valueArray);

            // https://mathworld.wolfram.com/Outlier.html
            // max allowed distance is 1.5 times the interquartileRange above third quartile or below first quartile
            var maxAllowedDistance = 1.5 * simpleStatistics.interquartileRange(valueArray);
            var firstQuartile = simpleStatistics.quantile(valueArray, 0.25);
            var thirdQuartile = simpleStatistics.quantile(valueArray, 0.75);
            var filteredArray = valueArray.filter(x => x < thirdQuartile + maxAllowedDistance);
            filteredArray = filteredArray.filter(x => x > firstQuartile - maxAllowedDistance);
            return filteredArray;
        }
    }
    RED.nodes.registerType("smooth",smooth);
}
