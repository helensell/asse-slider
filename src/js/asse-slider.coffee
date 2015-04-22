#
# Slider jQuery plugin
# Author: Thomas Klokosch <mail@thomasklokosch.com>
#
(($, window) ->

  # Define the plugin class
  class Slider

    iScroll: null
    numberOfSlides: null
    currentSlide: 0
    interval: null

    $slider: null
    $slideContainer: null
    $slides: null

    defaults:
      autoscroll: false
      speed: 500
      interval: 5000
      debug: true
      snap: true

      navigation: true
      navigationTemplate: _.template('<ul class="sliderNavigation">
        <% _.each(slides, function(element,index){ %>
          <li data-index="<%= index %>" class="slider_navigationItem fa fa-circle-o"></li>
        <% }); %>
      </ul>')

      # If specified, this elements children will receive index values for
      # the slides and matching click event bindings
      navigationElement: false

      prevNextButtons: true
      prevNextButtonsTemplate: _.template('
                              <span class="prev fa fa-angle-left"></span>
                              <span class="next fa fa-angle-right"></span>')

      slideContainerSelector: '.slideContainer'
      slideSelector: 'ul.slides > li'

      # Opacity of slides other than the current
      # Only applicable if the slider element has overflow: visible
      # and inactive slides are shown next to the current
      inactiveSlideOpacity: null

      # Margin left and right of the slides in pixels
      slideMargin: 0


    debugTemplate: _.template('
      <div class="debug">
        <span>Slider: <%= slider_index %></span>
        <span># of slides: <%= number_of_slides %></span>
        <span>Current slide: <%= current_slide %></span>
        <span>Autoscroll: <%= autoscroll %></span>
        <span># of navigations: <%= number_of_navigations %></span>
        <span>Slider width: <%= slider_width %></span>
      </div>')


    # Constructor
    constructor: (el, options, index = null) ->

      @options = $.extend({}, @defaults, options)

      @$slider = $(el)
      @$slider.data 'index', index
      @$slider.addClass 'slider_'+index
      @$sliderNavigation = []

      @$slideContainer = @$slider.find @options.slideContainerSelector
      @$slides = @$slideContainer.find @options.slideSelector
      @numberOfSlides = @$slides.length

      # Enable slides trough CSS
      @enableSlides()

      @iScroll = new IScroll el,
        scrollX: true
        scrollY: false
        snap: @options.snap
        snapSpeed: 400
        tap: true
        momentum: false
        eventPassthrough: false

      if @options.autoscroll
        @startAutoScroll()

      if @options.prevNextButtons
        @addPrevNextButtons()

      if @options.navigation
        @addNavigation()

      @resize()
      @goToSlide @currentSlide
      @bindEvents()
      @debug()


    # Enable slides via CSS
    enableSlides: ->

      @$slides.css
        display: 'block'


    # Add prev next buttons
    addPrevNextButtons: ->

      @$slider.append @options.prevNextButtonsTemplate()


    # Add navigation
    addNavigation: ->

      self = @

      sliderNavigationLength = @$sliderNavigation.length

      if @options.navigationElement

        @$sliderNavigation.push @options.navigationElement
        navigationItems = @$sliderNavigation[sliderNavigationLength].children()

        @$slides.each (index,element)->
          item = navigationItems.eq(index)
          if item
            item.data 'slider_index', self.$slider.data 'index'
            item.data 'item_index', index
            item.addClass 'slider_navigationItem'
            item.click (event)->
              self.stopAutoScroll()
              self.goToSlide $(@).data('item_index')

      else

        # Create a jQuery object directly from slider code
        newElement = @options.navigationTemplate({'slides': @$slides})
        @$sliderNavigation.push $(newElement)

        # Append it to slider element
        @$slider.append @$sliderNavigation[sliderNavigationLength]

        # Resize navigation
        @$sliderNavigation[sliderNavigationLength].css
          'margin-left': -@$sliderNavigation[sliderNavigationLength].width() / 2

      @updateNavigation()


    # Update navigation status
    updateNavigation: ->

      index = @currentSlide

      _.each @$sliderNavigation, (element)->
        $(element).find('.slider_navigationItem')
          .removeClass('active')
          .eq(index).addClass 'active'


    updateSlides: ->

      # Fade inactive slides to a specific opacity value
      if @options.inactiveSlideOpacity

        @$slides.stop().animate
          opacity: '0.5'

        @$slides.eq(@currentSlide).stop().animate
          opacity: '1'


    # Event callback on scroll end
    onScrollEnd: =>

      @currentSlide = @iScroll.currentPage.pageX
      @updateSlides()
      @updateNavigation()
      @debug()


    # User touches the screen but scrolling didn't start yet
    onBeforeScrollStart: =>

      @stopAutoScroll()


    # Resize slider
    resize: =>

      @stopAutoScroll()

      @$slides.width @$slider.outerWidth()
      @$slideContainer.width (@$slides.outerWidth() + (@options.slideMargin*2)) * @numberOfSlides
      @$slideContainer.height @$slider.height()

      if @iScroll then @iScroll.refresh()

      @startAutoScroll()


    # Bind events
    bindEvents: ->

      self = @

      @iScroll.on 'scrollEnd', @onScrollEnd

      @iScroll.on 'beforeScrollStart', @onBeforeScrollStart

      @$slides.on 'click', 'img', ->
        self.stopAutoScroll()

      @$slider.on 'click', 'span.next', ->
        self.stopAutoScroll()
        self.nextSlide()

      @$slider.on 'click', 'span.prev', ->
        self.stopAutoScroll()
        self.prevSlide()

      @$slider.on 'click', 'ul.sliderNavigation li', ->
        self.stopAutoScroll()
        self.goToSlide $(@).data('index')

      $(window).bind 'resize', ->
        self.resize()
        ###
        if @resizeTo
          clearTimeout @resizeTimeout
        @resizeTimeout = setTimeout ->
        , 200
        ###


    # Go to next slide
    nextSlide: =>

      self = @

      if @numberOfSlides > @currentSlide + 1
        nextSlideIndex = @currentSlide+1
      else
        nextSlideIndex = 0

      @goToSlide nextSlideIndex


    # Go to previous slide
    prevSlide: =>

      self = @

      if @currentSlide-1 >= 0
        nextSlideIndex = @currentSlide-1
      else
        nextSlideIndex = @numberOfSlides-1

      @goToSlide nextSlideIndex


    # Go to slide index
    goToSlide: (index)=>

      if @currentSlide != index
        @iScroll?.goToPage index, 0, @options.speed
        @currentSlide = index

      @updateSlides()
      @updateNavigation()


    # Start autoscroll
    startAutoScroll: =>

      @interval = setInterval @nextSlide, @options.interval


    # Stop autoscroll
    stopAutoScroll: =>

      clearInterval @interval
      @interval = null


    # Add debug output to slider
    debug: =>

      if @options.debug
        @$slider.find('.debug').remove()
        @$slider.append @debugTemplate
          'slider_index': @$slider.data 'index'
          'number_of_slides': @numberOfSlides
          'current_slide': @iScroll.currentPage.pageX
          'autoscroll': if @interval then 'enabled' else 'disabled'
          'number_of_navigations': @$sliderNavigation.length
          'slider_width': @$slider.width()


    # Print option to console
    # Can't just return the value to debug it because
    # it would break chaining with the jQuery object
    # Every method call returns a jQuery object
    get: (option) ->
      console.log 'option: '+option+' is '+@options[option]
      @options[option]


    # Set option to this instances options array
    set: (option, value) ->
      console.log 'setting '+option+' to '+value
      @options[option] = value
      @updateSettings()


    # Update slider settings from options
    updateSettings: ->

      if @options.autoscroll && !@interval
        @startAutoScroll()

      if @options.navigationElement
        @addNavigation()

      @debug()



  # Define the plugin
  $.fn.extend Slider: (option, args...) ->

    @each (index)->
      $this = $(@)
      data = $this.data('Slider')

      if !data
        $this.data 'Slider', (data = new Slider(@, option, index))

      if typeof option == 'string'
        return data[option].apply(data, args)


) window.jQuery, window

