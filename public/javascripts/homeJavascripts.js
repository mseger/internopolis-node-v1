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

  $('.inviteFBFriend').click(function (){
    FB.init({appId: 514685761900234, xfbml: true, cookie: false});
    FB.ui({
        method: 'send',
        display: 'popup',
        to: 100003129971591, 
        name: 'Making the Hard Parts of Internships Easy',
        link: 'http://internopolis.herokuapp.com', // REALLY NEED THE GROUP ID HERE, WILL HAVE TO COME IN THE JAVASCRIPT
    });
  })
                      
})
