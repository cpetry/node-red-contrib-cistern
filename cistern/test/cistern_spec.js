var should = require("should");
var helper = require("node-red-node-test-helper");
var cistern = require("../cistern.js");

helper.init(require.resolve('node-red'));

describe('cistern Node', function () {
  
    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });
  

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "cistern", name: "test name" }];
    helper.load(cistern, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.property('name', 'test name');
        done();
      } catch(err) {
        done(err);
      }
    });
  });

  it('should show error when input is null', function (done) {
    var flow = [
       { id: "n1", type: "cistern", radius: "3", maxDistance: "4", minDistance: "1", unit_input: "m", wires:[["result"]] },
    ];
    helper.load(cistern, flow, function () {

        var n1 = helper.getNode("n1");
        n1.receive(null);
        n1.error.should.be.called();
        n1.should.not.have.called("context");
        done();
    });
  });

  it('should show error when input is has no payload', function (done) {
    var flow = [
       { id: "n1", type: "cistern", radius: "3", maxDistance: "4", minDistance: "1", unit_input: "m", wires:[["result"]] },
    ];
    helper.load(cistern, flow, function () {

        var n1 = helper.getNode("n1");
        n1.receive({ something: ""});
        n1.error.should.be.called();
        done();
    });
  });

  it('should show error when input is not a number', function (done) {
    var flow = [
       { id: "n1", type: "cistern", radius: "3", maxDistance: "4", minDistance: "1", unit_input: "m", wires:[["result"]] },
    ];
    helper.load(cistern, flow, function () {

        var n1 = helper.getNode("n1");
        n1.receive({ payload: "f" });
        n1.error.should.be.called();
        done();
    });
  });

  it('should show error when input is negative', function (done) {
    var flow = [
       { id: "n1", type: "cistern", radius: "3", maxDistance: "4", minDistance: "1", unit_input: "m", wires:[["result"]] },
    ];
    helper.load(cistern, flow, function () {

        var n1 = helper.getNode("n1");
        n1.receive({ payload: "-2" });
        n1.error.should.be.called();
        done();
    });
  });

  it('should show error when unit_input is invalid', function (done) {
    var flow = [
       { id: "n1", type: "cistern", radius: "3", maxDistance: "1", minDistance: "1", unit_input: "z", wires:[["result"]] },
    ];
    helper.load(cistern, flow, function () {

        var n1 = helper.getNode("n1");
        n1.receive({ payload: "1" });
        n1.error.should.be.called();
        done();
    });
  });

  it('should show error when maxDistance less or equal then minDistance is not a number', function (done) {
    var flow = [
       { id: "n1", type: "cistern", radius: "1", maxDistance: "1", minDistance: "1", unit_input: "m", wires:[["result"]] },
    ];
    helper.load(cistern, flow, function () {

        var n1 = helper.getNode("n1");
        n1.receive({ payload: "1" });
        n1.error.should.be.called();
        done();
    });
  });

  it('should show warning if radius is bigger than maxDistance', function (done) {
    var flow = [
       { id: "n1", type: "cistern", radius: "1", maxDistance: "3.2", minDistance: "1", unit_input: "m", wires:[["result"]] },
    ];
    helper.load(cistern, flow, function () {

        var n1 = helper.getNode("n1");
        n1.receive({ payload: "3.5" });
        n1.warn.should.be.called();
        done();
    });
  });

  it('should return correct liters', function (done) {
    var flow = [
       { id: "n1", type: "cistern", radius: "1.35", maxDistance: "3.2", minDistance: "1", unit_input: "m", wires:[["resultLiter"]] },
       { id: "resultLiter", type: "helper",  },
    ];
    helper.load(cistern, flow, function () {

        var result = helper.getNode("resultLiter");
        result.on("input", function (msg) {
            try {
                msg.payload.should.be.approximately(6870.66, 0.1 );
                done();
            } catch(err) {
                done(err);
            }
        });
        var n1 = helper.getNode("n1");
        n1.receive({ payload: "2" });
        n1.error.should.not.be.called();
    });
  });

  it('should return correct liters on array', function (done) {
    var flow = [
       { id: "n1", type: "cistern", radius: "1.35", maxDistance: "3.2", minDistance: "1", unit_input: "m", wires:[["resultLiter"]] },
       { id: "resultLiter", type: "helper",  },
    ];
    helper.load(cistern, flow, function () {

        var result = helper.getNode("resultLiter");
        result.on("input", function (msg) {
            try {
                msg.payload[0].should.be.approximately(6870.66, 0.1 );
                msg.payload[1].should.be.approximately(4007.89, 0.1 );
                done();
            } catch(err) {
                done(err);
            }
        });
        var n1 = helper.getNode("n1");
        n1.receive({ payload: ["2", "2.5"] });
        n1.error.should.not.be.called();
    });
  });

  it('should return correct liters when input is in cm', function (done) {
    var flow = [
       { id: "n1", type: "cistern", radius: "1.35", maxDistance: "3.2", minDistance: "1", unit_input: "cm", wires:[["resultLiter"]] },
       { id: "resultLiter", type: "helper",  },
    ];
    helper.load(cistern, flow, function () {

        var result = helper.getNode("resultLiter");
        result.on("input", function (msg) {
            try {
                msg.payload.should.be.approximately(6870.66, 0.1 );
                done();
            } catch(err) {
                done(err);
            }
        });
        var n1 = helper.getNode("n1");
        n1.receive({ payload: "200" });
        n1.error.should.not.be.called();
    });
  });

  it('should return correct liters when input is in mm', function (done) {
    var flow = [
       { id: "n1", type: "cistern", radius: "1.35", maxDistance: "3.2", minDistance: "1", unit_input: "mm", wires:[["resultLiter"]] },
       { id: "resultLiter", type: "helper",  },
    ];
    helper.load(cistern, flow, function () {

        var result = helper.getNode("resultLiter");
        result.on("input", function (msg) {
            try {
                msg.payload.should.be.approximately(6870.66, 0.1 );
                done();
            } catch(err) {
                done(err);
            }
        });
        var n1 = helper.getNode("n1");
        n1.receive({ payload: "2000" });
        n1.error.should.not.be.called();
    });
  });

  it('should return correct liters when input is in inch', function (done) {
    var flow = [
       { id: "n1", type: "cistern", radius: "1.35", maxDistance: "3.2", minDistance: "1", unit_input: "inch", wires:[["resultLiter"]] },
       { id: "resultLiter", type: "helper",  },
    ];
    helper.load(cistern, flow, function () {

        var result = helper.getNode("resultLiter");
        result.on("input", function (msg) {
            try {
                msg.payload.should.be.approximately(6870.66, 0.1 );
                done();
            } catch(err) {
                done(err);
            }
        });
        var n1 = helper.getNode("n1");
        n1.receive({ payload: "78.74015" });
        n1.error.should.not.be.called();
    });
  });

  it('should return correct percentage', function (done) {
    var flow = [
       { id: "n1", type: "cistern", radius: "1.35", maxDistance: "3.2", minDistance: "1", unit_input: "m", wires:[[], ["resultPercentage"]] },
       { id: "resultPercentage", type: "helper",  },
    ];
    helper.load(cistern, flow, function () {

        var result = helper.getNode("resultPercentage");
        result.on("input", function (msg) {
            try {
                msg.payload.should.be.approximately(0.5454, 0.001 );
                done();
            } catch(err) {
                done(err);
            }
        });
        var n1 = helper.getNode("n1");
        n1.receive({ payload: "2" });
        n1.error.should.not.be.called();
    });
  });
});
