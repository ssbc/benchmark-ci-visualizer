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

  var myChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: datasets
    }
  })
})();
