(function() {
  var ctx = document.getElementById("myChart").getContext('2d');

  let createDatasetFromBenchmarks = (benchmarks) => {
    let ds = []

    for (let i = 0; i < benchmarks.length; ++i) {
      let b = benchmarks[i]
      ds.push({
        label: b.bench,
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
    data: {
      datasets: datasets
    }
  })

  let benchSelect = document.getElementById("benchSelect")
  let userSelect = document.getElementById("userSelect")
  let folderSelect = document.getElementById("folderSelect")
  let systemInfoDiv = document.getElementById("systemInfo")

  let handleChange = (ev) => {
    let filteredBench = bench

    let selectedBenchItems = Array.from(benchSelect.selectedOptions).map(opt => opt.value)
    if (selectedBenchItems.length > 0)
      filteredBench = filteredBench.filter((b) => selectedBenchItems.includes(b.bench))

    let selectedUserItems = Array.from(userSelect.selectedOptions).map(opt => opt.value)
    if (selectedUserItems.length > 0)
      filteredBench = filteredBench.filter((b) => selectedUserItems.includes(b.user))

    let selectedFolderItems = Array.from(folderSelect.selectedOptions).map(opt => opt.value)
    if (selectedFolderItems.length > 0)
      filteredBench = filteredBench.filter((b) => selectedFolderItems.includes(b.folder))

    chart.data.datasets = createDatasetFromBenchmarks(filteredBench)
    chart.update()

    updateSystemInfo(filteredBench)
  }

  let updateSystemInfo = (benchmarks) => {
    let systemInfos = [...new Set(benchmarks.map(b => JSON.stringify(b.systemInfo, null, 2)))]
    if (systemInfos.length == 1)
      systemInfoDiv.innerHTML = "System info:" + systemInfos[0]
  }

  updateSystemInfo(bench)

  benchSelect.onchange = handleChange
  userSelect.onchange = handleChange
  folderSelect.onchange = handleChange

})();
