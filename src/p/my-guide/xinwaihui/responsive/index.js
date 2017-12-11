(function() {
  var wrapperEls = $('.login-wrapper ');

  var firstEl = $(wrapperEls.get(0));
  var secondEl = $(wrapperEls.get(1));
  if (firstEl.offset() && secondEl.offset()) {
	  console.log(firstEl.offset().top, firstEl.height(), secondEl.offset().top)

	  if (firstEl.offset().top + firstEl.height() > secondEl.offset().top) {
	    secondEl.removeClass('fixed-bottom');
	  }
  }

})();