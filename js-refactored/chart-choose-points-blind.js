function drawChoosePointsBlind() {
  // This plot consists of 1) a top_plot and 2) a week_slider. Hence, names or doc-strings
  // for yscales and widths/heights will often be referenced with respect to one or the other
  
  // ================================================
  // TODO: Make this code responsive
  // ================================================
  // These valeus are required so that the clicking coordinates are correct
  // TODO: Make these responsive viewbox values
  // Look at these SO answers
  // - https://stackoverflow.com/questions/22183727/how-do-you-convert-screen-coordinates-to-document-space-in-a-scaled-svg
  // - https://stackoverflow.com/questions/29261304/how-to-get-the-click-coordinates-relative-to-svg-element-holding-the-onclick-lis
  // The svg plot width
  const width = document.getElementById("chart-choose-points-blind").offsetWidth;
  // The height of the top part of the plot (including the bottom margin)
  const top_plot_height = document.getElementById("chart-choose-points-blind").offsetWidth / 2;
  // Height for both the top plot and the week slider together
  const svg_height = 1.2 * top_plot_height;

  const xscale = d3.scaleLinear()
    .domain([xmin, xmax])
    .range([margin.left, width - margin.right])

  // yscale for the top plot
  const yscale = d3.scaleLinear()
    .domain([ymin, ymax])
    .range([top_plot_height - margin.bottom, margin.top])

  const svg = d3.select("#chart-choose-points-blind").append("svg").attr("width", width).attr("height", svg_height);
  // const svg = d3.select("#chart-choose-points-blind").append("svg").attr("viewBox", [0, 0, width, height]);
  // ================================================

  const NUMBER_OF_GUESSES = 5;
  const MODEL_TRANSITION_DURATION = 300;
  
  // TODO: Delete these lines
  // Random points generator
  // let points_random1 = drawRandomPoints();

  // Generate the underlying curve (dist_underlying):
  let underlying_curve_y = sample_from_gp_prior(xtilde, kernel, mean_function);
  underlying_curve_y = squeeze_to_range(underlying_curve_y, ymin, ymax);
  let underlying_curve = xtilde.map((d, i) => ({x: xtilde[i], y: underlying_curve_y[i]}));

  // let dist_underlying = conditional_distribution(points_random1.map((d) => d.x),
  //                                                   points_random1.map((d) => d.y),
  //                                                   xtilde,
  //                                                   kernel);
  
  // User selected points
  let points_chosen = [];
  
  // const svg = d3.select("#chart-choose-points-blind").append("svg").attr("viewBox", [0, 0, width, height]);
  

  // Background y grid
  svg.append("g")
    .call(yGrid, top_plot_height, width);

  svg.append("g")
    .call(xAxis, top_plot_height, width);
  
  svg.append("g")
    .call(yAxis, top_plot_height);

  svg.append("g")
    .call(xLabel, top_plot_height, width);

  svg.append("g")
    .call(yLabel, top_plot_height);


  // ============================
  // Set up labels below x axis
  // ============================
  
  const weekSlider = svg.append("g")
                      .attr("class", "weekSlider")
  // Week slider has to exist on the space ranging from
  // in x direction [0, width]
  // in y direction [top_plot_height, svg_height]
  const week_slider_plot_height = (svg_height - top_plot_height);
  const week_slider_plot_start = top_plot_height;
  const week_slider_plot_margin = {top: 0.2 * week_slider_plot_height, bottom: 0.2 * week_slider_plot_height}
  let week_slider_xscale = d3.scaleLinear()
	.domain([0, 1])
	.range([margin.left, width - margin.right]);
  let week_slider_yscale = d3.scaleLinear()
	.domain([0, 1])
	.range([week_slider_plot_start + week_slider_plot_margin.top, svg_height - week_slider_plot_margin.bottom]);
  
  // --- Add the decorative lines at the top and bottom of "week" slider
  weekSlider.append("rect")
    .attr("x", margin.left)
    .attr("y", week_slider_yscale(0.))
    .attr("height", 1)
    .attr("width", get_length_of(week_slider_xscale.range()))
  
  weekSlider.append("rect")
    .attr("x", margin.left)
    .attr("y", week_slider_yscale(1.))
    .attr("height", 1)
    .attr("width", get_length_of(week_slider_xscale.range()))
                      
  
  // 'Week' text label
  let week_text = weekSlider.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "start")
    .attr("x", margin.left)
    .attr("y", week_slider_yscale(0.5))
    .attr("dy", "0.3em")
    .text("Week:");

  // Get the width of the week text to subtract from remaining x-space available
  let week_text_bbox = week_text.node().getBBox()
    
  const weeks_list = [];

  
  for (let i=1; i <= NUMBER_OF_GUESSES; i++) {
    weeks_list.push(i);
  }

  let week_text_offset = week_slider_xscale.invert(week_text_bbox.x + week_text_bbox.width)
  let width_per_week = (1 - week_text_offset) / NUMBER_OF_GUESSES;

  function week_index_to_position (i) {
    return week_slider_xscale(week_text_offset + (i + 0.5) * width_per_week)
  }

  const circleLabelBackground = weekSlider.append("circle")
      .attr("class", ".circleLabelBackground")
      .attr("r", 0.8 * get_length_of(week_slider_yscale.range()) / 2)
      .attr("fill", "lightgray")
      .attr("cy", week_slider_yscale(0.5))
      .attr("cx", week_index_to_position(0));

  
  weekSlider.append("g")
    .selectAll(".circleLabels")
    .data(weeks_list)
    .enter()
    .append("circle")
    .attr("r", "20")
    // .attr("stroke", "lightgrey")
    // .attr("stroke-width", 1.5)
    .attr("fill", "transparent")
    .attr("cy", week_slider_yscale(0.5))
    .attr("cx", (d,i) => week_index_to_position(i))
  
  weekSlider.selectAll(".circleTextLabels")
    .data(weeks_list)
    .enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.3em")
    .attr("y", week_slider_yscale(0.5))
    .attr("x", (d,i) => week_index_to_position(i))
    .text(d => d);
  
  // ============================
  // Set up shapes for model
  // ============================
  
  // Set up model mean and std deviations
  // const modelLine = d3.line()
  //   .curve(d3.curveBasis)
  //   .x(d => xscale(d.x))
  //   .y(d => yscale(d.mean))
  
  // const area = d3.area()
  //   .curve(d3.curveBasis)
  //   .x(d => xscale(d.x))
  //   .y0(d => yscale(d.lower))
  //   .y1(d => yscale(d.upper));
  
  // const area2 = d3.area()
  //   .curve(d3.curveBasis)
  //   .x(d => xscale(d.x))
  //   .y0(d => yscale(d.lower2))
  //   .y1(d => yscale(d.upper2));
  
  const underlyingLine = d3.line()
    .curve(d3.curveBasis)
    .x(d => xscale(d.x))
    .y(d => yscale(d.y))
  
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
    // .attr("stroke", "red")
    .attr("stroke", colors[2])
    .attr("stroke-dasharray", (3, 5))
    .attr("stroke-width", 2)
    .attr("fill", "transparent");
  
  // ============================
  // Add other elements to svg
  // ============================
 
  const hLine = svg.append("line")
    .attr("stroke", "gray")
    .attr("stroke-dasharray", (3, 5))
    .attr("stroke-width", 2)
    .attr("x1", -10) // Outside the plot. Needed so line doesn't show before it is positioned.
    .attr("x2", -10) // Outside the plot
    .attr("y1", yscale.range()[0])
    .attr("y2", yscale.range()[1]);
  
  // Use rect in the background to capture click events and handle point creation
  const makeBackroundRectClickable = (object, underlying_curve) => object
      .on("click", event => {
        points_chosen.push(getPoints(event, underlying_curve));
        update();  
        if (points_chosen.length >= NUMBER_OF_GUESSES) {
          showUnderlying(underlying_curve)
        };
        updateWeekCircle();
      })
      .on("mousemove", event => {
        hLine.attr("x1", event.offsetX)
            .attr("x2", event.offsetX)
            .attr("opacity", 1);
      })
      .on("mouseout", event => {
        hLine.attr("opacity", 0);
      });

  const backgroundRect = svg.append("rect")
    .attr("transform", `translate(${margin.left},0)`)
    .attr("width", width - (margin.left + margin.right))
    .attr("height", top_plot_height)
    // Transparent "white", a fill is required to capture click events
    .attr("fill", "#fff0")
    .call(makeBackroundRectClickable, underlying_curve);
  
  // Restrict circles to a common group to set attributes collectively and avoid selecting unwanted elements
  const circles = svg.append("g")
    .attr("fill", "blue");
 

  const resetButton = svg.append("text")
    .attr("x", width - margin.right)
    .attr("y", 10)
    .attr("text-anchor", "end")
    .attr("class", "f6 link dim br-pill ba ph3 pv1 dib black")
    .attr("dy", "0.3em")
    .text("Reset graphic")
    .on("click", event => resetGraph());

  // Initial drawing  
  update();

  // TODO: Delete this section
  // function drawRandomPoints () {
  //   return [{x: math.random(6, 12), y: math.random(-0.8, 0.8)}, 
  //          {x: math.random(15, 22), y: math.random(-0.8, 0.8)},
  //          {x: math.random(25, 32), y: math.random(-0.8, 0.8)},
  //          {x: math.random(37, 45), y: math.random(-0.8, 0.8)}]
  // }
  
  function getPoints(event, underlying_curve) {
    let x_val = xscale.invert(event.offsetX) 
    
    let index = d3.format(".0f")(((x_val-5)/45) * x_axis_resolution);
    let y_val = underlying_curve[index].y;

    // updateWeekCircle();
    
    return {x: x_val, y: y_val}
  }
  
  function updateWeekCircle() {
    // Update 'weeks' circle label at bottom of the plot
    // +2 is added to the points_chosen.length because the new click hasn't yet been added to points_chosen and the circle also needs to be one position ahead of the current guess

    let circleLabelPosition = week_index_to_position(points_chosen.length);
  
    if ((points_chosen.length) < NUMBER_OF_GUESSES) { // Required to stop the circle at the final week position
      circleLabelBackground
        .transition()
        .duration(400)
        .attr("cx", circleLabelPosition)
       // .attrTween('r', () => {
       //   return function(t) { return 20 - t*(1-t)*30; };
       // });
    }
  }

  function update() {
  
    // Draw new circles
    circles.selectAll("circle")
      .data(points_chosen)
      .join(
        // Special handling for new elements only
        enter => enter.append("circle")
          .attr("r", 7)
      )
      // Applies to merged selection of new and old elements
      .attr("cx", d => xscale(d.x))
      .attr("cy", d => yscale(d.y));
    

    // TODO: Copy in conditional_dist_with_confidence_intervals function
    // Update conditional dist
    const dist = conditional_dist_with_confidence_intervals(points_chosen.map((d) => d.x),
                                          points_chosen.map((d) => d.y),
                                          xtilde,
                                          kernel);
    
    // modelMean.selectAll('.mean')
    //   .data([dist])
    //   .join('path')
    //   .attr('class', 'mean')
    //   .transition()
    //   .duration(MODEL_TRANSITION_DURATION)
    //   .attr('d', d => modelLine(d));
    
    // envelope.selectAll('.envelope')
    //   .data([dist])
    //   .join('path')
    //   .attr('class', 'envelope')
    //   .transition()
    //   .duration(MODEL_TRANSITION_DURATION)
    //   .attr('d', d => area(d));
    
    // envelope2.selectAll('.envelope2')
    //   .data([dist])
    //   .join('path')
    //   .attr('class', 'envelope2')
    //   .transition()
    //   .duration(MODEL_TRANSITION_DURATION)
    //   .attr('d', d => area2(d));
    
    // Notify observable that the points have changed
    // svg.dispatch("input");
  }
  
  function showUnderlying(underlying_curve) {
    // const dist = conditional_distribution(points_random1.map((d) => d.x),
    //                                       points_random1.map((d) => d.y),
    //                                       xtilde,
    //                                       kernel);
    
    underlyingMean.selectAll('.underlyingMean')
      .data([underlying_curve])
      .join('path')
      .attr('class', 'underlyingMean')
      .attr('d', d => underlyingLine(d))
      .attr("opacity", 1);
    
    backgroundRect.on("click", "null");
    
    // Notify observable that the points have changed
    // svg.dispatch("input");
  
  }

  function resetGraph() {

  underlyingMean.selectAll('.underlyingMean')
    .attr("opacity", 0);

  // TODO: Delete these lines
  // Random points generator
  // points_random1 = drawRandomPoints();
  // let dist_underlying = conditional_distribution(points_random1.map((d) => d.x),
  //                                                   points_random1.map((d) => d.y),
  //                                                   xtilde,
  //                                                   kernel);

  // Generate the underlying curve (dist_underlying):
  let underlying_curve_y = sample_from_gp_prior(xtilde, kernel, mean_function);
  underlying_curve_y = squeeze_to_range(underlying_curve_y, ymin, ymax);
  let underlying_curve = xtilde.map((d, i) => ({x: xtilde[i], y: underlying_curve_y[i]}));

  // User selected points
  points_chosen = [];
  backgroundRect.call(makeBackroundRectClickable, underlying_curve);

  updateWeekCircle(); 
  update();


  }
  
}

drawChoosePointsBlind();