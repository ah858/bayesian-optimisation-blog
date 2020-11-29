const points = [];
		// const points = [{x: 500, y: 200}];
	  
		const width = document.getElementById("chart").offsetWidth
		const height = document.getElementById("chart").offsetWidth / 2
  
		const xtilde = [...Array(201).keys()].map((i) => i / 200 * 10)
		const sigma = 0.25
		const ell = 1.5
		const delta = 0.005

	 	const svg = d3.select("#chart").append("svg").attr("width", width).attr("height", height);
	 	// const svg = d3.select("#chart").append("svg").attr("viewBox", [0, 0, width, height]);
	 	// const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]);

	  	const margin = ({top:20, right:30, bottom: 20, left: 30})

	  	const xscale = d3.scaleLinear()
		  .domain([0,10])
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
		const dist = conditional_distribution(points.map((d) => xscale.invert(d.x)),
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
		svg.dispatch("input");
		}

		const drawThreshold = function() {

		// Update conditional dist
		const dist = conditional_distribution(points.map((d) => xscale.invert(d.x)),
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

		const squared_exponential_kernel = (sigma, ell) => {
		  const sigmasq = Math.pow(sigma, 2);
		  const ellsq = 2 * Math.pow(ell, 2);
		  return (x1, x2) => sigmasq * Math.exp(-Math.pow(x1 - x2, 2) / ellsq)
		}

		const apply_kernel = (x1s, x2s, kernel) => {
		  const covariance = [];
		  for(let i = 0; i < x1s.length; i++) {
		    covariance.push([]);
		    for(let j = 0; j < x2s.length; j++) {
		      covariance[i][j] = kernel(x1s[i], x2s[j]);
		    }
		  }
		  return math.matrix(covariance);
		}

		const conditional_distribution = (x, y, xtilde, kernel) => {
		  if(x.length == 0) return ({ mean: [{ x: 0, y: 0 }] });
		  const Sigma = math.add(apply_kernel(x, x, kernel), math.multiply(math.identity(x.length), delta));
		  const Sigmainv = math.inv(Sigma);
		  const Omega = apply_kernel(xtilde, xtilde, kernel);
		  const K = apply_kernel(x, xtilde, kernel);
		  
		  const mean = math.multiply(math.multiply(math.transpose(K), Sigmainv), y)
		    ._data;
		  
		  const variance = math.diag(math.subtract(Omega, math.multiply(math.multiply(math.transpose(K), Sigmainv), K)))
		    ._data;
		  
		  const sd = math.sqrt(variance);
		  
		  return mean.map((d, i) => ({ 
		    x: xtilde[i], 
		    mean: d, 
		    var: variance[i], 
		    sd: sd[i], 
		    lower: d - 1.96 * sd[i], 
		    upper: d + 1.96 * sd[i],
		    lower2: d - 1.28 * sd[i],
		    upper2: d + 1.28 * sd[i]
		  }));
		}

		const kernel = squared_exponential_kernel(sigma, ell)