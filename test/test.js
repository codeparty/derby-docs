var hashd = require('hashd');
var assert = require('better-assert');
var docs = require('../index');
var rimraf = require('rimraf');
var path = require('path');

var source = __dirname + '/source';
var dest = __dirname + '/dest';

var wrappers = __dirname + '/fixtures/wrappers';
var expected = __dirname + '/fixtures/expected';

docs({
  source: source,
  dest: dest,
  wrappers: wrappers
});

var bin = path.resolve(__dirname + '/../bin');

before(function(done) {
  rimraf(dest + '/*', function(err) {
    assert(!err);
    done();
  });
});

describe('A sanity Test', function() {
  it('should pass', function() {
    assert(true);
  });
});

//
// Todo, better tests at some point.
//
describe('Generated files', function() {
  it('should match the expected files', function() {
    
    var hash1 = hashd(dest);
    var hash2 = hashd(expected);
    assert(hash1 == hash2);
  });
});

