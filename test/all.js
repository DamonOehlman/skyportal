var test = require('tape');
var skyportal = require('../');
var commands = require('../commands');
var portal;

test('it can find a skyportal', function(t) {
  t.plan(1);
  t.ok(portal = skyportal.find(), 'portal found');
});

test('it will not find the 10th skyportal (if it does, then wow)', function(t) {
  t.plan(1);
  t.notOk(skyportal.find(9), 'did not find the 10th skyportal (as expected)');
});

test('open a portal', function(t) {
  t.plan(1);
  skyportal.open(portal, function(err) {
    t.ifError(err, 'opened ok');
  });
});

test('change the color of the portal (separate rgb arguments)', function(t) {
  t.plan(1);
  skyportal.send(commands.color(255, 255, 255), portal, function(err) {
    t.ifError(err, 'no error');
  });
});

test('change the color of the portal (rgb array)', function(t) {
  t.plan(1);
  skyportal.send(commands.color([255, 0, 0]), portal, function(err) {
    t.ifError(err, 'no error');
  });
});

test('read the status of the portal', function(t) {
  t.plan(2);
  skyportal.read(portal, function(err, data) {
    t.ifError(err);
    t.ok(data instanceof Buffer, 'have some data');
  });
});