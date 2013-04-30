$(function () {
  $('.addToStarredHousing').click(function () {
    $.post("/starred_housing/add", {description: this.value});
    alert("Added to your Starred Potential Roommates");
    return false;
  })
})
