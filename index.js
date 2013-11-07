var path = require('path');
var fs = require('fs');
var md = require('marked');
var hljs = require('highlight.js');

md.setOptions({
  gfm: true,
  highlight: function (code, lang) {
    return hljs.highlightAuto(lang, code).value;
  },
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  langPrefix: 'lang-'
});

var internalTOC = [];
var externalTOC = [];
var allcontent = [];

var expH1 = /<h1(.*?)<\/h1>/;
var expH2 = /<h2(.*?)<\/h2>/gi;
var expID = /<([^\s]+).*?id="([^"]*?)".*?>(.+?)<\/\1>/;

module.exports = function(opts, cb) {

  //
  // get the header and footer to wrap individual items
  // as well as the all-in-one doc.
  //
  var headerpath = path.join(opts.wrappers, 'header.html');
  var footerpath = path.join(opts.wrappers, 'footer.html');

  var header = fs.readFileSync(headerpath).toString();
  var footer = fs.readFileSync(footerpath).toString();

  opts.ignore = opts.ignore || ['.git', 'node_modules'];
  console.log('Building docs from markdown files in %s', opts.source);

  function createLink(href, text, classname) {

    return [
      '<li><a href="', href, '" class="', classname, '">', 
      text, 
      '</a></li>'
    ].join('');
  }

  //
  // parse for h1 and h2 to build the internal and external TOCs.
  //
  function compile(data, p) {

    var dest = p
      .replace(opts.source, opts.dest)
      .replace('.md', '.html');

    var relativepath = p
      .replace(opts.source, '')
      .replace('.md', '.html');

    md(data.toString(), function (err, markup) {
      if (err) return cb(err);

      var H1 = markup.match(expH1);
      var H2 = markup.match(expH2);

      if (H1) {
        var id = H1[0].match(expID);
        internalTOC.push(createLink('#' + id[2], id[3], 'parimary'));
        externalTOC.push(createLink(relativepath, id[3], 'primary'));
      }

      if (H2) {
        H2.forEach(function(tag) {
          var id = tag.match(expID);
          internalTOC.push(createLink('#' + id[2], id[3], 'secondary'));
          externalTOC.push(createLink(relativepath, id[3], 'secondary'));
        });
      }

      allcontent.push(markup);
      fs.writeFileSync(dest, [header, markup, footer].join('\n'));
    });
  }

  var depth = [];

  function build(d) {

    var dir = fs.readdirSync(d);

    dir.forEach(function(entry) {
      var p = path.join(d, entry);
      var stat = fs.statSync(p);

      if (opts.ignore.indexOf(path.basename(d)) > 0) {
        return;
      }

      var rpath = depth.join('/');

      if (stat.isDirectory()) {
        depth.push(p.replace(opts.source, ''));
        
        try {
          var np = p.replace(opts.source, opts.dest);
          fs.mkdirSync(np);
        }
        catch(ex) {
          if (ex.code != 'EEXIST') {
            throw ex;
          }
        }
        build(p);
      }
      else if (p.indexOf('.md') > -1) {
        compile(
          fs.readFileSync(p),
          path.join(p)
        );
      }
      depth.pop();
    });
  }

  //
  // recurse the source directory.
  //
  build(opts.source);

  //
  // wrap and flatten the data.
  //
  function buildTOC(a) {
    return [
      '<nav role="navigation">',
        '<ul class="toc">',
          a.join('\n'),
        '</ul>',
      '</nav>'
    ].join('\n');
  }

  function buildContent(a) {
    return [
      '<section role="main">',
        a.join('\n'),
      '</section>'
    ].join('\n');
  }

  //
  // Build a version with everything.
  //
  fs.writeFileSync(
    path.join(opts.dest, '/index.html'),
    [
      header,
      buildTOC(internalTOC),
      buildContent(allcontent),
      footer
    ].join('\n')
  );

  //
  // Build a toc for the individual files.
  //
  fs.writeFileSync(
    path.join(opts.dest, '/toc.html'),
    [
      header,
      buildTOC(externalTOC),
      footer
    ].join('\n')
  );
}

