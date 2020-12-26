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
	// Stack colours
	// =========================
	// let stackColourOneStep = ['#212121', '#d2d2d2', '#dbdbdb', '#e5e5e5', '#efefef', '#f9f9f9'];
	let stackColourTwoStep = ['#2A363B', '#6C5B7B', '#C06C84', '#F67280', '#C06C84', '#6C5B7B'];
	let stackColourOneStep = ['#2A363B', '#e6e2e9', '#f0dbe1', '#fccfd4', '#f0dbe1', '#e6e2e9']; // 90% lighter https://www.w3schools.com/colors/colors_picker.asp

	let stackColour = d3.scaleOrdinal().domain([0,1,2,3,4])
		.range(d3.schemeSet3);

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
	// Set up background grid
	// ============================
  
	// svg.append("g")
	//   .call(yGrid, height, width);
  
	// ============================
	// Set up axis
	// ============================

	svg.append("g")
	  .call(xAxis, height, width);
	
	svg.append("g")
	  .call(yAxis, height);
  
	svg.append("g")
	  .call(xLabel, LOWER_GRAPHIC_HEIGHT_MULTIPLIER*height, width);
  
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
	
	const expectedImprovementLine = d3.line()
		.curve(d3.curveBasis)
		.x(d => xscale(d.x))
		.y(d => yscaleLower(d.expected_improvement));

	
	const expectedImprovementArea = d3.area()
		.curve(d3.curveBasis)
		.x(d => xscale(d.x))
	  .y0(d => yscaleLower.range()[0])
		.y1(d => yscaleLower(d.expected_improvement));
   
	// ============================
	// Add model elements to svg
	// ============================
	
	// One-step model parameters
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
			.attr("width", width);
	
	// Two-step model parameters
  
	const envelopeTwoStep = svg.append("g")
	  .attr("stroke", "transparent")
	  // .attr("fill", "rgba(0,0,100,0.1)");
	  .attr("fill", "#F2F2F7");
	
	const envelope2TwoStep = svg.append("g")
	  .attr("stroke", "transparent")
	  .attr("fill", "#D9DAE8");
	  // .attr("fill", "rgba(0,0,100,0.1)");
	
	const modelMeanTwoStep = svg.append("g")
	  .attr("stroke", "black")
		.attr("fill", "transparent");
		
	const redEnvelopeTwoStep = svg.append("g")
	  .attr("stroke", "transparent")
	  .attr("fill", "rgba(255,0,0,0.2)");
	
	const clipPathTwoStep = svg.append("clipPath")
		  .attr("id", "theshold-clip-2-step")
		  .append("rect")
		  .attr("x", xscale.domain()[0])
		  .attr("y", yscale.domain()[1])
			.attr("width", width);
			
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
	  // .attr("stroke", "green")
	  .attr("fill", "gray");
	
  	// Use rect in the background to capture click events and 
  	// handle point creation
	const backgroundRect = svg.append("rect")
		.attr("transform", `translate(${margin.left},0)`)
		.attr("width", width - (margin.left + margin.right))
		.attr("height", height)
		// Transparent "white" so click events can be captured
		.attr("fill", "#fff0");
		// .on("mousemove", event => {
		// 	hlineMouseover(event);
		// });  

	// Restrict circles to a common group to set
	// attributes collectively and avoid selecting unwanted elements
	const potentialCircles = svg.append("g")
		.attr("fill", "gray");
	  
	// Restrict circles to a common group to set attributes collectively and avoid selecting unwanted elements
	const circles = svg.append("g")
    .attr("fill", "blue")
    .on("click", event => {
      const point = d3.select(event.target).datum();
      points4.splice(points4.indexOf(point), 1);
      update(points4);
    });
	
	let twoStepShowing = false;
	const toggleTwoStepButton = svg.append("text")
	  .attr("x", width - margin.right)
	  .attr("y", 10)
	  .attr("text-anchor", "end")
	  .attr("class", "f6 link dim br-pill ba ph3 pv1 dib black")
	  .attr("dy", "0.3em")
	  .text("Toggle 2-step visuals")
	  .on("click", event => toggleTwoStep());


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

	function createExtraPointsFromDist(dist, x, index, N) {

		let y_intervals = gaussian_confidence_intervals(dist.mean[index], dist.variance[index], 2)

		let points_new = y_intervals.map(function(y,i){ 
			return {x: x, y: yscale(y), idx: i} 
		});

		// let points_new = [];

		// for (let i=0; i< y_intervals.length; i++) {
		// 	points_new.push({x: x, y: yscale(y_intervals[i])})
		// }

		return points_new
	}

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
	// Initial drawing  
	// ============================
	intialUpdate(points4);
	// Draw Expected improvement curves
	drawExpectedImprovement(points4);
  
	// Show initial vertical line when hovering over the image
  function hlineMouseover(event) {
		let gp_space_points = scale_invert_points(points4, xscale, yscale);
												
    // Get position of hline
    let x = event.offsetX
    
		// Fix hline position
		hLine.attr("x1", x)
      .attr("x2", x);
    
		// Draw potential circles
		
		// let index = d3.format(".0f")((xscale.invert(x) / 10) * 201);
		let index = d3.format(".0f")(xscaleIndex.invert(x));


    // POINTS CORRESPOND TO PLOTTED CONFIDENCE INTERVALS Update conditional dist
    // let dist = conditional_dist_with_confidence_intervals(gp_space_points.map((d) => d.x),
    //                                       gp_space_points.map((d) => d.y),
    //                                       xtilde,
		// 																			kernel);
    // let points_new = createExtraPoints(dist, x, index);

    // POINTS CORRESPOND TO BRUNO'S CHOSEN POINTS Update conditional dist
    let dist = conditional_distribution(gp_space_points.map((d) => d.x),
                                          gp_space_points.map((d) => d.y),
                                          xtilde,
																					kernel);
						
    let points_new = createExtraPointsFromDist(dist, x, index, 2);
    
    // Draw grey circles for possible points
    potentialCircles.selectAll(".potentialCircles")
      .data(points_new)
			.join("circle")
			.attr("class", "potentialCircles")
      // .attr("r", 4)
      .attr("r", 7)
      .attr("cx", d => d.x)
			.attr("cy", d => d.y)
			.attr("fill", (d,i) => stackColourTwoStep[i+1])
			.on("mouseover", event => {   
				drawXPoints(event);
			})
			.on("mouseout", event => {   
				line.style("visibility", "hidden");
				envelopeTwoStep.style("visibility", "hidden");
				envelope2TwoStep.style("visibility", "hidden");
				modelMeanTwoStep.style("visibility", "hidden");
				redEnvelopeTwoStep.style("visibility", "hidden");

			});;
	}
  
  // TODO: Expectation of the (best) EI for each x-slice i.e. for each x-slice you need to do 5xEI weighted calculations (averaging over maximums).
  
  // TODO: Vectorise EI code
  
	// Draw the expected improvement

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
			
			// Add 
      
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
      
			// TODO: Calculate the probability weights and 2-step arrays dyamically
      // let probability_weights = [0.0584409, 0.175847, 0.325062, 0.398942, 0.325062, 0.175847, 0.0584409 ];
			// let two_step_exp_imp = [[],[],[],[],[],[],[]];
      let probability_weights = [0.175847, 0.325062, 0.398942, 0.325062, 0.175847];
			let two_step_exp_imp = [[],[],[],[],[]];
      // let probability_weights = [0.325062, 0.398942, 0.325062 ];
			// let two_step_exp_imp = [[],[],[]];
			let normalised_prob = normalise_weights(probability_weights);
			let number_of_confidence_intervals = probability_weights.length;

      for (let i = 0; i < xgrid.length; i++) {
        let y_samples = gaussian_confidence_intervals(dist.mean[i], dist.variance[i], 2) // Change the 1 at the end to get more points
        let points_samples = y_samples.map((d, i) => ({x: xgrid[i], y: d}));
        
        for (let j=0; j <= number_of_confidence_intervals-1; j++) { // Iterate over the number of confidence intervals points
          let points_xval = prev_points_gp_space.concat(points_samples[j]);
          let exp_imp = get_expected_improvement_from_points(points_xval, subsampled_xgrid, kernel);
          
          let max_exp_imp = math.max(exp_imp);
          
          two_step_exp_imp[j].push(normalised_prob[j] * max_exp_imp);
        }
      }
      
      return two_step_exp_imp; 
		}     
		
		function subsample_array(array, sampling_rate) {
			let subsampled = [];
			for (let i = 0; i < array.length; i = i+sampling_rate) {
				subsampled.push(array[i]);
			}
			return subsampled;
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
		
		// Plot the stacks in reverse order so lowest traces are on top
    for (let n=5; n>=0; n--) { // TODO: Make upper limit dynamic depending on the number of confidence intervals
      expectedImprovementGroup.selectAll(`.exp-imp-${n}`)
        .data([grouped_stack_data.get(n)])//[all_stack_points[key_id]])
        .enter()
        .append('path')
        .attr('class', `exp-imp-${n}`) // No dot here
        // .attr('d', d => expectedImprovementLine(d))
				.attr('d', d => expectedImprovementArea(d))
				.attr('fill', stackColourOneStep[n])
				.attr('stroke', 'transparent');
		}
	}

	// Create candidate points to show potential Gaussian Process
	function drawXPoints(event) {

		line.style("visibility", "visible");
		envelopeTwoStep.style("visibility", "visible");
		envelope2TwoStep.style("visibility", "visible");
		modelMeanTwoStep.style("visibility", "visible");
		redEnvelopeTwoStep.style("visibility", "visible");


		// Need offsetX not event.x otherwise it does not account for margin (I think)
		let x = event.offsetX

		// Freeze hline and prevent future clicks
		hLine.attr("x1", x)
			.attr("x2", x)
			.attr("opacity", 0.5);

		// Remove hover and click response on main image
		// backgroundRect.attr("pointer-events", "none")
		// 	.on("click", null);
		
		// Get array for point positions (the same as the positions found in hlineMouseover() )
		// const index = d3.format(".0f")((xscale.invert(x) / 10) * x_axis_resolution);
		let index = d3.format(".0f")(xscaleIndex.invert(x));

    // POINTS CORRESPOND TO PLOTTED CONFIDENCE INTERVALS Update conditional dist
    // let dist = conditional_dist_with_confidence_intervals(points4.map((d) => d.x),
    //                                       points4.map((d) => d.y),
    //                                       xtilde,
		// 																			kernel);
    // let points_new = createExtraPoints(dist, x, index);

    // POINTS CORRESPOND TO BRUNO'S CHOSEN POINTS Update conditional dist
    // let dist = conditional_distribution(points4.map((d) => xscale.invert(d.x)),
		// 																		points4.map((d) => yscale.invert(d.y)),
    //                                     xtilde,
		// 																		kernel);
    // let points_new = createExtraPointsFromDist(dist, x, index, 2);
		// let points_ext = points4.concat(points_new)

		let points_ext = points4.concat(d3.select(event.target).data())
		
		// Draw new circles
		// potentialCircles.selectAll(".potentialCircles")
		// 	.data(points_ext)
		// 	.join("circle")
		// 	.attr("class", "potentialCircles")
		// 	.attr("cx", d => d.x)
		// 	.attr("cy", d => d.y)
		// 	// .on("click", event => {
		// 	//   let tmp_point = d3.select(event.target).datum();
		// 	//   drawGauss(points_new.indexOf(tmp_point));
		// 	// })
		// 	.transition()
		// 	.duration(600)
		// 	.attr("r", 7)
		// 	.attr("fill", (d,i) => stackColourTwoStep[i+1]);
		// 	// .style("fill", "lightgray");

		update(points_ext);
		drawThreshold(points_ext);

		// // Incrementally show each one with the resulting Gaussian
		// let len = points_new.length - 1;
		
		// // The first point is displayed without a delay
		// drawGauss(len, true); --len;
		// // Remaining points are looped through with a delay
		// loopDrawGP(len)
		
		// function loopDrawGP(i) {
		// 	setTimeout(function() {
		// 		drawGauss(i);
		// 		if (--i >= 0) loopDrawGP(i, false);   //  decrement i and call myLoop again if i > 0
		// 	}, LOOP_DELAY)
		// }
	
		// // Draw points in that iteration as black and show the max threshold
		// function drawGauss(i) {
		// 		let points_tmp = points4.concat(points_new[i]) // Clone array
		// 		update(points_tmp);
		// 		drawThreshold(points_tmp);
		// }
	}

  // Draw conditional distribution on image
  function intialUpdate(points_arg) {
  
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
	
	function update(points_arg) {
  
    // Update conditional dist
    const dist = conditional_dist_with_confidence_intervals(points_arg.map((d) => xscale.invert(d.x)),
                                          points_arg.map((d) => yscale.invert(d.y)),
                                          xtilde,
                                          kernel);
    
    // Draw model
    modelMeanTwoStep.selectAll('.meanTwoStep')
      .data([dist])
      .join('path')
      .attr('class', 'meanTwoStep')
      // .transition()
      // .duration(500)
      .attr('d', d => modelLine(d));
    
    envelopeTwoStep.selectAll('.envelopeTwoStep')
      .data([dist])
      .join('path')
      .attr('class', 'envelopeTwoStep')
      // .transition()
      // .duration(500)
      .attr('d', d => area(d));
    
    envelope2TwoStep.selectAll('.envelope2TwoStep')
      .data([dist])
      .join('path')
      .attr('class', 'envelope2TwoStep')
      // .transition()
      // .duration(500)
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
    
		line.attr("y1", y)
		.attr("y2", y)
		.attr("x1", xscale.range()[0])
		.attr("x2", xscale.range()[1]);

    // // Only expand in the red line for the first point
    // if (!line.classed(".expanded")) {
    //   line.attr("y1", y)
    //     .attr("y2", y)
    //     // .attr("x1", x) // Line 'grows' out from maximum point
    //     // .attr("x2", x)
    //     .attr("class", ".expanded")
    //     // .transition()
    //     // .delay(500) // Line enters the point by expanding out
    //     // .duration(400)
    //     .attr("x1", xscale.range()[0])
    //     .attr("x2", xscale.range()[1]);
    // } else {
    // // Subsequent transitions just move the line up and down
    //   line
    //     // .transition()
    //     // .duration(400)
    //     .attr("y1", y)
    //     .attr("y2", y);
    // }
    
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
    clipPathTwoStep
      // .transition()
      // .duration(500)
			.attr("height", y);
			
		redEnvelopeTwoStep.selectAll('.redEnvelope')
      .data([dist])
			.join(
				enter => enter.append('path')
			)
      .attr('class', 'redEnvelope')
      .attr('d', d => area(d))
      .attr("clip-path","url(#theshold-clip-2-step)");

		// redEnvelopeTwoStep.selectAll('.redEnvelope')
    //   .data([dist])
    //   .join(
    //     enter => enter.append('path')
		// 			// .attr("opacity", 0) // Initally the line is transparent so it can fade in
		// 			)
    //   .attr('class', 'redEnvelope')
    //   .transition() // Smooth transition between positions
    //   .duration(500)
    //   .attr('d', d => area(d))
    //   .attr("clip-path","url(#theshold-clip3)")
    //   .transition() // Fade in the line the first time
      // .delay(500)
      // .duration(500)
      // .ease(d3.easeLinear)
			// .attr("opacity", 1);
			

			console.log(redEnvelopeTwoStep.selectAll('.redEnvelope'));
    
	}
	
	function toggleTwoStep() {

			if (twoStepShowing) {
				for (let n=5; n>=1; n--) { // TODO: Make upper limit dynamic depending on the number of confidence intervals
					expectedImprovementGroup.selectAll(`.exp-imp-${n}`)
						.attr('fill', stackColourOneStep[n]);
				}

				modelMean.selectAll('.mean')
					.attr("stroke", "black")
					.attr("stroke-dasharray", 'null')
					.attr("stroke-width", 1);
				envelope.selectAll('.envelope')
					.attr("stroke", "transparent")
					.attr("fill", "rgba(0,0,100,0.05)");
				envelope2.selectAll('.envelope2')
					.attr("stroke", "transparent")
					.attr("fill", "rgba(0,0,100,0.1)");

				backgroundRect.on("mousemove", event => null)
				hLine.style("visibility", "hidden");
				potentialCircles.style("visibility", "hidden");
				envelopeTwoStep.style("visibility", "hidden");
				envelope2TwoStep.style("visibility", "hidden");
				modelMeanTwoStep.style("visibility", "hidden");
				redEnvelopeTwoStep.style("visibility", "hidden");


			} else {
				// Set 2-step stack colours
				for (let n=5; n>=1; n--) { // TODO: Make upper limit dynamic depending on the number of confidence intervals
					expectedImprovementGroup.selectAll(`.exp-imp-${n}`)
						.attr('fill', stackColourTwoStep[n]);
				}

				// Set GP model visuals
				modelMean.selectAll('.mean')
					.attr('stroke', '#dbdbdb')
					// .attr("stroke-dasharray", (3, 5))
					// .attr("stroke-width", 2);
				envelope.selectAll('.envelope')
					.attr('fill', 'transparent')
					.attr('stroke', '#e5e5e5')
					// .attr("stroke-dasharray", (3, 5))
					// .attr("stroke-width", 2);
				envelope2.selectAll('.envelope2')
					.attr('fill', 'transparent')
					.attr('stroke', '#e5e5e5')
					// .attr("stroke-dasharray", (3, 5))
					// .attr("stroke-width", 2);

				backgroundRect.on("mousemove", event => {
					hlineMouseover(event);
				})
				hLine.style("visibility", "visible");
				potentialCircles.style("visibility", "visible");
				// envelopeTwoStep.style("visibility", "visible");
				// envelope2TwoStep.style("visibility", "visible");
				// modelMeanTwoStep.style("visibility", "visible");
				// redEnvelopeTwoStep.style("visibility", "visible");

			}




		twoStepShowing = !twoStepShowing;

	}
	
}
  
drawTwoStepEI();