#!/usr/bin/env node

// specify dependency
var testrunner = require("qunit");
var fs = require('fs');
var testsDir = process.env.TESTS_DIR || './tmp';
var path = require('path');
var exec = require('child_process').exec;

var excludedTests = [
  // auth_replication and cors need admin access (#1030)
  'test.auth_replication.js',
  'test.cors.js',
  //no workers in node
  'test.worker.js',
  // Plugins currnetly arent tested (#1031)
  'test.gql.js',
  'test.spatial.js'
];

var testFiles;

if (process.env.TEST_FILE) {
  testFiles = [process.env.TEST_FILE];
} else {
  testFiles = fs.readdirSync("./tests").filter(function(name){
    return (/^test\.([a-z0-9_])*\.js$/).test(name) &&
      (excludedTests.indexOf(name) === -1);
  });
}

testrunner.setup({
  log: {
    errors: true,
    summary: true
  }
});

function cleanup() {
  // Remove test databases and test allDbs database.
  exec('rm -r ' + testsDir);
}

exec('mkdir -p ' + testsDir, function () {
  process.env.TESTS_DIR = testsDir.slice(-1) === "/" ? testsDir : testsDir+"/";

  process.on('SIGINT', cleanup);
  process.on('exit', cleanup);

  testrunner.run({
    deps: [
      './lib/deps/extend.js',
      './lib/deps/blob.js',
      './lib/deps/ajax.js',
      './tests/pouch.shim.js'
    ],
    code: './lib/adapters/leveldb.js',
    tests: testFiles.map(function(n) {
      return "./tests/" + n;
    })
  }, function(err, result) {
    if (err) {
      console.error(err);
      process.exit(1);
      return;
    } else if (result.failed) {
      console.log('[node] failed ' + result.failed + ' out of ' + result.assertions + ' tests')
      process.exit(2);
      return;
    }
  });
});
