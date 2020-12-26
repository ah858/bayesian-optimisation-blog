function drawTwoStepEI() {
  
	// ================================================
	// TODO: Make this code responsive
	// ================================================
	// These valeus are required so that the clicking coordinates are correct
	// TODO: Make these responsive viewbox values
	// Look at these SO answers
	// - https://stackoverflow.com/questions/22183727/how-do-you-convert-screen-coordinates-to-document-space-in-a-scaled-svg
	// - https://stackoverflow.com/questions/29261304/how-to-get-the-click-coordinates-relative-to-svg-element-holding-the-onclick-lis
	const width = document.getElementById("chart-two-step").offsetWidth
	const height  = document.getElementById("chart-two-step").offsetWidth / 2


	let points4 = [{x: 50, y: 370},
		{x: 150, y: 200},
		{x: 500, y: 300}];

	let LOOP_DELAY = 1500;
	let LOWER_GRAPHIC_HEIGHT_MULTIPLIER = 1.4;

	// =========================
	// Extra scale values
	// =========================
	
	// TODO: Put Lower axis and scale definitions in seperate file
	let yscaleLower = d3.scaleLinear()
		.domain([0, 1])
		.range([LOWER_GRAPHIC_HEIGHT_MULTIPLIER*height - margin.bottom, height + margin.top])
	
	let yAxisLower = g => g
		.attr("transform", `translate(${margin.left},0)`)
		.attr("pointer-events", "none")
		.call(d3.axisLeft(yscaleLower))
	
	let xAxisLower = g => g
		.attr("transform", `translate(0, ${LOWER_GRAPHIC_HEIGHT_MULTIPLIER* height - margin.bottom})`)
		.attr("pointer-events", "none")
		.call(d3.axisBottom(xscale))
  
	const xscale = d3.scaleLinear()
	  .domain([5,50])
		.range([margin.left, width - margin.right])
  
	const yscale = d3.scaleLinear()
	  .domain([-1, 1])
		.range([height - margin.bottom, margin.top])

	
	const xscaleIndex = d3.scaleLinear()
	  .domain([0,x_axis_resolution])
	  .range([margin.left, width - margin.right])
		

  
	const svg = d3.select("#chart-two-step").append("svg").attr("width", width).attr("height", LOWER_GRAPHIC_HEIGHT_MULTIPLIER*height);

	// ============================
	// Set up axes
	// ============================
  
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
	// Set up labels below x axis
	// ============================
	
	// TODO: Add labels for below x axis
	// TODO: Rewrite x/yAxisLower with variable weight and height parameters
	svg.append("g")
	  .call(xAxisLower);
  	svg.append("g")
	  .call(yAxisLower);
	
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
	
	const expectedImprovementLine = d3.line()
		.curve(d3.curveBasis)
		.x(d => xscale(d.x))
		.y(d => yscaleLower(d.expected_improvement))
   
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
	
	const redEnvelope = svg.append("g")
	  .attr("stroke", "transparent")
	  .attr("fill", "rgba(255,0,0,0.2)");
	
	const clipPath = svg.append("clipPath")
		  .attr("id", "theshold-clip3")
		  .append("rect")
		  .attr("x", xscale.domain()[0])
		  .attr("y", yscale.domain()[1])
		  .attr("width", width)
	
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

	const line = svg.append("line")
	  .attr("stroke", "red")
	  .attr("stroke-dasharray", (3, 5))
	  .attr("stroke-width", 2)
	  .attr("x1", xscale.range()[0])
	  .attr("x2", xscale.range()[0]);
	
	const expectedImprovementGroup = svg.append("g")
	  .attr("stroke", "green")
	  .attr("fill", "transparent");

	
	// Restrict circles to a common group to set
	// attributes collectively and avoid selecting unwanted elements
	const potentialCircles = svg.append("g")
	  .attr("fill", "gray")
	
  	// Use rect in the background to capture click events and 
  	// handle point creation
	const backgroundRect = svg.append("rect")
		.attr("transform", `translate(${margin.left},0)`)
		.attr("width", width - (margin.left + margin.right))
		.attr("height", height)
		// Transparent "white" so click events can be captured
		.attr("fill", "#fff0")
		.on("mousemove", event => {
			hlineMouseover(event);
		})
		.on("click", event => {    
			drawXPoints(event)
	  });  
	  
	// Restrict circles to a common group to set attributes collectively and avoid selecting unwanted elements
	const circles = svg.append("g")
    .attr("fill", "blue")
    .on("click", event => {
      const point = d3.select(event.target).datum();
      points4.splice(points4.indexOf(point), 1);
      update(points4);
    });
  
   
  
	// const resetButton = svg.append("text")
	//   .attr("x", width - margin.right)
	//   .attr("y", 10)
	//   .attr("text-anchor", "end")
	//   .attr("class", "f6 link dim br-pill ba ph3 pv1 dib black")
	//   .attr("dy", "0.3em")
	//   .text("Reset graphic")
	//   .on("click", event => resetGraph());


	// ============================
	// Event functions
	// ============================
	
	const drag = d3.drag()
		.on("start", function() {
		d3.select(this).attr("stroke", "black");
		})
		.on("drag", (event, d) => {
		d.x = event.x;
		d.y = event.y;
		update(points4);
		})
		.on("end", function() {
		d3.select(this).attr("stroke", null);
		});
	
	// ============================
	// Helper Functions
	// ============================

	function createExtraPoints(dist, x, index) {

		let selected_mean = yscale(dist[index]["mean"]);
		let selected_std_lo = yscale(dist[index]["lower"]);
		let selected_std_up = yscale(dist[index]["upper"]);
		let selected_std_lo2 = yscale(dist[index]["lower2"]);
		let selected_std_up2 = yscale(dist[index]["upper2"]);
	
		let points_new = [{x: x, y: selected_std_up},
											{x: x, y: selected_std_up2},
											{x: x, y: (selected_mean+selected_std_up2)/2},
											{x: x, y: selected_mean},
											{x: x, y: (selected_mean+selected_std_lo2)/2},
											{x: x, y: selected_std_lo2},
											{x: x, y: selected_std_lo}]
		
		return points_new
	}

	function subsample_array(array, sampling_rate) {
		let subsampled = [];
		for (let i = 0; i < array.length; i = i+sampling_rate) {
			subsampled.push(array[i]);
		}
		return subsampled;
	}
  
	// ============================
	// Initial drawing  
	// ============================
	update(points4);
  
	// Show initial vertical line when hovering over the image
  function hlineMouseover(event) {
		let gp_space_points = scale_invert_points(points4, xscale, yscale);
  
    // Update conditional dist
    let dist = conditional_dist_with_confidence_intervals(gp_space_points.map((d) => d.x),
                                          gp_space_points.map((d) => d.y),
                                          xtilde,
																					kernel);
												
    // Get position of hline
    let x = event.offsetX
    
    // Fix hline position
    hLine.attr("x1", x)
      .attr("x2", x);
    
		// Draw potential circles
		
		// let index = d3.format(".0f")((xscale.invert(x) / 10) * 201);
		let index = d3.format(".0f")(xscaleIndex.invert(x));

    let points_new = createExtraPoints(dist, x, index);
    
    // Draw grey circles for possible points
    potentialCircles.selectAll("circle")
      .data(points_new)
      .join("circle")
      .attr("r", 4)
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
	}
  
  // TODO: Expectation of the (best) EI for each x-slice i.e. for each x-slice you need to do 5xEI weighted calculations (averaging over maximums).
  
  // TODO: Vectorise EI code
  
	// Draw the expected improvement

	// TODO: Why does this take one argument when only called with one?
  function drawExpectedImprovement(plot_space_points) {

    let gp_space_points = scale_invert_points(plot_space_points, xscale, yscale);

    function get_expected_improvement_from_points(points, xgrid, kernel) {
      
      let dist_from_points = conditional_distribution(points.map((d) => d.x),
                                              points.map((d) => d.y),
                                              xgrid,
                                              kernel);
      
      let max_val = d3.max(points, p => p.y);
      let exp_imp = expected_improvement(xgrid, dist_from_points.mean, math.sqrt(dist_from_points.variance), max_val);
      return exp_imp;
    }
	

    /**
    * Return object array with culmulative EI values for plotting as a D3 path
    * @param  {Array of arrays} array_of_exp_imp    
          Array of expected improvements (EI) different sample points. 
          [[1-step array], [2-step point 1], ..., [2-step point n]]
    * @param  {Array of integers} corresponding_xvals 
          X values that correspond to points used to calculate the EI arrays.
    * @return {Array of objects}      
          A list of objects with each points x-coord, EI value, and key for which sub-array it originated from.
    */
    function calculated_culmulative_exp_imp(one_step_exp_imp, two_step_exp_imp, xgrid){
      
      let culmulative_vals = [...one_step_exp_imp];

      let exp_imp_objects = [];
      
      // Add objects for each one-step point
      for (let i=0; i < xgrid.length; i++) {
        // let xval = 10 * i / one_step_exp_imp.length; //TODO: Arbitrary constant of 10?
        exp_imp_objects.push({"x": xgrid[i], "expected_improvement": one_step_exp_imp[i], "key": 0 });
      }
      
      // Add objects for each two-step point
      for (let i = 0; i < two_step_exp_imp.length; i++){
        // For each subarray element
        for (let j = 0; j < xgrid.length; j++){
          culmulative_vals[j] = two_step_exp_imp[i][j] + culmulative_vals[j];
          
          exp_imp_objects.push({"x": xgrid[j], "expected_improvement": culmulative_vals[j], "key": (i+1)});
        }
      }
      
      return exp_imp_objects
    }
    
    /**
    * Normalise a list of probabilities
    * @param  {Array of numbers}  probability_weights Array of unormalised probabilities
    * @return {Array of numbers}                      Array of normalised probabilities
    */
    function normalise_weights(weights) {
      let weights_sum = weights.reduce((a, b) => a + b, 0);
      let normalised_w = weights.map(d => d / weights_sum);
      return normalised_w
    }
    
    function get_expected_improvement_against_xvals(prev_points_gp_space, xgrid) { 
      // Note, this dist operates on a different grid than xtilde
       let dist = conditional_distribution(prev_points_gp_space.map((d) => d.x),
                                        prev_points_gp_space.map((d) => d.y),
                                        xgrid,
                                        kernel);
      // Subsampled grid to use in the inner evaluation of the maximum for 2nd-step EI:
      let subsampled_xgrid = subsample_array(xgrid, 5);
      
      let two_step_exp_imp = [[],[],[]];
      // let probability_weights = [0.0584409, 0.175847, 0.325062,  0.398942, 0.325062, 0.175847, 0.0584409 ];
      let normalised_prob = normalise_weights([0.325062,  0.398942, 0.325062]);

      for (let i = 0; i < xgrid.length; i++) {
        let y_samples = gaussian_confidence_intervals(dist.mean[i], dist.variance[i], 1) // Change the 1 at the end to get more points
        let points_samples = y_samples.map((d, i) => ({x: xgrid[i], y: d}));
        
        for (let j=0; j <= 2; j++) { // Iterate over the 3 points
          let points_xval = prev_points_gp_space.concat(points_samples[j]);
          let exp_imp = get_expected_improvement_from_points(points_xval, subsampled_xgrid, kernel);
          
          let max_exp_imp = math.max(exp_imp);
          
          two_step_exp_imp[j].push(normalised_prob[j] * max_exp_imp);
        }
      }
      
      return two_step_exp_imp; 
    }     
	
    // ==============================================
    // NEW CODE  
    // ==============================================
    let ei_plot_xgrid = subsample_array(xtilde, 2);
    let one_step_exp_imp = get_expected_improvement_from_points(gp_space_points, ei_plot_xgrid, kernel);

    // Get two step EIs and prepend one-step EI

    let two_step_exp_imp = get_expected_improvement_against_xvals(gp_space_points, ei_plot_xgrid);
        
    let exp_imp_objects = calculated_culmulative_exp_imp(one_step_exp_imp, two_step_exp_imp, ei_plot_xgrid);
    
    // Scale to the space of the plot
    // let scaled_exp_imp_objects = exp_imp_objects.map((d) => ({x: xscale(d.x), y: d.y}));
    // ==============================================
    
    // Group items
    let grouped_stack_data = d3.group(exp_imp_objects, d => d.key)
    
    for (let n=0; n<=3; n++) {
      expectedImprovementGroup.selectAll(`.exp-imp-${n}`)
        .data([grouped_stack_data.get(n)])//[all_stack_points[key_id]])
        .enter()
        .append('path')
        .attr('class', `exp-imp-${n}`) // No dot here
        .attr('d', d => expectedImprovementLine(d));
		}
	}

	// Create candidate points to show potential Gaussian Process
	function drawXPoints(event) {

		// Need offsetX not event.x otherwise it does not account for margin (I think)
		let x = event.offsetX

		// Freeze hline and prevent future clicks
		hLine.attr("x1", x)
			.attr("x2", x)
			.attr("opacity", 0.5);

		// Remove hover and click response on main image
		backgroundRect.attr("pointer-events", "none")
			.on("click", null);
		
		// Update conditional dist
		let dist = conditional_dist_with_confidence_intervals(points4.map((d) => xscale.invert(d.x)),
																					points4.map((d) => yscale.invert(d.y)),
																					xtilde,
																					kernel);
		
		// Get array for point positions (the same as the positions found in hlineMouseover() )
		// const index = d3.format(".0f")((xscale.invert(x) / 10) * x_axis_resolution);
		let index = d3.format(".0f")(xscaleIndex.invert(x));
		let points_new = createExtraPoints(dist, x, index)
				
		let points_ext = points4.concat(points_new)
		
		// Draw new circles
		potentialCircles.selectAll("circle")
			.data(points_ext)
			.join("circle")
			.attr("cx", d => d.x)
			.attr("cy", d => d.y)
			// .on("click", event => {
			//   let tmp_point = d3.select(event.target).datum();
			//   drawGauss(points_new.indexOf(tmp_point));
			// })
			.transition()
			.duration(600)
			.attr("r", 7)
			.style("fill", "lightgray");
	
			
		// Incrementally show each one with the resulting Gaussian
		let len = points_new.length - 1;
		
		// The first point is displayed without a delay
		drawGauss(len, true); --len;
		// Remaining points are looped through with a delay
		loopDrawGP(len)
		
		// Draw Expected improvement curves
		// TODO: I think this function is incorrectly implemented
		drawExpectedImprovement(points4, points_new);
		
		function loopDrawGP(i) {
			setTimeout(function() {
				drawGauss(i);
				if (--i >= 0) loopDrawGP(i, false);   //  decrement i and call myLoop again if i > 0
			}, LOOP_DELAY)
		}
	
		// Draw points in that iteration as black and show the max threshold
		function drawGauss(i) {
				let points_tmp = points4.concat(points_new[i]) // Clone array
				update(points_tmp);
				drawThreshold(points_tmp);
		}
	}

  // Draw conditional distribution on image
  function update(points_arg) {
  
    // Update conditional dist
    const dist = conditional_dist_with_confidence_intervals(points_arg.map((d) => xscale.invert(d.x)),
                                          points_arg.map((d) => yscale.invert(d.y)),
                                          xtilde,
                                          kernel);
    // Draw new circles
    circles.selectAll("circle")
      .data(points_arg)
      .join(
        // Special handling for new elements only
        enter => enter.append("circle")
          .attr("r", 7)
          .call(drag)
      )
      // Applies to merged selection of new and old elements
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
    
    // Draw model
    modelMean.selectAll('.mean')
      .data([dist])
      .join('path')
      .attr('class', 'mean')
      .transition()
      .duration(500)
      .attr('d', d => modelLine(d));
    
    envelope.selectAll('.envelope')
      .data([dist])
      .join('path')
      .attr('class', 'envelope')
      .transition()
      .duration(500)
      .attr('d', d => area(d));
    
    envelope2.selectAll('.envelope2')
      .data([dist])
      .join('path')
      .attr('class', 'envelope2')
      .transition()
      .duration(500)
      .attr('d', d => area2(d));
    
  }
  
  // Draw the maximum threshold and red envelope
  function drawThreshold(points_arg) {
    
    // Update conditional dist
    const dist = conditional_dist_with_confidence_intervals(points_arg.map((d) => xscale.invert(d.x)),
                                          points_arg.map((d) => yscale.invert(d.y)),
                                          xtilde,
                                          kernel);
    
    // Coordinates of the maximum point
    let y = d3.min(points_arg, p => p.y);
    let x = d3.least(points_arg, p => p.y).x;
    
    // drawExpectedImprovement(dist, yscale.invert(y));
    
    // Only expand in the red line for the first point
    if (!line.classed(".expanded")) {
      line.attr("y1", y)
        .attr("y2", y)
        .attr("x1", x) // Line 'grows' out from maximum point
        .attr("x2", x)
        .attr("class", ".expanded")
        .transition()
        .delay(500) // Line enters the point by expanding out
        .duration(400)
        .attr("x1", xscale.range()[0])
        .attr("x2", xscale.range()[1]);
    } else {
    // Subsequent transitions just move the line up and down
      line
        .transition()
        .duration(400)
        .attr("y1", y)
        .attr("y2", y);
    }
    
    // Disable dragging and turn points black
    circles.selectAll("circle")
      .data(points_arg)
      .join()
      .on('mousedown.drag', null)
      .transition()
      .attr("fill", "black");
    
    // Color maximum point red
    circles.selectAll("circle")
      .data(points_arg)
      .join()
      .filter(d => d.y === y)
      .transition()
      .attr("fill", "red");
    
    // Position red envelope by adjusting clipPath and redEvelope
    clipPath
      .transition()
      .duration(500)
      .attr("height", y);
    
    redEnvelope.selectAll('.redEnvelope')
      .data([dist])
      .join(
        enter => enter.append('path')
          .attr("opacity", 0))  // Initally the line is transparent so it can fade in
      .attr('class', 'redEnvelope')
      .transition() // Smooth transition between positions
      .duration(500)
      .attr('d', d => area(d))
      .attr("clip-path","url(#theshold-clip3)")
      .transition() // Fade in the line the first time
      .delay(500)
      .duration(500)
      .ease(d3.easeLinear)
      .attr("opacity", 1);
    
  }
	
}
  
drawTwoStepEI();