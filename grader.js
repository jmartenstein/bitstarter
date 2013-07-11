#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

   + JSON
     - http://en.wikipedia.org/wiki/JSON
     - https://developer.mozilla.org/en-US/docs/JSON
     - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program  = require('commander');
var cheerio  = require('cheerio');
var rest     = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
  var instr = infile.toString();
  if(!fs.existsSync(instr)) {
    console.log("%s does not exist. Exiting.", instr);
    process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
  }
  return instr;
};

var html2Output = function(html_string, checks_file) {
  $ = cheerio.load(html_string);
  var checks = loadChecks(checks_file).sort();
  var out = {};
  for(var ii in checks) {
    var present = $(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  var outJson = JSON.stringify(out, null, 4);
  console.log(outJson);
}

var buildfn_url = function(checksfile) {
  var response2output = function(result, response) {
    var ouput = {}
    if (result instanceof Error) {
      sys.puts('Error: ' + util.format(response.message));
    } else {
      html2Output(result, checksfile);
    }
  }
  return response2output;
}

var buildfn_file = function(checksfile) {
  var data2output = function(err,data) {
    var ouput = {}
    if (err instanceof Error) {
      sys.puts('Error: ' + util.format(data.message));
    } else {
      html2Output(data, checksfile);
    }
  }
  return data2output;
}

var loadChecks = function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlUrl = function(urlstring, checksfile) {
  var response2output = buildfn_url(checksfile);
  rest.get(urlstring).on('complete', response2output);
}

var checkHtmlFile = function(htmlfile, checksfile) {
  var data2output = buildfn_file(checksfile);
  fs.readFile(htmlfile, data2output);
}

var clone = function(fn) {
  // Workaround for commander.js issue.
  // http://stackoverflow.com/a/6772648
  return fn.bind({});
};

if(require.main == module) {
  program
    .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists))
    .option('-u, --url <html_url>', 'Path to web url')
    .parse(process.argv);

  if (program.file !== undefined) {
    checkHtmlFile(program.file, program.checks);
  }
  if (program.url !== undefined) {
    checkHtmlUrl(program.url, program.checks);
  }
} else {
  exports.checkHtmlFile = checkHtmlFile;
  exports.checkHtmlUrl = checkHtmlFile;
}
