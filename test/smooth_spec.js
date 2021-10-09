var should = require("should");
var helper = require("node-red-node-test-helper");
var smooth = require("../smooth.js");

helper.init(require.resolve('node-red'));

describe('smooth Node', function () {
  
    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });
  

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "smooth", name: "test name" }];
    helper.load(smooth, flow, function () {
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
       { id: "n1", type: "smooth", numberOfSamples: "5", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(smooth, flow, function () {

        var resultNode = helper.getNode("result");
        var n1 = helper.getNode("n1");
        n1.receive(null);
        n1.warn.should.be.called();
        n1.should.not.have.called("context");
        done();
    });
  });

  it('should show error when input is has no payload', function (done) {
    var flow = [
       { id: "n1", type: "smooth", numberOfSamples: "5", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(smooth, flow, function () {

        var resultNode = helper.getNode("result");
        var n1 = helper.getNode("n1");
        n1.receive({ something: "input"});
        n1.warn.should.be.called;
        done();
    });
  });

  it('should show error when input is not a number', function (done) {
    var flow = [
       { id: "n1", type: "smooth", numberOfSamples: "5", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(smooth, flow, function () {

        var resultNode = helper.getNode("result");
        var n1 = helper.getNode("n1");
        n1.receive({ payload: "Something" });
        n1.warn.should.be.called;
        done();
    });
  });
  
  it('should get nothing when receive is below numberOfSamples', function (done) {
    var flow = [
       { id: "n1", type: "smooth", numberOfSamples: "5", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(smooth, flow, function () {

        var resultNode = helper.getNode("result");
        var n1 = helper.getNode("n1");
        n1.receive({ payload: "1" });
        n1.receive({ payload: "2" });
        n1.receive({ payload: "3" });
        n1.receive({ payload: "4" });
        resultNode.should.not.have.called("input");
        done();
    });
  });
  

  it('should clear array when numberOfSamples reached', function (done) {
    var flow = [
       { id: "n1", type: "smooth", numberOfSamples: "5", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(smooth, flow, function () {

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
       { id: "n1", type: "smooth", numberOfSamples: "8", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(smooth, flow, function () {

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
