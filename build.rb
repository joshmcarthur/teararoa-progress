require "csv"
require "json"
require "ostruct"
require "bigdecimal"
require "active_support/all"

HEADERS = ["Section Name", "Route Distance", "Distance", "Completed?", "Notes"]

# The whole route
route = JSON.parse(File.read("./data/route_and_waypoints.json"), object_class: OpenStruct).features

# Just the waypoints (start/end points)
waypoints = route.filter { |feat| feat.geometry.type == "Point" }

# Build sections by combining start and end points with a segment
sections = route.filter { |feat| feat.geometry.type == "LineString" }.map do |segment|
  OpenStruct.new(
    start: waypoints.find { |wp| wp.geometry.coordinates == segment.geometry.coordinates.first },
    finish: waypoints.find { |wp| wp.geometry.coordinates == segment.geometry.coordinates.last },
    segment: segment
  )
end

def title(section)
  return "#{section.start.properties.name} to #{section.finish.properties.name}" if section.start && section.finish
  return "? -> #{section.finish.properties.name}" if section.finish
  "#{section.start.properties.name} -> ?" if section.start
end

def range_extractor(section)
  extract_kms = /\A([\d\.]+) km to ([\d\.]+) km\Z/
  section.segment.properties.cmt.scan(extract_kms).first.map(&:to_d)
end


CSV.open("output.csv", "w") do |csv|
  csv << HEADERS
  sections.each do |section|
    range = range_extractor(section)
    csv << [title(section), range.first, section.segment.properties.desc, "FALSE", ""]
    start_offset = range.first.zero? ? 0 : range.first.ceil % range.first
    range.first.ceil.upto(range.last.floor).each_with_index do |milestone, index|
      csv << ["", milestone, start_offset + index, "FALSE", ""]
    end
  end
end