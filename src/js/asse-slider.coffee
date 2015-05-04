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
    $sliderNavigation: null

    defaults:
      autoscroll: true
      speed: 500
      interval: 5000
      debug: true
      snap: true

      # Navigation element array
      # either 'index' for on-slider navigation, a jQuery selector for a thumbnail
      # navigation or another slider element for a slider acting as a synced remote
      # navigation to this slider instance
      navigation: ['index']

      # Index navigation default template
      indexNavigationTemplate: _.template('<ul class="sliderNavigation">
        <% _.each(slides, function(element,index){ %>
          <li data-index="<%= index %>" class="slider_navigationItem fa fa-circle-o"></li>
        <% }); %>
      </ul>')

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

      # Width of the slide, defaults to auto, takes a 100% slider width
      slideWidth: 'auto'

      # Slide click callback function
      onSlideClick: (event)-> console.log 'slide clicked'


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
        onBeforeScrollStart: (e)->
          point = e.touches[0]
          pointStartX = point.pageX
          pointStartY = point.pageY
          null
        onBeforeScrollMove: (e)->
          deltaX = Math.abs(point.pageX - pointStartX)
          deltaY = Math.abs(point.pageY - pointStartY)
          if deltaX >= deltaY
            e.preventDefault()
          else
            null

      if @options.autoscroll
        @startAutoScroll()

      if @options.prevNextButtons
        @addPrevNextButtons()

      if _.size(@options.navigation)
        @renderNavigation()

      @resize()
      @goToSlide @currentSlide
      @bindEvents()
      @debug()
      @


    # Enable slides via CSS
    enableSlides: ->

      @$slides.css
        display: 'block'


    # Add prev next buttons
    addPrevNextButtons: ->

      @$slider.append @options.prevNextButtonsTemplate()


    # Add navigation
    renderNavigation: ->

      self = @

      _.each @options.navigation, (element, index, list)=>

        if element == 'index'

          # Create a jQuery object directly from slider code
          newElement = @options.indexNavigationTemplate({'slides': @$slides})
          @$sliderNavigation.push $(newElement)

          # Append it to slider element
          @$slider.append _.last(@$sliderNavigation)

          # Resize navigation
          _.last(@$sliderNavigation).css
            'margin-left': -(_.last(@$sliderNavigation).width() / 2)

        else if element.data('Slider')

          @$sliderNavigation.push element

          _.last(@$sliderNavigation).Slider 'onSlideClick', (event)->
            self.stopAutoScroll()
            self.goToSlide $(event.currentTarget).index()

        else if element instanceof jQuery

          @$sliderNavigation.push element
          navigationItems = _.last(@$sliderNavigation).children()

          @$slides.each (index,slide)=>
            item = navigationItems.eq(index)
            if item
              item.data 'slider_index', @$slider.data 'index'
              item.data 'item_index', index
              item.addClass 'slider_navigationItem'
              item.on 'click', (event)->
                self.stopAutoScroll()
                self.goToSlide $(@).data('item_index')


      @updateNavigation()


    # Update navigation status
    updateNavigation: ->

      index = @currentSlide

      _.each @$sliderNavigation, (element)->

        if element.data('Slider')

          # Update remote slider
          element.Slider('goToSlide', index)

        else if element instanceof jQuery

          $(element).find('.slider_navigationItem')
            .removeClass('active')
            .eq(index).addClass 'active'


    # Add a callback function on slide click
    onSlideClick: (callback)->

      if typeof callback == 'function'
        @options.onSlideClick = callback


    # Update slide properties to current slider state
    updateSlides: ->

      # Fade inactive slides to a specific opacity value
      if @options.inactiveSlideOpacity
        @setSlideOpacity 1, @options.inactiveSlideOpacity

      @$slides.removeClass 'active'
      @$slides.eq(@currentSlide).addClass 'active'


    # Set slide opacity for active and inactive slides
    setSlideOpacity: (active, inactive)->

      @$slides.stop().animate
        opacity: inactive

      @$slides.eq(@currentSlide).stop().animate
        opacity: active


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

      if @options.slideWidth == 'auto'
        @$slides.width @$slider.outerWidth()
      else
        @$slides.width parseInt(@options.slideWidth) + 'px'

      @$slideContainer.width (@$slides.outerWidth(true) + (@options.slideMargin*2)) * @numberOfSlides
      @$slideContainer.height @$slider.height()

      if @iScroll
        @iScroll.refresh()

      if @options.autoscroll
        @startAutoScroll()


    # Bind events
    bindEvents: ->

      self = @

      @iScroll.on 'scrollEnd', @onScrollEnd

      @iScroll.on 'beforeScrollStart', @onBeforeScrollStart

      @$slides.on 'tap', (event)->
        self.stopAutoScroll()
        if typeof self.options.onSlideClick == 'function'
          self.options.onSlideClick.apply(@, [event])

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

      if @currentSlide != index && index < @numberOfSlides
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
          'current_slide': @iScroll.currentPage?.pageX
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

      # Set options value
      @options[option] = value

      # If no interval is currently present, start autoscroll
      if option == 'autoscroll' && !@interval
        @startAutoScroll()

      # TODO: Update slide margin
      #if option == 'slideMargin'
        # cache slideMargin CSS on element?
        # what if the user wants to switch back

      if option == 'inactiveSlideOpacity' && @options.inactiveSlideOpacity
        @setSlideOpacity 1, @options.inactiveSlideOpacity

      if option == 'navigation'
        @renderNavigation()

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

