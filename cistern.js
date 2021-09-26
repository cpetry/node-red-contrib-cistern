module.exports = function(RED) {
    function Cistern(config) {
        RED.nodes.createNode(this,config);
        this.radius = config.radius;
        this.minDistance = config.minDistance;
        this.maxDistance = config.maxDistance;
        var node = this;
        node.on('input', function(msg) {
            distance = msg.payload;

            var nodeContext = this.context();
            if (typeof nodeContext.measureValues !== 'undefined' && nodeContext.measureValues.length > 0) {
                // the array is defined and has at least one element
                nodeContext.measureValues = []
            }

            circle = (node.radius * node.radius) * Math.PI;
            fullVolume = circle * node.minDistance; // full cistern
            emptyVolume = circle * node.maxDistance; // empty cistern
            currentVolume = circle * distance;

            if (fullVolume <= emptyVolume)
            {
                this.error("Invalid min and max distances: min='" + minDistance + "', max='" + maxDistance + "'");
                this.status({fill:"red",shape:"ring",text:"error"});
                return;
            }
            else if (distance < 0)
            {
                this.error("Invalid input distance: '" + distance + "'");
                this.status({fill:"red",shape:"ring",text:"error"});
                return;
            }


            liters = currentVolume * 1000;
            var msgLiters = { payload: liters } // 1 m³ = 1000 liters

            percentage = (fullVolume - currentVolume) / (fullVolume - emptyVolume);
            var msgPercentage = { payload: currentVolume } 

            var outputText = "" + liters + "l / " + percentage + "%";
            this.status({fill:"green",shape:"ring",text: outputText});

            this.send([ msgLiters , msgPercentage ]);
        });
    }
    RED.nodes.registerType("cistern",Cistern);
}
