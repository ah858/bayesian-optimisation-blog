// Add "collapsible" footnotes. A footnote that will only expand and appear once the footnote button is pressed.

var collButtons = document.getElementsByClassName("collapsible-button");
var collContents = document.getElementsByClassName("collapsible-content");
var i;

for (i = 0; i < collButtons.length; i++) {
    collButtons[i].collapsible_content = collContents[i];
  collButtons[i].addEventListener("click", function() {
    this.classList.toggle("active");
    if (this.collapsible_content.style.maxHeight){
      this.collapsible_content.style.maxHeight = null;
    } else {
      this.collapsible_content.style.maxHeight = this.collapsible_content.scrollHeight + "px";
    } 
  });
}