
// ============================
// Intial setup
// ============================

// let width = 300; //document.getElementById("chart").offsetWidth
// let height = 150; // document.getElementById("chart").offsetWidth / 2

function drawChartPossibleFuncs() {

  const svg = d3.select("#chart-possible-funcs").append("svg").attr("viewBox", [0, 0, width, height]);

  let y_linear = xtilde.map((i) => 0.14 * i - 0.4 );
  let y_quad1 = xtilde.map((i) => -0.03*i*(i-10) - 1 + 0.05*i);
  let y_quad2 = xtilde.map((i) => -0.6 + 0.01*i**2);
  let y_cubic = xtilde.map((i) => -0.6 + 0.005*(6.8-i)**3);

  let data_linear = xtilde.map((d, i) => ({x: xtilde[i], y: y_linear[i]}));
  let data_quad1 = xtilde.map((d, i) => ({x: xtilde[i], y: y_quad1[i]}));
  let data_quad2 = xtilde.map((d, i) => ({x: xtilde[i], y: y_quad2[i]}));
  let data_cubic = xtilde.map((d, i) => ({x: xtilde[i], y: y_cubic[i]}));

  // ============================
  // Set up shapes for model
  // ============================

  // Set up model mean and std deviations
  const modelLine = d3.line()
    .curve(d3.curveBasis)
    .x((d,i) => xscale(d.x))
    .y((d,i) => yscale(d.y));

  function handleMouseover(event) {
    d3.select(event.currentTarget).attr("stroke", "red");
  };

  function handleMouseout(event) {
    d3.select(event.currentTarget).attr("stroke", "lightgray");
  };

  // ============================
  // Add model elements to svg
  // ============================

  // Model parameters
  const modelLineGroup = svg.append("g")
    .attr("stroke", "lightgray")
    .attr("stroke-width", 3)
    .attr('fill', 'none');

  svg.append("g")
    .call(xAxis);

  svg.append("g")
    .call(yAxis);

  // Initial drawing  
  update();


  function update() {
    
    modelLineGroup.selectAll('.modelLineLinear')
      .data([data_linear])
      .join('path')
      .attr('class', 'modelLineLinear')
      .attr('d', d => modelLine(d))
      .on("mouseover", (event) => handleMouseover(event))
      .on("mouseout", (event) => handleMouseout(event));
    
    modelLineGroup.selectAll('.modelQuad1')
      .data([data_quad1])
      .join('path')
      .attr('class', 'modelQuad1')
      .attr('d', d => modelLine(d))
      .on("mouseover", (event) => handleMouseover(event))
      .on("mouseout", (event) => handleMouseout(event));
    
    modelLineGroup.selectAll('.modelQuad2')
      .data([data_quad2])
      .join('path')
      .attr('class', 'modelQuad2')
      .attr('d', d => modelLine(d))
      .on("mouseover", (event) => handleMouseover(event))
      .on("mouseout", (event) => handleMouseout(event));
    
    modelLineGroup.selectAll('.modelCubic')
      .data([data_cubic])
      .join('path')
      .attr('class', 'modelCubic')
      .attr('d', d => modelLine(d))
      .on("mouseover", (event) => handleMouseover(event))
      .on("mouseout", (event) => handleMouseout(event));
  }
};

drawChartPossibleFuncs();