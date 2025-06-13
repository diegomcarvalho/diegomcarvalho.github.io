---
# Leave the homepage title empty to use the site title
title: ""
date: 2022-10-24
type: landing

design:
  # Default section spacing
  spacing: "6rem"

sections:
  - block: resume-biography
    content:
      # Choose a user profile to display (a folder name within `content/authors/`)
      username: admin
      text: ""
      # Show a call-to-action button under your biography? (optional)
      button:
        text: Download CV
        url: uploads/resume.pdf
    design:
      css_class: light #dark
      background:
        color: white #black
#        text_color_light: false
#        image:
#          # Add your image background to `assets/media/`.
#          filename: wave-haikei.svg
#          filters:
#            brightness: 1.0
#          size: cover
#          position: center
#          parallax: false
  - block: collection
    id: news
    content:
      title: Posts
      subtitle: 'Just opinions...'
      text: ''
      # Page type to display. E.g. post, talk, publication...
      page_type: post
      # Choose how many pages you would like to display (0 = all pages)
      count: 5
      # Filter on criteria
      filters:
        author: ""
        category: ""
        tag: ""
        exclude_featured: false
        exclude_future: false
        exclude_past: false
        publication_type: ""
      # Choose how many pages you would like to offset by
      offset: 0
      # Page order: descending (desc) or ascending (asc) date.
      order: desc
      columns: 2
    design:
      # Choose a layout view
      view: date-title-summary
      columns: 2
      # Reduce spacing
      spacing:
        padding: [0, 0, 0, 0]
  - block: collection
    id: papers
    content:
      title: Featured Publications
      filters:
        folders:
          - publication
        featured_only: false
    design:
      view: article-grid
      columns: 2
---
