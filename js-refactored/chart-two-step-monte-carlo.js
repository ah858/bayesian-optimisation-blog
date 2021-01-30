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

	let LOOP_DELAY = 50;
	let LOWER_GRAPHIC_HEIGHT_MULTIPLIER = 1.4;
	let NUM_MONTE_CARLO_SAMPLES = 15;


	// =========================
	// Stack colours
	// =========================
	// let stackColourOneStep = ['#212121', '#d2d2d2', '#dbdbdb', '#e5e5e5', '#efefef', '#f9f9f9'];
	let stackColourTwoStep = ['#2A363B', '#6C5B7B', '#C06C84', '#F67280', '#C06C84', '#6C5B7B'];
	// let stackColourOneStep = ['#2A363B', '#e6e2e9', '#f0dbe1', '#fccfd4', '#f0dbe1', '#e6e2e9']; // 90% lighter https://www.w3schools.com/colors/colors_picker.asp
	let stackColourOneStep = ['#2A363B', 'white', 'white', 'white', 'white', 'white']; // 90% lighter https://www.w3schools.com/colors/colors_picker.asp

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

	// const expectedImprovementMaskLeft = d3.rect()
	// 	.x0(d => xscale.range()[0])
	// 	.x1(d => xscale(d.x)-1)
	//   .y0(d => yscaleLower.range()[0])
	// 	.y1(d => yscaleLower.range()[1]);
	// const expectedImprovementMaskRight = d3.rect()
	// 	.x0(d => xscale(d.x)+1)
	// 	.x1(d => xscale.range()[1])
	// 	.y0(d => yscaleLower.range()[0])
	// 	.y1(d => yscaleLower.range()[1]);
   
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
		.attr("fill", "gray");

	const expectedImprovementOneStepGroup = svg.append("g")
		.attr("fill", "gray");
		
	const expectedImprovmentMask = svg.append("g")
		.attr("fill", "rgba(255,255,255,0.4)");
	
  	// Use rect in the background to capture click events and 
  	// handle point creation
	const backgroundRect = svg.append("rect")
		.attr("transform", `translate(${margin.left},0)`)
		.attr("width", width - (margin.left + margin.right))
		.attr("height", height)
		// Transparent "white" so click events can be captured
		.attr("fill", "#fff0");

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
	// drawExpectedImprovement(points4);

	// TODO: Draw one-step EI curves

	

  // TODO: Expectation of the (best) EI for each x-slice i.e. for each x-slice you need to do 5xEI weighted calculations (averaging over maximums).
  
  // TODO: Vectorise EI code
  
	// Monte Carlo EI implementation
	function drawExpectedImprovementMonteCarlo(plot_space_points){

		function randomly_sample_expected_improvement(points, x, mean, variance, xgrid){

			let y_sample = mean + math.sqrt(variance) * sample_random_normal();
			let tmp_points = points.concat({x: x, y: y_sample});
			let exp_imp = get_expected_improvement_from_points(tmp_points, xgrid, kernel);
			let max_exp_imp = math.max(exp_imp);

			return ({
				points_tmp: tmp_points,
				max_exp_imp: max_exp_imp
			})

		}

		function plot_expected_improvement_for_x_val(dist, x, xgrid, points){

			function loopEachMonteCarlo(i) {
				setTimeout(function() {

					// Fix hline position
					hLine.attr("x1", xscale(x))
						.attr("x2", xscale(x));

					avg_max_exp_imp = drawEachMonteCarlo(i, avg_max_exp_imp);
					if (i++ < NUM_MONTE_CARLO_SAMPLES) {loopEachMonteCarlo(i);}   //  increment i and call myLoop depending on if condition
					else {
						avg_max_exp_imp_return_val.push(avg_max_exp_imp)
					}
				}, LOOP_DELAY)
			}
		
			// Draw points in that iteration as black and show the max threshold
			function drawEachMonteCarlo(i, avg_max_exp_imp) {

				let {points_tmp, max_exp_imp} = randomly_sample_expected_improvement(points, x, mean, variance, xgrid);

				// Combine new result with current Monte Carlo estimate
				avg_max_exp_imp = (max_exp_imp + i * avg_max_exp_imp) / (i+1);
				let exp_imp_point = {x: x, expected_improvement: avg_max_exp_imp}; // For plotting 2-step histogram

				// TODO Show GP with the new points and update the avg_max_exp_imp bar chart
				let converted_points = points_tmp.map(d => ({x: xscale(d.x), y: yscale(d.y)}))
				update(converted_points);
				
				// Draw histogram bars for 2-step EI
				expectedImprovementGroup.selectAll(`.exp-imp-${index}`)
					.data([exp_imp_point])
					.join(
						enter => enter.append('rect')
							.attr('class', `exp-imp-${index}`) // No dot here
							.attr('fill', 'lightblue')
							.attr("width", 10)
					)
					.attr("x", d => xscale(d.x))
					// Offset height by 1-step EI
					.attr("y", d => yscaleLower(one_step_exp_imp[index] + d.expected_improvement))
					.attr("height", d => yscaleLower(0) - yscaleLower(one_step_exp_imp[index] + d.expected_improvement));
		
				return avg_max_exp_imp
			}

			// Get x index
			let index = xgrid.indexOf(x);

			// Calculate (mean, var) at that x value
			let mean = dist["mean"][index];
			let variance = dist["variance"][index];

			let avg_max_exp_imp = 0;
			let avg_max_exp_imp_return_val = []; // Append the return value to array because it can't be returned directly from setInterval loop

			loopEachMonteCarlo(0);

			console.log(avg_max_exp_imp_return_val)
			console.log(avg_max_exp_imp_return_val)

			// TODO This returns undefined even though the value exists
			return avg_max_exp_imp_return_val[0]

		}

		function subsample_array(array, sampling_rate) {
			let subsampled = [];
			for (let i = 0; i < array.length; i = i+sampling_rate) {
				subsampled.push(array[i]);
			}
			return subsampled;
		}

    function get_expected_improvement_from_points(points, xgrid, kernel) {
      
      let dist_from_points = conditional_distribution(points.map((d) => d.x),
                                              points.map((d) => d.y),
                                              xgrid,
                                              kernel);
      
			let max_val = d3.max(points, p => p.y);
			// let exp_imp = expected_improvement(xgrid, dist_from_points.mean, math.sqrt(dist_from_points.variance), max_val);
      let exp_imp = expected_improvement(dist_from_points.mean, math.sqrt(dist_from_points.variance), max_val);
      return exp_imp;
		}
		
		function loopMonteCarlo(i) {
			setTimeout(function() {
				drawMonteCarlo(i);
				i = i + 3;
				if (i < ei_plot_xgrid.length) loopMonteCarlo(i);   //  decrement i and call myLoop again if i > 0
			}, (LOOP_DELAY * NUM_MONTE_CARLO_SAMPLES + 700) )  // Time loop delay so each cycle can finish
		}
	
		// Draw points in that iteration as black and show the max threshold
		function drawMonteCarlo(i) {
			let x = ei_plot_xgrid[i];
			let max_exp_imp = plot_expected_improvement_for_x_val(dist_from_points, x, ei_plot_xgrid, gp_space_points)

			two_step_cumulative_points.push({x: x, expected_improvement: max_exp_imp + one_step_exp_imp[i]})
			
			// console.log(avg_ei);
		}
	
		// Calculate GP distribution for one-step points
		let gp_space_points = scale_invert_points(plot_space_points, xscale, yscale);
		let ei_plot_xgrid = subsample_array(xtilde, 2);
		let dist_from_points = conditional_distribution(gp_space_points.map((d) => d.x),
																										gp_space_points.map((d) => d.y),
																										ei_plot_xgrid,
																										kernel);

		// Calculate one-step EI
		let one_step_exp_imp = get_expected_improvement_from_points(gp_space_points, ei_plot_xgrid, kernel);

		let one_step_array = one_step_exp_imp.map((d,i) => ({x: ei_plot_xgrid[i], expected_improvement: d}));

		expectedImprovementOneStepGroup.selectAll(`.exp-imp-one-step`)
			.data([one_step_array])
			.enter()
			.append('path')
			.attr('class', `exp-imp-one-step`) // No dot here
			.attr('d', d => expectedImprovementArea(d))
			.attr('fill', stackColourOneStep[0])
			.attr('stroke', 'transparent');


		let two_step_cumulative_points = []

		// Draw Monte Carlo samples
		loopMonteCarlo(0);

		console.log(one_step_exp_imp);
		console.log(two_step_cumulative_points)

		expectedImprovementGroup.selectAll(`.exp-imp-two-step`)
			.data([two_step_cumulative_points])
			.enter()
			.append('path')
			.attr('class', `exp-imp-two-step`) // No dot here
			.attr('d', d => expectedImprovementArea(d))
			// .attr('fill', stackColourOneStep[1])
			.attr('stroke', 'black');
											
		// TODO: Draw 1-step EI curve
		// TODO: Add culmulative 2-step onto 1-step
		// TODO: Convert histogram of 2-step EI into curve

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

		let index = d3.format(".0f")(xscaleIndex.invert(x));

		let points_ext = points4.concat(d3.select(event.target).data())
		update(points_ext);
		drawThreshold(points_ext);
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


		let y = d3.min(points_arg, p => p.y);
	
		line.attr("y1", y)
			.attr("y2", y)
			.attr("x1", xscale.range()[0])
			.attr("x2", xscale.range()[1]);
			
			clipPath
				.attr("height", y);
				
			redEnvelope.selectAll('.redEnvelope')
				.data([dist])
				.join(
					enter => enter.append('path')
				)
				.attr('class', 'redEnvelope')
				.attr('d', d => area(d))
				.attr("clip-path","url(#theshold-clip3)");
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
		.attr('d', d => modelLine(d));
		
		envelopeTwoStep.selectAll('.envelopeTwoStep')
		.data([dist])
		.join('path')
		.attr('class', 'envelopeTwoStep')
		.attr('d', d => area(d));
		
		envelope2TwoStep.selectAll('.envelope2TwoStep')
		.data([dist])
		.join('path')
		.attr('class', 'envelope2TwoStep')
				.attr('d', d => area2(d));

		circles.selectAll(".two-step-circle")
		.data(points_arg)
		.join(
			// Special handling for new elements only
			enter => enter.append("circle")
				.attr("r", 7)
				.attr("opacity", 1),
			exit => exit
				.attr("opacity", 1)
				.call(exit => exit.transition() // fade out old points
					.attr("opacity", 0)
					.duration(1000)
					.remove()
					)
		)
		// Applies to merged selection of new and old elements
		.attr("cx", d => d.x)
				.attr("cy", d => d.y)
				.attr("class", "two-step-circle");

			drawThreshold(points_arg);
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
    
    // Disable dragging and turn points black
    circles.selectAll(".two-step-circle")
      .data(points_arg)
      .join()
      .on('mousedown.drag', null)
      .attr("fill", "black");
    
    // Color maximum point red
    circles.selectAll(".two-step-circle")
      .data(points_arg)
      .join()
      .filter(d => d.y === y)
      .attr("fill", "red");
    
    // Position red envelope by adjusting clipPath and redEvelope
    clipPathTwoStep
			.attr("height", y);
			
		redEnvelopeTwoStep.selectAll('.redEnvelopeTwoStep')
      .data([dist])
			.join(
				enter => enter.append('path')
			)
      .attr('class', 'redEnvelopeTwoStep')
      .attr('d', d => area(d))
      .attr("clip-path","url(#theshold-clip-2-step)");
    
	}
	
	function toggleTwoStep() {

			if (twoStepShowing) {
				intialUpdate(points4);

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
				redEnvelope.style("visibility", "visible");
				line.style("visibility", "visible");

				hLine.style("visibility", "hidden");
				potentialCircles.style("visibility", "hidden");
				envelopeTwoStep.style("visibility", "hidden");
				envelope2TwoStep.style("visibility", "hidden");
				modelMeanTwoStep.style("visibility", "hidden");
				redEnvelopeTwoStep.style("visibility", "hidden");


			} else {

				drawExpectedImprovementMonteCarlo(points4);

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

				// backgroundRect.on("mousemove", event => {
				// 	hlineMouseover(event);
				// })
				redEnvelope.style("visibility", "hidden");
				// line.style("visibility", "hidden");
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