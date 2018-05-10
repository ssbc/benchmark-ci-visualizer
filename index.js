var http = require('http')
var fs = require('fs')
var path = require('path')
var h = require('hyperscript')
var colors = require('nice-color-palettes')
var lo = require('lodash')

var program = require('commander');

program
  .option('-h, --host [value]', 'Host to listen to', 'localhost')
  .option('-p, --port [value]', 'Port to listen on', 8811)
  .option('-r, --results [value]', 'Path to where results are stored', '../bench-ssb-share/')
  .parse(process.argv);

require('ssb-client')(function (err, sbot, config) {
  if (err) {
    console.log(err)
    return
  }

  sbot.about.get((err, allAbouts) => {
    http.createServer(function(req, res) { return serve(allAbouts, req, res) }).listen(program.port, program.host, function () {
      console.log('[viewer] Listening on http://' + program.host + ':' + program.port)
    })
  })
})

function ifModified(req, lastMod) {
  var ifModSince = req.headers['if-modified-since']
  if (!ifModSince) return false
  var d = new Date(ifModSince)
  return d && Math.floor(d/1000) >= Math.floor(lastMod/1000)
}

function serveFile(req, res, file) {
  fs.stat(file, function (err, stat) {
    if (err && err.code === 'ENOENT') return respond(res, 404, 'Not found')
    if (err) return respond(res, 500, err.stack || err)
    if (!stat.isFile()) return respond(res, 403, 'May only load files')
    if (ifModified(req, stat.mtime)) return respond(res, 304, 'Not modified')
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Last-Modified': stat.mtime.toGMTString()
    })
    fs.createReadStream(file).pipe(res)
  })
}

function serve(abouts, req, res) {
  console.log("serving request: ", req.url)

  if (req.method !== 'GET' && req.method !== 'HEAD')
    return respond(res, 405, 'Method must be GET or HEAD')
  else if (req.url == "/hermies.png")
    return serveFile(req, res, "hermies.png")
  else if (req.url != "/")
    return respond(res, 200, '')
  
  let chartScript = h('script')
  chartScript.innerHTML = fs.readFileSync('node_modules/chart.js/dist/Chart.js')

  let colorScript =  h('script', "var colors = " + JSON.stringify(colors))

  let styles = h('style')
  styles.innerHTML = fs.readFileSync('styles.css')

  let benchmarks = []

  let parseAndAddFile = (filename, userFolder, runFolder) => {
    let pathname = path.basename(filename)

    if (!filename.endsWith(".json") || pathname == 'system-info.json') return

    let data = fs.readFileSync(filename)
    let json = JSON.parse(data)
    let benchName = Object.keys(json)[0] // we expect only 1 per file
    let systemInfo = {}

    try {
      systemInfo = JSON.parse(fs.readFileSync(filename.replace(pathname, "system-info.json"), "utf8"))
    } catch (ex) {
      console.log("error reading system-info.json for ", filename)
    }

    let values = abouts[userFolder]

    let userName = userFolder, userImage = ""

    for (var key in values) {
      for (var author in values[key]) {
        if (author != userFolder)
          break;

        var v = values[key][author][0]

        if (!v) break;

        if (key == 'name') userName = v
        if (key == 'image') userImage = typeof v == 'string' ? v : v.link
      }
    }

    let benchData = {
      userId: userFolder,
      userName: userName,
      userImage: userImage,
      folder: runFolder,
      pathname,
      bench: benchName,
      data: json[benchName],
      systemInfo
    }

    benchmarks.push(benchData)
  }

  let parseDir = (dir, userFolder, runFolder) => {
    let contents = fs.readdirSync(dir)
    contents.forEach((content) => {
      let stat = fs.statSync(dir + content)
      if (stat.isDirectory())
        parseDir(dir + content + "/",
                 userFolder == null ? content : userFolder,
                 userFolder != null && runFolder == null ? content : runFolder)
      else
        parseAndAddFile(dir + content, userFolder, runFolder)
    })
  }
  
  parseDir(program.results)

  let benchOptions = []
  lo.uniqBy(benchmarks, (el) => [el.bench, el.pathname].join()).forEach((el) => {
      benchOptions.push(h('li', [ h('input', { type: 'checkbox', value: el.bench }),
                                  h('label', { class: 'checkboxLabel' }, el.pathname.replace("bench-","").replace(".json","") + ' ' + el.bench) ]))
  })

  let userOptions = []
  lo.uniqBy(benchmarks, 'user').forEach((el) => {
    userOptions.push(h('li', [ h('input', { type: 'checkbox', value: el.userId }),
                               h('img', { src: 'http://localhost:8989/blobs/get/' + el.userImage, class: 'avatar' }),
                               h('label', { class: 'checkboxLabel' }, el.userName)
                             ]))
  })

  let folderOptions = []
    lo.orderBy(lo.uniqBy(benchmarks, 'folder'), 'folder').forEach((el) => {
        folderOptions.push(h('li', { id : el.folder }, [ h('input', { type: 'checkbox', value: el.folder }),
                                   h('label', { class: 'checkboxLabel' }, el.folder.replace("_"," ")) ]))
    })

    let infoItems = [ ["platform", "freemem"], ["release", "totalmem"], ["cpus", "load"] , ["nodeversion", ""]]
    let systemInfos = []
    infoItems.forEach((el) => {
        systemInfos.push( h( 'tr', [ h( 'td', { class: 'tableLabel' }, el[0]), h( 'td', { id: el[0], class: 'tableContent' } ),
                                   h( 'td', { class: 'tableLabel' }, el[1]), h( 'td', { id: el[1], class: 'tableContent' } )]))
    })

  let dataScript = h('script', "var bench = " + JSON.stringify(benchmarks))
  
  let runScript = h('script')
  runScript.innerHTML = fs.readFileSync('visualize.js')

  let html = '<!doctype html>' +
        h('html',
          [h('head',
             [h('title', 'Benchmark ci visualizer'),
              styles,chartScript, colorScript, dataScript]),
           h('body',
             [ h('div', { id: 'header' }, [
                 h('img', { id: "logo", src: 'hermies.png' }),
                 h('h1', "Benchmark SSB")
               ]),
               h('div', { id: 'checkboxes' }, [
               h('div', { id: 'benchCheckboxes'}, [
                 h('h4', 'Benchmarks'),
                 h('ul', { id: 'benchSelect' }, benchOptions),
               ]),
               h('div', { id: 'userCheckboxes'}, [
                 h('h4', 'Users'),
                 h('ul', { id: 'userSelect' }, userOptions),
               ]),
               h('div', { id: 'folderCheckboxes'}, [
                 h('h4', 'Timestamps'),
                 h('ul', { id: 'folderSelect' }, folderOptions),
               ])
               ]),
               h('div', { id: 'wrapper' }, h('canvas', { id: "myChart" })),

               h('div', { id: 'systemInfo' }, [
                 h('h4', 'System information'),
                 h('table', { id: 'systemInfos' }, systemInfos),
               ]),
               runScript]
            )]).outerHTML

  return respond(res, 200, html)
}

function respond(res, status, message) {
  res.writeHead(status)
  res.end(message)
}
