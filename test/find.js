var test = require('tape');
var skyportal = require('../');


test('it can find a skyportal', function(t) {
  t.plan(1);
  t.ok(skyportal.find(), 'portal found');
});

test('it will not find the 10th skyportal (if it does, then wow)', function(t) {
  t.plan(1);
  t.notOk(skyportal.find(9), 'did not find the 10th skyportal (as expected)');
});