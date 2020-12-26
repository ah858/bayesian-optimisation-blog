
function drawChartGaussianProcessSandbox() {
	const points = [];
	// const points = [{x: 500, y: 200}];

	// ================================================
	// TODO: Make this code responsive
	// ================================================
	// These valeus are required so that the clicking coordinates are correct
	// TODO: Make these responsive viewbox values
	// Look at these SO answers
	// - https://stackoverflow.com/questions/22183727/how-do-you-convert-screen-coordinates-to-document-space-in-a-scaled-svg
	// - https://stackoverflow.com/questions/29261304/how-to-get-the-click-coordinates-relative-to-svg-element-holding-the-onclick-lis
	const width = document.getElementById("chart-gp-sandox").offsetWidth
	const height  = document.getElementById("chart-gp-sandox").offsetWidth / 2

	const xscale = d3.scaleLinear()
		.domain([5,50])
		.range([margin.left, width - margin.right])

	const yscale = d3.scaleLinear()
	  .domain([-1, 1])
	  .range([height - margin.bottom, margin.top])

	const xAxis = g => g
	  .attr("transform", `translate(0, ${height - margin.bottom})`)
	  .attr("pointer-events", "none")
	  .call(d3.axisBottom(xscale))

	const yAxis = g => g
	  .attr("transform", `translate(${margin.left},0)`)
	  .attr("pointer-events", "none")
	  .call(d3.axisLeft(yscale))

	const svg = d3.select("#chart-gp-sandox").append("svg").attr("width", width).attr("height", height);
	// ================================================

	// const svg = d3.select("#chart").append("svg").attr("viewBox", [0, 0, width, height]);

	svg.append("g")
		.call(xAxis);

	svg.append("g")
		.call(yAxis);

	const drag = d3.drag()
	.on("start", function() {
	  d3.select(this).attr("stroke", "black");
	})
	.on("drag", (event, d) => {
	  d.x = event.x;
	  d.y = event.y;
	  update();
	})
	.on("end", function() {
	  d3.select(this).attr("stroke", null);
	});

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

	const redEnvelope = svg.append("g")
	.attr("stroke", "transparent")
	.attr("fill", "rgba(255,0,0,0.2)");

	const clipPath = svg.append("clipPath")
	    .attr("id", "theshold-clip")
	    .append("rect")
	    .attr("x", xscale.domain()[0])
	    .attr("y", yscale.domain()[1])
	    .attr("width", width)

	// ============================
	// Add other elements to svg
	// ============================

	// Use rect in the background to capture click events and handle point creation
	const backgroundRect = svg.append("rect")
	.attr("width", width)
	.attr("height", height)
	// Transparent "white", a fill is required to capture click events
	.attr("fill", "#fff0")
	.on("click", event => {
	    points.push({x: event.offsetX, y: event.offsetY});
	    // console.log(points);
	    update();  
	});

	const line = svg.append("line")
	.attr("stroke", "red")
	.attr("stroke-dasharray", (3, 5))
	.attr("stroke-width", 2)
	.attr("x1", xscale.range()[0])
	.attr("x2", xscale.range()[0]);

	// Restrict circles to a common group to set attributes collectively and avoid selecting unwanted elements
	const circles = svg.append("g")
	.attr("fill", "blue")
	.on("click", event => {
	  const point = d3.select(event.target).datum();
	  points.splice(points.indexOf(point), 1);
	  update();
	});

	// Replaced with function based on id button below
	// const textButton = svg.append("g")
	//   .attr("class", "textButton")
	//   .call(text_button);

	// Initial drawing  //////////////////////////////////////////////
	// update();
	// return svg.node();

	const update = function() {

	// Draw new circles
	circles.selectAll("circle")
	  .data(points)
	  .join(
	    // Special handling for new elements only
	    enter => enter.append("circle")
	      .attr("r", 7)
	      .call(drag)
	  )
	  // Applies to merged selection of new and old elements
	  .attr("cx", d => d.x)
	  .attr("cy", d => d.y);

	// Update conditional dist
	const dist = conditional_dist_with_confidence_intervals(points.map((d) => xscale.invert(d.x)),
	                                      points.map((d) => yscale.invert(d.y)),
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
	  .attr('d', d => area(d));

	envelope2.selectAll('.envelope2')
	  .data([dist])
	  .join('path')
	  .attr('class', 'envelope2')
	  .attr('d', d => area2(d));


	 d3.select("#button1")
	  // .on("click", console.log('event.target'));
	  // .on("click", drawThreshold());
	  // .on("click", (event) => console.log(event.target));
	  .on("click", (event) => drawThreshold());
	// textButton.on("click", () => {drawThreshold()})

	// Notify observable that the points have changed
	// svg.dispatch("input");
	}

	const drawThreshold = function() {

	// Update conditional dist
	const dist = conditional_dist_with_confidence_intervals(points.map((d) => xscale.invert(d.x)),
	                                      points.map((d) => yscale.invert(d.y)),
	                                      xtilde,
	                                      kernel);

	// Draw maximum line
	const y = d3.min(points, p => p.y);
	const x = d3.least(points, p => p.y).x;

	line.attr("y1", y)
	  .attr("y2", y)
	  .attr("x1", x)
	  .attr("x2", x)
	  .transition()
	  .delay(700)
	  .duration(400)
	  .attr("x1", xscale.range()[0])
	  .attr("x2", xscale.range()[1]);

	// Disable dragging and reduce points
	circles.selectAll("circle")
	  .data(points)
	  .join()
	  .on('mousedown.drag', null)
	  .transition()
	  .duration(500)
	  .attr("r", 5)
	  .transition()
	  .attr("fill", "black");

	// Identify maximum points
	circles.selectAll("circle")
	  .data(points)
	  .join()
	  .filter(d => d.y === d3.min(points, p => p.y))
	  .transition()
	  .duration(500)
	  .attr("r", 5)
	  .transition()
	  .attr("fill", "red");

	backgroundRect.on('click',null);
	 d3.select("#button1")
	  .attr("onclick", null);

	// textButton.on('click',null);
	// textButton.select("text").text("");
	clipPath.attr("height", y);

	// Draw out threshold line and red envelope
	redEnvelope.selectAll('.redEnvelope')
	  .data([dist])
	  .join('path')
	  .attr('class', 'redEnvelope')
	  .attr("opacity", 0)
	  .attr('d', d => area(d))
	  .transition()
	  .delay(1000)
	  .duration(500)
	  .ease(d3.easeLinear).attr("opacity", 1)
	  .attr("clip-path","url(#theshold-clip)");  
	}

}

drawChartGaussianProcessSandbox();