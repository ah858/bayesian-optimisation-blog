
// ============================
// Intial setup
// ============================

// let width = 300; //document.getElementById("chart").offsetWidth
// let height = 150; // document.getElementById("chart").offsetWidth / 2

function drawChartPossibleFuncs() {
  
  const svg = d3.select("#chart-possible-funcs").append("svg").attr("viewBox", [0, 0, width, height]);
  
  let y1 = xtilde.map((i) => {
            let n = (i-5)/4.5;
            return (0.01*(n-1)*(7-n)*(n-8));
          });
  let y2 = xtilde.map((i) => {
            let n = (i-5)/4.5;
            return (0.5 + 0.003*(n-1)*(n-3)*(n-6)*(n-10) -0.03*n*(n-10) - 1 + 0.05*n);
          });
  let y3 = xtilde.map((i) => {
            let n = (i-5)/4.5;
            return (-0.2 + 0.005*(n-4)**3);
          });
  let y4 = xtilde.map((i) => {
            let n = (i-5)/4.5;
            return (-0.6 + 0.005*(6.8-n)**3);
          });
 
  let data_comb = xtilde.map((d, i) => ({x: xtilde[i], 
                                         y1: y1[i], 
                                         y2: y2[i], 
                                         y3: y3[i], 
                                         y4: y4[i]}));
  // ============================
  // Set up shapes for model
  // ============================
  
  // Set up model mean and std deviations
  const modelLine1 = d3.line()
    .curve(d3.curveBasis)
    .x((d,i) => xscale(d.x))
    .y((d,i) => yscale(d.y1));
 
  const modelLine2 = d3.line()
    .curve(d3.curveBasis)
    .x((d,i) => xscale(d.x))
    .y((d,i) => yscale(d.y2));
  
  const modelLine3 = d3.line()
    .curve(d3.curveBasis)
    .x((d,i) => xscale(d.x))
    .y((d,i) => yscale(d.y3));
  
  const modelLine4 = d3.line()
    .curve(d3.curveBasis)
    .x((d,i) => xscale(d.x))
    .y((d,i) => yscale(d.y4));
  
  // ============================
  // Add model elements to svg
  // ============================
  
  // Background y grid
  svg.append("g")
    .call(yGrid, height, width);

  // Model parameters
  const modelLineGroup = svg.append("g")
    .attr("stroke", "red")
    // .attr("stroke-width", 3)
    .attr('fill', 'none');

  svg.append("g")
    .call(xAxis, height, width);
  
  svg.append("g")
    .call(yAxis, height);

  svg.append("g")
    .call(xLabel, height, width);

  svg.append("g")
    .call(yLabel, height);


  update();
  
  function update() {
    
    const modelLineObject = modelLineGroup.selectAll('.modelLineTransition')
      .data([data_comb])
      .join('path')
      .attr('class', 'modelLineTransition')
      .attr('d', d => modelLine1(d));
    
    function repeat() {
      modelLineObject
      .transition()
      .duration(2000)
      .attr('d', d => modelLine2(d))
      .transition()
      .duration(2000)
      .attr('d', d => modelLine3(d))
      .transition()
      .duration(2000)
      .attr('d', d => modelLine4(d))
      .transition()
      .duration(2000)
      .attr('d', d => modelLine1(d))
      .on("end", repeat);  // when the transition finishes start again
    };
    
    repeat();
    
  }
};

drawChartPossibleFuncs();