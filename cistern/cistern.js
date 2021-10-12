module.exports = function(RED) {
    function Cistern(config) {
        RED.nodes.createNode(this,config);
        this.radius = config.radius;
        this.minDistance = config.minDistance;
        this.maxDistance = config.maxDistance;
        this.unit_input = config.unit_input;
        var node = this;
        node.on('input', function(msg) {
            var isValid = node.checkInput(msg);
            if (!isValid)
                return;

            var distance = parseFloat(msg.payload);
            if (distance < 0)
            {
                this.error("Invalid input distance: '" + distance + "'");
                this.status({fill:"red",shape:"ring",text:"distance < 0"});
                return;
            }
            switch(node.unit_input)
            {
                case "mm":
                    distance /= 1000;
                    break;
                case "cm":
                    distance /= 100;
                    break;
                case "m":
                    break;
                case "inch":
                    distance *= 0.0254;
                    break;
                default:
                    this.error("Unknown input unit: '" + node.unit_input + "'");
                    this.status({fill:"red",shape:"ring",text:"Unknown unit '" + node.unit_input + "'"});
                    return;
            }

            var radius = parseFloat(node.radius);
            var circle = (radius * radius) * Math.PI;
            var minDistance = parseFloat(node.minDistance);
            var maxDistance = parseFloat(node.maxDistance);
            if (maxDistance <= minDistance)
            {
                this.error("Invalid min and max distances: min='" + minDistance + "', max='" + maxDistance + "'");
                this.status({fill:"red",shape:"ring",text:"max < min!"});
                return;
            }
            else if (distance > maxDistance)
            {
                this.warn("Input distance is greater than maxDistance!");
                this.status({fill:"yellow",shape:"ring",text:"distance > max!"});
            }

            var deltaDistance = maxDistance - minDistance;
            var fullVolume = circle * deltaDistance
            currentVolume = circle * (maxDistance - distance);

            var liters = currentVolume * 1000; // 1 m³ = 1000 liters
            var msgLiters = { payload: liters }

            percentage = currentVolume / fullVolume;
            var msgPercentage = { payload: percentage } 

            var fullLiters = fullVolume * 1000;
            var outputText = "" + liters.toFixed(2) + " l / " + fullLiters.toFixed(2) + " l, " + (percentage * 100).toFixed(2) + " %";
            node.status({fill:"green",shape:"ring",text: outputText});

            node.send([ msgLiters , msgPercentage ]);
        });

        node.checkInput = function(msg)
        {
            if (msg == null || !msg.hasOwnProperty("payload"))
            {
                node.error("msg.payload is null!");
                node.status({fill:"red",shape:"ring",text:"msg.payload is null!"});
                return false;
            }
            var distance = parseFloat(msg.payload);
            if (isNaN(distance))
            {
                node.error("Invalid input distance: '" + distance + "'");
                node.status({fill:"red",shape:"ring",text:"distance < 0"});
                return false;
            }
            else if (distance < 0)
            {
                node.error("Invalid input distance: '" + distance + "'");
                node.status({fill:"red",shape:"ring",text:"distance < 0"});
                return false;
            }

            return true;
        }
    }
    RED.nodes.registerType("cistern",Cistern);
}
