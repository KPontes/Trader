//set active on menu item refering to page loaded
$(document).ready(function() {
  $(function() {
    var current_page_URL = location.href;
    $("a").each(function() {
      if ($(this).attr("href") !== "#") {
        var target_URL = $(this).prop("href");

        if (target_URL == current_page_URL) {
          $("nav a")
            .parents("li, ul")
            .removeClass("active");
          $(this)
            .parent("li")
            .addClass("active");

          return false;
        }
      }
    });
  });
});

//include menu
$(document).ready(function() {
  $("#includeMenu").load("menu1.html");
  $("#includeFooter").load("footer.html");
  $("#includePricing").load("pricing1.html");
  $("#includeReactFrame").load("reactapp.html");
});
