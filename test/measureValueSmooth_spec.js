var should = require("should");
var helper = require("node-red-node-test-helper");
var measureValueSmooth = require("../measureValueSmooth.js");

helper.init(require.resolve('node-red'));

describe('measureValueSmooth Node', function () {
  
    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });
  

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "measureValueSmooth", name: "test name" }];
    helper.load(measureValueSmooth, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.property('name', 'test name');
        done();
      } catch(err) {
        done(err);
      }
    });
  });

  it('should show error when input is not a number', function (done) {
    var flow = [
       { id: "n1", type: "measureValueSmooth", numberOfSamples: "5", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(measureValueSmooth, flow, function () {

        var resultNode = helper.getNode("result");
        var n1 = helper.getNode("n1");
        n1.receive({ payload: "Something" });
        n1.should.not.have.called("context");
        done();
    });
  });
  
  it('should get nothing when receive is below numberOfSamples', function (done) {
    var flow = [
       { id: "n1", type: "measureValueSmooth", numberOfSamples: "5", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(measureValueSmooth, flow, function () {

        var resultNode = helper.getNode("result");
        var n1 = helper.getNode("n1");
        n1.receive({ payload: "1" });
        n1.receive({ payload: "2" });
        n1.receive({ payload: "3" });
        n1.receive({ payload: "4" });
        //n1.should.have.called("context");
        resultNode.should.not.have.called("input");
        done();
    });
  });
  

  it('should clear array when numberOfSamples reached', function (done) {
    var flow = [
       { id: "n1", type: "measureValueSmooth", numberOfSamples: "5", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(measureValueSmooth, flow, function () {

        var resultNode = helper.getNode("result");
        var n1 = helper.getNode("n1");
        n1.receive({ payload: "1" });
        if (n1.getContextArray().length == 0)
          done(error)
        n1.receive({ payload: "2" });
        n1.receive({ payload: "3" });
        n1.receive({ payload: "4" });
        n1.receive({ payload: "5" });
        if(n1.getContextArray().length == 0)
          done();
    });
  });

  it('should get mean of array', function (done) {
    var flow = [
       { id: "n1", type: "measureValueSmooth", numberOfSamples: "8", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(measureValueSmooth, flow, function () {

        var resultNode = helper.getNode("result");
        resultNode.on("input", function (msg) {
            try {
                msg.should.have.property('payload', 4.5 );
                done();
            } catch(err) {
                done(err);
            }
        });
        
        var n1 = helper.getNode("n1");
        n1.receive({ payload: "1" });
        n1.receive({ payload: "3" });
        n1.receive({ payload: "4" });
        n1.receive({ payload: "2" });
        n1.receive({ payload: "7" });
        n1.receive({ payload: "5" });
        n1.receive({ payload: "8" });
        n1.receive({ payload: "6" });
    });
  });
});
