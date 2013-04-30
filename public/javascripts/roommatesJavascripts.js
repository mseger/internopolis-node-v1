$(function () {
  $('.goToMatchFB').click(function(){
    window.open("https://facebook.com/" + this.value);
  });

  $('.addToFavoriteRoommates').on('submit', function () {
    $.post("/orders/delete", $(this).serialize());
    alert("Order Completed");
    $(this).parent.remove();
    return false;
  })

})
