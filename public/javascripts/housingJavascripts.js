$(function () {
  $('.addToStarredHousing').click(function () {
    $.post("/starred_housing/add", {description: this.value});
    alert("Added to your Starred Potential Roommates");
    return false;
  })

  $('.setHousingGlobal').click(function (){
  	window.housingListing = this.value;
  })

  $('.addStarredListingToGroup').click(function(){
  	$.post("/starred_housing/addToGroup", {group_id: this.getAttribute("value"), housing_id: window.housingListing});
  	alert("Starred Roommate Match and Added to your Group");
  	return false;
  })


})
