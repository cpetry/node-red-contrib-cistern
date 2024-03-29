var helper = require("node-red-node-test-helper");
var outlier = require("../outlier.js");

helper.init(require.resolve('node-red'));

describe('outlier Node', function () {
  
    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });
  

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "outlier", name: "test name" }];
    helper.load(outlier, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        expect(n1).toHaveProperty('name', 'test name');
        done();
      } catch(err) {
        done(err);
      }
    });
  });

  it('should show error when input is null', function (done) {
    var flow = [
       { id: "n1", type: "outlier", numberOfSamples: "5", mode_input: "batch_number", mode_outlier: "remove", mode_output: "median", max_interquartile_range: "2", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {

        var resultNode = helper.getNode("result");
        var n1 = helper.getNode("n1");
        n1.receive(null);
        n1.warn.should.be.called();
        done();
    });
  });

  it('should show error when input is has no payload', function (done) {
    var flow = [
       { id: "n1", type: "outlier", numberOfSamples: "5", mode_input: "batch_number", mode_outlier: "remove", mode_output: "median", max_interquartile_range: "2", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {

        var resultNode = helper.getNode("result");
        var n1 = helper.getNode("n1");
        n1.receive({ something: "input"});
        n1.warn.should.be.called();
        done();
    });
  });

  it('should show error when input is not a number', function (done) {
    var flow = [
       { id: "n1", type: "outlier", numberOfSamples: "5", mode_input: "batch_number", mode_outlier: "remove", mode_output: "median", max_interquartile_range: "2", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {

        var resultNode = helper.getNode("result");
        var n1 = helper.getNode("n1");
        n1.receive({ payload: "Something" });
        n1.warn.should.be.called();
        done();
    });
  });
  
  it('should get nothing when receive is below numberOfSamples', function (done) {
    var flow = [
       { id: "n1", type: "outlier", numberOfSamples: "5", mode_input: "batch_number", mode_outlier: "remove", mode_output: "median", max_interquartile_range: "2", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {

        var resultNode = helper.getNode("result");
        var n1 = helper.getNode("n1");
        n1.receive({ payload: "1" });
        n1.receive({ payload: "2" });
        n1.receive({ payload: "3" });
        n1.receive({ payload: "4" });
        n1.warn.should.not.be.called();
        done();
    });
  });
  

  it('should clear array when numberOfSamples reached', function (done) {
    var flow = [
       { id: "n1", type: "outlier", numberOfSamples: "5", mode_input: "batch_number", mode_outlier: "remove", mode_output: "median", max_interquartile_range: "2", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {

        var resultNode = helper.getNode("result");
        var n1 = helper.getNode("n1");
        n1.receive({ payload: "1" });
        if (n1.getContextArray().length == 0)
          done(error)
        n1.receive({ payload: "2" });
        n1.receive({ payload: "3" });
        n1.receive({ payload: "4" });
        n1.receive({ payload: "5" });
        var valueArray = n1.context().get('valueArray');
        if(valueArray.length != 0)
          done(error);
        done();
    });
  });

  it('should get median of array when mode_input is batch and mode_output is median', function (done) {
    var flow = [
       { id: "n1", type: "outlier", numberOfSamples: "8", mode_input: "batch_number", mode_outlier: "remove", mode_output: "median", max_interquartile_range: "6", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {

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
        n1.warn.should.not.be.called();
    });
  });

  it('should get filtered array of input when mode_input is batch and mode_output is array', function (done) {
    var flow = [
       { id: "n1", type: "outlier", numberOfSamples: "8", mode_input: "batch_number", mode_outlier: "remove", mode_output: "array", max_interquartile_range: "6", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {

        var resultNode = helper.getNode("result");
        resultNode.on("input", function (msg) {
            try {
                msg.should.have.property('payload', [1,3,4,2,7,5,8,6] );
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
        n1.warn.should.not.be.called();
    });
  });

  it('should get median of array when mode_input is string array', function (done) {
    var flow = [
       { id: "n1", type: "outlier", mode_input: "array", mode_outlier: "remove", mode_output: "median", max_interquartile_range: "6", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {
  
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
        n1.receive({ payload: ["1", "3", "4", "2", "7", "5", "8", "6"] });
        n1.warn.should.not.be.called();
    });
  });

  it('should get median of array when mode_input is number array equal entries', function (done) {
    var flow = [
       { id: "n1", type: "outlier", mode_input: "array", mode_outlier: "remove", mode_output: "median", max_interquartile_range: "6", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {
  
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
        n1.receive({ payload: [1, 3, 4, 2, 7, 5, 8, 6] });
        n1.warn.should.not.be.called();
    });
  });

  
  it('should get median of array when mode_input is number array', function (done) {
    var flow = [
       { id: "n1", type: "outlier", mode_input: "array", mode_outlier: "remove", mode_output: "median", max_interquartile_range: "6", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {
  
        var resultNode = helper.getNode("result");
        resultNode.on("input", function (msg) {
            try {
                msg.should.have.property('payload', 1.5 );
                done();
            } catch(err) {
                done(err);
            }
        });
        
        var n1 = helper.getNode("n1");
        n1.receive({ payload: [1, 1, 2, 8] });
        n1.warn.should.not.be.called();
    });
  });

  it('should get mean of array when mode_input is number array', function (done) {
    var flow = [
       { id: "n1", type: "outlier", mode_input: "array", mode_outlier: "remove", mode_output: "mean", max_interquartile_range: "6", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {
  
        var resultNode = helper.getNode("result");
        resultNode.on("input", function (msg) {
            try {
                msg.should.have.property('payload', 3 );
                done();
            } catch(err) {
                done(err);
            }
        });
        
        var n1 = helper.getNode("n1");
        n1.receive({ payload: [1, 1, 2, 8] });
        n1.warn.should.not.be.called();
    });
  });

  it('should get mode of array when mode_input is number array', function (done) {
    var flow = [
       { id: "n1", type: "outlier", mode_input: "array", mode_outlier: "remove", mode_output: "mode", max_interquartile_range: "6", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {
  
        var resultNode = helper.getNode("result");
        resultNode.on("input", function (msg) {
            try {
                msg.should.have.property('payload', 1 );
                done();
            } catch(err) {
                done(err);
            }
        });
        
        var n1 = helper.getNode("n1");
        n1.receive({ payload: [1, 1, 2, 8] });
        n1.warn.should.not.be.called();
    });
  });

  it('should get filtered array of input when mode_input is array, and mode_outlier is remove and mode_output is array', function (done) {
    var flow = [
       { id: "n1", type: "outlier", mode_input: "array", mode_outlier: "remove", mode_output: "array", max_interquartile_range: "6", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {
  
        var resultNode = helper.getNode("result");
        resultNode.on("input", function (msg) {
            try {
                msg.should.have.property('payload', [1, 2, 5, 4, 7, 8, 3, 4, 2, 7, 5, 8, 6] );
                done();
            } catch(err) {
                done(err);
            }
        });
        
        var n1 = helper.getNode("n1");
        n1.receive({ payload: [1, 2, 5, 4, 7, 8, 3, 22, 4, 2, 7, 5, -55, 8, 6] });
        n1.warn.should.not.be.called();
    });
  });

  it('should get filtered array of input when mode_input is array and mode_outlier is get and mode_output is array', function (done) {
    var flow = [
       { id: "n1", type: "outlier", mode_input: "array", mode_outlier: "get", mode_output: "array", max_interquartile_range: "6", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {
  
        var resultNode = helper.getNode("result");
        resultNode.on("input", function (msg) {
            try {
                msg.should.have.property('payload', [22, -55] );
                done();
            } catch(err) {
                done(err);
            }
        });
        
        var n1 = helper.getNode("n1");
        n1.receive({ payload: [1, 2, 5, 4, 7, 8, 3, 22, 4, 2, 7, 5, -55, 8, 6] });
        n1.warn.should.not.be.called();
    });
  });

  it('should show error when input array is empty', function (done) {
    var flow = [
       { id: "n1", type: "outlier", mode_input: "array", mode_outlier: "remove", mode_output: "median", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {
        var n1 = helper.getNode("n1");
        n1.receive({ payload: [] });
        n1.warn.should.be.called();
        done();
    });
  });

  it('should not output when max allowed outlier reached', function (done) {
    var flow = [
       { id: "n1", type: "outlier", mode_input: "array", mode_outlier: "remove", mode_output: "median", max_interquartile_range: "2", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {
        var resultNode = helper.getNode("result");
        const spy = jest.spyOn(resultNode, 'warn');
        var n1 = helper.getNode("n1");
        n1.receive({ payload: [1, 3, -22, 4, 2, 7, 5, -55, 8, 6] });
        expect(spy).not.toHaveBeenCalled();
        done();
    });
  });

  it('should not filter at all when all values are equal', function (done) {
    var flow = [
       { id: "n1", type: "outlier", mode_input: "array", mode_outlier: "remove", mode_output: "median", max_interquartile_range: "2", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {
        var resultNode = helper.getNode("result");
        const spy = jest.spyOn(resultNode, 'warn');
        var n1 = helper.getNode("n1");
        n1.receive({ payload: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2] });
        expect(spy).not.toHaveBeenCalled();
        done();
    });
  });

  it('should output when max allowed outlier not reached', function (done) {
    var flow = [
       { id: "n1", type: "outlier", mode_input: "array", mode_outlier: "remove", mode_output: "median", max_interquartile_range: "1", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {
        var resultNode = helper.getNode("result");
        resultNode.on("input", function (msg) {
            try {
                msg.should.have.property('payload');
                done();
            } catch(err) {
                done(err);
            }
        });
        var n1 = helper.getNode("n1");
        n1.receive({ payload: [18, 17, 15, 14 ,12 ,11 ,11, 11, 10, 10, 11, 10, 11, 10, 11, 11, 10, 11, 11, 10, 11, 11] });
        n1.warn.should.not.be.called();
    });
  });

  it('should output when max allowed outlier not reached', function (done) {
    var flow = [
       { id: "n1", type: "outlier", mode_input: "array", mode_outlier: "remove", mode_output: "median", max_interquartile_range: "2.5", wires:[["result"]] },
       { id: "result", type: "helper",  },
    ];
    helper.load(outlier, flow, function () {
        var resultNode = helper.getNode("result");
        resultNode.on("input", function (msg) {
            try {
                msg.should.have.property('payload');
                done();
            } catch(err) {
                done(err);
            }
        });
        var n1 = helper.getNode("n1");
        n1.receive({ payload: [132, 135, 132, 131, 131.1, 132.2, 133.4, 132, 135, 132, 131, 131.1, 132.2, 133.4, 132, 135, 132, 131, 131.1, 132.2, 133.4, 132, 135, 132, 131, 131.1, 132.2, 133.4, 132, 135, 132, 131, 131.1, 132.2, 133.4, 132, 135, 132, 131, 131.1, 132.2, 133.4] });
        n1.warn.should.not.be.called();
    });
  });
});
