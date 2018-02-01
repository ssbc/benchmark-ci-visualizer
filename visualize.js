(function() {
  var ctx = document.getElementById("myChart").getContext('2d');

  let datasets = []
  let i = 0
  
  for (var key in bench) {
    datasets.push({
      label: key,
      data: bench[key].map((v) => { return { x: v[0], y: v[1] } }),
      fill: false,
      backgroundColor: colors[i][0],
      borderColor: colors[i][0]
    })
    ++i
  }

  let chart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: datasets
    }
  })

  let select = document.getElementById("benchSelect")
  select.onchange = (ev) => {
    let selectedItems = Array.from(select.selectedOptions).map(opt => opt.value)
    if (selectedItems.length == 0)
      chart.data.datasets = datasets
    else
      chart.data.datasets = datasets.filter((d) => selectedItems.includes(d.label))

    chart.update()
  }
})();
