function drawChoosePointsWithVariance() {
  
  // ================================================
  // TODO: Make this code responsive
  // ================================================
  // These valeus are required so that the clicking coordinates are correct
  // TODO: Make these responsive viewbox values
  // Look at these SO answers
  // - https://stackoverflow.com/questions/22183727/how-do-you-convert-screen-coordinates-to-document-space-in-a-scaled-svg
  // - https://stackoverflow.com/questions/29261304/how-to-get-the-click-coordinates-relative-to-svg-element-holding-the-onclick-lis
  const width = document.getElementById("chart-choose-points-with-variance").offsetWidth
  const height  = document.getElementById("chart-choose-points-with-variance").offsetWidth / 2

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

  const svg = d3.select("#chart-choose-points-with-variance").append("svg").attr("width", width).attr("height", 1.2*height);
  // ================================================

  const NUMBER_OF_GUESSES = 3;
  
  // Random points generator
  const points_random1 = [{x: math.random(6, 12), y: math.random(-0.8, 0.8)}, 
                             {x: math.random(15, 22), y: math.random(-0.8, 0.8)},
                             {x: math.random(25, 32), y: math.random(-0.8, 0.8)},
                             {x: math.random(37, 45), y: math.random(-0.8, 0.8)}]
  
  // User selected points
  const points_chosen = [];
  
  // const svg = d3.select("#chart-choose-points-blind").append("svg").attr("viewBox", [0, 0, width, height]);
  
  svg.append("g")
    .call(xAxis);
  
  svg.append("g")
    .call(yAxis);
  
  // ============================
  // Set up labels below x axis
  // ============================
  
  const weekSlider = svg.append("g")
                      .attr("class", "weekSlider")
  
  weekSlider.append("rect")
    .attr("x", 1.1 * margin.left)
    .attr("y", 1.1*height + height*0.045)
    .attr("height", 1)
    .attr("width", width - margin.left - margin.right)
    // .attr("fill", "lightblue");
  
  weekSlider.append("rect")
    .attr("x", 1.1 * margin.left)
    .attr("y", 1.1*height - height*0.045 - 1)
    .attr("height", 1)
    .attr("width", width - margin.left - margin.right)
    // .attr("fill", "lightblue");
                      
  const circleLabelBackground = weekSlider.append("circle")
      .attr("class", ".circleLabelBackground")
      .attr("r", height*0.04)
    // .attr("stroke", "lightgrey")
    // .attr("stroke-width", 1.5)
      .attr("fill", "lightgray")
      .attr("cy", 1.1*height)
      .attr("cx", margin.left + (width - margin.left - margin.right) / (NUMBER_OF_GUESSES + 1));
  
  // 'Week' text label
  // svg.append("g")
  weekSlider.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "start")
    .attr("x", 1.1 * margin.left)
    .attr("y", 1.1*height)
    .attr("dy", "0.3em")
    .text("Week:");
    
  const weeks_list = [];
  
  for (let i=1; i <= NUMBER_OF_GUESSES; i++) {
    weeks_list.push(i);
  }
  
  weekSlider.append("g")
    .selectAll(".circleLabels")
    .data(weeks_list)
    .enter()
    .append("circle")
    .attr("r", "20")
    // .attr("stroke", "lightgrey")
    // .attr("stroke-width", 1.5)
    .attr("fill", "transparent")
    .attr("cy", 1.1*height)
    .attr("cx", (d,i) => {
            return margin.left + d * (width - margin.left - margin.right) / (NUMBER_OF_GUESSES + 1);
            }
         );
  
  weekSlider.selectAll(".circleTextLabels")
    .data(weeks_list)
    .enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.3em")
    .attr("y", 1.1*height)
    .attr("x", (d,i) => {
            return margin.left + d * (width - margin.left - margin.right) / (NUMBER_OF_GUESSES + 1);
            }
         )
    .text(d => d);

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
  
  const unerlyingMean = svg.append("g")
    .attr("stroke", "red")
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
    // .attr("x1", -10) // Outside the plot
    // .attr("x2", -10) // Outside the plot
    .attr("opacity", 0)
    .attr("y1", yscale.range()[0])
    .attr("y2", yscale.range()[1]);
  
  // Use rect in the background to capture click events and handle point creation
  const backgroundRect = svg.append("rect")
    .attr("transform", `translate(${margin.left},0)`)
    .attr("width", width - (margin.left + margin.right))
    .attr("height", height)
    // Transparent "white", a fill is required to capture click events
    .attr("fill", "#fff0")
    .on("click", event => {
      points_chosen.push(getPoints(event));
      update();  
      if (points_chosen.length >= NUMBER_OF_GUESSES) {
        showUnderlying()
      };
    })
    .on("mousemove", event => {
      hLine.attr("x1", event.offsetX)
          .attr("x2", event.offsetX)
          .attr("opacity", 1);
    })
    .on("mouseout", event => {
      hLine.attr("opacity", 0);
    });
  
  // Restrict circles to a common group to set attributes collectively and avoid selecting unwanted elements
  const circles = svg.append("g")
    .attr("fill", "blue");
  const dist_underlying = conditional_distribution(points_random1.map((d) => d.x),
                                                    points_random1.map((d) => d.y),
                                                    xtilde,
                                                    kernel);
 
  // Initial drawing  
  update();
  return svg.node();
  
  function getPoints(event) {
    const x_val = xscale.invert(event.offsetX) 
    
    const index = d3.format(".0f")(((x_val-5)/45) * 201);
    const y_val = dist_underlying[index]["mean"]
    
    // Update 'weeks' circle label at bottom of the plot
    // +2 is added to the points_chosen.length because the new click hasn't yet been added to points_chosen and the circle also needs to be one position ahead of the current guess
    let circleLabelPosition = margin.left + (points_chosen.length+2) * (width - margin.left - margin.right) / (NUMBER_OF_GUESSES + 1);
  
    if ((points_chosen.length+1) < NUMBER_OF_GUESSES) { // Required to stop the circle at the final week position
      circleLabelBackground
        .transition()
        .duration(400)
        .attr("cx", circleLabelPosition)
       // .attrTween('r', () => {
       //   return function(t) { return 20 - t*(1-t)*30; };
       // });
    }
    
    return {x: x_val, y: y_val}
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
    
    // Update conditional dist
    const dist = conditional_distribution(points_chosen.map((d) => d.x),
                                          points_chosen.map((d) => d.y),
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
  }
  
  function showUnderlying() {
    const dist = conditional_distribution(points_random1.map((d) => d.x),
                                          points_random1.map((d) => d.y),
                                          xtilde,
                                          kernel);
    
    unerlyingMean.selectAll('.unerlyingMean')
      .data([dist])
      .join('path')
      .attr('class', 'unerlyingMean')
      .attr('d', d => modelLine(d));
    
    backgroundRect.on("click", "null");
    
    // Notify observable that the points have changed
    svg.dispatch("input");
  
  }
  
}

drawChoosePointsWithVariance();