$(() => {
  function smallRightMenu() {
    $('.w-btn-menu').on('click', function () {
      if ($('.w-sm-right-menu').hasClass('d-block')) {
        $('.w-sm-right-menu').removeClass('d-block');
      } else {
        $('.w-sm-right-menu').addClass('d-block');
      }
    });
  }
  smallRightMenu();
});