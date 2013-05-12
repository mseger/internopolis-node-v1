$(function () {
  $('.goToMatchFB').click(function(){
    window.open("https://facebook.com/" + this.value);
  });

  $('.addToStarredRoommates').click(function () {
    $.post("/starred_roommates/add", {id: this.value});
    alert("Added to your Starred Potential Roommates");
    return false;
  })

  $('.addStarredToGroup').click(function (){
  	$.post("/starred_roommates/addToGroup", {group_id: this.getAttribute("value"), user_FBID: window.userFBID});
  	alert("Starred Roommate Match and Added to your Group");
    $(this).parent.remove();
  	return false;
  })

  $('.setUserGlobal').click(function (){
    window.userFBID = this.value;
  })


  $('#my_modal').popup();

})
