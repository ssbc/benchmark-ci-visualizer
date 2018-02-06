var http = require('http')
var fs = require('fs');
var path = require('path');
var h = require('hyperscript');
var colors = require('nice-color-palettes')
var lo = require('lodash')

let port = 8811
let host = "localhost"

http.createServer(serve).listen(port, host, function () {
  console.log('[viewer] Listening on http://' + host + ':' + port)
})

function serve(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD')
    return respond(res, 405, 'Method must be GET or HEAD')
  else if (req.url != "/")
    return respond(res, 200, '')
  
  console.log("serving request: ", req.url)
  
  let chartScript = h('script')
  chartScript.innerHTML = fs.readFileSync('node_modules/chart.js/dist/Chart.js')

  let colorScript =  h('script', "var colors = " + JSON.stringify(colors))

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
      console.log("error reading system-info.json", ex)
    }

    let benchData = {
      user: userFolder,
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
  
  let sharedir = '../bench-ssb-share/'

  parseDir(sharedir)

  let benchSelectOptions = []

  lo.uniqBy(benchmarks, (el) => [el.bench, el.pathname]).forEach((el) => {
    benchSelectOptions.push(h('option', { value: el.bench }, el.pathname + ' ' + el.bench))
  })

  let userSelectOptions = []

  lo.uniqBy(benchmarks, 'user').forEach((el) => {
    userSelectOptions.push(h('option', { value: el.user }, el.user))
  })

  let folderSelectOptions = []

  lo.uniqBy(benchmarks, 'folder').forEach((el) => {
    folderSelectOptions.push(h('option', { value: el.folder }, el.folder))
  })

  let dataScript = h('script', "var bench = " + JSON.stringify(benchmarks))
  
  let runScript = h('script')
  runScript.innerHTML = fs.readFileSync('visualize.js')

  let html = '<!doctype html>' +
        h('html',
          [h('head',
             [h('title', 'Benchmark ci visualizer'),
              chartScript, colorScript, dataScript]),
           h('body',
             [h('h1', "Bench ssb"),
              h('select', { id: 'benchSelect', multiple: '' }, benchSelectOptions),
              h('select', { id: 'userSelect', multiple: '' }, userSelectOptions),
              h('select', { id: 'folderSelect', multiple: '' }, folderSelectOptions),
              h('div', { id: 'systemInfo' }),
              h('canvas', { id: "myChart", width: "400", height: "400" }),
              runScript]
            )]).outerHTML

  return respond(res, 200, html)
}

function respond(res, status, message) {
  res.writeHead(status)
  res.end(message)
}
