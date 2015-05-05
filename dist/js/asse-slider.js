(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice;

  (function($, window) {
    var Slider;
    Slider = (function() {
      Slider.prototype.iScroll = null;

      Slider.prototype.numberOfSlides = null;

      Slider.prototype.currentSlide = 0;

      Slider.prototype.interval = null;

      Slider.prototype.$slider = null;

      Slider.prototype.$slideContainer = null;

      Slider.prototype.$slides = null;

      Slider.prototype.$sliderNavigation = null;

      Slider.prototype.$sliderListeners = null;

      Slider.prototype.$slidesInContainer = null;

      Slider.prototype.defaults = {
        autoscroll: true,
        speed: 500,
        interval: 5000,
        debug: true,
        snap: true,
        disabled: false,
        navigation: ['index'],
        indexNavigationTemplate: _.template('<ul class="sliderNavigation"> <% _.each(slides, function(element,index){ %> <% if(!carousel || (index>=carousel && (index+1)<=slides.length-carousel)){ %> <li data-index="<%= index %>" class="slider_navigationItem fa fa-circle-o"></li> <% } %> <% }); %> </ul>'),
        prevNextButtons: true,
        prevNextButtonsTemplate: _.template('<span class="prev fa fa-angle-left"></span> <span class="next fa fa-angle-right"></span>'),
        slideContainerSelector: '.slideContainer',
        slideSelector: 'ul.slides > li',
        inactiveSlideOpacity: null,
        slideMargin: 0,
        slideWidth: 'auto',
        carousel: 0,
        onSlideClick: function(event) {},
        onNextClick: function(event) {},
        onPrevClick: function(event) {}
      };

      Slider.prototype.debugTemplate = _.template('<div class="debug"> <span>Slider: <%= slider_index %></span> <span># of slides: <%= number_of_slides %></span> <span>Current slide: <%= current_slide %></span> <span>Autoscroll: <%= autoscroll %></span> <span># of navigations: <%= number_of_navigations %></span> <span>Slider width: <%= slider_width %></span> </div>');

      function Slider(el, options, index) {
        var self;
        if (index == null) {
          index = null;
        }
        this.debug = bind(this.debug, this);
        this.stopAutoScroll = bind(this.stopAutoScroll, this);
        this.startAutoScroll = bind(this.startAutoScroll, this);
        this.goToSlide = bind(this.goToSlide, this);
        this.prevSlide = bind(this.prevSlide, this);
        this.nextSlide = bind(this.nextSlide, this);
        this.resize = bind(this.resize, this);
        this.onBeforeScrollStart = bind(this.onBeforeScrollStart, this);
        this.onScrollEnd = bind(this.onScrollEnd, this);
        self = this;
        this.options = $.extend({}, this.defaults, options);
        this.$slider = $(el);
        this.$slider.data('index', index);
        this.$slider.addClass('slider_' + index);
        this.$sliderNavigation = [];
        this.$sliderListeners = [];
        this.$slidesInContainer = null;
        this.options.onSlideClick = function(event) {
          return self.goToSlide($(event.currentTarget).index());
        };
        this.$slideContainer = this.$slider.find(this.options.slideContainerSelector);
        this.refreshSlides();
        if (this.options.carousel) {
          this.addCarouselSlides();
          this.refreshSlides();
          this.currentSlide = this.options.carousel;
        }
        this.enableSlides();
        this.iScroll = new IScroll(el, {
          scrollX: true,
          scrollY: false,
          snap: this.options.snap,
          snapSpeed: 400,
          tap: true,
          momentum: false,
          eventPassthrough: false,
          onBeforeScrollStart: function(e) {
            var point, pointStartX, pointStartY;
            point = e.touches[0];
            pointStartX = point.pageX;
            pointStartY = point.pageY;
            return null;
          },
          onBeforeScrollMove: function(e) {
            var deltaX, deltaY;
            deltaX = Math.abs(point.pageX - pointStartX);
            deltaY = Math.abs(point.pageY - pointStartY);
            if (deltaX >= deltaY) {
              return e.preventDefault();
            } else {
              return null;
            }
          }
        });
        if (this.options.autoscroll) {
          this.startAutoScroll();
        }
        if (this.options.prevNextButtons) {
          this.addPrevNextButtons();
        }
        if (_.size(this.options.navigation)) {
          this.renderNavigation();
        }
        this.resize();
        this.goToSlide(this.currentSlide, false);
        this.bindEvents();
        this.debug();
        this;
      }

      Slider.prototype.refreshSlides = function() {
        this.$slides = this.$slideContainer.find(this.options.slideSelector);
        return this.numberOfSlides = this.$slides.length;
      };

      Slider.prototype.enableSlides = function() {
        return this.$slides.css({
          display: 'block'
        });
      };

      Slider.prototype.addPrevNextButtons = function() {
        return this.$slider.append(this.options.prevNextButtonsTemplate());
      };

      Slider.prototype.renderNavigation = function() {
        var self;
        self = this;
        _.each(this.$sliderNavigation, function(element, index) {
          if (!element.data('Slider')) {
            return $(element).remove();
          }
        });
        _.each(this.options.navigation, (function(_this) {
          return function(element, index, list) {
            var navigationItems, newElement;
            if (element === 'index') {
              newElement = _this.options.indexNavigationTemplate({
                'slides': _this.$slides,
                'carousel': _this.options.carousel
              });
              _this.$sliderNavigation.push($(newElement));
              _this.$slider.append(_.last(_this.$sliderNavigation));
              return _.last(_this.$sliderNavigation).css({
                'margin-left': -(_.last(_this.$sliderNavigation).width() / 2)
              });
            } else if (element.data('Slider')) {
              return self.registerListener(element);
            } else if (element instanceof jQuery) {
              _this.$sliderNavigation.push(element);
              navigationItems = _.last(_this.$sliderNavigation).children();
              return _this.$slides.each(function(index, slide) {
                var item;
                item = navigationItems.eq(index);
                if (item) {
                  item.data('slider_index', _this.$slider.data('index'));
                  item.data('item_index', index);
                  item.addClass('slider_navigationItem');
                  return item.on('click', function(event) {
                    self.stopAutoScroll();
                    return self.goToSlide($(this).data('item_index'));
                  });
                }
              });
            }
          };
        })(this));
        return this.updateNavigation();
      };

      Slider.prototype.registerListener = function(listener) {
        return this.$sliderListeners.push(listener);
      };

      Slider.prototype.updateNavigation = function() {
        var index;
        index = this.currentSlide;
        if (!this.options.disabled) {
          return _.each(this.$sliderNavigation, function(element) {
            if (element instanceof jQuery) {
              return $(element).find('.slider_navigationItem').removeClass('active').filter('[data-index=' + index + ']').addClass('active');
            }
          });
        }
      };

      Slider.prototype.updateSlides = function() {
        if (this.options.inactiveSlideOpacity) {
          this.setSlideOpacity(1, this.options.inactiveSlideOpacity);
        }
        this.$slides.removeClass('active');
        return this.$slides.eq(this.currentSlide).addClass('active');
      };

      Slider.prototype.setSlideOpacity = function(active, inactive) {
        this.$slides.stop().animate({
          opacity: inactive
        });
        return this.$slides.eq(this.currentSlide).stop().animate({
          opacity: active
        });
      };

      Slider.prototype.onScrollEnd = function() {
        var self;
        self = this;
        if (this.slidesInContainer > 1) {
          if (this.iScroll.currentPage.pageX < this.numberOfSlides - this.slidesInContainer) {
            this.currentSlide = this.iScroll.currentPage.pageX;
          }
        } else {
          this.currentSlide = this.iScroll.currentPage.pageX;
        }
        if (this.options.carousel) {
          if (this.currentSlide + this.options.carousel >= this.numberOfSlides) {
            this.goToSlide(this.options.carousel, false);
          } else if (this.currentSlide < this.options.carousel) {
            this.goToSlide(this.numberOfSlides - (this.options.carousel + 1), false);
          }
        }
        _.each(this.$sliderListeners, function(listener) {
          listener.Slider('stopAutoScroll');
          return listener.Slider('goToSlide', self.currentSlide);
        });
        this.updateSlides();
        this.updateNavigation();
        return this.debug();
      };

      Slider.prototype.onBeforeScrollStart = function() {
        return this.stopAutoScroll();
      };

      Slider.prototype.resize = function() {
        var containerWidth, slideWidth;
        this.stopAutoScroll();
        if (this.options.slideWidth === 'auto') {
          this.$slides.width(this.$slider.outerWidth());
        } else {
          this.$slides.width(parseInt(this.options.slideWidth) + 'px');
        }
        slideWidth = this.$slides.outerWidth() + (this.options.slideMargin * 2);
        containerWidth = slideWidth * this.numberOfSlides;
        containerWidth -= this.options.slideMargin * 2;
        containerWidth += parseFloat(this.$slides.first().css('margin-left'));
        containerWidth += parseFloat(this.$slides.last().css('margin-right'));
        this.slidesInContainer = Math.ceil(this.$slider.width() / slideWidth);
        this.$slideContainer.width(containerWidth);
        this.$slideContainer.height(this.$slider.height());
        if (this.iScroll) {
          this.iScroll.refresh();
        }
        if (this.options.autoscroll) {
          return this.startAutoScroll();
        }
      };

      Slider.prototype.bindEvents = function() {
        var self;
        self = this;
        this.iScroll.on('scrollEnd', this.onScrollEnd);
        this.iScroll.on('beforeScrollStart', this.onBeforeScrollStart);
        this.$slides.on('tap', function(event) {
          self.stopAutoScroll();
          if (typeof self.options.onSlideClick === 'function') {
            return self.options.onSlideClick.apply(this, [event, self]);
          }
        });
        this.$slider.on('click', 'span.next', function(event) {
          event.stopPropagation();
          self.stopAutoScroll();
          self.nextSlide();
          if (typeof self.options.onNextClick === 'function') {
            return self.options.onNextClick.apply(this, [event, self]);
          }
        });
        this.$slider.on('click', 'span.prev', function(event) {
          event.stopPropagation();
          self.stopAutoScroll();
          self.prevSlide();
          if (typeof self.options.onPrevClick === 'function') {
            return self.options.onPrevClick.apply(this, [event, self]);
          }
        });
        this.$slider.on('click', 'ul.sliderNavigation li', function() {
          self.stopAutoScroll();
          return self.goToSlide($(this).data('index'));
        });
        return $(window).bind('resize', function() {
          return self.resize();

          /*
          if @resizeTo
            clearTimeout @resizeTimeout
          @resizeTimeout = setTimeout ->
          , 200
           */
        });
      };

      Slider.prototype.nextSlide = function() {
        var nextSlideIndex, self;
        self = this;
        if (this.numberOfSlides > (this.currentSlide + 1)) {
          nextSlideIndex = this.currentSlide + 1;
        } else {
          nextSlideIndex = 0;
        }
        return this.goToSlide(nextSlideIndex);
      };

      Slider.prototype.prevSlide = function() {
        var nextSlideIndex, self;
        self = this;
        if (this.currentSlide - 1 >= 0) {
          nextSlideIndex = this.currentSlide - 1;
        } else {
          nextSlideIndex = this.numberOfSlides - 1;
        }
        return this.goToSlide(nextSlideIndex);
      };

      Slider.prototype.goToSlide = function(index, animate) {
        var ref, ref1;
        if (animate == null) {
          animate = true;
        }
        if (animate) {
          if ((ref = this.iScroll) != null) {
            ref.goToPage(index, 0, this.options.speed);
          }
        } else {
          if ((ref1 = this.iScroll) != null) {
            ref1.goToPage(index, 0, 0);
          }
        }
        this.currentSlide = index;
        this.updateSlides();
        this.updateNavigation();
        _.each(this.$sliderListeners, function(listener) {
          listener.Slider('stopAutoScroll');
          return listener.Slider('goToSlide', index);
        });
        return this.debug();
      };

      Slider.prototype.addCarouselSlides = function() {
        this.$startElements = this.$slides.slice(-this.options.carousel).clone();
        this.$endElements = this.$slides.slice(0, this.options.carousel).clone();
        this.$slides.parent().prepend(this.$startElements);
        return this.$slides.parent().append(this.$endElements);
      };

      Slider.prototype.startAutoScroll = function() {
        return this.interval = setInterval(this.nextSlide, this.options.interval);
      };

      Slider.prototype.stopAutoScroll = function() {
        clearInterval(this.interval);
        return this.interval = null;
      };

      Slider.prototype.debug = function() {
        var ref;
        if (this.options.debug) {
          this.$slider.find('.debug').remove();
          return this.$slider.append(this.debugTemplate({
            'slider_index': this.$slider.data('index'),
            'number_of_slides': this.numberOfSlides,
            'current_slide': (ref = this.iScroll.currentPage) != null ? ref.pageX : void 0,
            'autoscroll': this.interval ? 'enabled' : 'disabled',
            'number_of_navigations': this.$sliderNavigation.length,
            'slider_width': this.$slider.width()
          }));
        }
      };

      Slider.prototype.get = function(option) {
        console.log('option: ' + option + ' is ' + this.options[option]);
        return this.options[option];
      };

      Slider.prototype.set = function(option, value) {
        this.options[option] = value;
        if (option === 'autoscroll' && !this.interval) {
          this.startAutoScroll();
        }
        if (option === 'inactiveSlideOpacity' && this.options.inactiveSlideOpacity) {
          this.setSlideOpacity(1, this.options.inactiveSlideOpacity);
        }
        if (option === 'navigation') {
          this.renderNavigation();
        }
        return this.debug();
      };

      return Slider;

    })();
    return $.fn.extend({
      Slider: function() {
        var args, option;
        option = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        return this.each(function(index) {
          var $this, data;
          $this = $(this);
          data = $this.data('Slider');
          if (!data) {
            $this.data('Slider', (data = new Slider(this, option, index)));
          }
          if (typeof option === 'string') {
            return data[option].apply(data, args);
          }
        });
      }
    });
  })(window.jQuery, window);

}).call(this);

