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
        prevButtonSelector: null,
        nextButtonSelector: null,
        slideContainerSelector: '.slideContainer',
        slideSelector: 'ul.slides > li',
        inactiveSlideOpacity: null,
        slideMargin: 0,
        slideWidth: 'auto',
        carousel: 0,
        onStart: function(event) {},
        onSlideClick: function(event) {
          return this.goToSlide($(event.currentTarget).index());
        },
        onNextClick: function(event) {},
        onPrevClick: function(event) {},
        onScrollEnd: function(event) {},
        onBeforeResize: function(event) {},
        onAfterResize: function(event) {}
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
        this.$slider.data('index', this.options.index ? 'slider_' + this.options.index : 'slider_' + index);
        this.$slider.addClass(this.options.index ? 'slider_' + this.options.index : 'slider_' + index);
        this.$sliderNavigation = [];
        this.$slidesInContainer = null;
        this.$slideContainer = this.$slider.find(this.options.slideContainerSelector);
        this.refreshSlides();
        if (this.options.carousel) {
          if (this.options.carousel > this.$slideContainer.find(this.options.slideSelector).length) {
            this.options.carousel = this.$slideContainer.find(this.options.slideSelector).length;
          }
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
        this.addPrevNextButtons();
        if (_.size(this.options.navigation)) {
          this.renderNavigation();
        }
        this.resize();
        this.goToSlide(this.currentSlide, false);
        this.bindEvents();
        this.debug();
        if (typeof self.options.onStart === 'function') {
          self.options.onStart.apply(this, []);
        }
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
        var handleNextEvent, handlePrevEvent, self;
        self = this;
        handleNextEvent = function(event) {
          event.stopPropagation();
          self.stopAutoScroll();
          self.nextSlide();
          if (typeof self.options.onNextClick === 'function') {
            return self.options.onNextClick.apply(this, [event, self]);
          }
        };
        handlePrevEvent = function(event) {
          event.stopPropagation();
          self.stopAutoScroll();
          self.prevSlide();
          if (typeof self.options.onPrevClick === 'function') {
            return self.options.onPrevClick.apply(this, [event, self]);
          }
        };
        if (this.options.prevNextButtons) {
          if (this.options.prevButtonSelector || this.options.nextButtonSelector) {
            if (this.options.prevButtonSelector) {
              $('body').on('click', this.options.prevButtonSelector, handlePrevEvent);
            }
            if (this.options.nextButtonSelector) {
              return $('body').on('click', this.options.nextButtonSelector, handleNextEvent);
            }
          } else {
            this.$slider.append(this.options.prevNextButtonsTemplate());
            this.$slider.on('tap', 'span.prev', handlePrevEvent);
            return this.$slider.on('tap', 'span.next', handleNextEvent);
          }
        }
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

      Slider.prototype.onScrollEnd = function(event) {
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
            this.goToSlide(this.options.carousel + (this.currentSlide - (this.numberOfSlides - this.options.carousel)), false, false);
          } else if (this.currentSlide < this.options.carousel) {
            this.goToSlide(this.numberOfSlides - (this.options.carousel + 1), false, false);
          }
        }
        if (typeof self.options.onScrollEnd === 'function') {
          self.options.onScrollEnd.apply(this, [event, self]);
        }
        this.updateSlides();
        this.updateNavigation();
        return this.debug();
      };

      Slider.prototype.onBeforeScrollStart = function() {
        return this.stopAutoScroll();
      };

      Slider.prototype.resize = function(event) {
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
          this.startAutoScroll();
        }
        if (typeof this.options.onAfterResize === 'function') {
          return this.options.onAfterResize.apply(this, [event]);
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
            return self.options.onSlideClick.apply(self, [event]);
          }
        });
        this.$slider.on('tap', 'ul.sliderNavigation li', function() {
          self.stopAutoScroll();
          return self.goToSlide($(this).data('item_index'));
        });
        return $(window).bind('resize', function(event) {
          if (typeof self.options.onBeforeResize === 'function') {
            self.options.onBeforeResize.apply(self, [event]);
          }
          return self.resize(event);
        });
      };

      Slider.prototype.nextSlide = function() {
        var nextSlideIndex, self;
        self = this;
        if (this.numberOfSlides > this.currentSlide + 1) {
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

      Slider.prototype.goToSlide = function(index, animate, triggerEvent) {
        var ref, ref1, self;
        if (animate == null) {
          animate = true;
        }
        if (triggerEvent == null) {
          triggerEvent = true;
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
        if (triggerEvent) {
          $('body').trigger(this.$slider.data('index') + '#goToSlide', index - this.options.carousel);
        }
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

      Slider.prototype.listenTo = function(index) {
        var self;
        self = this;
        return $('body').on('slider_' + index + '#goToSlide', function(event, index) {
          self.stopAutoScroll();
          return self.goToSlide(index + self.options.carousel, true, false);
        });
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
        if (option === 'listenTo') {
          this.listenTo(value);
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

//# sourceMappingURL=data:application/json;base64,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LXNsaWRlci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIiNcbiMgU2xpZGVyIGpRdWVyeSBwbHVnaW5cbiMgQXV0aG9yOiBUaG9tYXMgS2xva29zY2ggPG1haWxAdGhvbWFza2xva29zY2guY29tPlxuI1xuKCgkLCB3aW5kb3cpIC0+XG5cbiAgIyBEZWZpbmUgdGhlIHBsdWdpbiBjbGFzc1xuICBjbGFzcyBTbGlkZXJcblxuICAgIGlTY3JvbGw6IG51bGxcbiAgICBudW1iZXJPZlNsaWRlczogbnVsbFxuICAgIGN1cnJlbnRTbGlkZTogMFxuICAgIGludGVydmFsOiBudWxsXG5cbiAgICAkc2xpZGVyOiBudWxsXG4gICAgJHNsaWRlQ29udGFpbmVyOiBudWxsXG4gICAgJHNsaWRlczogbnVsbFxuICAgICRzbGlkZXJOYXZpZ2F0aW9uOiBudWxsXG4gICAgJHNsaWRlckxpc3RlbmVyczogbnVsbFxuICAgICRzbGlkZXNJbkNvbnRhaW5lcjogbnVsbFxuXG4gICAgZGVmYXVsdHM6XG4gICAgICBhdXRvc2Nyb2xsOiB0cnVlXG4gICAgICBzcGVlZDogNTAwXG4gICAgICBpbnRlcnZhbDogNTAwMFxuICAgICAgZGVidWc6IHRydWVcbiAgICAgIHNuYXA6IHRydWVcblxuICAgICAgIyBJbiB0aGlzIHN0YXRlLCB0aGUgc2xpZGVyIGluc3RhbmNlIHNob3VsZCBuZXZlciBmb3J3YXJkIGV2ZW50cyB0b1xuICAgICAgIyB0aGUgaVNjcm9sbCBjb21wb25lbnQsIGUuZy4gd2hlbiB0aGUgc2xpZGVyIGlzIG5vdCB2aXNpYmxlIChkaXNwbGF5Om5vbmUpXG4gICAgICAjIGFuZCB0aGVyZWZvcmUgaVNjcm9sbCBjYW4ndCBnZXQvc2Nyb2xsIHRoZSBzbGlkZSBlbGVtZW50c1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlXG5cbiAgICAgICMgTmF2aWdhdGlvbiBlbGVtZW50IGFycmF5XG4gICAgICAjIGVpdGhlciAnaW5kZXgnIGZvciBvbi1zbGlkZXIgbmF2aWdhdGlvbiwgYSBqUXVlcnkgc2VsZWN0b3IgZm9yIGEgdGh1bWJuYWlsXG4gICAgICAjIG5hdmlnYXRpb24gb3IgYW5vdGhlciBzbGlkZXIgZWxlbWVudCBmb3IgYSBzbGlkZXIgYWN0aW5nIGFzIGEgc3luY2VkIHJlbW90ZVxuICAgICAgIyBuYXZpZ2F0aW9uIHRvIHRoaXMgc2xpZGVyIGluc3RhbmNlXG4gICAgICBuYXZpZ2F0aW9uOiBbJ2luZGV4J11cblxuICAgICAgIyBJbmRleCBuYXZpZ2F0aW9uIGRlZmF1bHQgdGVtcGxhdGVcbiAgICAgIGluZGV4TmF2aWdhdGlvblRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8dWwgY2xhc3M9XCJzbGlkZXJOYXZpZ2F0aW9uXCI+XG4gICAgICAgIDwlIF8uZWFjaChzbGlkZXMsIGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgpeyAlPlxuICAgICAgICAgIDwlIGlmKCFjYXJvdXNlbCB8fCAoaW5kZXg+PWNhcm91c2VsICYmIChpbmRleCsxKTw9c2xpZGVzLmxlbmd0aC1jYXJvdXNlbCkpeyAlPlxuICAgICAgICAgICAgPGxpIGRhdGEtaXRlbV9pbmRleD1cIjwlPSBpbmRleCAlPlwiIGNsYXNzPVwic2xpZGVyX25hdmlnYXRpb25JdGVtIGZhIGZhLWNpcmNsZS1vXCI+PC9saT5cbiAgICAgICAgICA8JSB9ICU+XG4gICAgICAgIDwlIH0pOyAlPlxuICAgICAgPC91bD4nKVxuXG4gICAgICBwcmV2TmV4dEJ1dHRvbnM6IHRydWVcbiAgICAgIHByZXZOZXh0QnV0dG9uc1RlbXBsYXRlOiBfLnRlbXBsYXRlKCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicHJldiBmYSBmYS1hbmdsZS1sZWZ0XCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJuZXh0IGZhIGZhLWFuZ2xlLXJpZ2h0XCI+PC9zcGFuPicpXG5cbiAgICAgICMgSWYgb25lIG9mIHRoZXNlIHZhcmlhYmxlcyBpcyBhIGpRdWVyeSBzZWxlY3RvciwgdGhleSBhcmUgdXNlZCBpbnN0ZWFkXG4gICAgICAjIG9mIHJlbmRlcmluZyB0aGUgYWJvdmUgdGVtcGxhdGVcbiAgICAgIHByZXZCdXR0b25TZWxlY3RvcjogbnVsbFxuICAgICAgbmV4dEJ1dHRvblNlbGVjdG9yOiBudWxsXG5cbiAgICAgIHNsaWRlQ29udGFpbmVyU2VsZWN0b3I6ICcuc2xpZGVDb250YWluZXInXG4gICAgICBzbGlkZVNlbGVjdG9yOiAndWwuc2xpZGVzID4gbGknXG5cbiAgICAgICMgT3BhY2l0eSBvZiBzbGlkZXMgb3RoZXIgdGhhbiB0aGUgY3VycmVudFxuICAgICAgIyBPbmx5IGFwcGxpY2FibGUgaWYgdGhlIHNsaWRlciBlbGVtZW50IGhhcyBvdmVyZmxvdzogdmlzaWJsZVxuICAgICAgIyBhbmQgaW5hY3RpdmUgc2xpZGVzIGFyZSBzaG93biBuZXh0IHRvIHRoZSBjdXJyZW50XG4gICAgICBpbmFjdGl2ZVNsaWRlT3BhY2l0eTogbnVsbFxuXG4gICAgICAjIE1hcmdpbiBsZWZ0IGFuZCByaWdodCBvZiB0aGUgc2xpZGVzIGluIHBpeGVsc1xuICAgICAgc2xpZGVNYXJnaW46IDBcblxuICAgICAgIyBXaWR0aCBvZiB0aGUgc2xpZGUsIGRlZmF1bHRzIHRvIGF1dG8sIHRha2VzIGEgMTAwJSBzbGlkZXIgd2lkdGhcbiAgICAgIHNsaWRlV2lkdGg6ICdhdXRvJ1xuXG4gICAgICAjIEZha2UgYSBjYXJvdXNlbCBlZmZlY3QgYnkgc2hvd2luZyB0aGUgbGFzdCBzbGlkZSBuZXh0IHRvIHRoZSBmaXJzdFxuICAgICAgIyB0aGF0IGNhbid0IGJlIG5hdmlnYXRlZCB0byBidXQgZm9yd2FyZHMgdG8gdGhlIGVuZCBvZiB0aGUgc2xpZGVyXG4gICAgICAjIE51bWJlciBpbmRpY2F0ZXMgbnVtYmVyIG9mIHNsaWRlcyBwYWRkaW5nIGxlZnQgYW5kIHJpZ2h0XG4gICAgICBjYXJvdXNlbDogMFxuXG4gICAgICAjIENhbGxiYWNrIG9uIHNsaWRlciBpbml0aWFsaXphdGlvblxuICAgICAgb25TdGFydDogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnU3RhcnQnXG5cbiAgICAgICMgU2xpZGUgY2xpY2sgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgIG9uU2xpZGVDbGljazogKGV2ZW50KS0+XG4gICAgICAgIEBnb1RvU2xpZGUgJChldmVudC5jdXJyZW50VGFyZ2V0KS5pbmRleCgpXG4gICAgICAgICNjb25zb2xlLmxvZyAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmluZGV4KClcblxuICAgICAgb25OZXh0Q2xpY2s6IChldmVudCktPlxuICAgICAgICAjY29uc29sZS5sb2cgJ05leHQnXG5cbiAgICAgIG9uUHJldkNsaWNrOiAoZXZlbnQpLT5cbiAgICAgICAgI2NvbnNvbGUubG9nICdQcmV2J1xuXG4gICAgICBvblNjcm9sbEVuZDogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnRW5kJ1xuXG4gICAgICBvbkJlZm9yZVJlc2l6ZTogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnQmVmb3JlIFJlc2l6ZSdcblxuICAgICAgb25BZnRlclJlc2l6ZTogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnQWZ0ZXIgUmVzaXplJ1xuXG5cbiAgICBkZWJ1Z1RlbXBsYXRlOiBfLnRlbXBsYXRlKCdcbiAgICAgIDxkaXYgY2xhc3M9XCJkZWJ1Z1wiPlxuICAgICAgICA8c3Bhbj5TbGlkZXI6IDwlPSBzbGlkZXJfaW5kZXggJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPiMgb2Ygc2xpZGVzOiA8JT0gbnVtYmVyX29mX3NsaWRlcyAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+Q3VycmVudCBzbGlkZTogPCU9IGN1cnJlbnRfc2xpZGUgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPkF1dG9zY3JvbGw6IDwlPSBhdXRvc2Nyb2xsICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj4jIG9mIG5hdmlnYXRpb25zOiA8JT0gbnVtYmVyX29mX25hdmlnYXRpb25zICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj5TbGlkZXIgd2lkdGg6IDwlPSBzbGlkZXJfd2lkdGggJT48L3NwYW4+XG4gICAgICA8L2Rpdj4nKVxuXG5cbiAgICAjIENvbnN0cnVjdG9yXG4gICAgY29uc3RydWN0b3I6IChlbCwgb3B0aW9ucywgaW5kZXggPSBudWxsKSAtPlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBAb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBAZGVmYXVsdHMsIG9wdGlvbnMpXG5cbiAgICAgIEAkc2xpZGVyID0gJChlbClcbiAgICAgIEAkc2xpZGVyLmRhdGEgJ2luZGV4JywgaWYgQG9wdGlvbnMuaW5kZXggdGhlbiAnc2xpZGVyXycrQG9wdGlvbnMuaW5kZXggZWxzZSAnc2xpZGVyXycraW5kZXhcbiAgICAgIEAkc2xpZGVyLmFkZENsYXNzIGlmIEBvcHRpb25zLmluZGV4IHRoZW4gJ3NsaWRlcl8nK0BvcHRpb25zLmluZGV4IGVsc2UgJ3NsaWRlcl8nK2luZGV4XG4gICAgICBAJHNsaWRlck5hdmlnYXRpb24gPSBbXVxuICAgICAgQCRzbGlkZXNJbkNvbnRhaW5lciA9IG51bGxcblxuICAgICAgQCRzbGlkZUNvbnRhaW5lciA9IEAkc2xpZGVyLmZpbmQgQG9wdGlvbnMuc2xpZGVDb250YWluZXJTZWxlY3RvclxuICAgICAgQHJlZnJlc2hTbGlkZXMoKVxuXG4gICAgICBpZiBAb3B0aW9ucy5jYXJvdXNlbFxuXG4gICAgICAgIGlmIEBvcHRpb25zLmNhcm91c2VsID4gQCRzbGlkZUNvbnRhaW5lci5maW5kKEBvcHRpb25zLnNsaWRlU2VsZWN0b3IpLmxlbmd0aFxuICAgICAgICAgIEBvcHRpb25zLmNhcm91c2VsID0gQCRzbGlkZUNvbnRhaW5lci5maW5kKEBvcHRpb25zLnNsaWRlU2VsZWN0b3IpLmxlbmd0aFxuXG4gICAgICAgIEBhZGRDYXJvdXNlbFNsaWRlcygpXG4gICAgICAgIEByZWZyZXNoU2xpZGVzKClcbiAgICAgICAgQGN1cnJlbnRTbGlkZSA9IEBvcHRpb25zLmNhcm91c2VsXG5cbiAgICAgICMgRW5hYmxlIHNsaWRlcyB0cm91Z2ggQ1NTXG4gICAgICBAZW5hYmxlU2xpZGVzKClcblxuICAgICAgQGlTY3JvbGwgPSBuZXcgSVNjcm9sbCBlbCxcbiAgICAgICAgc2Nyb2xsWDogdHJ1ZVxuICAgICAgICBzY3JvbGxZOiBmYWxzZVxuICAgICAgICBzbmFwOiBAb3B0aW9ucy5zbmFwXG4gICAgICAgIHNuYXBTcGVlZDogNDAwXG4gICAgICAgIHRhcDogdHJ1ZVxuICAgICAgICBtb21lbnR1bTogZmFsc2VcbiAgICAgICAgZXZlbnRQYXNzdGhyb3VnaDogdHJ1ZVxuICAgICAgICBwcmV2ZW50RGVmYXVsdDogZmFsc2VcblxuICAgICAgaWYgQG9wdGlvbnMuYXV0b3Njcm9sbFxuICAgICAgICBAc3RhcnRBdXRvU2Nyb2xsKClcblxuICAgICAgQGFkZFByZXZOZXh0QnV0dG9ucygpXG5cbiAgICAgIGlmIF8uc2l6ZShAb3B0aW9ucy5uYXZpZ2F0aW9uKVxuICAgICAgICBAcmVuZGVyTmF2aWdhdGlvbigpXG5cbiAgICAgIEByZXNpemUoKVxuICAgICAgQGdvVG9TbGlkZSBAY3VycmVudFNsaWRlLCBmYWxzZVxuICAgICAgQGJpbmRFdmVudHMoKVxuICAgICAgQGRlYnVnKClcblxuICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vblN0YXJ0ID09ICdmdW5jdGlvbidcbiAgICAgICAgc2VsZi5vcHRpb25zLm9uU3RhcnQuYXBwbHkoQCwgW10pXG5cbiAgICAgIEBcblxuXG4gICAgIyBSZWZyZXNoIHNsaWRlc1xuICAgIHJlZnJlc2hTbGlkZXM6IC0+XG5cbiAgICAgIEAkc2xpZGVzID0gQCRzbGlkZUNvbnRhaW5lci5maW5kIEBvcHRpb25zLnNsaWRlU2VsZWN0b3JcbiAgICAgIEBudW1iZXJPZlNsaWRlcyA9IEAkc2xpZGVzLmxlbmd0aFxuXG5cbiAgICAjIEVuYWJsZSBzbGlkZXMgdmlhIENTU1xuICAgIGVuYWJsZVNsaWRlczogLT5cblxuICAgICAgQCRzbGlkZXMuY3NzXG4gICAgICAgIGRpc3BsYXk6ICdibG9jaydcblxuXG4gICAgIyBBZGQgcHJldiBuZXh0IGJ1dHRvbnNcbiAgICBhZGRQcmV2TmV4dEJ1dHRvbnM6IC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgICMgTmV4dCBldmVudCBmdW5jdGlvblxuICAgICAgaGFuZGxlTmV4dEV2ZW50ID0gKGV2ZW50KS0+XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIHNlbGYuc3RvcEF1dG9TY3JvbGwoKVxuICAgICAgICBzZWxmLm5leHRTbGlkZSgpXG5cbiAgICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vbk5leHRDbGljayA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgc2VsZi5vcHRpb25zLm9uTmV4dENsaWNrLmFwcGx5KEAsIFtldmVudCxzZWxmXSlcblxuICAgICAgIyBQcmV2IGV2ZW50IGZ1bmN0aW9uXG4gICAgICBoYW5kbGVQcmV2RXZlbnQgPSAoZXZlbnQpLT5cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYucHJldlNsaWRlKClcblxuICAgICAgICBpZiB0eXBlb2Ygc2VsZi5vcHRpb25zLm9uUHJldkNsaWNrID09ICdmdW5jdGlvbidcbiAgICAgICAgICBzZWxmLm9wdGlvbnMub25QcmV2Q2xpY2suYXBwbHkoQCwgW2V2ZW50LHNlbGZdKVxuXG4gICAgICBpZiBAb3B0aW9ucy5wcmV2TmV4dEJ1dHRvbnNcblxuICAgICAgICAjIENoZWNrIGlmIHByZXYvbmV4dCBidXR0b24gc2VsZWN0b3JzIGFyZSBzZXQgaW4gb3B0aW9ucyxcbiAgICAgICAgIyBhbmQgaWYgc28sIHVzZSB0aGVtIGluc3RlYWQgb2YgcmVuZGVyaW5nIHRlbXBsYXRlXG4gICAgICAgIGlmIEBvcHRpb25zLnByZXZCdXR0b25TZWxlY3RvciBvciBAb3B0aW9ucy5uZXh0QnV0dG9uU2VsZWN0b3JcblxuICAgICAgICAgICMgV2UgY2FuJ3QgdXNlIHRoZSBjdXN0b20gJ3RhcCcgZXZlbnQgb3V0c2lkZSBvZiB0aGUgaVNjcm9sbCBlbGVtZW50XG4gICAgICAgICAgIyBUaGVyZWZvcmUgd2UgaGF2ZSB0byBiaW5kIGNsaWNrIGFuZCB0b3VjaHN0YXJ0IGV2ZW50cyBib3RoIHRvXG4gICAgICAgICAgIyB0aGUgY3VzdG9tIGVsZW1lbnRcbiAgICAgICAgICBpZiBAb3B0aW9ucy5wcmV2QnV0dG9uU2VsZWN0b3JcbiAgICAgICAgICAgICQoJ2JvZHknKS5vbiAnY2xpY2snLCBAb3B0aW9ucy5wcmV2QnV0dG9uU2VsZWN0b3IsIGhhbmRsZVByZXZFdmVudFxuXG4gICAgICAgICAgaWYgQG9wdGlvbnMubmV4dEJ1dHRvblNlbGVjdG9yXG4gICAgICAgICAgICAkKCdib2R5Jykub24gJ2NsaWNrJywgQG9wdGlvbnMubmV4dEJ1dHRvblNlbGVjdG9yLCBoYW5kbGVOZXh0RXZlbnRcblxuICAgICAgICAjIE5vIHNlbGVjdG9ycyBzZXQsIHJlbmRlciB0ZW1wbGF0ZVxuICAgICAgICBlbHNlXG5cbiAgICAgICAgICBAJHNsaWRlci5hcHBlbmQgQG9wdGlvbnMucHJldk5leHRCdXR0b25zVGVtcGxhdGUoKVxuXG4gICAgICAgICAgQCRzbGlkZXIub24gJ3RhcCcsICdzcGFuLnByZXYnLCBoYW5kbGVQcmV2RXZlbnRcbiAgICAgICAgICBAJHNsaWRlci5vbiAndGFwJywgJ3NwYW4ubmV4dCcsIGhhbmRsZU5leHRFdmVudFxuXG5cbiAgICAjIEFkZCBuYXZpZ2F0aW9uXG4gICAgcmVuZGVyTmF2aWdhdGlvbjogLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgIyBEZWxldGUgb2xkIHNsaWRlciBuYXZpZ2F0aW9uIGVsZW1lbnRzXG4gICAgICBfLmVhY2ggQCRzbGlkZXJOYXZpZ2F0aW9uLCAoZWxlbWVudCwgaW5kZXgpLT5cbiAgICAgICAgaWYgIWVsZW1lbnQuZGF0YSgnU2xpZGVyJylcbiAgICAgICAgICAkKGVsZW1lbnQpLnJlbW92ZSgpXG5cbiAgICAgIF8uZWFjaCBAb3B0aW9ucy5uYXZpZ2F0aW9uLCAoZWxlbWVudCwgaW5kZXgsIGxpc3QpPT5cblxuICAgICAgICBpZiBlbGVtZW50ID09ICdpbmRleCdcblxuICAgICAgICAgICMgQ3JlYXRlIGEgalF1ZXJ5IG9iamVjdCBkaXJlY3RseSBmcm9tIHNsaWRlciBjb2RlXG4gICAgICAgICAgbmV3RWxlbWVudCA9IEBvcHRpb25zLmluZGV4TmF2aWdhdGlvblRlbXBsYXRlKHsnc2xpZGVzJzogQCRzbGlkZXMsICdjYXJvdXNlbCc6IEBvcHRpb25zLmNhcm91c2VsfSlcbiAgICAgICAgICBAJHNsaWRlck5hdmlnYXRpb24ucHVzaCAkKG5ld0VsZW1lbnQpXG5cbiAgICAgICAgICAjIEFwcGVuZCBpdCB0byBzbGlkZXIgZWxlbWVudFxuICAgICAgICAgIEAkc2xpZGVyLmFwcGVuZCBfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKVxuXG4gICAgICAgICAgIyBSZXNpemUgbmF2aWdhdGlvblxuICAgICAgICAgIF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pLmNzc1xuICAgICAgICAgICAgJ21hcmdpbi1sZWZ0JzogLShfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKS53aWR0aCgpIC8gMilcblxuICAgICAgICBlbHNlIGlmIGVsZW1lbnQgaW5zdGFuY2VvZiBqUXVlcnlcblxuICAgICAgICAgIEAkc2xpZGVyTmF2aWdhdGlvbi5wdXNoIGVsZW1lbnRcbiAgICAgICAgICBuYXZpZ2F0aW9uSXRlbXMgPSBfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKS5jaGlsZHJlbigpXG5cbiAgICAgICAgICBAJHNsaWRlcy5lYWNoIChpbmRleCxzbGlkZSk9PlxuICAgICAgICAgICAgaXRlbSA9IG5hdmlnYXRpb25JdGVtcy5lcShpbmRleClcbiAgICAgICAgICAgIGlmIGl0ZW1cbiAgICAgICAgICAgICAgaXRlbS5kYXRhICdzbGlkZXJfaW5kZXgnLCBAJHNsaWRlci5kYXRhICdpbmRleCdcbiAgICAgICAgICAgICAgaXRlbS5kYXRhICdpdGVtX2luZGV4JywgaW5kZXgrcGFyc2VJbnQoc2VsZi5vcHRpb25zLmNhcm91c2VsKVxuICAgICAgICAgICAgICBpdGVtLmFkZENsYXNzICdzbGlkZXJfbmF2aWdhdGlvbkl0ZW0nXG4gICAgICAgICAgICAgIGl0ZW0ub24gJ2NsaWNrJywgKGV2ZW50KS0+XG4gICAgICAgICAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgICAgICAgICAgc2VsZi5nb1RvU2xpZGUgJChAKS5kYXRhKCdpdGVtX2luZGV4JylcblxuICAgICAgQHVwZGF0ZU5hdmlnYXRpb24oKVxuXG5cbiAgICAjIFVwZGF0ZSBuYXZpZ2F0aW9uIHN0YXR1c1xuICAgIHVwZGF0ZU5hdmlnYXRpb246IC0+XG5cbiAgICAgIHNlbGYgPSBAXG4gICAgICBpbmRleCA9IEBjdXJyZW50U2xpZGVcblxuICAgICAgaWYgIUBvcHRpb25zLmRpc2FibGVkXG5cbiAgICAgICAgXy5lYWNoIEAkc2xpZGVyTmF2aWdhdGlvbiwgKGVsZW1lbnQpLT5cblxuICAgICAgICAgIGlmIGVsZW1lbnQgaW5zdGFuY2VvZiBqUXVlcnlcblxuICAgICAgICAgICAgJChlbGVtZW50KS5maW5kKCcuc2xpZGVyX25hdmlnYXRpb25JdGVtJylcbiAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICAgICAgICAuZmlsdGVyICgpLT4gJChAKS5kYXRhKCdpdGVtX2luZGV4JykgPT0gaW5kZXhcbiAgICAgICAgICAgICAgLmFkZENsYXNzICdhY3RpdmUnXG5cblxuICAgICMgVXBkYXRlIHNsaWRlIHByb3BlcnRpZXMgdG8gY3VycmVudCBzbGlkZXIgc3RhdGVcbiAgICB1cGRhdGVTbGlkZXM6IChhbmltYXRlPXRydWUpLT5cblxuICAgICAgIyBGYWRlIGluYWN0aXZlIHNsaWRlcyB0byBhIHNwZWNpZmljIG9wYWNpdHkgdmFsdWVcbiAgICAgIGlmIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5ICYmIGFuaW1hdGVcbiAgICAgICAgQHNldFNsaWRlT3BhY2l0eSAxLCBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eSwgdHJ1ZVxuICAgICAgZWxzZVxuICAgICAgICBAc2V0U2xpZGVPcGFjaXR5IDEsIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5LCBmYWxzZVxuXG4gICAgICBAJHNsaWRlcy5yZW1vdmVDbGFzcyAnYWN0aXZlJ1xuICAgICAgQCRzbGlkZXMuZXEoQGN1cnJlbnRTbGlkZSkuYWRkQ2xhc3MgJ2FjdGl2ZSdcblxuXG4gICAgIyBTZXQgc2xpZGUgb3BhY2l0eSBmb3IgYWN0aXZlIGFuZCBpbmFjdGl2ZSBzbGlkZXNcbiAgICBzZXRTbGlkZU9wYWNpdHk6IChhY3RpdmUsIGluYWN0aXZlLCBhbmltYXRlPXRydWUpLT5cblxuICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICBAJHNsaWRlcy5zdG9wKCkuYW5pbWF0ZVxuICAgICAgICAgIG9wYWNpdHk6IGluYWN0aXZlXG5cbiAgICAgICAgQCRzbGlkZXMuZXEoQGN1cnJlbnRTbGlkZSkuc3RvcCgpLmFuaW1hdGVcbiAgICAgICAgICBvcGFjaXR5OiBhY3RpdmVcbiAgICAgIGVsc2VcbiAgICAgICAgQCRzbGlkZXMuc3RvcCgpLmNzc1xuICAgICAgICAgIG9wYWNpdHk6IGluYWN0aXZlXG5cbiAgICAgICAgQCRzbGlkZXMuZXEoQGN1cnJlbnRTbGlkZSkuc3RvcCgpLmNzc1xuICAgICAgICAgIG9wYWNpdHk6IGFjdGl2ZVxuXG5cbiAgICAjIEV2ZW50IGNhbGxiYWNrIG9uIHNjcm9sbCBlbmRcbiAgICBvblNjcm9sbEVuZDogKGV2ZW50KT0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgICMgSWYgU2xpZGVyIHNob3dzIG1vcmUgdGhhbiBvbmUgc2xpZGUgcGVyIHBhZ2VcbiAgICAgICMgd2UgbmVlZCB0byBjaGVjayBpZiB0aGUgY3VycmVudFNsaWRlIGlzIG9uIHRoZVxuICAgICAgIyBsYXN0IHBhZ2UgYW5kIGhpZ2hlciB0aGFuIHRoZSBvbmUgc25hcHBlZCB0b1xuICAgICAgaWYgQHNsaWRlc0luQ29udGFpbmVyID4gMVxuICAgICAgICBpZiBAaVNjcm9sbC5jdXJyZW50UGFnZS5wYWdlWCA8IEBudW1iZXJPZlNsaWRlcyAtIEBzbGlkZXNJbkNvbnRhaW5lclxuICAgICAgICAgIEBjdXJyZW50U2xpZGUgPSBAaVNjcm9sbC5jdXJyZW50UGFnZS5wYWdlWFxuICAgICAgZWxzZVxuICAgICAgICBAY3VycmVudFNsaWRlID0gQGlTY3JvbGwuY3VycmVudFBhZ2UucGFnZVhcblxuICAgICAgaWYgQG9wdGlvbnMuY2Fyb3VzZWxcbiAgICAgICAgIyBJZiBsYXN0IHNsaWRlLCByZXR1cm4gdG8gZmlyc3RcbiAgICAgICAgaWYgQGN1cnJlbnRTbGlkZSA+PSBAbnVtYmVyT2ZTbGlkZXMtQG9wdGlvbnMuY2Fyb3VzZWxcbiAgICAgICAgICBAZ29Ub1NsaWRlIEBvcHRpb25zLmNhcm91c2VsICsgKEBjdXJyZW50U2xpZGUgLSAoQG51bWJlck9mU2xpZGVzLUBvcHRpb25zLmNhcm91c2VsKSksIGZhbHNlLCBmYWxzZVxuICAgICAgICAjIElmIGZpcnN0IHNsaWRlLCBtb3ZlIHRvIGxhc3RcbiAgICAgICAgZWxzZSBpZiBAY3VycmVudFNsaWRlIDwgQG9wdGlvbnMuY2Fyb3VzZWxcbiAgICAgICAgICBAZ29Ub1NsaWRlIEBudW1iZXJPZlNsaWRlcyAtIChAb3B0aW9ucy5jYXJvdXNlbCsxKSwgZmFsc2UsIGZhbHNlXG5cbiAgICAgIGlmIHR5cGVvZiBzZWxmLm9wdGlvbnMub25TY3JvbGxFbmQgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICBzZWxmLm9wdGlvbnMub25TY3JvbGxFbmQuYXBwbHkoQCwgW2V2ZW50LHNlbGZdKVxuXG4gICAgICBAdXBkYXRlU2xpZGVzKClcbiAgICAgIEB1cGRhdGVOYXZpZ2F0aW9uKClcbiAgICAgIEBkZWJ1ZygpXG5cblxuICAgICMgVXNlciB0b3VjaGVzIHRoZSBzY3JlZW4gYnV0IHNjcm9sbGluZyBkaWRuJ3Qgc3RhcnQgeWV0XG4gICAgb25CZWZvcmVTY3JvbGxTdGFydDogPT5cblxuICAgICAgQHN0b3BBdXRvU2Nyb2xsKClcblxuXG4gICAgIyBSZXNpemUgc2xpZGVyXG4gICAgcmVzaXplOiAoZXZlbnQpPT5cblxuICAgICAgQHN0b3BBdXRvU2Nyb2xsKClcblxuICAgICAgaWYgQG9wdGlvbnMuc2xpZGVXaWR0aCA9PSAnYXV0bydcbiAgICAgICAgQCRzbGlkZXMud2lkdGggQCRzbGlkZXIub3V0ZXJXaWR0aCgpXG4gICAgICBlbHNlXG4gICAgICAgIEAkc2xpZGVzLndpZHRoIHBhcnNlSW50KEBvcHRpb25zLnNsaWRlV2lkdGgpICsgJ3B4J1xuXG4gICAgICAjIENhbGN1bGF0ZSBjb250YWluZXIgd2lkdGhcbiAgICAgICMgQSBwb3NzaWJsZSBtYXJnaW4gbGVmdCBhbmQgcmlnaHQgb2YgdGhlIGVsZW1lbnRzIG1ha2VzIHRoaXNcbiAgICAgICMgYSBsaXR0bGUgbW9yZSB0cmlja3kgdGhhbiBpdCBzZWVtcywgd2UgZG8gbm90IG9ubHkgbmVlZCB0b1xuICAgICAgIyBtdWx0aXBseSBhbGwgZWxlbWVudHMgKyB0aGVpciByZXNwZWN0aXZlIHNpZGUgbWFyZ2lucyBsZWZ0IGFuZFxuICAgICAgIyByaWdodCwgd2UgYWxzbyBoYXZlIHRvIHRha2UgaW50byBhY2NvdW50IHRoYXQgdGhlIGZpcnN0IGFuZCBsYXN0XG4gICAgICAjIGVsZW1lbnQgbWlnaHQgaGF2ZSBhIGRpZmZlcmVudCBtYXJnaW4gdG93YXJkcyB0aGUgYmVnaW5uaW5nIGFuZFxuICAgICAgIyBlbmQgb2YgdGhlIHNsaWRlIGNvbnRhaW5lclxuICAgICAgc2xpZGVXaWR0aCA9IChAJHNsaWRlcy5vdXRlcldpZHRoKCkgKyAoQG9wdGlvbnMuc2xpZGVNYXJnaW4gKiAyKSlcbiAgICAgIGNvbnRhaW5lcldpZHRoID0gIHNsaWRlV2lkdGggKiBAbnVtYmVyT2ZTbGlkZXNcblxuICAgICAgIyBSZW1vdmUgbGFzdCBhbmQgZmlyc3QgZWxlbWVudCBib3JkZXIgbWFyZ2luc1xuICAgICAgY29udGFpbmVyV2lkdGggLT0gQG9wdGlvbnMuc2xpZGVNYXJnaW4gKiAyXG5cbiAgICAgICMgQWRkIHdoYXRldmVyIG1hcmdpbiB0aGVzZSB0d28gZWxlbWVudHMgaGF2ZVxuICAgICAgY29udGFpbmVyV2lkdGggKz0gcGFyc2VGbG9hdCBAJHNsaWRlcy5maXJzdCgpLmNzcygnbWFyZ2luLWxlZnQnKVxuICAgICAgY29udGFpbmVyV2lkdGggKz0gcGFyc2VGbG9hdCBAJHNsaWRlcy5sYXN0KCkuY3NzKCdtYXJnaW4tcmlnaHQnKVxuXG4gICAgICAjIERldGVybWluZSB0aGUgYW1vdW50IG9mIHNsaWRlcyB0aGF0IGNhbiBmaXQgaW5zaWRlIHRoZSBzbGlkZSBjb250YWluZXJcbiAgICAgICMgV2UgbmVlZCB0aGlzIGZvciB0aGUgb25TY3JvbGxFbmQgZXZlbnQsIHRvIGNoZWNrIGlmIHRoZSBjdXJyZW50IHNsaWRlXG4gICAgICAjIGlzIGFscmVhZHkgb24gdGhlIGxhc3QgcGFnZVxuICAgICAgQHNsaWRlc0luQ29udGFpbmVyID0gTWF0aC5jZWlsIEAkc2xpZGVyLndpZHRoKCkgLyBzbGlkZVdpZHRoXG5cbiAgICAgIEAkc2xpZGVDb250YWluZXIud2lkdGggY29udGFpbmVyV2lkdGhcbiAgICAgIEAkc2xpZGVDb250YWluZXIuaGVpZ2h0IEAkc2xpZGVyLmhlaWdodCgpXG5cbiAgICAgIGlmIEBpU2Nyb2xsXG4gICAgICAgIEBpU2Nyb2xsLnJlZnJlc2goKVxuXG4gICAgICBpZiBAb3B0aW9ucy5hdXRvc2Nyb2xsXG4gICAgICAgIEBzdGFydEF1dG9TY3JvbGwoKVxuXG4gICAgICBpZiB0eXBlb2YgQG9wdGlvbnMub25BZnRlclJlc2l6ZSA9PSAnZnVuY3Rpb24nXG4gICAgICAgIEBvcHRpb25zLm9uQWZ0ZXJSZXNpemUuYXBwbHkoQCwgW2V2ZW50XSlcblxuXG4gICAgIyBCaW5kIGV2ZW50c1xuICAgIGJpbmRFdmVudHM6IC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIEBpU2Nyb2xsLm9uICdzY3JvbGxFbmQnLCBAb25TY3JvbGxFbmRcblxuICAgICAgQGlTY3JvbGwub24gJ2JlZm9yZVNjcm9sbFN0YXJ0JywgQG9uQmVmb3JlU2Nyb2xsU3RhcnRcblxuICAgICAgQCRzbGlkZXMub24gJ3RhcCcsIChldmVudCktPlxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vblNsaWRlQ2xpY2sgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlbGYub3B0aW9ucy5vblNsaWRlQ2xpY2suYXBwbHkoc2VsZiwgW2V2ZW50XSlcblxuICAgICAgQCRzbGlkZXIub24gJ3RhcCcsICd1bC5zbGlkZXJOYXZpZ2F0aW9uIGxpJywgLT5cbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYuZ29Ub1NsaWRlICQoQCkuZGF0YSgnaXRlbV9pbmRleCcpXG5cbiAgICAgICQod2luZG93KS5iaW5kICdyZXNpemUnLCAoZXZlbnQpLT5cblxuICAgICAgICBpZiB0eXBlb2Ygc2VsZi5vcHRpb25zLm9uQmVmb3JlUmVzaXplID09ICdmdW5jdGlvbidcbiAgICAgICAgICBzZWxmLm9wdGlvbnMub25CZWZvcmVSZXNpemUuYXBwbHkoc2VsZiwgW2V2ZW50XSlcblxuICAgICAgICBzZWxmLnJlc2l6ZSBldmVudFxuXG5cbiAgICAjIEdvIHRvIG5leHQgc2xpZGVcbiAgICBuZXh0U2xpZGU6ID0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIGlmIEBudW1iZXJPZlNsaWRlcyA+IEBjdXJyZW50U2xpZGUrMVxuICAgICAgICBuZXh0U2xpZGVJbmRleCA9IEBjdXJyZW50U2xpZGUrMVxuICAgICAgZWxzZVxuICAgICAgICBuZXh0U2xpZGVJbmRleCA9IDBcblxuICAgICAgQGdvVG9TbGlkZSBuZXh0U2xpZGVJbmRleFxuXG5cbiAgICAjIEdvIHRvIHByZXZpb3VzIHNsaWRlXG4gICAgcHJldlNsaWRlOiA9PlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBpZiBAY3VycmVudFNsaWRlLTEgPj0gMFxuICAgICAgICBuZXh0U2xpZGVJbmRleCA9IEBjdXJyZW50U2xpZGUtMVxuICAgICAgZWxzZVxuICAgICAgICBuZXh0U2xpZGVJbmRleCA9IEBudW1iZXJPZlNsaWRlcy0xXG5cbiAgICAgIEBnb1RvU2xpZGUgbmV4dFNsaWRlSW5kZXhcblxuXG4gICAgIyBHbyB0byBzbGlkZSBpbmRleFxuICAgIGdvVG9TbGlkZTogKGluZGV4LCBhbmltYXRlPXRydWUsIHRyaWdnZXJFdmVudD10cnVlKT0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIGlmIGFuaW1hdGVcbiAgICAgICAgQGlTY3JvbGw/LmdvVG9QYWdlIGluZGV4LCAwLCBAb3B0aW9ucy5zcGVlZFxuICAgICAgZWxzZVxuICAgICAgICBAaVNjcm9sbD8uZ29Ub1BhZ2UgaW5kZXgsIDAsIDBcblxuICAgICAgQGN1cnJlbnRTbGlkZSA9IGluZGV4XG4gICAgICBAdXBkYXRlU2xpZGVzKGFuaW1hdGUpXG4gICAgICBAdXBkYXRlTmF2aWdhdGlvbigpXG5cbiAgICAgIGlmIHRyaWdnZXJFdmVudFxuICAgICAgICAkKCdib2R5JykudHJpZ2dlciBAJHNsaWRlci5kYXRhKCdpbmRleCcpKycjZ29Ub1NsaWRlJywgaW5kZXggLSBAb3B0aW9ucy5jYXJvdXNlbFxuXG4gICAgICBAZGVidWcoKVxuXG5cbiAgICAjIEFkZCBmYWtlIGNhcm91c2VsIHNsaWRlc1xuICAgIGFkZENhcm91c2VsU2xpZGVzOiAtPlxuXG4gICAgICBAJHN0YXJ0RWxlbWVudHMgPSBAJHNsaWRlcy5zbGljZSgtQG9wdGlvbnMuY2Fyb3VzZWwpLmNsb25lKClcbiAgICAgIEAkZW5kRWxlbWVudHMgPSBAJHNsaWRlcy5zbGljZSgwLEBvcHRpb25zLmNhcm91c2VsKS5jbG9uZSgpXG5cbiAgICAgIEAkc2xpZGVzLnBhcmVudCgpLnByZXBlbmQgQCRzdGFydEVsZW1lbnRzXG4gICAgICBAJHNsaWRlcy5wYXJlbnQoKS5hcHBlbmQgQCRlbmRFbGVtZW50c1xuXG5cbiAgICAjIFN0YXJ0IGF1dG9zY3JvbGxcbiAgICBzdGFydEF1dG9TY3JvbGw6ID0+XG5cbiAgICAgIEBpbnRlcnZhbCA9IHNldEludGVydmFsIEBuZXh0U2xpZGUsIEBvcHRpb25zLmludGVydmFsXG5cblxuICAgICMgU3RvcCBhdXRvc2Nyb2xsXG4gICAgc3RvcEF1dG9TY3JvbGw6ID0+XG5cbiAgICAgIGNsZWFySW50ZXJ2YWwgQGludGVydmFsXG4gICAgICBAaW50ZXJ2YWwgPSBudWxsXG5cblxuICAgICMgTGlzdGVuIHRvIGFub3RoZXIgc2xpZGVyIGZvciBuYXZpZ2F0aW9uXG4gICAgIyBQYXNzIHRoZSBzbGlkZXIgaW5kZXggZm9yIHRoZSBldmVudCBiaW5kaW5nIHNlbGVjdG9yXG4gICAgbGlzdGVuVG86IChpbmRleCktPlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICAkKCdib2R5Jykub24gJ3NsaWRlcl8nK2luZGV4KycjZ29Ub1NsaWRlJywgKGV2ZW50LCBpbmRleCktPlxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgc2VsZi5nb1RvU2xpZGUgKGluZGV4ICsgc2VsZi5vcHRpb25zLmNhcm91c2VsKSwgdHJ1ZSwgZmFsc2VcblxuXG4gICAgIyBBZGQgZGVidWcgb3V0cHV0IHRvIHNsaWRlclxuICAgIGRlYnVnOiA9PlxuXG4gICAgICBpZiBAb3B0aW9ucy5kZWJ1Z1xuICAgICAgICBAJHNsaWRlci5maW5kKCcuZGVidWcnKS5yZW1vdmUoKVxuICAgICAgICBAJHNsaWRlci5hcHBlbmQgQGRlYnVnVGVtcGxhdGVcbiAgICAgICAgICAnc2xpZGVyX2luZGV4JzogQCRzbGlkZXIuZGF0YSAnaW5kZXgnXG4gICAgICAgICAgJ251bWJlcl9vZl9zbGlkZXMnOiBAbnVtYmVyT2ZTbGlkZXNcbiAgICAgICAgICAnY3VycmVudF9zbGlkZSc6IEBpU2Nyb2xsLmN1cnJlbnRQYWdlPy5wYWdlWFxuICAgICAgICAgICdhdXRvc2Nyb2xsJzogaWYgQGludGVydmFsIHRoZW4gJ2VuYWJsZWQnIGVsc2UgJ2Rpc2FibGVkJ1xuICAgICAgICAgICdudW1iZXJfb2ZfbmF2aWdhdGlvbnMnOiBAJHNsaWRlck5hdmlnYXRpb24ubGVuZ3RoXG4gICAgICAgICAgJ3NsaWRlcl93aWR0aCc6IEAkc2xpZGVyLndpZHRoKClcblxuXG4gICAgIyBQcmludCBvcHRpb24gdG8gY29uc29sZVxuICAgICMgQ2FuJ3QganVzdCByZXR1cm4gdGhlIHZhbHVlIHRvIGRlYnVnIGl0IGJlY2F1c2VcbiAgICAjIGl0IHdvdWxkIGJyZWFrIGNoYWluaW5nIHdpdGggdGhlIGpRdWVyeSBvYmplY3RcbiAgICAjIEV2ZXJ5IG1ldGhvZCBjYWxsIHJldHVybnMgYSBqUXVlcnkgb2JqZWN0XG4gICAgZ2V0OiAob3B0aW9uKSAtPlxuICAgICAgY29uc29sZS5sb2cgJ29wdGlvbjogJytvcHRpb24rJyBpcyAnK0BvcHRpb25zW29wdGlvbl1cbiAgICAgIEBvcHRpb25zW29wdGlvbl1cblxuXG4gICAgIyBTZXQgb3B0aW9uIHRvIHRoaXMgaW5zdGFuY2VzIG9wdGlvbnMgYXJyYXlcbiAgICBzZXQ6IChvcHRpb24sIHZhbHVlKSAtPlxuXG4gICAgICAjIFNldCBvcHRpb25zIHZhbHVlXG4gICAgICBAb3B0aW9uc1tvcHRpb25dID0gdmFsdWVcblxuICAgICAgIyBJZiBubyBpbnRlcnZhbCBpcyBjdXJyZW50bHkgcHJlc2VudCwgc3RhcnQgYXV0b3Njcm9sbFxuICAgICAgaWYgb3B0aW9uID09ICdhdXRvc2Nyb2xsJyAmJiAhQGludGVydmFsXG4gICAgICAgIEBzdGFydEF1dG9TY3JvbGwoKVxuXG4gICAgICAjIFRPRE86IFVwZGF0ZSBzbGlkZSBtYXJnaW5cbiAgICAgICNpZiBvcHRpb24gPT0gJ3NsaWRlTWFyZ2luJ1xuICAgICAgICAjIGNhY2hlIHNsaWRlTWFyZ2luIENTUyBvbiBlbGVtZW50P1xuICAgICAgICAjIHdoYXQgaWYgdGhlIHVzZXIgd2FudHMgdG8gc3dpdGNoIGJhY2tcblxuICAgICAgaWYgb3B0aW9uID09ICdpbmFjdGl2ZVNsaWRlT3BhY2l0eScgJiYgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHlcbiAgICAgICAgQHNldFNsaWRlT3BhY2l0eSAxLCBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eVxuXG4gICAgICBpZiBvcHRpb24gPT0gJ25hdmlnYXRpb24nXG4gICAgICAgIEByZW5kZXJOYXZpZ2F0aW9uKClcblxuICAgICAgaWYgb3B0aW9uID09ICdsaXN0ZW5UbydcbiAgICAgICAgQGxpc3RlblRvIHZhbHVlXG5cbiAgICAgIEBkZWJ1ZygpXG5cblxuXG4gICMgRGVmaW5lIHRoZSBwbHVnaW5cbiAgJC5mbi5leHRlbmQgU2xpZGVyOiAob3B0aW9uLCBhcmdzLi4uKSAtPlxuXG4gICAgQGVhY2ggKGluZGV4KS0+XG4gICAgICAkdGhpcyA9ICQoQClcbiAgICAgIGRhdGEgPSAkdGhpcy5kYXRhKCdTbGlkZXInKVxuXG4gICAgICBpZiAhZGF0YVxuICAgICAgICAkdGhpcy5kYXRhICdTbGlkZXInLCAoZGF0YSA9IG5ldyBTbGlkZXIoQCwgb3B0aW9uLCBpbmRleCkpXG5cbiAgICAgIGlmIHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZydcbiAgICAgICAgcmV0dXJuIGRhdGFbb3B0aW9uXS5hcHBseShkYXRhLCBhcmdzKVxuXG5cbikgd2luZG93LmpRdWVyeSwgd2luZG93XG5cbiJdfQ==