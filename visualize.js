(function() {
  var ctx = document.getElementById("myChart").getContext('2d');

  let createDatasetFromBenchmarks = (benchmarks) => {
    let ds = []

    for (let i = 0; i < benchmarks.length; ++i) {
      let b = benchmarks[i]
      ds.push({
        label: b.bench + " - " + b.folder + " - " + b.userName,
        data: b.data.map((v) => { return { x: v[0], y: v[1] } }),
        fill: false,
        backgroundColor: colors[i][0],
        borderColor: colors[i][0]
      })
    }

    return ds
  }

  let datasets = createDatasetFromBenchmarks(bench)

  let chart = new Chart(ctx, {
    type: 'scatter',
    options: {
      legend: {
        display: false
      },
      maintainAspectRatio: false,
      responsive: true,
      tooltips: {
        backgroundColor: '#364149',
        enabled: true,
        mode: 'single',
        custom: function(tooltip) {
          if (!tooltip)
            return
          tooltip.displayColors = false
          tooltip.yPadding = 3
        },
        callbacks: {
          title: function(tooltipItem, data) {
            return "Bench: " + data['datasets'][tooltipItem[0].datasetIndex]['label'].split(" - ")[0]
          },
          label: function(tooltipItem, data) {
            var labels = data['datasets'][tooltipItem['datasetIndex']]['label'].split(" - ")
            return [ "User: " + labels[2], "Timestamp: " + labels[1].replace("_"," ")  ]
          }
        }
      }
      },
      data: {
        datasets: datasets
    }
  })

  let systemInfoList = document.getElementById("systemInfos")
  let systemInfoDiv = document.getElementById("systemInfo")

  let handleResize = (ev) => {
    var selectorHeight = document.getElementById("checkboxes").clientHeight

    var displayHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    var availableHeight = displayHeight - document.getElementById("header").clientHeight - document.getElementById("systemInfo").clientHeight - 60
    var maxAvailableHeight = Math.max(selectorHeight, availableHeight)
    document.getElementById("wrapper").style.maxHeight = maxAvailableHeight + "px"
  }

  let formatBytes = (a,b) => {
    if (0 == a)
      return "0 Bytes"
    var c=1024,d=b||2,e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],f=Math.floor(Math.log(a)/Math.log(c))
    return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]
  }

  let updateSystemInfo = (benchmarks) => {
    let systemInfos = [...new Set(benchmarks.map(b => JSON.stringify(b.systemInfo, null, 2)))]
    if (systemInfos.length == 1) {
      let displayInfos = JSON.parse(systemInfos)
      let infoItems = ["platform", "release", "cpus", "freemem", "totalmem", "load", "nodeversion"]

      infoItems.forEach((el) => {
        if (displayInfos[el] instanceof Array) {
          if (el == "load")
            displayInfos[el] = displayInfos[el].map(loadValue => loadValue.toFixed(2))
          document.getElementById(el).innerHTML = displayInfos[el].join("<br />")
        }
        else {
          if (el == "freemem" || el == "totalmem")
            displayInfos[el] = formatBytes(displayInfos[el],2)
          document.getElementById(el).innerHTML = displayInfos[el]
        }
      })

      systemInfoDiv.classList.remove("hidden")
      handleResize()
    }
    else {
      systemInfoDiv.classList.add("hidden")
      handleResize()
    }
  }

  let updateTimestampDisplay = (benchmarks) => {
    let folders = [...new Set(benchmarks.map(b => b.folder))]
    var folderItems = document.querySelectorAll('#folderSelect li');
    for (var i = 0; i < folderItems.length; i++) {
      if (folders.includes(folderItems[i].id))
        folderItems[i].classList.remove('hidden');
      else
        folderItems[i].classList.add('hidden');
    }
  }

  let handleChange = (ev) => {
    let filteredBench = bench

    let selectedBenchItems = Array.from(document.querySelectorAll('#benchSelect input:checked')).map(opt => opt.value)
    if (selectedBenchItems.length > 0)
      filteredBench = filteredBench.filter((b) => selectedBenchItems.includes(b.bench))

    let selectedUserItems = Array.from(document.querySelectorAll('#userSelect input:checked')).map(opt => opt.value)
    if (selectedUserItems.length > 0)
      filteredBench = filteredBench.filter((b) => selectedUserItems.includes(b.userId))

    updateTimestampDisplay(filteredBench)

    let selectedFolderItems = Array.from(document.querySelectorAll('#folderSelect input:checked')).map(opt => opt.value)
    if (selectedFolderItems.length > 0)
      filteredBench = filteredBench.filter((b) => selectedFolderItems.includes(b.folder))

    chart.data.datasets = createDatasetFromBenchmarks(filteredBench)
    chart.update()

    updateSystemInfo(filteredBench)
  }

  updateSystemInfo(bench)

  handleResize()

  benchSelect.onchange = handleChange
  userSelect.onchange = handleChange
  folderSelect.onchange = handleChange

  window.addEventListener("resize", handleResize, false);
})();
