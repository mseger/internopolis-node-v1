$(function () {
  $('.goToMatchFB').click(function(){
    window.open("https://facebook.com/" + this.value);
  });

  $('.addToStarredRoommates').click(function () {
    $.post("/starred_roommates/add", {id: this.value});
    alert("Added to your Starred Potential Roommates");
    return false;
  })


  $('#my_modal').popup();

})
