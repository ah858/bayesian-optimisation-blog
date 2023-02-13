function drawExpectedImprovementExplanationChart() {
  const points_chosen = [
    // {"x":26.5998,"y": ymin + 0.4 * (ymax - ymin)},
    // {"x":32.9,"y": ymin + 0.25* (ymax - ymin)},
    // {"x":42.0,"y": ymin + 0.62 * (ymax - ymin)},
    // {"x":46.85,"y":ymin + 0.55 * (ymax - ymin)}
    // {"x":6.1,"y": ymin + 0.57* (ymax - ymin)},
    {"x":8.7,"y":ymin + 0.58 * (ymax - ymin)},
    {"x":14.9,"y": ymin + 0.55 * (ymax - ymin)},
    {"x":41.1,"y": ymin + 0.5* (ymax - ymin)},
    {"x": 44,"y": ymin + 0.4 * (ymax - ymin)},
  ];
  const best_point_so_far = points_chosen.reduce((prev, curr) => (curr[1] > prev[1] ? curr : prev));
  const plot_points = points_chosen.slice(0);
  const slice_xloc = 22; // Location at which to slice through the plot to illustrate expected improvement

  
  // ============================
  // Event listeners for scroll positions
  // ============================



  // ============================
  // Begin D3 code
  // ============================

  const svg = d3.select("#chart-ei-explanation").append("svg").attr("viewBox", [0, 0, width, height]);

  // Background y grid
  const ygrid_gp = svg.append("g")
   .call(yGrid, height, width);

  const xaxis_gp = svg.append("g")
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
  // Compute the distribution for line GP plot
  // ============================

  // Compute the distribution for the line plot with confidence intervals
  const dist = conditional_dist_with_confidence_intervals(points_chosen.map((d) => d.x),
                                        points_chosen.map((d) => d.y),
                                        xtilde,
                                        kernel,
                                        mean_function);
  
  // ============================
  // Make the plot into a heatmap
  // ============================
  let heatmap_y_resolution = 40;
  let heatmap_x_resolution = 60;
  let rectangle_width = (width - margin.left - margin.right) / heatmap_x_resolution;
  let rectangle_height = (height - margin.top - margin.bottom) / heatmap_y_resolution;
  let ygrid = [...Array(heatmap_y_resolution).keys()].map((i) => ymin + (ymax - ymin) * (i + 0.5) / (heatmap_y_resolution));
  let xgrid = [...Array(heatmap_x_resolution).keys()].map((i) => xmin + (xmax - xmin) * (i + 0.5) / (heatmap_x_resolution));
    // .map(yscaleFunction);
  const heatmap_data = conditional_distribution_density_heatmap(
    points_chosen.map((d) => d.x),
    points_chosen.map((d) => d.y),
    xgrid,
    ygrid,
    kernel,
    mean_function,
  )
  // Build color scale
  const heatmapScale = d3.scaleLog().domain(d3.extent(heatmap_data.map(d => d.density+ 1e-3)))
  const heatmapColor = d3.scaleSequential(
    // (d) => d3.interpolator(d3.interpolate("#fff0", "#005ACD")interpolateBlues(heatmapScale(d))
    (d) => d3.interpolate("#FFFFFF", "#005ACD")(heatmapScale(d))
  )

  // Sizes of "heatmap" rectangles
  // Use Math.ceil because of weird interpolation issues
  // let rectangle_width = Math.ceil((width - margin.left - margin.right) / heatmap_x_resolution);
  // let rectangle_height = Math.ceil((height - margin.top - margin.bottom) / heatmap_y_resolution);


  // ============================
  // Add a second axis for density plot
  // ============================

  const slice_xloc_closest_on_grid = xgrid.reduce(function(prev, curr) {
    return (Math.abs(curr - slice_xloc) < Math.abs(prev - slice_xloc) && slice_xloc > curr ? curr : prev);
  });
  // TODO: possibly recompute density here at a higher resolution
  const density_at_slice = heatmap_data
    // Only keep the densities at desired slice 
    .filter((d) => d.x == slice_xloc_closest_on_grid)
    // Remap y -> y, density -> x
    .map((d) => ({x: d.density, y: d.y}));
  const slice_plot_x_start = xscale(slice_xloc_closest_on_grid) + 0.5 * rectangle_width
  const slice_density_width = Math.ceil((width - margin.right - xscale(slice_xloc)) / 3);

  function vertical_subplot(plot_x_start, plot_width, line_data, color, makeAxisOnTop = true) {
    const subplotScale = d3.scaleLinear()
      .domain([0, d3.max(line_data.map((d) => d.x))])
      .range([plot_x_start, plot_x_start + plot_width])

    const subplotAxis = svg.append("g")
      .attr("transform", `translate(0, ${( (makeAxisOnTop) ? margin.top : height - margin.bottom)})`)
      .attr("pointer-events", "none")
      .call(((makeAxisOnTop) ? d3.axisTop : d3.axisBottom)(subplotScale).ticks(2))
      .style("display", "none")
      .style("opacity", 0.0)
    
      subplotAxis.selectAll("line").style("stroke", color);
      subplotAxis.selectAll("text").style("fill", color);
      subplotAxis.selectAll("path").style("stroke", color);
    
    const lineFunc = d3.line()
      .curve(d3.curveBasis)
      .x(d => subplotScale(d.x))
      .y(d => yscale(d.y))
      // slice_density_axis.selectAll("text")
      //   .style("text-anchor", "start")
      //   .attr("dx", "-.35em")
      //   .attr("transform", "rotate(-45)")

    const lineOnPlot = svg.append("g")
      .attr("stroke", color)
      .attr("fill", "transparent")
      .style("display", "none")
      .style("opacity", 0.0);
      // sliceDe

    lineOnPlot.selectAll('.line')
      .data([line_data])
      .join('path')
      .attr('class', 'line')
      .attr('d', d => lineFunc(d));
    return [subplotAxis, lineOnPlot]

  }
  const [slice_density_axis, sliceDensityLine] = vertical_subplot(slice_plot_x_start, slice_density_width, density_at_slice, "#005ACD");
  // Plot improvement over maximum
  const improvement_at_slice = ygrid.map((y) => ({y: y, x: Math.max(y - best_point_so_far.y,  0)}))

  const [slice_improvement_axis, sliceImprovementLine] = vertical_subplot(slice_plot_x_start, slice_density_width, improvement_at_slice, "red", false);
  sliceImprovementLine.attr("stroke", "red");

  // const line = d3.line()
  //   .curve(d3.curveBasis)
  //   .x(d => subplotScale(d.x))
  //   .y(d => yscale(d.y))
    // slice_density_axis.selectAll("text")
    //   .style("text-anchor", "start")
    //   .attr("dx", "-.35em")
    //   .attr("transform", "rotate(-45)")

  const bestPointSoFarLine = svg.append("line")
    // .attr("class", "line")
    .attr("stroke", "red")
    .attr("stroke-dasharray", (3, 5))
    .attr("stroke-width", 2)
    .attr("y1", yscale(best_point_so_far.y))
	  .attr("y2", yscale(best_point_so_far.y))
	  .attr("x1", xscale(best_point_so_far.x))
	  .attr("x2", xscale(best_point_so_far.x));
    // .style("display", "none")
    // .style("opacity", 0.0)
    // .attr('class', 'line')
    // .attr('d', d3.line().x(d => xscale(d.x)).y(d => yscale(d.y)));


  // Initial drawing  
  update();

  // ============================
  // Event Listeners for buttons
  // ============================
  
  function update() {
    
    svg.selectAll()
      .data(heatmap_data, function(d) {return d.x+':'+d.y;})
      .enter()
      .append("rect")
        .attr("class", "heatmapRect")
        .attr("x", d => xscale(d.x) - 0.5 * rectangle_width) // Subtract a half to center rectangle
        .attr("y", d => yscale(d.y) - 0.5 * rectangle_height)
        .attr("width", rectangle_width)
        .attr("height", rectangle_height)
        .style("fill", d => heatmapColor(d.density + 1e-3))
        .style("display", "none")
        .style("opacity", 0.0)
  
    // Draw new circles
    circles.selectAll("circle")
      .data(plot_points)
      .join(
        // Special handling for new elements only
        enter => enter.append("circle")
          .attr("r", datapointCircleRadius)
      )
      // Applies to merged selection of new and old elements
      .attr("cx", d => xscale(d.x))
      .attr("cy", d => yscale(d.y));
    
    
    modelMean.selectAll('.mean')
      .data([dist])
      .join('path')
      .attr('class', 'mean')
      .attr('d', d => modelLine(d));

    envelope.selectAll('.envelope')
      .data([dist])
      .join('path')
      .attr('class', 'envelope')
      .attr('d', d => area(d));
    
    envelope2.selectAll('.envelope2')
      .data([dist])
      .join('path')
      .attr('class', 'envelope2')
      .attr('d', d => area2(d));

    bestPointSoFarLine.raise();
    svg.selectAll(".datapointCircle").raise();

    xaxis_gp.raise();

    sliceDensityLine.raise();
    slice_density_axis.raise();
    sliceImprovementLine.raise();
    slice_improvement_axis.raise();
    

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
  //     .transition().duration(250).attr("r", datapo)
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
  // Changing elements on plot:
  const plotStateBase = function () {
    ygrid_gp.transition().duration(400).style("opacity", 1.0);

    modelMean.select('.mean').style("display", "block")
      // .style("opacity", 1.)

    envelope.select('.envelope').style("display", "block")
      // .style("opacity", 1.)

    envelope2.select('.envelope2').style("display", "block")
      // .style("opacity", 1.)

    svg.selectAll(".heatmapRect")
    .transition()
    .duration(400)
    .style("opacity", 0.)
    .on("end", function() {d3.select(this).style("display", "none")})



  }
  const plotStateHeatMap = function () {
    ygrid_gp.transition().duration(400).style("opacity", 0.0);
    // Hide mean line and y axis lines
    svg.selectAll(".heatmapRect")
      .style("display", "block")
      .transition()
      .duration(400)
      .style("opacity", 1.)
      .on("end", function() {
        modelMean.select('.mean').style("display", "none")
        envelope.select('.envelope').style("display", "none")
        envelope2.select('.envelope2').style("display", "none")
      })

    circles.selectAll("circle")
      // .filter((d, i, nodes) => nodes[i].getStyle("display") == "none")
      .style("display", "block")
      .transition()
      .duration(400)
      .attr("r", datapointCircleRadius)

    xaxis_gp.selectAll(".tick")
      .style("display", "block")
      .transition()
      .duration(400)
      .style("opacity", 1)
    sliceDensityLine.transition().duration(400).style("opacity", 0.0)
      .on("end", function () {d3.select(this).style("display", "none")})
    slice_density_axis.transition().duration(400).style("opacity", 0.0)
      .on("end", function () {d3.select(this).style("display", "none")})

  }
  const plotStateHeatMapAndDensity = function () {
    svg.selectAll(".heatmapRect")
    .filter( (d, i, nodes) =>  d.x > slice_xloc)
    .transition()
    .duration(400)
    .style("opacity", 0.)
    .on("end", function() {d3.select(this).style("display", "none")})
    circles.selectAll("circle")
    .filter( (d, i, nodes) =>  d.x > slice_xloc)
    .transition()
    .duration(400)
    .attr("r", 0.)
    .on("end", function() {d3.select(this).style("display", "none")})
    // Hide the best point so far line
    bestPointSoFarLine.transition().duration(400)
      .attr("x1", xscale(best_point_so_far.x))
      .attr("x2", xscale(best_point_so_far.x))
    // And hide the improvement line
    sliceImprovementLine.style("display", "block")
      .transition()
      .duration(400)
      .style("opacity", 0.0)
      .on("end", function () {d3.select(this).style("display", "none")})
    slice_improvement_axis
      .transition()
      .duration(400)
      .style("opacity", 0.0)
      .on("end", function () {d3.select(this).style("display", "none")})

    xaxis_gp.selectAll(".tick")
      .filter(function() {
        var transform = d3.select(this).attr("transform");
        var translate = transform.match(/translate\(([^,]+),[^)]+\)/);
        var x = parseFloat(translate[1]);
        return x > xscale(slice_xloc);
      })
      .transition()
      .duration(500)
      .style("opacity", 0)
      .on("end", function() {
        d3.select(this).style("display", "none");
        // Also now show the density
        sliceDensityLine.style("display", "block")
          .transition()
          .duration(400)
          .style("opacity", 1.0)
        slice_density_axis.style("display", "block")
          .transition()
          .duration(400)
          .style("opacity", 1.0)
      })
  };

  const plotStateHeatMapAndDensityAndImprovement = function () {
        sliceImprovementLine.style("display", "block")
          .transition()
          .delay(400)
          .duration(400)
          .style("opacity", 1.0)
        slice_improvement_axis.style("display", "block")
          .transition()
          .duration(400)
          .style("opacity", 1.0)
        bestPointSoFarLine.transition().duration(400)
          .attr("x1", xscale.range()[0])
          .attr("x2", xscale.range()[1])

  }

  // Interactive buttons -> progress through the elements of the plot
  button1 = document.getElementById("button1");
  button1.onclick = plotStateBase;

  button2 = document.getElementById("button2");
  button2.onclick = plotStateHeatMap;

  button3 = document.getElementById("button3");
  button3.onclick = plotStateHeatMapAndDensity;
  
  button4 = document.getElementById("button4");
  button4.onclick = plotStateHeatMapAndDensityAndImprovement;
  
}

drawExpectedImprovementExplanationChart() 