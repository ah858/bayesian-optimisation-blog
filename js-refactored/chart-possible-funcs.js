
// ============================
// Intial setup
// ============================

// let width = 300; //document.getElementById("chart").offsetWidth
// let height = 150; // document.getElementById("chart").offsetWidth / 2

function drawChartPossibleFuncs() {
  
  const svg = d3.select("#chart-possible-funcs").append("svg").attr("viewBox", [0, 0, width, height]);
  
  let num_gp_samples = 4;
  let max_sample_height = 0.85; // Constant to rescale sample-curve height to (roughly)
  let transition_dur = 2000; // Transition duration
  
  let gp_samples = [];
  for (let i = 0; i < num_gp_samples; i++) {
      let sample = sample_from_gp_prior(xtilde, kernel);
      // To make the samples aesthetic, rescale limits to have a given max
      sample = math.multiply(sample, max_sample_height / math.max(math.abs(sample)));
      gp_samples.push(sample);
  }

  let data_comb = xtilde.map((d, i) => ({x: xtilde[i], 
                                         y1: gp_samples[0][i], 
                                         y2: gp_samples[1][i], 
                                         y3: gp_samples[2][i], 
                                         y4: gp_samples[3][i]}));


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
    // .attr("stroke", colors[1])
    // .attr("stroke-width", 4)
    .attr("stroke", colors[2])
    .attr("stroke-dasharray", (3, 5)) // match this to the underlying function style used later
    .attr("stroke-width", 2)
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