//# sourceMappingURL=data:application/json;base64,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LENBQUEsQ0FERjtTQWRBO2VBaUJBLElBQUMsQ0FBQSxLQUFELENBQUEsRUFwQkc7TUFBQSxDQS9kTCxDQUFBOztvQkFBQTs7UUFGRixDQUFBO1dBMGZBLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTCxDQUFZO0FBQUEsTUFBQSxNQUFBLEVBQVEsU0FBQSxHQUFBO0FBRWxCLFlBQUEsWUFBQTtBQUFBLFFBRm1CLHVCQUFRLDREQUUzQixDQUFBO2VBQUEsSUFBQyxDQUFBLElBQUQsQ0FBTSxTQUFDLEtBQUQsR0FBQTtBQUNKLGNBQUEsV0FBQTtBQUFBLFVBQUEsS0FBQSxHQUFRLENBQUEsQ0FBRSxJQUFGLENBQVIsQ0FBQTtBQUFBLFVBQ0EsSUFBQSxHQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsUUFBWCxDQURQLENBQUE7QUFHQSxVQUFBLElBQUcsQ0FBQSxJQUFIO0FBQ0UsWUFBQSxLQUFLLENBQUMsSUFBTixDQUFXLFFBQVgsRUFBcUIsQ0FBQyxJQUFBLEdBQVcsSUFBQSxNQUFBLENBQU8sSUFBUCxFQUFVLE1BQVYsRUFBa0IsS0FBbEIsQ0FBWixDQUFyQixDQUFBLENBREY7V0FIQTtBQU1BLFVBQUEsSUFBRyxNQUFBLENBQUEsTUFBQSxLQUFpQixRQUFwQjtBQUNFLG1CQUFPLElBQUssQ0FBQSxNQUFBLENBQU8sQ0FBQyxLQUFiLENBQW1CLElBQW5CLEVBQXlCLElBQXpCLENBQVAsQ0FERjtXQVBJO1FBQUEsQ0FBTixFQUZrQjtNQUFBLENBQVI7S0FBWixFQTdmRDtFQUFBLENBQUQsQ0FBQSxDQTBnQkUsTUFBTSxDQUFDLE1BMWdCVCxFQTBnQmlCLE1BMWdCakIsQ0FBQSxDQUFBO0FBQUEiLCJmaWxlIjoiYXNzZS1zbGlkZXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyIjXG4jIFNsaWRlciBqUXVlcnkgcGx1Z2luXG4jIEF1dGhvcjogVGhvbWFzIEtsb2tvc2NoIDxtYWlsQHRob21hc2tsb2tvc2NoLmNvbT5cbiNcbigoJCwgd2luZG93KSAtPlxuXG4gICMgRGVmaW5lIHRoZSBwbHVnaW4gY2xhc3NcbiAgY2xhc3MgU2xpZGVyXG5cbiAgICBpU2Nyb2xsOiBudWxsXG4gICAgbnVtYmVyT2ZTbGlkZXM6IG51bGxcbiAgICBjdXJyZW50U2xpZGU6IDBcbiAgICBpbnRlcnZhbDogbnVsbFxuXG4gICAgJHNsaWRlcjogbnVsbFxuICAgICRzbGlkZUNvbnRhaW5lcjogbnVsbFxuICAgICRzbGlkZXM6IG51bGxcbiAgICAkc2xpZGVyTmF2aWdhdGlvbjogbnVsbFxuICAgICRzbGlkZXJMaXN0ZW5lcnM6IG51bGxcbiAgICAkc2xpZGVzSW5Db250YWluZXI6IG51bGxcblxuICAgIGRlZmF1bHRzOlxuICAgICAgYXV0b3Njcm9sbDogdHJ1ZVxuICAgICAgc3BlZWQ6IDUwMFxuICAgICAgaW50ZXJ2YWw6IDUwMDBcbiAgICAgIGRlYnVnOiB0cnVlXG4gICAgICBzbmFwOiB0cnVlXG5cbiAgICAgICMgSW4gdGhpcyBzdGF0ZSwgdGhlIHNsaWRlciBpbnN0YW5jZSBzaG91bGQgbmV2ZXIgZm9yd2FyZCBldmVudHMgdG9cbiAgICAgICMgdGhlIGlTY3JvbGwgY29tcG9uZW50LCBlLmcuIHdoZW4gdGhlIHNsaWRlciBpcyBub3QgdmlzaWJsZSAoZGlzcGxheTpub25lKVxuICAgICAgIyBhbmQgdGhlcmVmb3JlIGlTY3JvbGwgY2FuJ3QgZ2V0L3Njcm9sbCB0aGUgc2xpZGUgZWxlbWVudHNcbiAgICAgIGRpc2FibGVkOiBmYWxzZVxuXG4gICAgICAjIE5hdmlnYXRpb24gZWxlbWVudCBhcnJheVxuICAgICAgIyBlaXRoZXIgJ2luZGV4JyBmb3Igb24tc2xpZGVyIG5hdmlnYXRpb24sIGEgalF1ZXJ5IHNlbGVjdG9yIGZvciBhIHRodW1ibmFpbFxuICAgICAgIyBuYXZpZ2F0aW9uIG9yIGFub3RoZXIgc2xpZGVyIGVsZW1lbnQgZm9yIGEgc2xpZGVyIGFjdGluZyBhcyBhIHN5bmNlZCByZW1vdGVcbiAgICAgICMgbmF2aWdhdGlvbiB0byB0aGlzIHNsaWRlciBpbnN0YW5jZVxuICAgICAgbmF2aWdhdGlvbjogWydpbmRleCddXG5cbiAgICAgICMgSW5kZXggbmF2aWdhdGlvbiBkZWZhdWx0IHRlbXBsYXRlXG4gICAgICBpbmRleE5hdmlnYXRpb25UZW1wbGF0ZTogXy50ZW1wbGF0ZSgnPHVsIGNsYXNzPVwic2xpZGVyTmF2aWdhdGlvblwiPlxuICAgICAgICA8JSBfLmVhY2goc2xpZGVzLCBmdW5jdGlvbihlbGVtZW50LGluZGV4KXsgJT5cbiAgICAgICAgICA8JSBpZighY2Fyb3VzZWwgfHwgKGluZGV4Pj1jYXJvdXNlbCAmJiAoaW5kZXgrMSk8PXNsaWRlcy5sZW5ndGgtY2Fyb3VzZWwpKXsgJT5cbiAgICAgICAgICAgIDxsaSBkYXRhLWluZGV4PVwiPCU9IGluZGV4ICU+XCIgY2xhc3M9XCJzbGlkZXJfbmF2aWdhdGlvbkl0ZW0gZmEgZmEtY2lyY2xlLW9cIj48L2xpPlxuICAgICAgICAgIDwlIH0gJT5cbiAgICAgICAgPCUgfSk7ICU+XG4gICAgICA8L3VsPicpXG5cbiAgICAgIHByZXZOZXh0QnV0dG9uczogdHJ1ZVxuICAgICAgcHJldk5leHRCdXR0b25zVGVtcGxhdGU6IF8udGVtcGxhdGUoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwcmV2IGZhIGZhLWFuZ2xlLWxlZnRcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm5leHQgZmEgZmEtYW5nbGUtcmlnaHRcIj48L3NwYW4+JylcblxuICAgICAgc2xpZGVDb250YWluZXJTZWxlY3RvcjogJy5zbGlkZUNvbnRhaW5lcidcbiAgICAgIHNsaWRlU2VsZWN0b3I6ICd1bC5zbGlkZXMgPiBsaSdcblxuICAgICAgIyBPcGFjaXR5IG9mIHNsaWRlcyBvdGhlciB0aGFuIHRoZSBjdXJyZW50XG4gICAgICAjIE9ubHkgYXBwbGljYWJsZSBpZiB0aGUgc2xpZGVyIGVsZW1lbnQgaGFzIG92ZXJmbG93OiB2aXNpYmxlXG4gICAgICAjIGFuZCBpbmFjdGl2ZSBzbGlkZXMgYXJlIHNob3duIG5leHQgdG8gdGhlIGN1cnJlbnRcbiAgICAgIGluYWN0aXZlU2xpZGVPcGFjaXR5OiBudWxsXG5cbiAgICAgICMgTWFyZ2luIGxlZnQgYW5kIHJpZ2h0IG9mIHRoZSBzbGlkZXMgaW4gcGl4ZWxzXG4gICAgICBzbGlkZU1hcmdpbjogMFxuXG4gICAgICAjIFdpZHRoIG9mIHRoZSBzbGlkZSwgZGVmYXVsdHMgdG8gYXV0bywgdGFrZXMgYSAxMDAlIHNsaWRlciB3aWR0aFxuICAgICAgc2xpZGVXaWR0aDogJ2F1dG8nXG5cbiAgICAgICMgRmFrZSBhIGNhcm91c2VsIGVmZmVjdCBieSBzaG93aW5nIHRoZSBsYXN0IHNsaWRlIG5leHQgdG8gdGhlIGZpcnN0XG4gICAgICAjIHRoYXQgY2FuJ3QgYmUgbmF2aWdhdGVkIHRvIGJ1dCBmb3J3YXJkcyB0byB0aGUgZW5kIG9mIHRoZSBzbGlkZXJcbiAgICAgICMgTnVtYmVyIGluZGljYXRlcyBudW1iZXIgb2Ygc2xpZGVzIHBhZGRpbmcgbGVmdCBhbmQgcmlnaHRcbiAgICAgIGNhcm91c2VsOiAwXG5cbiAgICAgICMgU2xpZGUgY2xpY2sgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgIG9uU2xpZGVDbGljazogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmluZGV4KClcblxuICAgICAgb25OZXh0Q2xpY2s6IChldmVudCktPlxuICAgICAgICAjY29uc29sZS5sb2cgJ05leHQnXG5cbiAgICAgIG9uUHJldkNsaWNrOiAoZXZlbnQpLT5cbiAgICAgICAgI2NvbnNvbGUubG9nICdQcmV2J1xuXG5cbiAgICBkZWJ1Z1RlbXBsYXRlOiBfLnRlbXBsYXRlKCdcbiAgICAgIDxkaXYgY2xhc3M9XCJkZWJ1Z1wiPlxuICAgICAgICA8c3Bhbj5TbGlkZXI6IDwlPSBzbGlkZXJfaW5kZXggJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPiMgb2Ygc2xpZGVzOiA8JT0gbnVtYmVyX29mX3NsaWRlcyAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+Q3VycmVudCBzbGlkZTogPCU9IGN1cnJlbnRfc2xpZGUgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPkF1dG9zY3JvbGw6IDwlPSBhdXRvc2Nyb2xsICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj4jIG9mIG5hdmlnYXRpb25zOiA8JT0gbnVtYmVyX29mX25hdmlnYXRpb25zICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj5TbGlkZXIgd2lkdGg6IDwlPSBzbGlkZXJfd2lkdGggJT48L3NwYW4+XG4gICAgICA8L2Rpdj4nKVxuXG5cbiAgICAjIENvbnN0cnVjdG9yXG4gICAgY29uc3RydWN0b3I6IChlbCwgb3B0aW9ucywgaW5kZXggPSBudWxsKSAtPlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBAb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBAZGVmYXVsdHMsIG9wdGlvbnMpXG5cbiAgICAgIEAkc2xpZGVyID0gJChlbClcbiAgICAgIEAkc2xpZGVyLmRhdGEgJ2luZGV4JywgaW5kZXhcbiAgICAgIEAkc2xpZGVyLmFkZENsYXNzICdzbGlkZXJfJytpbmRleFxuICAgICAgQCRzbGlkZXJOYXZpZ2F0aW9uID0gW11cbiAgICAgIEAkc2xpZGVyTGlzdGVuZXJzID0gW11cbiAgICAgIEAkc2xpZGVzSW5Db250YWluZXIgPSBudWxsXG5cbiAgICAgIEBvcHRpb25zLm9uU2xpZGVDbGljayA9IChldmVudCktPlxuICAgICAgICBzZWxmLmdvVG9TbGlkZSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmluZGV4KClcblxuICAgICAgQCRzbGlkZUNvbnRhaW5lciA9IEAkc2xpZGVyLmZpbmQgQG9wdGlvbnMuc2xpZGVDb250YWluZXJTZWxlY3RvclxuICAgICAgQHJlZnJlc2hTbGlkZXMoKVxuXG4gICAgICBpZiBAb3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICBAYWRkQ2Fyb3VzZWxTbGlkZXMoKVxuICAgICAgICBAcmVmcmVzaFNsaWRlcygpXG4gICAgICAgIEBjdXJyZW50U2xpZGUgPSBAb3B0aW9ucy5jYXJvdXNlbFxuXG4gICAgICAjIEVuYWJsZSBzbGlkZXMgdHJvdWdoIENTU1xuICAgICAgQGVuYWJsZVNsaWRlcygpXG5cbiAgICAgIEBpU2Nyb2xsID0gbmV3IElTY3JvbGwgZWwsXG4gICAgICAgIHNjcm9sbFg6IHRydWVcbiAgICAgICAgc2Nyb2xsWTogZmFsc2VcbiAgICAgICAgc25hcDogQG9wdGlvbnMuc25hcFxuICAgICAgICBzbmFwU3BlZWQ6IDQwMFxuICAgICAgICB0YXA6IHRydWVcbiAgICAgICAgbW9tZW50dW06IGZhbHNlXG4gICAgICAgIGV2ZW50UGFzc3Rocm91Z2g6IGZhbHNlXG4gICAgICAgIG9uQmVmb3JlU2Nyb2xsU3RhcnQ6IChlKS0+XG4gICAgICAgICAgcG9pbnQgPSBlLnRvdWNoZXNbMF1cbiAgICAgICAgICBwb2ludFN0YXJ0WCA9IHBvaW50LnBhZ2VYXG4gICAgICAgICAgcG9pbnRTdGFydFkgPSBwb2ludC5wYWdlWVxuICAgICAgICAgIG51bGxcbiAgICAgICAgb25CZWZvcmVTY3JvbGxNb3ZlOiAoZSktPlxuICAgICAgICAgIGRlbHRhWCA9IE1hdGguYWJzKHBvaW50LnBhZ2VYIC0gcG9pbnRTdGFydFgpXG4gICAgICAgICAgZGVsdGFZID0gTWF0aC5hYnMocG9pbnQucGFnZVkgLSBwb2ludFN0YXJ0WSlcbiAgICAgICAgICBpZiBkZWx0YVggPj0gZGVsdGFZXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBudWxsXG5cbiAgICAgIGlmIEBvcHRpb25zLmF1dG9zY3JvbGxcbiAgICAgICAgQHN0YXJ0QXV0b1Njcm9sbCgpXG5cbiAgICAgIGlmIEBvcHRpb25zLnByZXZOZXh0QnV0dG9uc1xuICAgICAgICBAYWRkUHJldk5leHRCdXR0b25zKClcblxuICAgICAgaWYgXy5zaXplKEBvcHRpb25zLm5hdmlnYXRpb24pXG4gICAgICAgIEByZW5kZXJOYXZpZ2F0aW9uKClcblxuICAgICAgQHJlc2l6ZSgpXG4gICAgICBAZ29Ub1NsaWRlIEBjdXJyZW50U2xpZGUsIGZhbHNlXG4gICAgICBAYmluZEV2ZW50cygpXG4gICAgICBAZGVidWcoKVxuICAgICAgQFxuXG5cbiAgICAjIFJlZnJlc2ggc2xpZGVzXG4gICAgcmVmcmVzaFNsaWRlczogLT5cblxuICAgICAgQCRzbGlkZXMgPSBAJHNsaWRlQ29udGFpbmVyLmZpbmQgQG9wdGlvbnMuc2xpZGVTZWxlY3RvclxuICAgICAgQG51bWJlck9mU2xpZGVzID0gQCRzbGlkZXMubGVuZ3RoXG5cblxuICAgICMgRW5hYmxlIHNsaWRlcyB2aWEgQ1NTXG4gICAgZW5hYmxlU2xpZGVzOiAtPlxuXG4gICAgICBAJHNsaWRlcy5jc3NcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJ1xuXG5cbiAgICAjIEFkZCBwcmV2IG5leHQgYnV0dG9uc1xuICAgIGFkZFByZXZOZXh0QnV0dG9uczogLT5cblxuICAgICAgQCRzbGlkZXIuYXBwZW5kIEBvcHRpb25zLnByZXZOZXh0QnV0dG9uc1RlbXBsYXRlKClcblxuXG4gICAgIyBBZGQgbmF2aWdhdGlvblxuICAgIHJlbmRlck5hdmlnYXRpb246IC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgICMgRGVsZXRlIG9sZCBzbGlkZXIgbmF2aWdhdGlvbiBlbGVtZW50c1xuICAgICAgXy5lYWNoIEAkc2xpZGVyTmF2aWdhdGlvbiwgKGVsZW1lbnQsIGluZGV4KS0+XG4gICAgICAgIGlmICFlbGVtZW50LmRhdGEoJ1NsaWRlcicpXG4gICAgICAgICAgJChlbGVtZW50KS5yZW1vdmUoKVxuXG4gICAgICBfLmVhY2ggQG9wdGlvbnMubmF2aWdhdGlvbiwgKGVsZW1lbnQsIGluZGV4LCBsaXN0KT0+XG5cbiAgICAgICAgaWYgZWxlbWVudCA9PSAnaW5kZXgnXG5cbiAgICAgICAgICAjIENyZWF0ZSBhIGpRdWVyeSBvYmplY3QgZGlyZWN0bHkgZnJvbSBzbGlkZXIgY29kZVxuICAgICAgICAgIG5ld0VsZW1lbnQgPSBAb3B0aW9ucy5pbmRleE5hdmlnYXRpb25UZW1wbGF0ZSh7J3NsaWRlcyc6IEAkc2xpZGVzLCAnY2Fyb3VzZWwnOiBAb3B0aW9ucy5jYXJvdXNlbH0pXG4gICAgICAgICAgQCRzbGlkZXJOYXZpZ2F0aW9uLnB1c2ggJChuZXdFbGVtZW50KVxuXG4gICAgICAgICAgIyBBcHBlbmQgaXQgdG8gc2xpZGVyIGVsZW1lbnRcbiAgICAgICAgICBAJHNsaWRlci5hcHBlbmQgXy5sYXN0KEAkc2xpZGVyTmF2aWdhdGlvbilcblxuICAgICAgICAgICMgUmVzaXplIG5hdmlnYXRpb25cbiAgICAgICAgICBfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKS5jc3NcbiAgICAgICAgICAgICdtYXJnaW4tbGVmdCc6IC0oXy5sYXN0KEAkc2xpZGVyTmF2aWdhdGlvbikud2lkdGgoKSAvIDIpXG5cbiAgICAgICAgZWxzZSBpZiBlbGVtZW50LmRhdGEoJ1NsaWRlcicpXG5cbiAgICAgICAgICBzZWxmLnJlZ2lzdGVyTGlzdGVuZXIgZWxlbWVudFxuXG4gICAgICAgIGVsc2UgaWYgZWxlbWVudCBpbnN0YW5jZW9mIGpRdWVyeVxuXG4gICAgICAgICAgQCRzbGlkZXJOYXZpZ2F0aW9uLnB1c2ggZWxlbWVudFxuICAgICAgICAgIG5hdmlnYXRpb25JdGVtcyA9IF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pLmNoaWxkcmVuKClcblxuICAgICAgICAgIEAkc2xpZGVzLmVhY2ggKGluZGV4LHNsaWRlKT0+XG4gICAgICAgICAgICBpdGVtID0gbmF2aWdhdGlvbkl0ZW1zLmVxKGluZGV4KVxuICAgICAgICAgICAgaWYgaXRlbVxuICAgICAgICAgICAgICBpdGVtLmRhdGEgJ3NsaWRlcl9pbmRleCcsIEAkc2xpZGVyLmRhdGEgJ2luZGV4J1xuICAgICAgICAgICAgICBpdGVtLmRhdGEgJ2l0ZW1faW5kZXgnLCBpbmRleFxuICAgICAgICAgICAgICBpdGVtLmFkZENsYXNzICdzbGlkZXJfbmF2aWdhdGlvbkl0ZW0nXG4gICAgICAgICAgICAgIGl0ZW0ub24gJ2NsaWNrJywgKGV2ZW50KS0+XG4gICAgICAgICAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgICAgICAgICAgc2VsZi5nb1RvU2xpZGUgJChAKS5kYXRhKCdpdGVtX2luZGV4JylcblxuICAgICAgQHVwZGF0ZU5hdmlnYXRpb24oKVxuXG5cbiAgICAjIFJlZ2lzdGVyIGxpc3RlbmVyXG4gICAgcmVnaXN0ZXJMaXN0ZW5lcjogKGxpc3RlbmVyKS0+XG5cbiAgICAgIEAkc2xpZGVyTGlzdGVuZXJzLnB1c2ggbGlzdGVuZXJcblxuXG4gICAgIyBVcGRhdGUgbmF2aWdhdGlvbiBzdGF0dXNcbiAgICB1cGRhdGVOYXZpZ2F0aW9uOiAtPlxuXG4gICAgICBpbmRleCA9IEBjdXJyZW50U2xpZGVcblxuICAgICAgaWYgIUBvcHRpb25zLmRpc2FibGVkXG5cbiAgICAgICAgXy5lYWNoIEAkc2xpZGVyTmF2aWdhdGlvbiwgKGVsZW1lbnQpLT5cblxuICAgICAgICAgIGlmIGVsZW1lbnQgaW5zdGFuY2VvZiBqUXVlcnlcblxuICAgICAgICAgICAgJChlbGVtZW50KS5maW5kKCcuc2xpZGVyX25hdmlnYXRpb25JdGVtJylcbiAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICAgICAgICAuZmlsdGVyKCdbZGF0YS1pbmRleD0nK2luZGV4KyddJykuYWRkQ2xhc3MgJ2FjdGl2ZSdcblxuXG4gICAgIyBVcGRhdGUgc2xpZGUgcHJvcGVydGllcyB0byBjdXJyZW50IHNsaWRlciBzdGF0ZVxuICAgIHVwZGF0ZVNsaWRlczogLT5cblxuICAgICAgIyBGYWRlIGluYWN0aXZlIHNsaWRlcyB0byBhIHNwZWNpZmljIG9wYWNpdHkgdmFsdWVcbiAgICAgIGlmIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5XG4gICAgICAgIEBzZXRTbGlkZU9wYWNpdHkgMSwgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHlcblxuICAgICAgQCRzbGlkZXMucmVtb3ZlQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgIEAkc2xpZGVzLmVxKEBjdXJyZW50U2xpZGUpLmFkZENsYXNzICdhY3RpdmUnXG5cblxuICAgICMgU2V0IHNsaWRlIG9wYWNpdHkgZm9yIGFjdGl2ZSBhbmQgaW5hY3RpdmUgc2xpZGVzXG4gICAgc2V0U2xpZGVPcGFjaXR5OiAoYWN0aXZlLCBpbmFjdGl2ZSktPlxuXG4gICAgICBAJHNsaWRlcy5zdG9wKCkuYW5pbWF0ZVxuICAgICAgICBvcGFjaXR5OiBpbmFjdGl2ZVxuXG4gICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5zdG9wKCkuYW5pbWF0ZVxuICAgICAgICBvcGFjaXR5OiBhY3RpdmVcblxuXG4gICAgIyBFdmVudCBjYWxsYmFjayBvbiBzY3JvbGwgZW5kXG4gICAgb25TY3JvbGxFbmQ6ID0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgICMgSWYgU2xpZGVyIHNob3dzIG1vcmUgdGhhbiBvbmUgc2xpZGUgcGVyIHBhZ2VcbiAgICAgICMgd2UgbmVlZCB0byBjaGVjayBpZiB0aGUgY3VycmVudFNsaWRlIGlzIG9uIHRoZVxuICAgICAgIyBsYXN0IHBhZ2UgYW5kIGhpZ2hlciB0aGFuIHRoZSBvbmUgc25hcHBlZCB0b1xuICAgICAgaWYgQHNsaWRlc0luQ29udGFpbmVyID4gMVxuICAgICAgICBpZiBAaVNjcm9sbC5jdXJyZW50UGFnZS5wYWdlWCA8IEBudW1iZXJPZlNsaWRlcyAtIEBzbGlkZXNJbkNvbnRhaW5lclxuICAgICAgICAgIEBjdXJyZW50U2xpZGUgPSBAaVNjcm9sbC5jdXJyZW50UGFnZS5wYWdlWFxuICAgICAgZWxzZVxuICAgICAgICBAY3VycmVudFNsaWRlID0gQGlTY3JvbGwuY3VycmVudFBhZ2UucGFnZVhcblxuICAgICAgaWYgQG9wdGlvbnMuY2Fyb3VzZWxcbiAgICAgICAgIyBJZiBsYXN0IHNsaWRlLCByZXR1cm4gdG8gZmlyc3RcbiAgICAgICAgaWYgQGN1cnJlbnRTbGlkZStAb3B0aW9ucy5jYXJvdXNlbCA+PSBAbnVtYmVyT2ZTbGlkZXNcbiAgICAgICAgICBAZ29Ub1NsaWRlIEBvcHRpb25zLmNhcm91c2VsLCBmYWxzZVxuICAgICAgICAjIElmIGZpcnN0IHNsaWRlLCBtb3ZlIHRvIGxhc3RcbiAgICAgICAgZWxzZSBpZiBAY3VycmVudFNsaWRlIDwgQG9wdGlvbnMuY2Fyb3VzZWxcbiAgICAgICAgICBAZ29Ub1NsaWRlIEBudW1iZXJPZlNsaWRlcyAtIChAb3B0aW9ucy5jYXJvdXNlbCsxKSwgZmFsc2VcblxuICAgICAgXy5lYWNoIEAkc2xpZGVyTGlzdGVuZXJzLCAobGlzdGVuZXIpLT5cblxuICAgICAgICAjIFVwZGF0ZSByZW1vdGUgc2xpZGVyXG4gICAgICAgIGxpc3RlbmVyLlNsaWRlciAnc3RvcEF1dG9TY3JvbGwnXG4gICAgICAgIGxpc3RlbmVyLlNsaWRlciAnZ29Ub1NsaWRlJywgc2VsZi5jdXJyZW50U2xpZGVcblxuICAgICAgQHVwZGF0ZVNsaWRlcygpXG4gICAgICBAdXBkYXRlTmF2aWdhdGlvbigpXG4gICAgICBAZGVidWcoKVxuXG5cbiAgICAjIFVzZXIgdG91Y2hlcyB0aGUgc2NyZWVuIGJ1dCBzY3JvbGxpbmcgZGlkbid0IHN0YXJ0IHlldFxuICAgIG9uQmVmb3JlU2Nyb2xsU3RhcnQ6ID0+XG5cbiAgICAgIEBzdG9wQXV0b1Njcm9sbCgpXG5cblxuICAgICMgUmVzaXplIHNsaWRlclxuICAgIHJlc2l6ZTogPT5cblxuICAgICAgQHN0b3BBdXRvU2Nyb2xsKClcblxuICAgICAgaWYgQG9wdGlvbnMuc2xpZGVXaWR0aCA9PSAnYXV0bydcbiAgICAgICAgQCRzbGlkZXMud2lkdGggQCRzbGlkZXIub3V0ZXJXaWR0aCgpXG4gICAgICBlbHNlXG4gICAgICAgIEAkc2xpZGVzLndpZHRoIHBhcnNlSW50KEBvcHRpb25zLnNsaWRlV2lkdGgpICsgJ3B4J1xuXG4gICAgICAjIENhbGN1bGF0ZSBjb250YWluZXIgd2lkdGhcbiAgICAgICMgQSBwb3NzaWJsZSBtYXJnaW4gbGVmdCBhbmQgcmlnaHQgb2YgdGhlIGVsZW1lbnRzIG1ha2VzIHRoaXNcbiAgICAgICMgYSBsaXR0bGUgbW9yZSB0cmlja3kgdGhhbiBpdCBzZWVtcywgd2UgZG8gbm90IG9ubHkgbmVlZCB0b1xuICAgICAgIyBtdWx0aXBseSBhbGwgZWxlbWVudHMgKyB0aGVpciByZXNwZWN0aXZlIHNpZGUgbWFyZ2lucyBsZWZ0IGFuZFxuICAgICAgIyByaWdodCwgd2UgYWxzbyBoYXZlIHRvIHRha2UgaW50byBhY2NvdW50IHRoYXQgdGhlIGZpcnN0IGFuZCBsYXN0XG4gICAgICAjIGVsZW1lbnQgbWlnaHQgaGF2ZSBhIGRpZmZlcmVudCBtYXJnaW4gdG93YXJkcyB0aGUgYmVnaW5uaW5nIGFuZFxuICAgICAgIyBlbmQgb2YgdGhlIHNsaWRlIGNvbnRhaW5lclxuICAgICAgc2xpZGVXaWR0aCA9IChAJHNsaWRlcy5vdXRlcldpZHRoKCkgKyAoQG9wdGlvbnMuc2xpZGVNYXJnaW4gKiAyKSlcbiAgICAgIGNvbnRhaW5lcldpZHRoID0gIHNsaWRlV2lkdGggKiBAbnVtYmVyT2ZTbGlkZXNcblxuICAgICAgIyBSZW1vdmUgbGFzdCBhbmQgZmlyc3QgZWxlbWVudCBib3JkZXIgbWFyZ2luc1xuICAgICAgY29udGFpbmVyV2lkdGggLT0gQG9wdGlvbnMuc2xpZGVNYXJnaW4gKiAyXG5cbiAgICAgICMgQWRkIHdoYXRldmVyIG1hcmdpbiB0aGVzZSB0d28gZWxlbWVudHMgaGF2ZVxuICAgICAgY29udGFpbmVyV2lkdGggKz0gcGFyc2VGbG9hdCBAJHNsaWRlcy5maXJzdCgpLmNzcygnbWFyZ2luLWxlZnQnKVxuICAgICAgY29udGFpbmVyV2lkdGggKz0gcGFyc2VGbG9hdCBAJHNsaWRlcy5sYXN0KCkuY3NzKCdtYXJnaW4tcmlnaHQnKVxuXG4gICAgICAjIERldGVybWluZSB0aGUgYW1vdW50IG9mIHNsaWRlcyB0aGF0IGNhbiBmaXQgaW5zaWRlIHRoZSBzbGlkZSBjb250YWluZXJcbiAgICAgICMgV2UgbmVlZCB0aGlzIGZvciB0aGUgb25TY3JvbGxFbmQgZXZlbnQsIHRvIGNoZWNrIGlmIHRoZSBjdXJyZW50IHNsaWRlXG4gICAgICAjIGlzIGFscmVhZHkgb24gdGhlIGxhc3QgcGFnZVxuICAgICAgQHNsaWRlc0luQ29udGFpbmVyID0gTWF0aC5jZWlsIEAkc2xpZGVyLndpZHRoKCkgLyBzbGlkZVdpZHRoXG5cbiAgICAgIEAkc2xpZGVDb250YWluZXIud2lkdGggY29udGFpbmVyV2lkdGhcbiAgICAgIEAkc2xpZGVDb250YWluZXIuaGVpZ2h0IEAkc2xpZGVyLmhlaWdodCgpXG5cbiAgICAgIGlmIEBpU2Nyb2xsXG4gICAgICAgIEBpU2Nyb2xsLnJlZnJlc2goKVxuXG4gICAgICBpZiBAb3B0aW9ucy5hdXRvc2Nyb2xsXG4gICAgICAgIEBzdGFydEF1dG9TY3JvbGwoKVxuXG5cbiAgICAjIEJpbmQgZXZlbnRzXG4gICAgYmluZEV2ZW50czogLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgQGlTY3JvbGwub24gJ3Njcm9sbEVuZCcsIEBvblNjcm9sbEVuZFxuXG4gICAgICBAaVNjcm9sbC5vbiAnYmVmb3JlU2Nyb2xsU3RhcnQnLCBAb25CZWZvcmVTY3JvbGxTdGFydFxuXG4gICAgICBAJHNsaWRlcy5vbiAndGFwJywgKGV2ZW50KS0+XG4gICAgICAgIHNlbGYuc3RvcEF1dG9TY3JvbGwoKVxuICAgICAgICBpZiB0eXBlb2Ygc2VsZi5vcHRpb25zLm9uU2xpZGVDbGljayA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgc2VsZi5vcHRpb25zLm9uU2xpZGVDbGljay5hcHBseShALCBbZXZlbnQsc2VsZl0pXG5cbiAgICAgIEAkc2xpZGVyLm9uICdjbGljaycsICdzcGFuLm5leHQnLCAoZXZlbnQpLT5cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYubmV4dFNsaWRlKClcblxuICAgICAgICBpZiB0eXBlb2Ygc2VsZi5vcHRpb25zLm9uTmV4dENsaWNrID09ICdmdW5jdGlvbidcbiAgICAgICAgICBzZWxmLm9wdGlvbnMub25OZXh0Q2xpY2suYXBwbHkoQCwgW2V2ZW50LHNlbGZdKVxuXG4gICAgICBAJHNsaWRlci5vbiAnY2xpY2snLCAnc3Bhbi5wcmV2JywgKGV2ZW50KS0+XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIHNlbGYuc3RvcEF1dG9TY3JvbGwoKVxuICAgICAgICBzZWxmLnByZXZTbGlkZSgpXG5cbiAgICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vblByZXZDbGljayA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgc2VsZi5vcHRpb25zLm9uUHJldkNsaWNrLmFwcGx5KEAsIFtldmVudCxzZWxmXSlcblxuICAgICAgQCRzbGlkZXIub24gJ2NsaWNrJywgJ3VsLnNsaWRlck5hdmlnYXRpb24gbGknLCAtPlxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgc2VsZi5nb1RvU2xpZGUgJChAKS5kYXRhKCdpbmRleCcpXG5cbiAgICAgICQod2luZG93KS5iaW5kICdyZXNpemUnLCAtPlxuICAgICAgICBzZWxmLnJlc2l6ZSgpXG4gICAgICAgICMjI1xuICAgICAgICBpZiBAcmVzaXplVG9cbiAgICAgICAgICBjbGVhclRpbWVvdXQgQHJlc2l6ZVRpbWVvdXRcbiAgICAgICAgQHJlc2l6ZVRpbWVvdXQgPSBzZXRUaW1lb3V0IC0+XG4gICAgICAgICwgMjAwXG4gICAgICAgICMjI1xuXG5cbiAgICAjIEdvIHRvIG5leHQgc2xpZGVcbiAgICBuZXh0U2xpZGU6ID0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIGlmIEBudW1iZXJPZlNsaWRlcyA+IChAY3VycmVudFNsaWRlKzEpXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gKEBjdXJyZW50U2xpZGUrMSlcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSAwXG5cbiAgICAgIEBnb1RvU2xpZGUgbmV4dFNsaWRlSW5kZXhcblxuXG4gICAgIyBHbyB0byBwcmV2aW91cyBzbGlkZVxuICAgIHByZXZTbGlkZTogPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgQGN1cnJlbnRTbGlkZS0xID49IDBcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSBAY3VycmVudFNsaWRlLTFcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSBAbnVtYmVyT2ZTbGlkZXMtMVxuXG4gICAgICBAZ29Ub1NsaWRlIG5leHRTbGlkZUluZGV4XG5cblxuICAgICMgR28gdG8gc2xpZGUgaW5kZXhcbiAgICBnb1RvU2xpZGU6IChpbmRleCwgYW5pbWF0ZT10cnVlKT0+XG5cbiAgICAgIGlmIGFuaW1hdGVcbiAgICAgICAgQGlTY3JvbGw/LmdvVG9QYWdlIGluZGV4LCAwLCBAb3B0aW9ucy5zcGVlZFxuICAgICAgZWxzZVxuICAgICAgICBAaVNjcm9sbD8uZ29Ub1BhZ2UgaW5kZXgsIDAsIDBcblxuICAgICAgQGN1cnJlbnRTbGlkZSA9IGluZGV4XG4gICAgICBAdXBkYXRlU2xpZGVzKClcbiAgICAgIEB1cGRhdGVOYXZpZ2F0aW9uKClcblxuICAgICAgXy5lYWNoIEAkc2xpZGVyTGlzdGVuZXJzLCAobGlzdGVuZXIpLT5cblxuICAgICAgICAjIFVwZGF0ZSByZW1vdGUgc2xpZGVyXG4gICAgICAgIGxpc3RlbmVyLlNsaWRlciAnc3RvcEF1dG9TY3JvbGwnXG4gICAgICAgIGxpc3RlbmVyLlNsaWRlciAnZ29Ub1NsaWRlJywgaW5kZXhcblxuICAgICAgQGRlYnVnKClcblxuXG4gICAgIyBBZGQgZmFrZSBjYXJvdXNlbCBzbGlkZXNcbiAgICBhZGRDYXJvdXNlbFNsaWRlczogLT5cblxuICAgICAgQCRzdGFydEVsZW1lbnRzID0gQCRzbGlkZXMuc2xpY2UoLUBvcHRpb25zLmNhcm91c2VsKS5jbG9uZSgpXG4gICAgICBAJGVuZEVsZW1lbnRzID0gQCRzbGlkZXMuc2xpY2UoMCxAb3B0aW9ucy5jYXJvdXNlbCkuY2xvbmUoKVxuXG4gICAgICBAJHNsaWRlcy5wYXJlbnQoKS5wcmVwZW5kIEAkc3RhcnRFbGVtZW50c1xuICAgICAgQCRzbGlkZXMucGFyZW50KCkuYXBwZW5kIEAkZW5kRWxlbWVudHNcblxuXG4gICAgIyBTdGFydCBhdXRvc2Nyb2xsXG4gICAgc3RhcnRBdXRvU2Nyb2xsOiA9PlxuXG4gICAgICBAaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCBAbmV4dFNsaWRlLCBAb3B0aW9ucy5pbnRlcnZhbFxuXG5cbiAgICAjIFN0b3AgYXV0b3Njcm9sbFxuICAgIHN0b3BBdXRvU2Nyb2xsOiA9PlxuXG4gICAgICBjbGVhckludGVydmFsIEBpbnRlcnZhbFxuICAgICAgQGludGVydmFsID0gbnVsbFxuXG5cbiAgICAjIEFkZCBkZWJ1ZyBvdXRwdXQgdG8gc2xpZGVyXG4gICAgZGVidWc6ID0+XG5cbiAgICAgIGlmIEBvcHRpb25zLmRlYnVnXG4gICAgICAgIEAkc2xpZGVyLmZpbmQoJy5kZWJ1ZycpLnJlbW92ZSgpXG4gICAgICAgIEAkc2xpZGVyLmFwcGVuZCBAZGVidWdUZW1wbGF0ZVxuICAgICAgICAgICdzbGlkZXJfaW5kZXgnOiBAJHNsaWRlci5kYXRhICdpbmRleCdcbiAgICAgICAgICAnbnVtYmVyX29mX3NsaWRlcyc6IEBudW1iZXJPZlNsaWRlc1xuICAgICAgICAgICdjdXJyZW50X3NsaWRlJzogQGlTY3JvbGwuY3VycmVudFBhZ2U/LnBhZ2VYXG4gICAgICAgICAgJ2F1dG9zY3JvbGwnOiBpZiBAaW50ZXJ2YWwgdGhlbiAnZW5hYmxlZCcgZWxzZSAnZGlzYWJsZWQnXG4gICAgICAgICAgJ251bWJlcl9vZl9uYXZpZ2F0aW9ucyc6IEAkc2xpZGVyTmF2aWdhdGlvbi5sZW5ndGhcbiAgICAgICAgICAnc2xpZGVyX3dpZHRoJzogQCRzbGlkZXIud2lkdGgoKVxuXG5cbiAgICAjIFByaW50IG9wdGlvbiB0byBjb25zb2xlXG4gICAgIyBDYW4ndCBqdXN0IHJldHVybiB0aGUgdmFsdWUgdG8gZGVidWcgaXQgYmVjYXVzZVxuICAgICMgaXQgd291bGQgYnJlYWsgY2hhaW5pbmcgd2l0aCB0aGUgalF1ZXJ5IG9iamVjdFxuICAgICMgRXZlcnkgbWV0aG9kIGNhbGwgcmV0dXJucyBhIGpRdWVyeSBvYmplY3RcbiAgICBnZXQ6IChvcHRpb24pIC0+XG4gICAgICBjb25zb2xlLmxvZyAnb3B0aW9uOiAnK29wdGlvbisnIGlzICcrQG9wdGlvbnNbb3B0aW9uXVxuICAgICAgQG9wdGlvbnNbb3B0aW9uXVxuXG5cbiAgICAjIFNldCBvcHRpb24gdG8gdGhpcyBpbnN0YW5jZXMgb3B0aW9ucyBhcnJheVxuICAgIHNldDogKG9wdGlvbiwgdmFsdWUpIC0+XG5cbiAgICAgICMgU2V0IG9wdGlvbnMgdmFsdWVcbiAgICAgIEBvcHRpb25zW29wdGlvbl0gPSB2YWx1ZVxuXG4gICAgICAjIElmIG5vIGludGVydmFsIGlzIGN1cnJlbnRseSBwcmVzZW50LCBzdGFydCBhdXRvc2Nyb2xsXG4gICAgICBpZiBvcHRpb24gPT0gJ2F1dG9zY3JvbGwnICYmICFAaW50ZXJ2YWxcbiAgICAgICAgQHN0YXJ0QXV0b1Njcm9sbCgpXG5cbiAgICAgICMgVE9ETzogVXBkYXRlIHNsaWRlIG1hcmdpblxuICAgICAgI2lmIG9wdGlvbiA9PSAnc2xpZGVNYXJnaW4nXG4gICAgICAgICMgY2FjaGUgc2xpZGVNYXJnaW4gQ1NTIG9uIGVsZW1lbnQ/XG4gICAgICAgICMgd2hhdCBpZiB0aGUgdXNlciB3YW50cyB0byBzd2l0Y2ggYmFja1xuXG4gICAgICBpZiBvcHRpb24gPT0gJ2luYWN0aXZlU2xpZGVPcGFjaXR5JyAmJiBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eVxuICAgICAgICBAc2V0U2xpZGVPcGFjaXR5IDEsIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5XG5cbiAgICAgIGlmIG9wdGlvbiA9PSAnbmF2aWdhdGlvbidcbiAgICAgICAgQHJlbmRlck5hdmlnYXRpb24oKVxuXG4gICAgICBAZGVidWcoKVxuXG5cblxuICAjIERlZmluZSB0aGUgcGx1Z2luXG4gICQuZm4uZXh0ZW5kIFNsaWRlcjogKG9wdGlvbiwgYXJncy4uLikgLT5cblxuICAgIEBlYWNoIChpbmRleCktPlxuICAgICAgJHRoaXMgPSAkKEApXG4gICAgICBkYXRhID0gJHRoaXMuZGF0YSgnU2xpZGVyJylcblxuICAgICAgaWYgIWRhdGFcbiAgICAgICAgJHRoaXMuZGF0YSAnU2xpZGVyJywgKGRhdGEgPSBuZXcgU2xpZGVyKEAsIG9wdGlvbiwgaW5kZXgpKVxuXG4gICAgICBpZiB0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnXG4gICAgICAgIHJldHVybiBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgYXJncylcblxuXG4pIHdpbmRvdy5qUXVlcnksIHdpbmRvd1xuXG4iXX0=