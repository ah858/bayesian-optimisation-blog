function drawChartExploreExploit() {
  const initial_points_chosen = [
    {"x":26.5998,"y":-0.2},
    {"x":32.9,"y":-0.5},
    {"x":42.0,"y":0.25},
    {"x":46.85,"y":0.17}
  ];
  const plot_points = initial_points_chosen.slice(0);

  
  // ============================
  // Event listeners for scroll positions
  // ============================



  // ============================
  // Begin D3 code
  // ============================

  const svg = d3.select("#chart-ei-explanation").append("svg").attr("viewBox", [0, 0, width, height]);

  // Background y grid
  svg.append("g")
   .call(yGrid, height, width);

  svg.append("g")
    .call(xAxis, height, width);
  
  svg.append("g")
    .call(yAxis, height);

  svg.append("g")
    .call(xLabel, height, width);

  svg.append("g")
    .call(yLabel, height);
  

  // ============================
  // Set up shapes for model
  // ============================
  
  // Set up model mean and std deviations
  const modelLine = d3.line()
    .curve(d3.curveBasis)
    .x(d => xscale(d.x))
    .y(d => yscale(d.mean))
  
  const area = d3.area()
    .curve(d3.curveBasis)
    .x(d => xscale(d.x))
    .y0(d => yscale(d.lower))
    .y1(d => yscale(d.upper));
  
  const area2 = d3.area()
    .curve(d3.curveBasis)
    .x(d => xscale(d.x))
    .y0(d => yscale(d.lower2))
    .y1(d => yscale(d.upper2));
  
  // ============================
  // Add model elements to svg
  // ============================
  
  // Model parameters
  const modelMean = svg.append("g")
    .attr("stroke", "black")
    .attr("fill", "transparent");

  const envelope = svg.append("g")
    .attr("stroke", "transparent")
    .attr("fill", "rgba(0,0,100,0.05)");
  
  const envelope2 = svg.append("g")
    .attr("stroke", "transparent")
    .attr("fill", "rgba(0,0,100,0.1)");
  
  const underlyingMean = svg.append("g")
    .attr("stroke", "red")
    .attr("stroke-dasharray", (3, 5))
    .attr("stroke-width", 2)
    .attr("fill", "transparent");
  
  // ============================
  // Add other elements to svg
  // ============================
 
  // Use rect in the background to capture click events and handle point creation
  const backgroundRect = svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    // Transparent "white", a fill is required to capture click events
    .attr("fill", "#fff0");
  
  // Restrict circles to a common group to set attributes collectively and avoid selecting unwanted elements
  const circles = svg.append("g")
    .attr("fill", "white")
    .attr("stroke", "black")
    .attr("class", "datapointCircle");
  
  // ============================
  // Make the plot into a heatmap
  // ============================
  let heatmap_y_resolution = 40;
  let heatmap_x_resolution = 60;
  let ygrid = [...Array(heatmap_y_resolution).keys()].map((i) => ymin + (ymax - ymin) * (i + 1) / (heatmap_y_resolution));
  let xgrid = [...Array(heatmap_x_resolution).keys()].map((i) => xmin + (xmax - xmin) * i / (heatmap_x_resolution));
    // .map(yscaleFunction);
  const heatmap_data = conditional_distribution_density_heatmap(
                      initial_points_chosen.map((d) => d.x),
                      initial_points_chosen.map((d) => d.y),
                      xgrid,
                      ygrid,
                      kernel
  )
  // Build color scale
  var myColor = d3.scaleSequential()
  // .interpolator(d3.interpolate("#05C0", "#005ACD"))
  .interpolator(d3.interpolate("#FFFFFF", "#005ACD"))
  .domain([0,d3.max(heatmap_data.map(d => d.density))]);

  // Sizes of "heatmap" rectangles
  let rectangle_width = (width - margin.left - margin.right) / heatmap_x_resolution;
  // let rectangle_height = (height - margin.top - margin.bottom) / heatmap_y_resolution;
  // Use Math.ceil because of weird interpolation issues
  // let rectangle_width = Math.ceil((width - margin.left - margin.right) / heatmap_x_resolution);
  let rectangle_height = Math.ceil((height - margin.top - margin.bottom) / heatmap_y_resolution);


  // ============================
  // Add a second plot
  // ============================

  // Initial drawing  
  update();

  // ============================
  // Event Listeners for buttons
  // ============================

  // d3.select("#button-explore-exploit-1")
  //   .on("click", (event) => drawNewPoint());

  // d3.select("#button-explore-exploit-2")
  //   .on("click", (event) => showVariance());

  // d3.select("#button-explore-exploit-3")
  //   .on("click", (event) => showUnderlying());
  
  function update() {
    
  svg.selectAll()
    .data(heatmap_data, function(d) {return d.x+':'+d.y;})
    .enter()
    .append("rect")
      .attr("x", d => xscale(d.x))
      .attr("y", d => yscale(d.y))
      .attr("width", rectangle_width)
      .attr("height", rectangle_height)
      .style("fill", d => myColor(d.density))
      .style("opacity", 1.0)
  
    // Draw new circles
    circles.selectAll("circle")
      .data(plot_points)
      .join(
        // Special handling for new elements only
        enter => enter.append("circle")
          .attr("r", 7)
      )
      // Applies to merged selection of new and old elements
      .attr("cx", d => xscale(d.x))
      .attr("cy", d => yscale(d.y));
    
    // Update conditional dist
    const dist = conditional_dist_with_confidence_intervals(initial_points_chosen.map((d) => d.x),
                                          initial_points_chosen.map((d) => d.y),
                                          xtilde,
                                          kernel);
    
    modelMean.selectAll('.mean')
      .data([dist])
      .join('path')
      .attr('class', 'mean')
      .attr('d', d => modelLine(d));

    envelope.selectAll('.envelope')
      .data([dist])
      .join('path')
      .attr('class', 'envelope')
      // .transition()
      // .duration(VARIANCE_TRANSITION_DURATION)
      // .attr("opacity", 1)
      .attr('d', d => area(d));
    
    envelope2.selectAll('.envelope2')
      .data([dist])
      .join('path')
      .attr('class', 'envelope2')
      // .transition()
      // .duration(VARIANCE_TRANSITION_DURATION)
      // .attr("opacity", 1)
      .attr('d', d => area2(d));

    svg.selectAll(".datapointCircle").raise();
    

    // Notify observable that the points have changed
    svg.dispatch("input");
  }
  
  // const addNewPoint = function() {
  //   // Only add the new point if the original 6 points exist
  //   if (plot_points.length == initial_points_chosen.length) {
  //     plot_points.push(selected_point);
  //   }
  //   drawNewPoint();
  // }

  // const drawNewPoint = function () {
  //   // Draw new circles
  //   circles.selectAll("circle")
  //     .data(plot_points)
  //     .join(
  //       // Special handling for new elements only
  //       enter => enter.append("circle")
  //         .attr("r", 0)
  //         .attr("fill", "#CC0000")
  //     )
  //     // Applies to merged selection of new and old elements
  //     .attr("cx", d => xscale(d.x))
  //     .attr("cy", d => yscale(d.y))
  //     .transition().duration(250).attr("r", 7)
  //     // .attrTween('r', () => {
  //     //   return function(t) { return 7*t - t*(1-t)*15; };
  //     // });
  // }

  // const addUnexploredArea = function() {
  //   // Only add the new point if the original 6 points exist
  //   if (highlight_circles.length == 0) {
  //     highlight_circles.push(unexplored_area_loc);
  //   }
  //   drawHighlightCircles();
  // }
  // const removeUnexploredArea = function() {
  //   // Only add the new point if the original 6 points exist
  //   if (highlight_circles.length > 0) {
  //     highlight_circles.pop();
  //   }
  //   drawHighlightCircles();
  // }


  // const drawHighlightCircles = function () {
  //   // Draw new circles
  //   highlight_circles.selectAll("circle")
  //     .data(highlight_circles)
  //     .join(
  //       // Special handling for new elements only
  //       enter => enter.append("circle")
  //         .attr("r", 30)
  //         // .attr("opacity", 0)
  //     )

  //     // Applies to merged selection of new and old elements
  //     .attr("cx", d => xscale(d.x))
  //     .attr("cy", d => yscale(d.y))
  //     // .transition().duration(250).attr("opacity", 0.5)
  // }

  // const removeNewPoint = function() {
  //   // Do not alter if only the original 6 points exist
  //   if (plot_points.length > initial_points_chosen.length) {
  //     plot_points.pop()
  //   }

  //   drawNewPoint();
  // }


  // const VARIANCE_TRANSITION_DURATION = 350;
  

  // const showVariance = function() {
  //   const dist = conditional_dist_with_confidence_intervals(initial_points_chosen.map((d) => d.x),
  //                                         initial_points_chosen.map((d) => d.y),
  //                                         xtilde,
  //                                         kernel);
  
  //   modelMean.selectAll('.mean')
  //     .data([dist])
  //     .join('path')
  //     .attr('class', 'mean')
  //     .attr('d', d => modelLine(d));
    
  //   envelope.selectAll('.envelope')
  //     .data([dist])
  //     .join('path')
  //     .attr('class', 'envelope')
  //     .transition()
  //     .duration(VARIANCE_TRANSITION_DURATION)
  //     .attr("opacity", 1)
  //     .attr('d', d => area(d));
    
  //   envelope2.selectAll('.envelope2')
  //     .data([dist])
  //     .join('path')
  //     .attr('class', 'envelope2')
  //     .transition()
  //     .duration(VARIANCE_TRANSITION_DURATION)
  //     .attr("opacity", 1)
  //     .attr('d', d => area2(d));
  // }

  // const hideVariance = function() {

  //   envelope.selectAll('.envelope')
  //     .transition()
  //     .duration(VARIANCE_TRANSITION_DURATION)
  //     .attr("opacity", 0);
  //   envelope2.selectAll('.envelope2')
  //     .transition()
  //     .duration(VARIANCE_TRANSITION_DURATION)
  //     .attr("opacity", 0);

  // }
  
  
}

drawChartExploreExploit() 