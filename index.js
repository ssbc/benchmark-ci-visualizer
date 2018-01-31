var http = require('http')
var fs = require('fs');
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

  let colorScript =  h('script')
  colorScript.innerHTML = "var colors = " + JSON.stringify(colors)

  let dataScripts = []
  let dataScriptStart = h('script')
  dataScriptStart.innerHTML = "var bench = {}"
  dataScripts.push(dataScriptStart)

  for (var i = 1; i <= 11; ++i) {
    let num = String(i).padStart(2, '0')
    let dataScript = h('script')
    dataScript.innerHTML = 'bench[' + i + '] = ' + fs.readFileSync('../bench-ssb-share/@6CAxOI3f+LUOVrbAl0IemqiS7ATpQvr9Mdw9LC4+Uv0=.ed25519/bench-' + num + '.json')
    dataScripts.push(dataScript)
  }
  
  let runScript = h('script')
  runScript.innerHTML = fs.readFileSync('visualize.js')
  
  let html = '<!doctype html>' +
        h('html',
          [h('head',
             [h('title', 'Benchmark ci visualizer'),
              chartScript, colorScript, dataScripts]),
           h('body',
             [h('h1', "Bench ssb"),
              h('canvas', { id: "myChart", width: "400", height: "400" }),
              runScript]
            )]).outerHTML

  return respond(res, 200, html)
}

function respond(res, status, message) {
  res.writeHead(status)
  res.end(message)
}
