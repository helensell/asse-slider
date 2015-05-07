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
        indexNavigationTemplate: _.template('<ul class="sliderNavigation"> <% _.each(slides, function(element,index){ %> <% if(!carousel || (index>=carousel && (index+1)<=slides.length-carousel)){ %> <li data-item_index="<%= index %>" class="slider_navigationItem fa fa-circle-o"></li> <% } %> <% }); %> </ul>'),
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
          eventPassthrough: true,
          preventDefault: false
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
                  item.data('item_index', index + parseInt(self.options.carousel));
                  item.addClass('slider_navigationItem');
                  return item.on('click', function(event) {
                    event.stopPropagation();
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
        var index, self;
        self = this;
        index = this.currentSlide;
        if (!this.options.disabled) {
          return _.each(this.$sliderNavigation, function(element) {
            if (element instanceof jQuery) {
              return $(element).find('.slider_navigationItem').removeClass('active').filter(function() {
                return $(this).data('item_index') === index;
              }).addClass('active');
            }
          });
        }
      };

      Slider.prototype.updateSlides = function(animate) {
        if (animate == null) {
          animate = true;
        }
        if (this.options.inactiveSlideOpacity && animate) {
          this.setSlideOpacity(1, this.options.inactiveSlideOpacity, true);
        } else {
          this.setSlideOpacity(1, this.options.inactiveSlideOpacity, false);
        }
        this.$slides.removeClass('active');
        return this.$slides.eq(this.currentSlide).addClass('active');
      };

      Slider.prototype.setSlideOpacity = function(active, inactive, animate) {
        if (animate == null) {
          animate = true;
        }
        if (animate) {
          this.$slides.stop().animate({
            opacity: inactive
          });
          return this.$slides.eq(this.currentSlide).stop().animate({
            opacity: active
          });
        } else {
          this.$slides.stop().css({
            opacity: inactive
          });
          return this.$slides.eq(this.currentSlide).stop().css({
            opacity: active
          });
        }
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
          if (this.currentSlide >= this.numberOfSlides - this.options.carousel) {
            this.goToSlide(this.options.carousel, false);
          } else if (this.currentSlide < this.options.carousel) {
            this.goToSlide(this.numberOfSlides - (this.options.carousel + 1), false);
          }
        }
        _.each(this.$sliderListeners, function(listener) {
          listener.Slider('stopAutoScroll');
          return listener.Slider('goToSlide', self.currentSlide - self.options.carousel);
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
          event.stopPropagation();
          self.stopAutoScroll();
          if (typeof self.options.onSlideClick === 'function') {
            return self.options.onSlideClick.apply(this, [event, self]);
          }
        });
        this.$slider.on('tap', 'span.next', function(event) {
          event.stopPropagation();
          self.stopAutoScroll();
          self.nextSlide();
          if (typeof self.options.onNextClick === 'function') {
            return self.options.onNextClick.apply(this, [event, self]);
          }
        });
        this.$slider.on('tap', 'span.prev', function(event) {
          event.stopPropagation();
          self.stopAutoScroll();
          self.prevSlide();
          if (typeof self.options.onPrevClick === 'function') {
            return self.options.onPrevClick.apply(this, [event, self]);
          }
        });
        this.$slider.on('tap', 'ul.sliderNavigation li', function() {
          self.stopAutoScroll();
          return self.goToSlide($(this).data('item_index'));
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
        var ref, ref1, self;
        if (animate == null) {
          animate = true;
        }
        self = this;
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
        this.updateSlides(animate);
        this.updateNavigation();
        _.each(this.$sliderListeners, function(listener) {
          listener.Slider('stopAutoScroll');
          return listener.Slider('goToSlide', index - self.options.carousel);
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

//# sourceMappingURL=data:application/json;base64,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UjtLQUFaLEVBamdCRDtFQUFBLENBQUQsQ0FBQSxDQThnQkUsTUFBTSxDQUFDLE1BOWdCVCxFQThnQmlCLE1BOWdCakIsQ0FBQSxDQUFBO0FBQUEiLCJmaWxlIjoiYXNzZS1zbGlkZXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyIjXG4jIFNsaWRlciBqUXVlcnkgcGx1Z2luXG4jIEF1dGhvcjogVGhvbWFzIEtsb2tvc2NoIDxtYWlsQHRob21hc2tsb2tvc2NoLmNvbT5cbiNcbigoJCwgd2luZG93KSAtPlxuXG4gICMgRGVmaW5lIHRoZSBwbHVnaW4gY2xhc3NcbiAgY2xhc3MgU2xpZGVyXG5cbiAgICBpU2Nyb2xsOiBudWxsXG4gICAgbnVtYmVyT2ZTbGlkZXM6IG51bGxcbiAgICBjdXJyZW50U2xpZGU6IDBcbiAgICBpbnRlcnZhbDogbnVsbFxuXG4gICAgJHNsaWRlcjogbnVsbFxuICAgICRzbGlkZUNvbnRhaW5lcjogbnVsbFxuICAgICRzbGlkZXM6IG51bGxcbiAgICAkc2xpZGVyTmF2aWdhdGlvbjogbnVsbFxuICAgICRzbGlkZXJMaXN0ZW5lcnM6IG51bGxcbiAgICAkc2xpZGVzSW5Db250YWluZXI6IG51bGxcblxuICAgIGRlZmF1bHRzOlxuICAgICAgYXV0b3Njcm9sbDogdHJ1ZVxuICAgICAgc3BlZWQ6IDUwMFxuICAgICAgaW50ZXJ2YWw6IDUwMDBcbiAgICAgIGRlYnVnOiB0cnVlXG4gICAgICBzbmFwOiB0cnVlXG5cbiAgICAgICMgSW4gdGhpcyBzdGF0ZSwgdGhlIHNsaWRlciBpbnN0YW5jZSBzaG91bGQgbmV2ZXIgZm9yd2FyZCBldmVudHMgdG9cbiAgICAgICMgdGhlIGlTY3JvbGwgY29tcG9uZW50LCBlLmcuIHdoZW4gdGhlIHNsaWRlciBpcyBub3QgdmlzaWJsZSAoZGlzcGxheTpub25lKVxuICAgICAgIyBhbmQgdGhlcmVmb3JlIGlTY3JvbGwgY2FuJ3QgZ2V0L3Njcm9sbCB0aGUgc2xpZGUgZWxlbWVudHNcbiAgICAgIGRpc2FibGVkOiBmYWxzZVxuXG4gICAgICAjIE5hdmlnYXRpb24gZWxlbWVudCBhcnJheVxuICAgICAgIyBlaXRoZXIgJ2luZGV4JyBmb3Igb24tc2xpZGVyIG5hdmlnYXRpb24sIGEgalF1ZXJ5IHNlbGVjdG9yIGZvciBhIHRodW1ibmFpbFxuICAgICAgIyBuYXZpZ2F0aW9uIG9yIGFub3RoZXIgc2xpZGVyIGVsZW1lbnQgZm9yIGEgc2xpZGVyIGFjdGluZyBhcyBhIHN5bmNlZCByZW1vdGVcbiAgICAgICMgbmF2aWdhdGlvbiB0byB0aGlzIHNsaWRlciBpbnN0YW5jZVxuICAgICAgbmF2aWdhdGlvbjogWydpbmRleCddXG5cbiAgICAgICMgSW5kZXggbmF2aWdhdGlvbiBkZWZhdWx0IHRlbXBsYXRlXG4gICAgICBpbmRleE5hdmlnYXRpb25UZW1wbGF0ZTogXy50ZW1wbGF0ZSgnPHVsIGNsYXNzPVwic2xpZGVyTmF2aWdhdGlvblwiPlxuICAgICAgICA8JSBfLmVhY2goc2xpZGVzLCBmdW5jdGlvbihlbGVtZW50LGluZGV4KXsgJT5cbiAgICAgICAgICA8JSBpZighY2Fyb3VzZWwgfHwgKGluZGV4Pj1jYXJvdXNlbCAmJiAoaW5kZXgrMSk8PXNsaWRlcy5sZW5ndGgtY2Fyb3VzZWwpKXsgJT5cbiAgICAgICAgICAgIDxsaSBkYXRhLWl0ZW1faW5kZXg9XCI8JT0gaW5kZXggJT5cIiBjbGFzcz1cInNsaWRlcl9uYXZpZ2F0aW9uSXRlbSBmYSBmYS1jaXJjbGUtb1wiPjwvbGk+XG4gICAgICAgICAgPCUgfSAlPlxuICAgICAgICA8JSB9KTsgJT5cbiAgICAgIDwvdWw+JylcblxuICAgICAgcHJldk5leHRCdXR0b25zOiB0cnVlXG4gICAgICBwcmV2TmV4dEJ1dHRvbnNUZW1wbGF0ZTogXy50ZW1wbGF0ZSgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInByZXYgZmEgZmEtYW5nbGUtbGVmdFwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibmV4dCBmYSBmYS1hbmdsZS1yaWdodFwiPjwvc3Bhbj4nKVxuXG4gICAgICBzbGlkZUNvbnRhaW5lclNlbGVjdG9yOiAnLnNsaWRlQ29udGFpbmVyJ1xuICAgICAgc2xpZGVTZWxlY3RvcjogJ3VsLnNsaWRlcyA+IGxpJ1xuXG4gICAgICAjIE9wYWNpdHkgb2Ygc2xpZGVzIG90aGVyIHRoYW4gdGhlIGN1cnJlbnRcbiAgICAgICMgT25seSBhcHBsaWNhYmxlIGlmIHRoZSBzbGlkZXIgZWxlbWVudCBoYXMgb3ZlcmZsb3c6IHZpc2libGVcbiAgICAgICMgYW5kIGluYWN0aXZlIHNsaWRlcyBhcmUgc2hvd24gbmV4dCB0byB0aGUgY3VycmVudFxuICAgICAgaW5hY3RpdmVTbGlkZU9wYWNpdHk6IG51bGxcblxuICAgICAgIyBNYXJnaW4gbGVmdCBhbmQgcmlnaHQgb2YgdGhlIHNsaWRlcyBpbiBwaXhlbHNcbiAgICAgIHNsaWRlTWFyZ2luOiAwXG5cbiAgICAgICMgV2lkdGggb2YgdGhlIHNsaWRlLCBkZWZhdWx0cyB0byBhdXRvLCB0YWtlcyBhIDEwMCUgc2xpZGVyIHdpZHRoXG4gICAgICBzbGlkZVdpZHRoOiAnYXV0bydcblxuICAgICAgIyBGYWtlIGEgY2Fyb3VzZWwgZWZmZWN0IGJ5IHNob3dpbmcgdGhlIGxhc3Qgc2xpZGUgbmV4dCB0byB0aGUgZmlyc3RcbiAgICAgICMgdGhhdCBjYW4ndCBiZSBuYXZpZ2F0ZWQgdG8gYnV0IGZvcndhcmRzIHRvIHRoZSBlbmQgb2YgdGhlIHNsaWRlclxuICAgICAgIyBOdW1iZXIgaW5kaWNhdGVzIG51bWJlciBvZiBzbGlkZXMgcGFkZGluZyBsZWZ0IGFuZCByaWdodFxuICAgICAgY2Fyb3VzZWw6IDBcblxuICAgICAgIyBTbGlkZSBjbGljayBjYWxsYmFjayBmdW5jdGlvblxuICAgICAgb25TbGlkZUNsaWNrOiAoZXZlbnQpLT5cbiAgICAgICAgI2NvbnNvbGUubG9nICQoZXZlbnQuY3VycmVudFRhcmdldCkuaW5kZXgoKVxuXG4gICAgICBvbk5leHRDbGljazogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnTmV4dCdcblxuICAgICAgb25QcmV2Q2xpY2s6IChldmVudCktPlxuICAgICAgICAjY29uc29sZS5sb2cgJ1ByZXYnXG5cblxuICAgIGRlYnVnVGVtcGxhdGU6IF8udGVtcGxhdGUoJ1xuICAgICAgPGRpdiBjbGFzcz1cImRlYnVnXCI+XG4gICAgICAgIDxzcGFuPlNsaWRlcjogPCU9IHNsaWRlcl9pbmRleCAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+IyBvZiBzbGlkZXM6IDwlPSBudW1iZXJfb2Zfc2xpZGVzICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj5DdXJyZW50IHNsaWRlOiA8JT0gY3VycmVudF9zbGlkZSAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+QXV0b3Njcm9sbDogPCU9IGF1dG9zY3JvbGwgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPiMgb2YgbmF2aWdhdGlvbnM6IDwlPSBudW1iZXJfb2ZfbmF2aWdhdGlvbnMgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPlNsaWRlciB3aWR0aDogPCU9IHNsaWRlcl93aWR0aCAlPjwvc3Bhbj5cbiAgICAgIDwvZGl2PicpXG5cblxuICAgICMgQ29uc3RydWN0b3JcbiAgICBjb25zdHJ1Y3RvcjogKGVsLCBvcHRpb25zLCBpbmRleCA9IG51bGwpIC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIEBvcHRpb25zID0gJC5leHRlbmQoe30sIEBkZWZhdWx0cywgb3B0aW9ucylcblxuICAgICAgQCRzbGlkZXIgPSAkKGVsKVxuICAgICAgQCRzbGlkZXIuZGF0YSAnaW5kZXgnLCBpbmRleFxuICAgICAgQCRzbGlkZXIuYWRkQ2xhc3MgJ3NsaWRlcl8nK2luZGV4XG4gICAgICBAJHNsaWRlck5hdmlnYXRpb24gPSBbXVxuICAgICAgQCRzbGlkZXJMaXN0ZW5lcnMgPSBbXVxuICAgICAgQCRzbGlkZXNJbkNvbnRhaW5lciA9IG51bGxcblxuICAgICAgQG9wdGlvbnMub25TbGlkZUNsaWNrID0gKGV2ZW50KS0+XG4gICAgICAgIHNlbGYuZ29Ub1NsaWRlICQoZXZlbnQuY3VycmVudFRhcmdldCkuaW5kZXgoKVxuXG4gICAgICBAJHNsaWRlQ29udGFpbmVyID0gQCRzbGlkZXIuZmluZCBAb3B0aW9ucy5zbGlkZUNvbnRhaW5lclNlbGVjdG9yXG4gICAgICBAcmVmcmVzaFNsaWRlcygpXG5cbiAgICAgIGlmIEBvcHRpb25zLmNhcm91c2VsXG4gICAgICAgIEBhZGRDYXJvdXNlbFNsaWRlcygpXG4gICAgICAgIEByZWZyZXNoU2xpZGVzKClcbiAgICAgICAgQGN1cnJlbnRTbGlkZSA9IEBvcHRpb25zLmNhcm91c2VsXG5cbiAgICAgICMgRW5hYmxlIHNsaWRlcyB0cm91Z2ggQ1NTXG4gICAgICBAZW5hYmxlU2xpZGVzKClcblxuICAgICAgQGlTY3JvbGwgPSBuZXcgSVNjcm9sbCBlbCxcbiAgICAgICAgc2Nyb2xsWDogdHJ1ZVxuICAgICAgICBzY3JvbGxZOiBmYWxzZVxuICAgICAgICBzbmFwOiBAb3B0aW9ucy5zbmFwXG4gICAgICAgIHNuYXBTcGVlZDogNDAwXG4gICAgICAgIHRhcDogdHJ1ZVxuICAgICAgICBtb21lbnR1bTogZmFsc2VcbiAgICAgICAgZXZlbnRQYXNzdGhyb3VnaDogdHJ1ZVxuICAgICAgICBwcmV2ZW50RGVmYXVsdDogZmFsc2VcblxuICAgICAgaWYgQG9wdGlvbnMuYXV0b3Njcm9sbFxuICAgICAgICBAc3RhcnRBdXRvU2Nyb2xsKClcblxuICAgICAgaWYgQG9wdGlvbnMucHJldk5leHRCdXR0b25zXG4gICAgICAgIEBhZGRQcmV2TmV4dEJ1dHRvbnMoKVxuXG4gICAgICBpZiBfLnNpemUoQG9wdGlvbnMubmF2aWdhdGlvbilcbiAgICAgICAgQHJlbmRlck5hdmlnYXRpb24oKVxuXG4gICAgICBAcmVzaXplKClcbiAgICAgIEBnb1RvU2xpZGUgQGN1cnJlbnRTbGlkZSwgZmFsc2VcbiAgICAgIEBiaW5kRXZlbnRzKClcbiAgICAgIEBkZWJ1ZygpXG4gICAgICBAXG5cblxuICAgICMgUmVmcmVzaCBzbGlkZXNcbiAgICByZWZyZXNoU2xpZGVzOiAtPlxuXG4gICAgICBAJHNsaWRlcyA9IEAkc2xpZGVDb250YWluZXIuZmluZCBAb3B0aW9ucy5zbGlkZVNlbGVjdG9yXG4gICAgICBAbnVtYmVyT2ZTbGlkZXMgPSBAJHNsaWRlcy5sZW5ndGhcblxuXG4gICAgIyBFbmFibGUgc2xpZGVzIHZpYSBDU1NcbiAgICBlbmFibGVTbGlkZXM6IC0+XG5cbiAgICAgIEAkc2xpZGVzLmNzc1xuICAgICAgICBkaXNwbGF5OiAnYmxvY2snXG5cblxuICAgICMgQWRkIHByZXYgbmV4dCBidXR0b25zXG4gICAgYWRkUHJldk5leHRCdXR0b25zOiAtPlxuXG4gICAgICBAJHNsaWRlci5hcHBlbmQgQG9wdGlvbnMucHJldk5leHRCdXR0b25zVGVtcGxhdGUoKVxuXG5cbiAgICAjIEFkZCBuYXZpZ2F0aW9uXG4gICAgcmVuZGVyTmF2aWdhdGlvbjogLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgIyBEZWxldGUgb2xkIHNsaWRlciBuYXZpZ2F0aW9uIGVsZW1lbnRzXG4gICAgICBfLmVhY2ggQCRzbGlkZXJOYXZpZ2F0aW9uLCAoZWxlbWVudCwgaW5kZXgpLT5cbiAgICAgICAgaWYgIWVsZW1lbnQuZGF0YSgnU2xpZGVyJylcbiAgICAgICAgICAkKGVsZW1lbnQpLnJlbW92ZSgpXG5cbiAgICAgIF8uZWFjaCBAb3B0aW9ucy5uYXZpZ2F0aW9uLCAoZWxlbWVudCwgaW5kZXgsIGxpc3QpPT5cblxuICAgICAgICBpZiBlbGVtZW50ID09ICdpbmRleCdcblxuICAgICAgICAgICMgQ3JlYXRlIGEgalF1ZXJ5IG9iamVjdCBkaXJlY3RseSBmcm9tIHNsaWRlciBjb2RlXG4gICAgICAgICAgbmV3RWxlbWVudCA9IEBvcHRpb25zLmluZGV4TmF2aWdhdGlvblRlbXBsYXRlKHsnc2xpZGVzJzogQCRzbGlkZXMsICdjYXJvdXNlbCc6IEBvcHRpb25zLmNhcm91c2VsfSlcbiAgICAgICAgICBAJHNsaWRlck5hdmlnYXRpb24ucHVzaCAkKG5ld0VsZW1lbnQpXG5cbiAgICAgICAgICAjIEFwcGVuZCBpdCB0byBzbGlkZXIgZWxlbWVudFxuICAgICAgICAgIEAkc2xpZGVyLmFwcGVuZCBfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKVxuXG4gICAgICAgICAgIyBSZXNpemUgbmF2aWdhdGlvblxuICAgICAgICAgIF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pLmNzc1xuICAgICAgICAgICAgJ21hcmdpbi1sZWZ0JzogLShfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKS53aWR0aCgpIC8gMilcblxuICAgICAgICBlbHNlIGlmIGVsZW1lbnQuZGF0YSgnU2xpZGVyJylcblxuICAgICAgICAgIHNlbGYucmVnaXN0ZXJMaXN0ZW5lciBlbGVtZW50XG5cbiAgICAgICAgZWxzZSBpZiBlbGVtZW50IGluc3RhbmNlb2YgalF1ZXJ5XG5cbiAgICAgICAgICBAJHNsaWRlck5hdmlnYXRpb24ucHVzaCBlbGVtZW50XG4gICAgICAgICAgbmF2aWdhdGlvbkl0ZW1zID0gXy5sYXN0KEAkc2xpZGVyTmF2aWdhdGlvbikuY2hpbGRyZW4oKVxuXG4gICAgICAgICAgQCRzbGlkZXMuZWFjaCAoaW5kZXgsc2xpZGUpPT5cbiAgICAgICAgICAgIGl0ZW0gPSBuYXZpZ2F0aW9uSXRlbXMuZXEoaW5kZXgpXG4gICAgICAgICAgICBpZiBpdGVtXG4gICAgICAgICAgICAgIGl0ZW0uZGF0YSAnc2xpZGVyX2luZGV4JywgQCRzbGlkZXIuZGF0YSAnaW5kZXgnXG4gICAgICAgICAgICAgIGl0ZW0uZGF0YSAnaXRlbV9pbmRleCcsIGluZGV4K3BhcnNlSW50KHNlbGYub3B0aW9ucy5jYXJvdXNlbClcbiAgICAgICAgICAgICAgaXRlbS5hZGRDbGFzcyAnc2xpZGVyX25hdmlnYXRpb25JdGVtJ1xuICAgICAgICAgICAgICBpdGVtLm9uICdjbGljaycsIChldmVudCktPlxuICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgICAgICAgICAgc2VsZi5nb1RvU2xpZGUgJChAKS5kYXRhKCdpdGVtX2luZGV4JylcblxuICAgICAgQHVwZGF0ZU5hdmlnYXRpb24oKVxuXG5cbiAgICAjIFJlZ2lzdGVyIGxpc3RlbmVyXG4gICAgcmVnaXN0ZXJMaXN0ZW5lcjogKGxpc3RlbmVyKS0+XG5cbiAgICAgIEAkc2xpZGVyTGlzdGVuZXJzLnB1c2ggbGlzdGVuZXJcblxuXG4gICAgIyBVcGRhdGUgbmF2aWdhdGlvbiBzdGF0dXNcbiAgICB1cGRhdGVOYXZpZ2F0aW9uOiAtPlxuXG4gICAgICBzZWxmID0gQFxuICAgICAgaW5kZXggPSBAY3VycmVudFNsaWRlXG5cbiAgICAgIGlmICFAb3B0aW9ucy5kaXNhYmxlZFxuXG4gICAgICAgIF8uZWFjaCBAJHNsaWRlck5hdmlnYXRpb24sIChlbGVtZW50KS0+XG5cbiAgICAgICAgICBpZiBlbGVtZW50IGluc3RhbmNlb2YgalF1ZXJ5XG5cbiAgICAgICAgICAgICQoZWxlbWVudCkuZmluZCgnLnNsaWRlcl9uYXZpZ2F0aW9uSXRlbScpXG4gICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgICAgICAgICAgICAgLmZpbHRlciAoKS0+ICQoQCkuZGF0YSgnaXRlbV9pbmRleCcpID09IGluZGV4XG4gICAgICAgICAgICAgIC5hZGRDbGFzcyAnYWN0aXZlJ1xuXG5cbiAgICAjIFVwZGF0ZSBzbGlkZSBwcm9wZXJ0aWVzIHRvIGN1cnJlbnQgc2xpZGVyIHN0YXRlXG4gICAgdXBkYXRlU2xpZGVzOiAoYW5pbWF0ZT10cnVlKS0+XG5cbiAgICAgICMgRmFkZSBpbmFjdGl2ZSBzbGlkZXMgdG8gYSBzcGVjaWZpYyBvcGFjaXR5IHZhbHVlXG4gICAgICBpZiBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eSAmJiBhbmltYXRlXG4gICAgICAgIEBzZXRTbGlkZU9wYWNpdHkgMSwgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHksIHRydWVcbiAgICAgIGVsc2VcbiAgICAgICAgQHNldFNsaWRlT3BhY2l0eSAxLCBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eSwgZmFsc2VcblxuICAgICAgQCRzbGlkZXMucmVtb3ZlQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgIEAkc2xpZGVzLmVxKEBjdXJyZW50U2xpZGUpLmFkZENsYXNzICdhY3RpdmUnXG5cblxuICAgICMgU2V0IHNsaWRlIG9wYWNpdHkgZm9yIGFjdGl2ZSBhbmQgaW5hY3RpdmUgc2xpZGVzXG4gICAgc2V0U2xpZGVPcGFjaXR5OiAoYWN0aXZlLCBpbmFjdGl2ZSwgYW5pbWF0ZT10cnVlKS0+XG5cbiAgICAgIGlmIGFuaW1hdGVcbiAgICAgICAgQCRzbGlkZXMuc3RvcCgpLmFuaW1hdGVcbiAgICAgICAgICBvcGFjaXR5OiBpbmFjdGl2ZVxuXG4gICAgICAgIEAkc2xpZGVzLmVxKEBjdXJyZW50U2xpZGUpLnN0b3AoKS5hbmltYXRlXG4gICAgICAgICAgb3BhY2l0eTogYWN0aXZlXG4gICAgICBlbHNlXG4gICAgICAgIEAkc2xpZGVzLnN0b3AoKS5jc3NcbiAgICAgICAgICBvcGFjaXR5OiBpbmFjdGl2ZVxuXG4gICAgICAgIEAkc2xpZGVzLmVxKEBjdXJyZW50U2xpZGUpLnN0b3AoKS5jc3NcbiAgICAgICAgICBvcGFjaXR5OiBhY3RpdmVcblxuXG4gICAgIyBFdmVudCBjYWxsYmFjayBvbiBzY3JvbGwgZW5kXG4gICAgb25TY3JvbGxFbmQ6ID0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgICMgSWYgU2xpZGVyIHNob3dzIG1vcmUgdGhhbiBvbmUgc2xpZGUgcGVyIHBhZ2VcbiAgICAgICMgd2UgbmVlZCB0byBjaGVjayBpZiB0aGUgY3VycmVudFNsaWRlIGlzIG9uIHRoZVxuICAgICAgIyBsYXN0IHBhZ2UgYW5kIGhpZ2hlciB0aGFuIHRoZSBvbmUgc25hcHBlZCB0b1xuICAgICAgaWYgQHNsaWRlc0luQ29udGFpbmVyID4gMVxuICAgICAgICBpZiBAaVNjcm9sbC5jdXJyZW50UGFnZS5wYWdlWCA8IEBudW1iZXJPZlNsaWRlcyAtIEBzbGlkZXNJbkNvbnRhaW5lclxuICAgICAgICAgIEBjdXJyZW50U2xpZGUgPSBAaVNjcm9sbC5jdXJyZW50UGFnZS5wYWdlWFxuICAgICAgZWxzZVxuICAgICAgICBAY3VycmVudFNsaWRlID0gQGlTY3JvbGwuY3VycmVudFBhZ2UucGFnZVhcblxuICAgICAgaWYgQG9wdGlvbnMuY2Fyb3VzZWxcbiAgICAgICAgIyBJZiBsYXN0IHNsaWRlLCByZXR1cm4gdG8gZmlyc3RcbiAgICAgICAgaWYgQGN1cnJlbnRTbGlkZSA+PSBAbnVtYmVyT2ZTbGlkZXMtQG9wdGlvbnMuY2Fyb3VzZWxcbiAgICAgICAgICBAZ29Ub1NsaWRlIEBvcHRpb25zLmNhcm91c2VsLCBmYWxzZVxuICAgICAgICAjIElmIGZpcnN0IHNsaWRlLCBtb3ZlIHRvIGxhc3RcbiAgICAgICAgZWxzZSBpZiBAY3VycmVudFNsaWRlIDwgQG9wdGlvbnMuY2Fyb3VzZWxcbiAgICAgICAgICBAZ29Ub1NsaWRlIEBudW1iZXJPZlNsaWRlcyAtIChAb3B0aW9ucy5jYXJvdXNlbCsxKSwgZmFsc2VcblxuICAgICAgXy5lYWNoIEAkc2xpZGVyTGlzdGVuZXJzLCAobGlzdGVuZXIpLT5cblxuICAgICAgICAjIFVwZGF0ZSByZW1vdGUgc2xpZGVyXG4gICAgICAgIGxpc3RlbmVyLlNsaWRlciAnc3RvcEF1dG9TY3JvbGwnXG4gICAgICAgIGxpc3RlbmVyLlNsaWRlciAnZ29Ub1NsaWRlJywgc2VsZi5jdXJyZW50U2xpZGUgLSBzZWxmLm9wdGlvbnMuY2Fyb3VzZWxcblxuICAgICAgQHVwZGF0ZVNsaWRlcygpXG4gICAgICBAdXBkYXRlTmF2aWdhdGlvbigpXG4gICAgICBAZGVidWcoKVxuXG5cbiAgICAjIFVzZXIgdG91Y2hlcyB0aGUgc2NyZWVuIGJ1dCBzY3JvbGxpbmcgZGlkbid0IHN0YXJ0IHlldFxuICAgIG9uQmVmb3JlU2Nyb2xsU3RhcnQ6ID0+XG5cbiAgICAgIEBzdG9wQXV0b1Njcm9sbCgpXG5cblxuICAgICMgUmVzaXplIHNsaWRlclxuICAgIHJlc2l6ZTogPT5cblxuICAgICAgQHN0b3BBdXRvU2Nyb2xsKClcblxuICAgICAgaWYgQG9wdGlvbnMuc2xpZGVXaWR0aCA9PSAnYXV0bydcbiAgICAgICAgQCRzbGlkZXMud2lkdGggQCRzbGlkZXIub3V0ZXJXaWR0aCgpXG4gICAgICBlbHNlXG4gICAgICAgIEAkc2xpZGVzLndpZHRoIHBhcnNlSW50KEBvcHRpb25zLnNsaWRlV2lkdGgpICsgJ3B4J1xuXG4gICAgICAjIENhbGN1bGF0ZSBjb250YWluZXIgd2lkdGhcbiAgICAgICMgQSBwb3NzaWJsZSBtYXJnaW4gbGVmdCBhbmQgcmlnaHQgb2YgdGhlIGVsZW1lbnRzIG1ha2VzIHRoaXNcbiAgICAgICMgYSBsaXR0bGUgbW9yZSB0cmlja3kgdGhhbiBpdCBzZWVtcywgd2UgZG8gbm90IG9ubHkgbmVlZCB0b1xuICAgICAgIyBtdWx0aXBseSBhbGwgZWxlbWVudHMgKyB0aGVpciByZXNwZWN0aXZlIHNpZGUgbWFyZ2lucyBsZWZ0IGFuZFxuICAgICAgIyByaWdodCwgd2UgYWxzbyBoYXZlIHRvIHRha2UgaW50byBhY2NvdW50IHRoYXQgdGhlIGZpcnN0IGFuZCBsYXN0XG4gICAgICAjIGVsZW1lbnQgbWlnaHQgaGF2ZSBhIGRpZmZlcmVudCBtYXJnaW4gdG93YXJkcyB0aGUgYmVnaW5uaW5nIGFuZFxuICAgICAgIyBlbmQgb2YgdGhlIHNsaWRlIGNvbnRhaW5lclxuICAgICAgc2xpZGVXaWR0aCA9IChAJHNsaWRlcy5vdXRlcldpZHRoKCkgKyAoQG9wdGlvbnMuc2xpZGVNYXJnaW4gKiAyKSlcbiAgICAgIGNvbnRhaW5lcldpZHRoID0gIHNsaWRlV2lkdGggKiBAbnVtYmVyT2ZTbGlkZXNcblxuICAgICAgIyBSZW1vdmUgbGFzdCBhbmQgZmlyc3QgZWxlbWVudCBib3JkZXIgbWFyZ2luc1xuICAgICAgY29udGFpbmVyV2lkdGggLT0gQG9wdGlvbnMuc2xpZGVNYXJnaW4gKiAyXG5cbiAgICAgICMgQWRkIHdoYXRldmVyIG1hcmdpbiB0aGVzZSB0d28gZWxlbWVudHMgaGF2ZVxuICAgICAgY29udGFpbmVyV2lkdGggKz0gcGFyc2VGbG9hdCBAJHNsaWRlcy5maXJzdCgpLmNzcygnbWFyZ2luLWxlZnQnKVxuICAgICAgY29udGFpbmVyV2lkdGggKz0gcGFyc2VGbG9hdCBAJHNsaWRlcy5sYXN0KCkuY3NzKCdtYXJnaW4tcmlnaHQnKVxuXG4gICAgICAjIERldGVybWluZSB0aGUgYW1vdW50IG9mIHNsaWRlcyB0aGF0IGNhbiBmaXQgaW5zaWRlIHRoZSBzbGlkZSBjb250YWluZXJcbiAgICAgICMgV2UgbmVlZCB0aGlzIGZvciB0aGUgb25TY3JvbGxFbmQgZXZlbnQsIHRvIGNoZWNrIGlmIHRoZSBjdXJyZW50IHNsaWRlXG4gICAgICAjIGlzIGFscmVhZHkgb24gdGhlIGxhc3QgcGFnZVxuICAgICAgQHNsaWRlc0luQ29udGFpbmVyID0gTWF0aC5jZWlsIEAkc2xpZGVyLndpZHRoKCkgLyBzbGlkZVdpZHRoXG5cbiAgICAgIEAkc2xpZGVDb250YWluZXIud2lkdGggY29udGFpbmVyV2lkdGhcbiAgICAgIEAkc2xpZGVDb250YWluZXIuaGVpZ2h0IEAkc2xpZGVyLmhlaWdodCgpXG5cbiAgICAgIGlmIEBpU2Nyb2xsXG4gICAgICAgIEBpU2Nyb2xsLnJlZnJlc2goKVxuXG4gICAgICBpZiBAb3B0aW9ucy5hdXRvc2Nyb2xsXG4gICAgICAgIEBzdGFydEF1dG9TY3JvbGwoKVxuXG5cbiAgICAjIEJpbmQgZXZlbnRzXG4gICAgYmluZEV2ZW50czogLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgQGlTY3JvbGwub24gJ3Njcm9sbEVuZCcsIEBvblNjcm9sbEVuZFxuXG4gICAgICBAaVNjcm9sbC5vbiAnYmVmb3JlU2Nyb2xsU3RhcnQnLCBAb25CZWZvcmVTY3JvbGxTdGFydFxuXG4gICAgICBAJHNsaWRlcy5vbiAndGFwJywgKGV2ZW50KS0+XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIHNlbGYuc3RvcEF1dG9TY3JvbGwoKVxuICAgICAgICBpZiB0eXBlb2Ygc2VsZi5vcHRpb25zLm9uU2xpZGVDbGljayA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgc2VsZi5vcHRpb25zLm9uU2xpZGVDbGljay5hcHBseShALCBbZXZlbnQsc2VsZl0pXG5cbiAgICAgIEAkc2xpZGVyLm9uICd0YXAnLCAnc3Bhbi5uZXh0JywgKGV2ZW50KS0+XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIHNlbGYuc3RvcEF1dG9TY3JvbGwoKVxuICAgICAgICBzZWxmLm5leHRTbGlkZSgpXG5cbiAgICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vbk5leHRDbGljayA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgc2VsZi5vcHRpb25zLm9uTmV4dENsaWNrLmFwcGx5KEAsIFtldmVudCxzZWxmXSlcblxuICAgICAgQCRzbGlkZXIub24gJ3RhcCcsICdzcGFuLnByZXYnLCAoZXZlbnQpLT5cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYucHJldlNsaWRlKClcblxuICAgICAgICBpZiB0eXBlb2Ygc2VsZi5vcHRpb25zLm9uUHJldkNsaWNrID09ICdmdW5jdGlvbidcbiAgICAgICAgICBzZWxmLm9wdGlvbnMub25QcmV2Q2xpY2suYXBwbHkoQCwgW2V2ZW50LHNlbGZdKVxuXG4gICAgICBAJHNsaWRlci5vbiAndGFwJywgJ3VsLnNsaWRlck5hdmlnYXRpb24gbGknLCAtPlxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgc2VsZi5nb1RvU2xpZGUgJChAKS5kYXRhKCdpdGVtX2luZGV4JylcblxuICAgICAgJCh3aW5kb3cpLmJpbmQgJ3Jlc2l6ZScsIC0+XG4gICAgICAgIHNlbGYucmVzaXplKClcbiAgICAgICAgIyMjXG4gICAgICAgIGlmIEByZXNpemVUb1xuICAgICAgICAgIGNsZWFyVGltZW91dCBAcmVzaXplVGltZW91dFxuICAgICAgICBAcmVzaXplVGltZW91dCA9IHNldFRpbWVvdXQgLT5cbiAgICAgICAgLCAyMDBcbiAgICAgICAgIyMjXG5cblxuICAgICMgR28gdG8gbmV4dCBzbGlkZVxuICAgIG5leHRTbGlkZTogPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgQG51bWJlck9mU2xpZGVzID4gKEBjdXJyZW50U2xpZGUrMSlcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSAoQGN1cnJlbnRTbGlkZSsxKVxuICAgICAgZWxzZVxuICAgICAgICBuZXh0U2xpZGVJbmRleCA9IDBcblxuICAgICAgQGdvVG9TbGlkZSBuZXh0U2xpZGVJbmRleFxuXG5cbiAgICAjIEdvIHRvIHByZXZpb3VzIHNsaWRlXG4gICAgcHJldlNsaWRlOiA9PlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBpZiBAY3VycmVudFNsaWRlLTEgPj0gMFxuICAgICAgICBuZXh0U2xpZGVJbmRleCA9IEBjdXJyZW50U2xpZGUtMVxuICAgICAgZWxzZVxuICAgICAgICBuZXh0U2xpZGVJbmRleCA9IEBudW1iZXJPZlNsaWRlcy0xXG5cbiAgICAgIEBnb1RvU2xpZGUgbmV4dFNsaWRlSW5kZXhcblxuXG4gICAgIyBHbyB0byBzbGlkZSBpbmRleFxuICAgIGdvVG9TbGlkZTogKGluZGV4LCBhbmltYXRlPXRydWUpPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICBAaVNjcm9sbD8uZ29Ub1BhZ2UgaW5kZXgsIDAsIEBvcHRpb25zLnNwZWVkXG4gICAgICBlbHNlXG4gICAgICAgIEBpU2Nyb2xsPy5nb1RvUGFnZSBpbmRleCwgMCwgMFxuXG4gICAgICBAY3VycmVudFNsaWRlID0gaW5kZXhcbiAgICAgIEB1cGRhdGVTbGlkZXMoYW5pbWF0ZSlcbiAgICAgIEB1cGRhdGVOYXZpZ2F0aW9uKClcblxuICAgICAgXy5lYWNoIEAkc2xpZGVyTGlzdGVuZXJzLCAobGlzdGVuZXIpLT5cblxuICAgICAgICAjIFVwZGF0ZSByZW1vdGUgc2xpZGVyXG4gICAgICAgIGxpc3RlbmVyLlNsaWRlciAnc3RvcEF1dG9TY3JvbGwnXG4gICAgICAgIGxpc3RlbmVyLlNsaWRlciAnZ29Ub1NsaWRlJywgaW5kZXggLSBzZWxmLm9wdGlvbnMuY2Fyb3VzZWxcblxuICAgICAgQGRlYnVnKClcblxuXG4gICAgIyBBZGQgZmFrZSBjYXJvdXNlbCBzbGlkZXNcbiAgICBhZGRDYXJvdXNlbFNsaWRlczogLT5cblxuICAgICAgQCRzdGFydEVsZW1lbnRzID0gQCRzbGlkZXMuc2xpY2UoLUBvcHRpb25zLmNhcm91c2VsKS5jbG9uZSgpXG4gICAgICBAJGVuZEVsZW1lbnRzID0gQCRzbGlkZXMuc2xpY2UoMCxAb3B0aW9ucy5jYXJvdXNlbCkuY2xvbmUoKVxuXG4gICAgICBAJHNsaWRlcy5wYXJlbnQoKS5wcmVwZW5kIEAkc3RhcnRFbGVtZW50c1xuICAgICAgQCRzbGlkZXMucGFyZW50KCkuYXBwZW5kIEAkZW5kRWxlbWVudHNcblxuXG4gICAgIyBTdGFydCBhdXRvc2Nyb2xsXG4gICAgc3RhcnRBdXRvU2Nyb2xsOiA9PlxuXG4gICAgICBAaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCBAbmV4dFNsaWRlLCBAb3B0aW9ucy5pbnRlcnZhbFxuXG5cbiAgICAjIFN0b3AgYXV0b3Njcm9sbFxuICAgIHN0b3BBdXRvU2Nyb2xsOiA9PlxuXG4gICAgICBjbGVhckludGVydmFsIEBpbnRlcnZhbFxuICAgICAgQGludGVydmFsID0gbnVsbFxuXG5cbiAgICAjIEFkZCBkZWJ1ZyBvdXRwdXQgdG8gc2xpZGVyXG4gICAgZGVidWc6ID0+XG5cbiAgICAgIGlmIEBvcHRpb25zLmRlYnVnXG4gICAgICAgIEAkc2xpZGVyLmZpbmQoJy5kZWJ1ZycpLnJlbW92ZSgpXG4gICAgICAgIEAkc2xpZGVyLmFwcGVuZCBAZGVidWdUZW1wbGF0ZVxuICAgICAgICAgICdzbGlkZXJfaW5kZXgnOiBAJHNsaWRlci5kYXRhICdpbmRleCdcbiAgICAgICAgICAnbnVtYmVyX29mX3NsaWRlcyc6IEBudW1iZXJPZlNsaWRlc1xuICAgICAgICAgICdjdXJyZW50X3NsaWRlJzogQGlTY3JvbGwuY3VycmVudFBhZ2U/LnBhZ2VYXG4gICAgICAgICAgJ2F1dG9zY3JvbGwnOiBpZiBAaW50ZXJ2YWwgdGhlbiAnZW5hYmxlZCcgZWxzZSAnZGlzYWJsZWQnXG4gICAgICAgICAgJ251bWJlcl9vZl9uYXZpZ2F0aW9ucyc6IEAkc2xpZGVyTmF2aWdhdGlvbi5sZW5ndGhcbiAgICAgICAgICAnc2xpZGVyX3dpZHRoJzogQCRzbGlkZXIud2lkdGgoKVxuXG5cbiAgICAjIFByaW50IG9wdGlvbiB0byBjb25zb2xlXG4gICAgIyBDYW4ndCBqdXN0IHJldHVybiB0aGUgdmFsdWUgdG8gZGVidWcgaXQgYmVjYXVzZVxuICAgICMgaXQgd291bGQgYnJlYWsgY2hhaW5pbmcgd2l0aCB0aGUgalF1ZXJ5IG9iamVjdFxuICAgICMgRXZlcnkgbWV0aG9kIGNhbGwgcmV0dXJucyBhIGpRdWVyeSBvYmplY3RcbiAgICBnZXQ6IChvcHRpb24pIC0+XG4gICAgICBjb25zb2xlLmxvZyAnb3B0aW9uOiAnK29wdGlvbisnIGlzICcrQG9wdGlvbnNbb3B0aW9uXVxuICAgICAgQG9wdGlvbnNbb3B0aW9uXVxuXG5cbiAgICAjIFNldCBvcHRpb24gdG8gdGhpcyBpbnN0YW5jZXMgb3B0aW9ucyBhcnJheVxuICAgIHNldDogKG9wdGlvbiwgdmFsdWUpIC0+XG5cbiAgICAgICMgU2V0IG9wdGlvbnMgdmFsdWVcbiAgICAgIEBvcHRpb25zW29wdGlvbl0gPSB2YWx1ZVxuXG4gICAgICAjIElmIG5vIGludGVydmFsIGlzIGN1cnJlbnRseSBwcmVzZW50LCBzdGFydCBhdXRvc2Nyb2xsXG4gICAgICBpZiBvcHRpb24gPT0gJ2F1dG9zY3JvbGwnICYmICFAaW50ZXJ2YWxcbiAgICAgICAgQHN0YXJ0QXV0b1Njcm9sbCgpXG5cbiAgICAgICMgVE9ETzogVXBkYXRlIHNsaWRlIG1hcmdpblxuICAgICAgI2lmIG9wdGlvbiA9PSAnc2xpZGVNYXJnaW4nXG4gICAgICAgICMgY2FjaGUgc2xpZGVNYXJnaW4gQ1NTIG9uIGVsZW1lbnQ/XG4gICAgICAgICMgd2hhdCBpZiB0aGUgdXNlciB3YW50cyB0byBzd2l0Y2ggYmFja1xuXG4gICAgICBpZiBvcHRpb24gPT0gJ2luYWN0aXZlU2xpZGVPcGFjaXR5JyAmJiBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eVxuICAgICAgICBAc2V0U2xpZGVPcGFjaXR5IDEsIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5XG5cbiAgICAgIGlmIG9wdGlvbiA9PSAnbmF2aWdhdGlvbidcbiAgICAgICAgQHJlbmRlck5hdmlnYXRpb24oKVxuXG4gICAgICBAZGVidWcoKVxuXG5cblxuICAjIERlZmluZSB0aGUgcGx1Z2luXG4gICQuZm4uZXh0ZW5kIFNsaWRlcjogKG9wdGlvbiwgYXJncy4uLikgLT5cblxuICAgIEBlYWNoIChpbmRleCktPlxuICAgICAgJHRoaXMgPSAkKEApXG4gICAgICBkYXRhID0gJHRoaXMuZGF0YSgnU2xpZGVyJylcblxuICAgICAgaWYgIWRhdGFcbiAgICAgICAgJHRoaXMuZGF0YSAnU2xpZGVyJywgKGRhdGEgPSBuZXcgU2xpZGVyKEAsIG9wdGlvbiwgaW5kZXgpKVxuXG4gICAgICBpZiB0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnXG4gICAgICAgIHJldHVybiBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgYXJncylcblxuXG4pIHdpbmRvdy5qUXVlcnksIHdpbmRvd1xuXG4iXX0=