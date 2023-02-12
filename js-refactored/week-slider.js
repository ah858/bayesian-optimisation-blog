class WeekSlider {
    constructor(xpos_start, ypos_start, width, height, margin, num_weeks, svg) {
        this.xpos_start = xpos_start;
        this.ypos_start = ypos_start;
        this.width = width;
        this.height = height;
        this.margin = margin;
        this.num_weeks = num_weeks;
        this.week_slider = svg.append("g").attr("class", "weekSlider")

        // Scales that range over the width and height of the week slider plot
        this.xscale = d3.scaleLinear()
        .domain([0, 1])
        .range([xpos_start + margin.left, xpos_start + width - margin.right]);
        this.yscale = d3.scaleLinear()
        .domain([0, 1])
        .range([ypos_start + margin.top, ypos_start + height - margin.bottom]);

        this.current_week_idx = 0;
        // ---------
        // Make the plot
        // ---------

        // --- Add the decorative lines at the top and bottom of "week" slider
        this.week_slider.append("rect")
        .attr("x", this.xscale(0.))
        .attr("y", this.yscale(0.))
        .attr("height", 1)
        .attr("width", get_length_of(this.xscale.range()))

        this.week_slider.append("rect")
        .attr("x", margin.left)
        .attr("y", this.yscale(1.))
        .attr("height", 1)
        .attr("width", get_length_of(this.xscale.range()))
                            

        // 'Week' text label
        let week_text = this.week_slider.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "start")
        .attr("x", this.xscale(0.))
        .attr("y", this.yscale(0.5))
        .attr("dy", "0.3em")
        .text("Week:");

        // Get the width of the week text to subtract from remaining x-space available
        let week_text_bbox = week_text.node().getBBox()

        const weeks_list = [];

        for (let i=1; i <= this.num_weeks; i++) {
            weeks_list.push(i);
        }

        this.week_text_offset = this.xscale.invert(week_text_bbox.x + week_text_bbox.width)
        this.width_per_week = (1 - this.week_text_offset) / this.num_weeks;


        this.weekHighlightCircle = this.week_slider.append("circle")
            .attr("class", ".weekHighlightCircle")
            .attr("r", 0.8 * get_length_of(this.yscale.range()) / 2)
            .attr("fill", "lightgray")
            .attr("cy", this.yscale(0.5))
            .attr("cx", this.week_index_to_position_on_plot(0));


        this.week_slider.append("g")
            .selectAll(".circleLabels")
            .data(weeks_list)
            .enter()
            .append("circle")
            .attr("r", "20")
            .attr("fill", "transparent")
            .attr("cy", this.yscale(0.5))
            .attr("cx", (d,i) => this.week_index_to_position_on_plot(i))

        this.week_slider.selectAll(".circleTextLabels")
            .data(weeks_list)
            .enter()
            .append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.3em")
            .attr("y", this.yscale(0.5))
            .attr("x", (d,i) => this.week_index_to_position_on_plot(i))
            .text(d => d);

    }

    week_index_to_position_on_plot (i) {
        return this.xscale(this.week_text_offset + (i + 0.5) * this.width_per_week)
    }

    update_current_week (new_week) {
        this.current_week_idx = new_week;
        this.weekHighlightCircle
            .transition()
            .duration(400)
            .attr("cx", this.week_index_to_position_on_plot(new_week))
    }
}