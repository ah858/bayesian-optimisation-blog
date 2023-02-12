function drawChoosePointsBlind() {
  // The svg plot width
  const width = document.getElementById("chart-choose-points-blind").offsetWidth;
  // The height of the top part of the plot (including the bottom margin)
  const top_plot_height = document.getElementById("chart-choose-points-blind").offsetWidth / 2;
  // Height for both the top plot and the week slider together
  const week_slider_height = 0.2 * top_plot_height;

  const number_of_guesses = 5;

  const svg = d3.select("#chart-choose-points-blind").append("svg").attr("width", width).attr("height", top_plot_height + week_slider_height);

  make_choose_points_plot(svg, width, top_plot_height, week_slider_height, false, false, number_of_guesses);
  
}

drawChoosePointsBlind();