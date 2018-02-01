var http = require('http')
var fs = require('fs');
var path = require('path');
var h = require('hyperscript');
var colors = require('nice-color-palettes')

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

  let dataScripts = []
  dataScripts.push(h('script', "var bench = {}"))

  let selectOptions = []

  let parseAndAddFile = (filename) => {
    if (filename.indexOf(".json") == -1) return
    
    let pathname = path.basename(filename)
    let data = fs.readFileSync(filename)
    let json = JSON.parse(data)
    let benchName = Object.keys(json)[0] // we expect only 1 per file

    selectOptions.push(h('option', { value: benchName }, pathname + ' ' + benchName))
    dataScripts.push(h('script', 'bench["' + benchName + '"] = ' + JSON.stringify(json[benchName])))
  }

  let parseDir = (path) => {
    let contents = fs.readdirSync(path)
    contents.forEach((content) => {
      let stat = fs.statSync(path + content)
      if (stat.isDirectory())
        parseDir(path + content + "/")
      else
        parseAndAddFile(path + content)
    })
  }
  
  let sharedir = '../bench-ssb-share/'

  parseDir(sharedir)
  
  let runScript = h('script')
  runScript.innerHTML = fs.readFileSync('visualize.js')

  let html = '<!doctype html>' +
        h('html',
          [h('head',
             [h('title', 'Benchmark ci visualizer'),
              chartScript, colorScript, dataScripts]),
           h('body',
             [h('h1', "Bench ssb"),
              h('select', { id: 'benchSelect', multiple: '' }, selectOptions),
              h('canvas', { id: "myChart", width: "400", height: "400" }),
              runScript]
            )]).outerHTML

  return respond(res, 200, html)
}

function respond(res, status, message) {
  res.writeHead(status)
  res.end(message)
}
