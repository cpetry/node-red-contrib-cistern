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

            var distance = node.getDistance(msg.payload);

            var radius = parseFloat(node.radius);
            var circle = Math.PI * radius * radius;
            var minDistance = parseFloat(node.minDistance);
            var maxDistance = parseFloat(node.maxDistance);
            if (maxDistance <= minDistance)
            {
                this.error("Invalid min and max distances: min='" + minDistance + "', max='" + maxDistance + "'");
                this.status({fill:"red",shape:"ring",text:"max < min!"});
                return;
            }
            else if ((Array.isArray(distance) && distance.every(x => x > maxDistance)) || distance > maxDistance)
            {
                this.warn("Input distance is greater than maxDistance!");
                this.status({fill:"yellow",shape:"ring",text:"distance > max!"});
            }

            var deltaDistance = maxDistance - minDistance;
            var fullVolume = circle * deltaDistance
            if (Array.isArray(distance))
                currentVolume = distance.map(x => circle * (maxDistance - x));
            else
                currentVolume = circle * (maxDistance - distance);

            if (Array.isArray(distance))
                liters = currentVolume.map(x => x * 1000); // 1 m³ = 1000 liters
            else
                liters = currentVolume * 1000; // 1 m³ = 1000 liters
            var msgLiters = { payload: liters }

            percentage = currentVolume / fullVolume;
            var msgPercentage = { payload: percentage } 

            var fullLiters = fullVolume * 1000;
            if (!Array.isArray(distance))
            {
                var outputText = "" + liters.toFixed(2) + " l / " + fullLiters.toFixed(2) + " l, " + (percentage * 100).toFixed(2) + " %";
                node.status({fill:"green",shape:"ring",text: outputText});
            }
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

            if (Array.isArray(msg.payload))
                return true;

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

        node.getDistance = function(payload)
        {
            if (Array.isArray(payload))
                value = payload.map(x=>node.convertDistance(x));
            else
                value = node.convertDistance(payload);
            return value;
        }

        node.convertDistance = function(payload)
        {
            var distance = parseFloat(payload);
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
                    distance *= 1;
                    break;
                case "inch":
                    distance *= 0.0254;
                    break;
            }
            return distance;
        }
    }
    RED.nodes.registerType("cistern",Cistern);
}
