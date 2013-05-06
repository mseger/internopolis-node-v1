$(function () {
  $('.removeGroup').click(function () {
    $.post("/group/" + this.value + "/remove", {id: this.value});
    alert("Removed Group from your Groups");
    document.location.reload(true);
    return false;
  })
})
