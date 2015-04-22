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

      Slider.prototype.defaults = {
        autoscroll: false,
        speed: 500,
        interval: 5000,
        debug: true,
        snap: true,
        navigation: true,
        navigationTemplate: _.template('<ul class="sliderNavigation"> <% _.each(slides, function(element,index){ %> <li data-index="<%= index %>" class="slider_navigationItem fa fa-circle-o"></li> <% }); %> </ul>'),
        navigationElement: false,
        prevNextButtons: true,
        prevNextButtonsTemplate: _.template('<span class="prev fa fa-angle-left"></span> <span class="next fa fa-angle-right"></span>'),
        slideContainerSelector: '.slideContainer',
        slideSelector: 'ul.slides > li',
        inactiveSlideOpacity: null,
        slideMargin: 0
      };

      Slider.prototype.debugTemplate = _.template('<div class="debug"> <span>Slider: <%= slider_index %></span> <span># of slides: <%= number_of_slides %></span> <span>Current slide: <%= current_slide %></span> <span>Autoscroll: <%= autoscroll %></span> <span># of navigations: <%= number_of_navigations %></span> <span>Slider width: <%= slider_width %></span> </div>');

      function Slider(el, options, index) {
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
        this.options = $.extend({}, this.defaults, options);
        this.$slider = $(el);
        this.$slider.data('index', index);
        this.$slider.addClass('slider_' + index);
        this.$sliderNavigation = [];
        this.$slideContainer = this.$slider.find(this.options.slideContainerSelector);
        this.$slides = this.$slideContainer.find(this.options.slideSelector);
        this.numberOfSlides = this.$slides.length;
        this.enableSlides();
        this.iScroll = new IScroll(el, {
          scrollX: true,
          scrollY: false,
          snap: this.options.snap,
          snapSpeed: 400,
          tap: true,
          momentum: false,
          eventPassthrough: false
        });
        if (this.options.autoscroll) {
          this.startAutoScroll();
        }
        if (this.options.prevNextButtons) {
          this.addPrevNextButtons();
        }
        if (this.options.navigation) {
          this.addNavigation();
        }
        this.resize();
        this.goToSlide(this.currentSlide);
        this.bindEvents();
        this.debug();
      }

      Slider.prototype.enableSlides = function() {
        return this.$slides.css({
          display: 'block'
        });
      };

      Slider.prototype.addPrevNextButtons = function() {
        return this.$slider.append(this.options.prevNextButtonsTemplate());
      };

      Slider.prototype.addNavigation = function() {
        var navigationItems, newElement, self, sliderNavigationLength;
        self = this;
        sliderNavigationLength = this.$sliderNavigation.length;
        if (this.options.navigationElement) {
          this.$sliderNavigation.push(this.options.navigationElement);
          navigationItems = this.$sliderNavigation[sliderNavigationLength].children();
          this.$slides.each(function(index, element) {
            var item;
            item = navigationItems.eq(index);
            if (item) {
              item.data('slider_index', self.$slider.data('index'));
              item.data('item_index', index);
              item.addClass('slider_navigationItem');
              return item.click(function(event) {
                self.stopAutoScroll();
                return self.goToSlide($(this).data('item_index'));
              });
            }
          });
        } else {
          newElement = this.options.navigationTemplate({
            'slides': this.$slides
          });
          this.$sliderNavigation.push($(newElement));
          this.$slider.append(this.$sliderNavigation[sliderNavigationLength]);
          this.$sliderNavigation[sliderNavigationLength].css({
            'margin-left': -this.$sliderNavigation[sliderNavigationLength].width() / 2
          });
        }
        return this.updateNavigation();
      };

      Slider.prototype.updateNavigation = function() {
        var index;
        index = this.currentSlide;
        return _.each(this.$sliderNavigation, function(element) {
          return $(element).find('.slider_navigationItem').removeClass('active').eq(index).addClass('active');
        });
      };

      Slider.prototype.updateSlides = function() {
        if (this.options.inactiveSlideOpacity) {
          this.$slides.animate({
            opacity: '0.5'
          });
          return this.$slides.eq(this.currentSlide).stop().animate({
            opacity: '1'
          });
        }
      };

      Slider.prototype.onScrollEnd = function() {
        this.currentSlide = this.iScroll.currentPage.pageX;
        this.updateSlides();
        this.updateNavigation();
        return this.debug();
      };

      Slider.prototype.onBeforeScrollStart = function() {
        return this.stopAutoScroll();
      };

      Slider.prototype.resize = function() {
        this.stopAutoScroll();
        this.$slides.width(this.$slider.outerWidth());
        this.$slideContainer.width((this.$slides.outerWidth() + (this.options.slideMargin * 2)) * this.numberOfSlides);
        this.$slideContainer.height(this.$slider.height());
        if (this.iScroll) {
          this.iScroll.refresh();
        }
        return this.startAutoScroll();
      };

      Slider.prototype.bindEvents = function() {
        var self;
        self = this;
        this.iScroll.on('scrollEnd', this.onScrollEnd);
        this.iScroll.on('beforeScrollStart', this.onBeforeScrollStart);
        this.$slides.on('click', 'img', function() {
          return self.stopAutoScroll();
        });
        this.$slider.on('click', 'span.next', function() {
          self.stopAutoScroll();
          return self.nextSlide();
        });
        this.$slider.on('click', 'span.prev', function() {
          self.stopAutoScroll();
          return self.prevSlide();
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

      Slider.prototype.goToSlide = function(index) {
        var ref;
        if (this.currentSlide !== index) {
          if ((ref = this.iScroll) != null) {
            ref.goToPage(index, 0, this.options.speed);
          }
          this.currentSlide = index;
        }
        this.updateSlides();
        return this.updateNavigation();
      };

      Slider.prototype.startAutoScroll = function() {
        return this.interval = setInterval(this.nextSlide, this.options.interval);
      };

      Slider.prototype.stopAutoScroll = function() {
        clearInterval(this.interval);
        return this.interval = null;
      };

      Slider.prototype.debug = function() {
        if (this.options.debug) {
          this.$slider.find('.debug').remove();
          return this.$slider.append(this.debugTemplate({
            'slider_index': this.$slider.data('index'),
            'number_of_slides': this.numberOfSlides,
            'current_slide': this.iScroll.currentPage.pageX,
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
        console.log('setting ' + option + ' to ' + value);
        this.options[option] = value;
        return this.updateSettings();
      };

      Slider.prototype.updateSettings = function() {
        if (this.options.autoscroll && !this.interval) {
          this.startAutoScroll();
        }
        if (this.options.navigationElement) {
          this.addNavigation();
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

//# sourceMappingURL=data:application/json;base64,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QUFDRSxVQUFBLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBQSxDQURGO1NBSEE7ZUFNQSxJQUFDLENBQUEsS0FBRCxDQUFBLEVBUmM7TUFBQSxDQTFUaEIsQ0FBQTs7b0JBQUE7O1FBRkYsQ0FBQTtXQXlVQSxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQUwsQ0FBWTtBQUFBLE1BQUEsTUFBQSxFQUFRLFNBQUEsR0FBQTtBQUVsQixZQUFBLFlBQUE7QUFBQSxRQUZtQix1QkFBUSw0REFFM0IsQ0FBQTtlQUFBLElBQUMsQ0FBQSxJQUFELENBQU0sU0FBQyxLQUFELEdBQUE7QUFDSixjQUFBLFdBQUE7QUFBQSxVQUFBLEtBQUEsR0FBUSxDQUFBLENBQUUsSUFBRixDQUFSLENBQUE7QUFBQSxVQUNBLElBQUEsR0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLFFBQVgsQ0FEUCxDQUFBO0FBR0EsVUFBQSxJQUFHLENBQUEsSUFBSDtBQUNFLFlBQUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxRQUFYLEVBQXFCLENBQUMsSUFBQSxHQUFXLElBQUEsTUFBQSxDQUFPLElBQVAsRUFBVSxNQUFWLEVBQWtCLEtBQWxCLENBQVosQ0FBckIsQ0FBQSxDQURGO1dBSEE7QUFNQSxVQUFBLElBQUcsTUFBQSxDQUFBLE1BQUEsS0FBaUIsUUFBcEI7QUFDRSxtQkFBTyxJQUFLLENBQUEsTUFBQSxDQUFPLENBQUMsS0FBYixDQUFtQixJQUFuQixFQUF5QixJQUF6QixDQUFQLENBREY7V0FQSTtRQUFBLENBQU4sRUFGa0I7TUFBQSxDQUFSO0tBQVosRUE1VUQ7RUFBQSxDQUFELENBQUEsQ0F5VkUsTUFBTSxDQUFDLE1BelZULEVBeVZpQixNQXpWakIsQ0FBQSxDQUFBO0FBQUEiLCJmaWxlIjoiYXNzZS1zbGlkZXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyIjXG4jIFNsaWRlciBqUXVlcnkgcGx1Z2luXG4jIEF1dGhvcjogVGhvbWFzIEtsb2tvc2NoIDxtYWlsQHRob21hc2tsb2tvc2NoLmNvbT5cbiNcbigoJCwgd2luZG93KSAtPlxuXG4gICMgRGVmaW5lIHRoZSBwbHVnaW4gY2xhc3NcbiAgY2xhc3MgU2xpZGVyXG5cbiAgICBpU2Nyb2xsOiBudWxsXG4gICAgbnVtYmVyT2ZTbGlkZXM6IG51bGxcbiAgICBjdXJyZW50U2xpZGU6IDBcbiAgICBpbnRlcnZhbDogbnVsbFxuXG4gICAgJHNsaWRlcjogbnVsbFxuICAgICRzbGlkZUNvbnRhaW5lcjogbnVsbFxuICAgICRzbGlkZXM6IG51bGxcblxuICAgIGRlZmF1bHRzOlxuICAgICAgYXV0b3Njcm9sbDogZmFsc2VcbiAgICAgIHNwZWVkOiA1MDBcbiAgICAgIGludGVydmFsOiA1MDAwXG4gICAgICBkZWJ1ZzogdHJ1ZVxuICAgICAgc25hcDogdHJ1ZVxuXG4gICAgICBuYXZpZ2F0aW9uOiB0cnVlXG4gICAgICBuYXZpZ2F0aW9uVGVtcGxhdGU6IF8udGVtcGxhdGUoJzx1bCBjbGFzcz1cInNsaWRlck5hdmlnYXRpb25cIj5cbiAgICAgICAgPCUgXy5lYWNoKHNsaWRlcywgZnVuY3Rpb24oZWxlbWVudCxpbmRleCl7ICU+XG4gICAgICAgICAgPGxpIGRhdGEtaW5kZXg9XCI8JT0gaW5kZXggJT5cIiBjbGFzcz1cInNsaWRlcl9uYXZpZ2F0aW9uSXRlbSBmYSBmYS1jaXJjbGUtb1wiPjwvbGk+XG4gICAgICAgIDwlIH0pOyAlPlxuICAgICAgPC91bD4nKVxuXG4gICAgICAjIElmIHNwZWNpZmllZCwgdGhpcyBlbGVtZW50cyBjaGlsZHJlbiB3aWxsIHJlY2VpdmUgaW5kZXggdmFsdWVzIGZvclxuICAgICAgIyB0aGUgc2xpZGVzIGFuZCBtYXRjaGluZyBjbGljayBldmVudCBiaW5kaW5nc1xuICAgICAgbmF2aWdhdGlvbkVsZW1lbnQ6IGZhbHNlXG5cbiAgICAgIHByZXZOZXh0QnV0dG9uczogdHJ1ZVxuICAgICAgcHJldk5leHRCdXR0b25zVGVtcGxhdGU6IF8udGVtcGxhdGUoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwcmV2IGZhIGZhLWFuZ2xlLWxlZnRcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm5leHQgZmEgZmEtYW5nbGUtcmlnaHRcIj48L3NwYW4+JylcblxuICAgICAgc2xpZGVDb250YWluZXJTZWxlY3RvcjogJy5zbGlkZUNvbnRhaW5lcidcbiAgICAgIHNsaWRlU2VsZWN0b3I6ICd1bC5zbGlkZXMgPiBsaSdcblxuICAgICAgIyBPcGFjaXR5IG9mIHNsaWRlcyBvdGhlciB0aGFuIHRoZSBjdXJyZW50XG4gICAgICAjIE9ubHkgYXBwbGljYWJsZSBpZiB0aGUgc2xpZGVyIGVsZW1lbnQgaGFzIG92ZXJmbG93OiB2aXNpYmxlXG4gICAgICAjIGFuZCBpbmFjdGl2ZSBzbGlkZXMgYXJlIHNob3duIG5leHQgdG8gdGhlIGN1cnJlbnRcbiAgICAgIGluYWN0aXZlU2xpZGVPcGFjaXR5OiBudWxsXG5cbiAgICAgICMgTWFyZ2luIGxlZnQgYW5kIHJpZ2h0IG9mIHRoZSBzbGlkZXMgaW4gcGl4ZWxzXG4gICAgICBzbGlkZU1hcmdpbjogMFxuXG5cbiAgICBkZWJ1Z1RlbXBsYXRlOiBfLnRlbXBsYXRlKCdcbiAgICAgIDxkaXYgY2xhc3M9XCJkZWJ1Z1wiPlxuICAgICAgICA8c3Bhbj5TbGlkZXI6IDwlPSBzbGlkZXJfaW5kZXggJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPiMgb2Ygc2xpZGVzOiA8JT0gbnVtYmVyX29mX3NsaWRlcyAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+Q3VycmVudCBzbGlkZTogPCU9IGN1cnJlbnRfc2xpZGUgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPkF1dG9zY3JvbGw6IDwlPSBhdXRvc2Nyb2xsICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj4jIG9mIG5hdmlnYXRpb25zOiA8JT0gbnVtYmVyX29mX25hdmlnYXRpb25zICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj5TbGlkZXIgd2lkdGg6IDwlPSBzbGlkZXJfd2lkdGggJT48L3NwYW4+XG4gICAgICA8L2Rpdj4nKVxuXG5cbiAgICAjIENvbnN0cnVjdG9yXG4gICAgY29uc3RydWN0b3I6IChlbCwgb3B0aW9ucywgaW5kZXggPSBudWxsKSAtPlxuXG4gICAgICBAb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBAZGVmYXVsdHMsIG9wdGlvbnMpXG5cbiAgICAgIEAkc2xpZGVyID0gJChlbClcbiAgICAgIEAkc2xpZGVyLmRhdGEgJ2luZGV4JywgaW5kZXhcbiAgICAgIEAkc2xpZGVyLmFkZENsYXNzICdzbGlkZXJfJytpbmRleFxuICAgICAgQCRzbGlkZXJOYXZpZ2F0aW9uID0gW11cblxuICAgICAgQCRzbGlkZUNvbnRhaW5lciA9IEAkc2xpZGVyLmZpbmQgQG9wdGlvbnMuc2xpZGVDb250YWluZXJTZWxlY3RvclxuICAgICAgQCRzbGlkZXMgPSBAJHNsaWRlQ29udGFpbmVyLmZpbmQgQG9wdGlvbnMuc2xpZGVTZWxlY3RvclxuICAgICAgQG51bWJlck9mU2xpZGVzID0gQCRzbGlkZXMubGVuZ3RoXG5cbiAgICAgICMgRW5hYmxlIHNsaWRlcyB0cm91Z2ggQ1NTXG4gICAgICBAZW5hYmxlU2xpZGVzKClcblxuICAgICAgQGlTY3JvbGwgPSBuZXcgSVNjcm9sbCBlbCxcbiAgICAgICAgc2Nyb2xsWDogdHJ1ZVxuICAgICAgICBzY3JvbGxZOiBmYWxzZVxuICAgICAgICBzbmFwOiBAb3B0aW9ucy5zbmFwXG4gICAgICAgIHNuYXBTcGVlZDogNDAwXG4gICAgICAgIHRhcDogdHJ1ZVxuICAgICAgICBtb21lbnR1bTogZmFsc2VcbiAgICAgICAgZXZlbnRQYXNzdGhyb3VnaDogZmFsc2VcblxuICAgICAgaWYgQG9wdGlvbnMuYXV0b3Njcm9sbFxuICAgICAgICBAc3RhcnRBdXRvU2Nyb2xsKClcblxuICAgICAgaWYgQG9wdGlvbnMucHJldk5leHRCdXR0b25zXG4gICAgICAgIEBhZGRQcmV2TmV4dEJ1dHRvbnMoKVxuXG4gICAgICBpZiBAb3B0aW9ucy5uYXZpZ2F0aW9uXG4gICAgICAgIEBhZGROYXZpZ2F0aW9uKClcblxuICAgICAgQHJlc2l6ZSgpXG4gICAgICBAZ29Ub1NsaWRlIEBjdXJyZW50U2xpZGVcbiAgICAgIEBiaW5kRXZlbnRzKClcbiAgICAgIEBkZWJ1ZygpXG5cblxuICAgICMgRW5hYmxlIHNsaWRlcyB2aWEgQ1NTXG4gICAgZW5hYmxlU2xpZGVzOiAtPlxuXG4gICAgICBAJHNsaWRlcy5jc3NcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJ1xuXG5cbiAgICAjIEFkZCBwcmV2IG5leHQgYnV0dG9uc1xuICAgIGFkZFByZXZOZXh0QnV0dG9uczogLT5cblxuICAgICAgQCRzbGlkZXIuYXBwZW5kIEBvcHRpb25zLnByZXZOZXh0QnV0dG9uc1RlbXBsYXRlKClcblxuXG4gICAgIyBBZGQgbmF2aWdhdGlvblxuICAgIGFkZE5hdmlnYXRpb246IC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIHNsaWRlck5hdmlnYXRpb25MZW5ndGggPSBAJHNsaWRlck5hdmlnYXRpb24ubGVuZ3RoXG5cbiAgICAgIGlmIEBvcHRpb25zLm5hdmlnYXRpb25FbGVtZW50XG5cbiAgICAgICAgQCRzbGlkZXJOYXZpZ2F0aW9uLnB1c2ggQG9wdGlvbnMubmF2aWdhdGlvbkVsZW1lbnRcbiAgICAgICAgbmF2aWdhdGlvbkl0ZW1zID0gQCRzbGlkZXJOYXZpZ2F0aW9uW3NsaWRlck5hdmlnYXRpb25MZW5ndGhdLmNoaWxkcmVuKClcblxuICAgICAgICBAJHNsaWRlcy5lYWNoIChpbmRleCxlbGVtZW50KS0+XG4gICAgICAgICAgaXRlbSA9IG5hdmlnYXRpb25JdGVtcy5lcShpbmRleClcbiAgICAgICAgICBpZiBpdGVtXG4gICAgICAgICAgICBpdGVtLmRhdGEgJ3NsaWRlcl9pbmRleCcsIHNlbGYuJHNsaWRlci5kYXRhICdpbmRleCdcbiAgICAgICAgICAgIGl0ZW0uZGF0YSAnaXRlbV9pbmRleCcsIGluZGV4XG4gICAgICAgICAgICBpdGVtLmFkZENsYXNzICdzbGlkZXJfbmF2aWdhdGlvbkl0ZW0nXG4gICAgICAgICAgICBpdGVtLmNsaWNrIChldmVudCktPlxuICAgICAgICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgICAgICAgc2VsZi5nb1RvU2xpZGUgJChAKS5kYXRhKCdpdGVtX2luZGV4JylcblxuICAgICAgZWxzZVxuXG4gICAgICAgICMgQ3JlYXRlIGEgalF1ZXJ5IG9iamVjdCBkaXJlY3RseSBmcm9tIHNsaWRlciBjb2RlXG4gICAgICAgIG5ld0VsZW1lbnQgPSBAb3B0aW9ucy5uYXZpZ2F0aW9uVGVtcGxhdGUoeydzbGlkZXMnOiBAJHNsaWRlc30pXG4gICAgICAgIEAkc2xpZGVyTmF2aWdhdGlvbi5wdXNoICQobmV3RWxlbWVudClcblxuICAgICAgICAjIEFwcGVuZCBpdCB0byBzbGlkZXIgZWxlbWVudFxuICAgICAgICBAJHNsaWRlci5hcHBlbmQgQCRzbGlkZXJOYXZpZ2F0aW9uW3NsaWRlck5hdmlnYXRpb25MZW5ndGhdXG5cbiAgICAgICAgIyBSZXNpemUgbmF2aWdhdGlvblxuICAgICAgICBAJHNsaWRlck5hdmlnYXRpb25bc2xpZGVyTmF2aWdhdGlvbkxlbmd0aF0uY3NzXG4gICAgICAgICAgJ21hcmdpbi1sZWZ0JzogLUAkc2xpZGVyTmF2aWdhdGlvbltzbGlkZXJOYXZpZ2F0aW9uTGVuZ3RoXS53aWR0aCgpIC8gMlxuXG4gICAgICBAdXBkYXRlTmF2aWdhdGlvbigpXG5cblxuICAgICMgVXBkYXRlIG5hdmlnYXRpb24gc3RhdHVzXG4gICAgdXBkYXRlTmF2aWdhdGlvbjogLT5cblxuICAgICAgaW5kZXggPSBAY3VycmVudFNsaWRlXG5cbiAgICAgIF8uZWFjaCBAJHNsaWRlck5hdmlnYXRpb24sIChlbGVtZW50KS0+XG4gICAgICAgICQoZWxlbWVudCkuZmluZCgnLnNsaWRlcl9uYXZpZ2F0aW9uSXRlbScpXG4gICAgICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICAgIC5lcShpbmRleCkuYWRkQ2xhc3MgJ2FjdGl2ZSdcblxuXG4gICAgdXBkYXRlU2xpZGVzOiAtPlxuXG4gICAgICAjIEZhZGUgaW5hY3RpdmUgc2xpZGVzIHRvIGEgc3BlY2lmaWMgb3BhY2l0eSB2YWx1ZVxuICAgICAgaWYgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHlcblxuICAgICAgICBAJHNsaWRlcy5hbmltYXRlXG4gICAgICAgICAgb3BhY2l0eTogJzAuNSdcblxuICAgICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5zdG9wKCkuYW5pbWF0ZVxuICAgICAgICAgIG9wYWNpdHk6ICcxJ1xuXG5cbiAgICAjIEV2ZW50IGNhbGxiYWNrIG9uIHNjcm9sbCBlbmRcbiAgICBvblNjcm9sbEVuZDogPT5cblxuICAgICAgQGN1cnJlbnRTbGlkZSA9IEBpU2Nyb2xsLmN1cnJlbnRQYWdlLnBhZ2VYXG4gICAgICBAdXBkYXRlU2xpZGVzKClcbiAgICAgIEB1cGRhdGVOYXZpZ2F0aW9uKClcbiAgICAgIEBkZWJ1ZygpXG5cblxuICAgICMgVXNlciB0b3VjaGVzIHRoZSBzY3JlZW4gYnV0IHNjcm9sbGluZyBkaWRuJ3Qgc3RhcnQgeWV0XG4gICAgb25CZWZvcmVTY3JvbGxTdGFydDogPT5cblxuICAgICAgQHN0b3BBdXRvU2Nyb2xsKClcblxuXG4gICAgIyBSZXNpemUgc2xpZGVyXG4gICAgcmVzaXplOiA9PlxuXG4gICAgICBAc3RvcEF1dG9TY3JvbGwoKVxuXG4gICAgICBAJHNsaWRlcy53aWR0aCBAJHNsaWRlci5vdXRlcldpZHRoKClcbiAgICAgIEAkc2xpZGVDb250YWluZXIud2lkdGggKEAkc2xpZGVzLm91dGVyV2lkdGgoKSArIChAb3B0aW9ucy5zbGlkZU1hcmdpbioyKSkgKiBAbnVtYmVyT2ZTbGlkZXNcbiAgICAgIEAkc2xpZGVDb250YWluZXIuaGVpZ2h0IEAkc2xpZGVyLmhlaWdodCgpXG5cbiAgICAgIGlmIEBpU2Nyb2xsIHRoZW4gQGlTY3JvbGwucmVmcmVzaCgpXG5cbiAgICAgIEBzdGFydEF1dG9TY3JvbGwoKVxuXG5cbiAgICAjIEJpbmQgZXZlbnRzXG4gICAgYmluZEV2ZW50czogLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgQGlTY3JvbGwub24gJ3Njcm9sbEVuZCcsIEBvblNjcm9sbEVuZFxuXG4gICAgICBAaVNjcm9sbC5vbiAnYmVmb3JlU2Nyb2xsU3RhcnQnLCBAb25CZWZvcmVTY3JvbGxTdGFydFxuXG4gICAgICBAJHNsaWRlcy5vbiAnY2xpY2snLCAnaW1nJywgLT5cbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG5cbiAgICAgIEAkc2xpZGVyLm9uICdjbGljaycsICdzcGFuLm5leHQnLCAtPlxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgc2VsZi5uZXh0U2xpZGUoKVxuXG4gICAgICBAJHNsaWRlci5vbiAnY2xpY2snLCAnc3Bhbi5wcmV2JywgLT5cbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYucHJldlNsaWRlKClcblxuICAgICAgQCRzbGlkZXIub24gJ2NsaWNrJywgJ3VsLnNsaWRlck5hdmlnYXRpb24gbGknLCAtPlxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgc2VsZi5nb1RvU2xpZGUgJChAKS5kYXRhKCdpbmRleCcpXG5cbiAgICAgICQod2luZG93KS5iaW5kICdyZXNpemUnLCAtPlxuICAgICAgICBzZWxmLnJlc2l6ZSgpXG4gICAgICAgICMjI1xuICAgICAgICBpZiBAcmVzaXplVG9cbiAgICAgICAgICBjbGVhclRpbWVvdXQgQHJlc2l6ZVRpbWVvdXRcbiAgICAgICAgQHJlc2l6ZVRpbWVvdXQgPSBzZXRUaW1lb3V0IC0+XG4gICAgICAgICwgMjAwXG4gICAgICAgICMjI1xuXG5cbiAgICAjIEdvIHRvIG5leHQgc2xpZGVcbiAgICBuZXh0U2xpZGU6ID0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIGlmIEBudW1iZXJPZlNsaWRlcyA+IEBjdXJyZW50U2xpZGUgKyAxXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gQGN1cnJlbnRTbGlkZSsxXG4gICAgICBlbHNlXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gMFxuXG4gICAgICBAZ29Ub1NsaWRlIG5leHRTbGlkZUluZGV4XG5cblxuICAgICMgR28gdG8gcHJldmlvdXMgc2xpZGVcbiAgICBwcmV2U2xpZGU6ID0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIGlmIEBjdXJyZW50U2xpZGUtMSA+PSAwXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gQGN1cnJlbnRTbGlkZS0xXG4gICAgICBlbHNlXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gQG51bWJlck9mU2xpZGVzLTFcblxuICAgICAgQGdvVG9TbGlkZSBuZXh0U2xpZGVJbmRleFxuXG5cbiAgICAjIEdvIHRvIHNsaWRlIGluZGV4XG4gICAgZ29Ub1NsaWRlOiAoaW5kZXgpPT5cblxuICAgICAgaWYgQGN1cnJlbnRTbGlkZSAhPSBpbmRleFxuICAgICAgICBAaVNjcm9sbD8uZ29Ub1BhZ2UgaW5kZXgsIDAsIEBvcHRpb25zLnNwZWVkXG4gICAgICAgIEBjdXJyZW50U2xpZGUgPSBpbmRleFxuXG4gICAgICBAdXBkYXRlU2xpZGVzKClcbiAgICAgIEB1cGRhdGVOYXZpZ2F0aW9uKClcblxuXG4gICAgIyBTdGFydCBhdXRvc2Nyb2xsXG4gICAgc3RhcnRBdXRvU2Nyb2xsOiA9PlxuXG4gICAgICBAaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCBAbmV4dFNsaWRlLCBAb3B0aW9ucy5pbnRlcnZhbFxuXG5cbiAgICAjIFN0b3AgYXV0b3Njcm9sbFxuICAgIHN0b3BBdXRvU2Nyb2xsOiA9PlxuXG4gICAgICBjbGVhckludGVydmFsIEBpbnRlcnZhbFxuICAgICAgQGludGVydmFsID0gbnVsbFxuXG5cbiAgICAjIEFkZCBkZWJ1ZyBvdXRwdXQgdG8gc2xpZGVyXG4gICAgZGVidWc6ID0+XG5cbiAgICAgIGlmIEBvcHRpb25zLmRlYnVnXG4gICAgICAgIEAkc2xpZGVyLmZpbmQoJy5kZWJ1ZycpLnJlbW92ZSgpXG4gICAgICAgIEAkc2xpZGVyLmFwcGVuZCBAZGVidWdUZW1wbGF0ZVxuICAgICAgICAgICdzbGlkZXJfaW5kZXgnOiBAJHNsaWRlci5kYXRhICdpbmRleCdcbiAgICAgICAgICAnbnVtYmVyX29mX3NsaWRlcyc6IEBudW1iZXJPZlNsaWRlc1xuICAgICAgICAgICdjdXJyZW50X3NsaWRlJzogQGlTY3JvbGwuY3VycmVudFBhZ2UucGFnZVhcbiAgICAgICAgICAnYXV0b3Njcm9sbCc6IGlmIEBpbnRlcnZhbCB0aGVuICdlbmFibGVkJyBlbHNlICdkaXNhYmxlZCdcbiAgICAgICAgICAnbnVtYmVyX29mX25hdmlnYXRpb25zJzogQCRzbGlkZXJOYXZpZ2F0aW9uLmxlbmd0aFxuICAgICAgICAgICdzbGlkZXJfd2lkdGgnOiBAJHNsaWRlci53aWR0aCgpXG5cblxuICAgICMgUHJpbnQgb3B0aW9uIHRvIGNvbnNvbGVcbiAgICAjIENhbid0IGp1c3QgcmV0dXJuIHRoZSB2YWx1ZSB0byBkZWJ1ZyBpdCBiZWNhdXNlXG4gICAgIyBpdCB3b3VsZCBicmVhayBjaGFpbmluZyB3aXRoIHRoZSBqUXVlcnkgb2JqZWN0XG4gICAgIyBFdmVyeSBtZXRob2QgY2FsbCByZXR1cm5zIGEgalF1ZXJ5IG9iamVjdFxuICAgIGdldDogKG9wdGlvbikgLT5cbiAgICAgIGNvbnNvbGUubG9nICdvcHRpb246ICcrb3B0aW9uKycgaXMgJytAb3B0aW9uc1tvcHRpb25dXG4gICAgICBAb3B0aW9uc1tvcHRpb25dXG5cblxuICAgICMgU2V0IG9wdGlvbiB0byB0aGlzIGluc3RhbmNlcyBvcHRpb25zIGFycmF5XG4gICAgc2V0OiAob3B0aW9uLCB2YWx1ZSkgLT5cbiAgICAgIGNvbnNvbGUubG9nICdzZXR0aW5nICcrb3B0aW9uKycgdG8gJyt2YWx1ZVxuICAgICAgQG9wdGlvbnNbb3B0aW9uXSA9IHZhbHVlXG4gICAgICBAdXBkYXRlU2V0dGluZ3MoKVxuXG5cbiAgICAjIFVwZGF0ZSBzbGlkZXIgc2V0dGluZ3MgZnJvbSBvcHRpb25zXG4gICAgdXBkYXRlU2V0dGluZ3M6IC0+XG5cbiAgICAgIGlmIEBvcHRpb25zLmF1dG9zY3JvbGwgJiYgIUBpbnRlcnZhbFxuICAgICAgICBAc3RhcnRBdXRvU2Nyb2xsKClcblxuICAgICAgaWYgQG9wdGlvbnMubmF2aWdhdGlvbkVsZW1lbnRcbiAgICAgICAgQGFkZE5hdmlnYXRpb24oKVxuXG4gICAgICBAZGVidWcoKVxuXG5cblxuICAjIERlZmluZSB0aGUgcGx1Z2luXG4gICQuZm4uZXh0ZW5kIFNsaWRlcjogKG9wdGlvbiwgYXJncy4uLikgLT5cblxuICAgIEBlYWNoIChpbmRleCktPlxuICAgICAgJHRoaXMgPSAkKEApXG4gICAgICBkYXRhID0gJHRoaXMuZGF0YSgnU2xpZGVyJylcblxuICAgICAgaWYgIWRhdGFcbiAgICAgICAgJHRoaXMuZGF0YSAnU2xpZGVyJywgKGRhdGEgPSBuZXcgU2xpZGVyKEAsIG9wdGlvbiwgaW5kZXgpKVxuXG4gICAgICBpZiB0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnXG4gICAgICAgIHJldHVybiBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgYXJncylcblxuXG4pIHdpbmRvdy5qUXVlcnksIHdpbmRvd1xuXG4iXX0=