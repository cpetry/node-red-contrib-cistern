var simpleStatistics = require("simple-statistics");

module.exports = function(RED) {
    function MeasureValueSmooth(config) {
        RED.nodes.createNode(this,config);
        this.numberOfSamples = config.numberOfSamples;
        this.valueRangeInPercentage = config.valueRangeInPercentage;
        var node = this;
        node.on('input', function(msg) {
            var distance = parseFloat(msg.payload);
            if (distance == NaN){
                node.status({fill:"red",shape:"ring", text: "msg.payload is not a number!"});
                return;
            }
            
            var valueArray = node.getContextArray();
            valueArray.push(distance);
            
            if (valueArray.length >= node.numberOfSamples)
            {
                var filteredArray = node.removeOutliers(valueArray);
                if (filteredArray.length == 0)
                {
                    node.status({fill:"red",shape:"ring", text: "error filtering outliers"});
                    return;
                }
                msg.payload = simpleStatistics.mean(filteredArray);
                node.send(msg);
                valueArray = new Array();
            }
            node.setContextArray(valueArray);

            var outputText = valueArray.join(',');
            node.status({fill:"green",shape:"ring", text: valueArray.length});
        });

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
    RED.nodes.registerType("measureValueSmooth",MeasureValueSmooth);
}
