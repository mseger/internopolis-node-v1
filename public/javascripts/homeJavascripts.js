$(function () {
  $('.removeGroup').click(function () {
    $.post("/group/" + this.value + "/remove", {id: this.value});
    alert("Removed Group from your Groups");
    document.location.reload(true);
    return false;
  })

  $('.setGlobalInviteVar').click(function (){
  	window.group = this.value;
  });

  $('#invite_modal').popup();

  $('#fb_message_modal').popup();

  $('.sendInviteEmail').on('submit', function () {
    window.location.href = "mailto:" + $(this).serializeArray()[0].value + "?subject=Your%20friends%20want%20you%20to%20check%20out%20their%20group%20on%20Internopolis.%20To%20Internopolis&body=To%20join,%20check%20out%20http://internopolis.herokuapp.com/"+window.group;
    return false;
  })
})
