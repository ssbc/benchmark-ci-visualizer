(function() {
  var ctx = document.getElementById("myChart").getContext('2d');

  let datasets = []

  for (var i = 1; i <= 11; ++i) {
    let num = String(i).padStart(2, '0')
    let name = Object.keys(bench[i])[0]
    datasets.push({
      label: num + ': ' + name,
      data: bench[i][name].map((v) => { return { x: v[0], y: v[1] } }),
      fill: false,
      backgroundColor: colors[i][0],
      borderColor: colors[i][0]
    })
  }

  let chart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: datasets
    }
  })

  let select = document.getElementById("benchSelect")
  select.onchange = (ev) => {
    let selectedIndexes = Array.from(select.selectedOptions).map(opt => parseInt(opt.value))
    if (selectedIndexes.length == 0)
      chart.data.datasets = datasets
    else
      chart.data.datasets = datasets.filter((el, i) => selectedIndexes.includes(i))

    chart.update()
  }
})();
