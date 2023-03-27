/**
 * 
 * @param {*} svg 
 * @param {number} width 
 * @param {number} top_plot_height 
 * @param {number} week_slider_height 
 * @param {boolean} draw_model_mean 
 * @param {boolean} draw_model_uncertainty 
 * @param {number} number_of_guesses 
 */
function make_choose_points_plot(svg, width, top_plot_height, week_slider_height, draw_model_mean, draw_model_uncertainty, number_of_guesses) {
  const MODEL_TRANSITION_DURATION = 300;
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

  const xscale = d3.scaleLinear()
    .domain([xmin, xmax])
    .range([margin.left, width - margin.right])

  // yscale for the top plot
  const yscale = d3.scaleLinear()
    .domain([ymin, ymax])
    .range([top_plot_height - margin.bottom, margin.top])

  // ================================================

  // Generate the underlying curve (dist_underlying):
  let underlying_curve_y = sample_from_gp_prior(xtilde, kernel, mean_function);
  underlying_curve_y = squeeze_to_range(underlying_curve_y, ymin, ymax);
  let underlying_curve = xtilde.map((d, i) => ({x: xtilde[i], y: underlying_curve_y[i]}));

  // User selected points
  let points_chosen = [];
  

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
  
  // Week slider has to exist on the space ranging from
  // in x direction [0, width]
  // in y direction [top_plot_height, svg_height]
  const week_slider_plot_margin = {
    top: 0.2 * week_slider_height,
    bottom: 0.2 * week_slider_height,
    left: margin.left,
    right: margin.right,
  }
  /**
   * @type WeekSlider
   */
  let weekSlider = new WeekSlider(0, top_plot_height, width, week_slider_height, week_slider_plot_margin, number_of_guesses, svg);
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
    .attr("stroke", trueFuncColor)
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
        if (points_chosen.length >= number_of_guesses) {
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
    .attr("fill", selectedPointsColor)
    .attr("stroke", "white")
    // .attr("stroke", selectedPointsColor);
 

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

  
  function getPoints(event, underlying_curve) {
    let x_val = xscale.invert(event.offsetX) 
    
    let index = d3.format(".0f")(((x_val - d3.min(xscale.domain()))/(get_length_of(xscale.domain()))) * x_axis_resolution);
    let y_val = underlying_curve[index].y;

    
    return {x: x_val, y: y_val}
  }
  
  function updateWeekCircle() {
    if ((points_chosen.length) < number_of_guesses) { // Required to stop the circle at the final week position
      weekSlider.update_current_week(points_chosen.length)
    }
  }

  function update() {
  
    // Draw new circles
    circles.selectAll("circle")
      .data(points_chosen)
      .join(
        // Special handling for new elements only
        enter => enter.append("circle")
          .attr("r", datapointCircleRadius)
      )
      // Applies to merged selection of new and old elements
      .attr("cx", d => xscale(d.x))
      .attr("cy", d => yscale(d.y));
    

    // Update conditional dist
    if (draw_model_mean || draw_model_uncertainty) {
        let dist = conditional_dist_with_confidence_intervals(
                                            points_chosen.map((d) => d.x),
                                            points_chosen.map((d) => d.y),
                                            xtilde,
                                            kernel,
                                            mean_function);

        if (draw_model_mean) {

            modelMean.selectAll('.mean')
            .data([dist])
            .join('path')
            .attr('class', 'mean')
            .transition()
            .duration(MODEL_TRANSITION_DURATION)
            .attr('d', d => modelLine(d));
        
        }
        if (draw_model_uncertainty) {
            envelope.selectAll('.envelope')
              .data([dist])
              .join('path')
              .attr('class', 'envelope')
              .transition()
              .duration(MODEL_TRANSITION_DURATION)
              .attr('d', d => area(d));
            
            envelope2.selectAll('.envelope2')
              .data([dist])
              .join('path')
              .attr('class', 'envelope2')
              .transition()
              .duration(MODEL_TRANSITION_DURATION)
              .attr('d', d => area2(d));

        }
    }
    
    // Notify observable that the points have changed
    // svg.dispatch("input");
  }
  
  function showUnderlying(underlying_curve) {
    
    underlyingMean.selectAll('.underlyingMean')
      .data([underlying_curve])
      .join('path')
      .attr('class', 'underlyingMean')
      .attr('d', d => underlyingLine(d))
      .transition(MODEL_TRANSITION_DURATION)
      .attr("opacity", 1);
    
    backgroundRect.on("click", "null");
    
    // Notify observable that the points have changed
    // svg.dispatch("input");
  
  }

  function resetGraph() {

  underlyingMean.selectAll('.underlyingMean')
    .attr("opacity", 0);

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