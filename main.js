// Global Parameters - Define the state of the narrative visualization
let currentSceneIndex = 0; // The current scene being displayed (0-indexed)
let rawData = [];          // Stores the loaded data from CSV
let dataLoaded = false;    // Flag to ensure rendering only happens after data is loaded

// SVG and container dimensions - Consistent visual structure
const containerWidth = 960;
const containerHeight = 600;
const margin = { top: 120, right: 120, bottom: 80, left: 100 }; // Adjusted right margin for labels/legend
const width = containerWidth - margin.left - margin.right;
const height = containerHeight - margin.top - margin.bottom;

// D3 Selections for main elements
const svg = d3.select("#main-svg")
    .attr("width", containerWidth)
    .attr("height", containerHeight);

const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Navigation element selections
const prevBtn = d3.select("#prev-btn");
const nextBtn = d3.select("#next-btn");
const sceneIndicator = d3.select("#scene-indicator");
const vizTitle = d3.select("#viz-title");
const tooltip = d3.select("#tooltip"); // Tooltip element

// --- Scene Rendering Functions ---
// These functions are key to controlling the display based on `currentSceneIndex`

/**
 * Renders Scene 1: The Global Urban Shift
 * Shows the changing proportion of urban vs. rural population over time.
 */
function renderScene1() {
    g.html(""); // Clear previous scene content for visual consistency
    vizTitle.text("Scene 1: The Global Urban Shift (1950-2020)");

    // Scales - Parameters controlling visual mapping
    const xScale = d3.scaleLinear()
        .domain(d3.extent(rawData, d => d.year))
        .range([0, width]);
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(rawData, d => Math.max(d.urban_population_billion, d.rural_population_billion)) * 1.05]) // Max of both + 5% padding
        .range([height, 0]);

    // Draw axes - Visual structure
    g.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).tickSizeOuter(0)); // Remove outer ticks
    g.append("g")
        .attr("class", "y-axis axis")
        .call(d3.axisLeft(yScale).tickFormat(d3.format(".1f")).tickSizeOuter(0));

    // Axis labels - Visual structure
    g.append("text")
        .attr("class", "x-axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .text("Year");
    g.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .attr("text-anchor", "middle")
        .text("Population (Billions)");

    // Line generators
    const lineUrban = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.urban_population_billion));
    const lineRural = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.rural_population_billion));

    // Draw lines
    g.append("path")
        .datum(rawData)
        .attr("class", "urban-line")
        .attr("d", lineUrban);

    g.append("path")
        .datum(rawData)
        .attr("class", "rural-line")
        .attr("d", lineRural);

    // Legend - Visual structure
    g.append("circle").attr("cx", width - 10).attr("cy", -45).attr("r", 6).attr("fill", "steelblue");
    g.append("text").attr("x", width).attr("y", -40).text("Urban Population").style("font-size", "12px").attr("alignment-baseline", "middle").attr("fill", "#555");
    g.append("circle").attr("cx", width - 10).attr("cy", -25).attr("r", 6).attr("fill", "orchid");
    g.append("text").attr("x", width).attr("y", -20).text("Rural Population").style("font-size", "12px").attr("alignment-baseline", "middle").attr("fill", "#555");

    // Annotations for Scene 1 - Highlight and reinforce specific data points
    // Finds the data point closest to the crossover year (2007)
    const crossoverYear = 2007;
    const crossoverData = rawData.find(d => d.year === crossoverYear);
    const annotationX = xScale(crossoverYear);
    const annotationY = yScale(crossoverData ? crossoverData.urban_population_billion : 3.3); // Fallback for safety

    const annotations = [
        {
            note: {
                label: `Around ${crossoverYear}, for the first time in history, more than half of the world's population lived in urban areas. This marks a critical global shift.`,
                bgPadding: 10,
                title: "Historic Crossover",
                align: "middle"
            },
            x: annotationX,
            y: annotationY,
            dy: -1, // Annotation placement - Parameter
            dx: -150,
            subject: { radius: 15, radiusPadding: 5 }, // Subject properties - Parameter
            type: d3.annotationCalloutCircle
        }
    ];

    const makeAnnotations = d3.annotation().annotations(annotations);
    g.append("g").attr("class", "annotation-group").call(makeAnnotations);

    updateNavigation();
}

/**
 * Renders Scene 2: Urban Footprint - Energy Consumption
 * Shows global energy consumption trends, with interactive elements.
 */
function renderScene2() {
    g.html(""); // Clear previous scene content
    vizTitle.text("Scene 2: Urban Footprint - Global Energy Consumption");

    // Scales
    const xScale = d3.scaleBand()
        .domain(rawData.map(d => d.year))
        .range([0, width])
        .padding(0.2); // More padding for bars
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(rawData, d => d.global_energy_consumption_quads) * 1.1])
        .range([height, 0]);

    // Draw axes
    g.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((d, i) => !(i % 10))).tickSizeOuter(0));
    g.append("g")
        .attr("class", "y-axis axis")
        .call(d3.axisLeft(yScale).tickSizeOuter(0));

    // Axis labels
    g.append("text")
        .attr("class", "x-axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .text("Year");
    g.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .attr("text-anchor", "middle")
        .text("Energy Consumption (Quads)");

    // Bars with interactivity
    g.selectAll(".bar")
        .data(rawData)
        .enter().append("rect")
        .attr("class", "energy-bar")
        .attr("x", d => xScale(d.year))
        .attr("y", d => yScale(d.global_energy_consumption_quads))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.global_energy_consumption_quads))
        .on("mouseover", function(event, d) { // Trigger for tooltip interaction
            d3.select(this).transition().duration(100).attr("fill", "#c23a3a"); // Darker red on hover
            tooltip.style("opacity", 1)
                .html(`Year: ${d.year}<br>Energy: ${d.global_energy_consumption_quads.toFixed(1)} Quads`)
                .style("left", (event.pageX + 15) + "px") // Position tooltip relative to mouse
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() { // Trigger to hide tooltip
            d3.select(this).transition().duration(100).attr("fill", "#f08080"); // Back to original color
            tooltip.style("opacity", 0);
        });

    // Annotations for Scene 2
    const annotations = [
        {
            note: {
              title: "Post-War Energy Boom",
              label: "Energy consumption surged dramatically, largely driven by industrialization and the energy demands of growing urban centers.",
              wrap: 200
            },
            x: xScale(2010), // instead of far right bar
            y: yScale(600),
            dx: -60, // pull text left
            dy: -20,
            subject: { radius: 6 }
          }
    ];

    const makeAnnotations = d3.annotation().annotations(annotations);
    g.append("g").attr("class", "annotation-group").call(makeAnnotations);

    updateNavigation();
}

/**
 * Renders Scene 3: The CO2 Consequence
 * Shows the direct correlation between energy consumption and CO2 emissions.
 */
function renderScene3() {
    g.html(""); // Clear previous scene content
    vizTitle.text("Scene 3: The CO2 Consequence");

    // Scales for scatterplot
    const xScale = d3.scaleLinear()
        .domain(d3.extent(rawData, d => d.global_energy_consumption_quads))
        .range([0, width]);
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(rawData, d => d.global_co2_emission_gt) * 1.1])
        .range([height, 0]);

    // Draw axes
    g.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickSizeOuter(0));
    g.append("g")
        .attr("class", "y-axis axis")
        .call(d3.axisLeft(yScale).tickSizeOuter(0));

    // Axis labels
    g.append("text")
        .attr("class", "x-axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .text("Global Energy Consumption (Quads)");
    g.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .attr("text-anchor", "middle")
        .text("Global CO2 Emission (Gigatons)");

    // Scatterplot points with interactivity (circles representing years)
    g.selectAll("circle")
        .data(rawData)
        .enter().append("circle")
        .attr("class", "co2-point")
        .attr("cx", d => xScale(d.global_energy_consumption_quads))
        .attr("cy", d => yScale(d.global_co2_emission_gt))
        .attr("r", 6) // Slightly larger radius
        .attr("opacity", 0.8)
        .on("mouseover", function(event, d) { // Trigger for tooltip interaction
            d3.select(this).transition().duration(100).attr("r", 9).attr("fill", "#2e8b57"); // Darker green on hover
            tooltip.style("opacity", 1)
                .html(`Year: ${d.year}<br>Energy: ${d.global_energy_consumption_quads.toFixed(1)} Quads<br>CO2: ${d.global_co2_emission_gt.toFixed(1)} Gt`)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() { // Trigger to hide tooltip
            d3.select(this).transition().duration(100).attr("r", 6).attr("fill", "#66cdaa"); // Back to original color
            tooltip.style("opacity", 0);
        });

    // Annotations for Scene 3
    const annotations = [
        {
          note: {
            title: "Direct Correlation",
            label: "As energy consumption (driven by urban growth) increases, so do CO2 emissions.",
            wrap: 250
          },
          x: xScale(530),      // pulled left
          y: yScale(33),       // pulled lower
          dx: -100,            // further left
          dy: -30,              // place text below line
          subject: { radius: 6 }
        }
      ];

    const makeAnnotations = d3.annotation().annotations(annotations);
    g.append("g").attr("class", "annotation-group").call(makeAnnotations);

    updateNavigation();
}

/**
 * Renders Scene 4: Towards Sustainable Cities
 * Concluding remarks on the importance of sustainable urban development.
 */


function renderScene4() {
    g.selectAll("*").remove();
    vizTitle.text("Scene 4: Explore the Data");

    d3.select("#metric-select").remove();

    d3.select("#controls")
        .append("select")
        .attr("id", "metric-select")
        .style("margin-left", "10px");

    const options = ["Urban Population", "Rural Population", "Energy Consumption", "CO2 Emissions"];
    const accessors = {
        "Urban Population": d => parseFloat(d.urban_population_billion),
        "Rural Population": d => parseFloat(d.rural_population_billion),
        "Energy Consumption": d => parseFloat(d.global_energy_consumption_quads), // Changed!
        "CO2 Emissions": d => parseFloat(d.global_co2_emission_gt) // Changed!
    };

    d3.select("#metric-select")
        .selectAll("option")
        .data(options)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    const xScale = d3.scaleLinear()
        .domain(d3.extent(rawData, d => +d.year))
        .range([0, width]);

    const yScale = d3.scaleLinear().range([height, 0]);
    const xAxis = d3.axisBottom(xScale);
    const yAxisGroup = g.append("g").attr("class", "y-axis");

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    const circle = g.append("circle")
        .attr("r", 5)
        .attr("fill", "orange")
        .style("opacity", 0);

    function updateLine(metric) {
        const accessor = accessors[metric];
        const data = rawData
            .map(d => ({ year: +d.year, value: accessor(d) }))
            .filter(d => !isNaN(d.year) && !isNaN(d.value));

        if (data.length === 0) {
            console.warn("No valid data points for:", metric);
            return;
        }

        const yDomain = d3.extent(data, d => d.value);
        yScale.domain(yDomain).nice();
        yAxisGroup.transition().call(d3.axisLeft(yScale));

        g.selectAll(".data-line").remove();

        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.value));

        g.append("path")
            .datum(data)
            .attr("class", "data-line")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);

        g.selectAll(".hover-point").remove();
        g.selectAll(".hover-point")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "hover-point")
            .attr("cx", d => xScale(d.year))
            .attr("cy", d => yScale(d.value))
            .attr("r", 8)
            .attr("fill", "transparent")
            .on("mouseover", (event, d) => {
                circle
                    .attr("cx", xScale(d.year))
                    .attr("cy", yScale(d.value))
                    .style("opacity", 1);
                tooltip.style("opacity", 1).html(`Year: ${d.year}<br>${metric}: ${d.value.toLocaleString(undefined, {maximumFractionDigits: 2})}`).style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                circle.style("opacity", 0);
                tooltip.style("opacity", 0);
            });
    }

    updateLine("Urban Population");

    d3.select("#metric-select").on("change", function () {
        updateLine(this.value);
    });

    updateNavigation();
}

// Array of scene rendering functions - Parameter for scene management
const scenes = [renderScene1, renderScene2, renderScene3, renderScene4];

// --- Navigation Logic (Triggers) ---

/**
 * Updates the state of navigation buttons and scene indicator.
 * This is called after every scene render.
 */
function updateNavigation() {
    prevBtn.attr("disabled", currentSceneIndex === 0 ? true : null); // Disable 'Previous' on first scene
    nextBtn.attr("disabled", currentSceneIndex === scenes.length - 1 ? true : null); // Disable 'Next' on last scene
    sceneIndicator.text(`${currentSceneIndex + 1} of ${scenes.length}`);
}

/**
 * Transitions to a specific scene index.
 * @param {number} index The 0-indexed number of the scene to go to.
 */
function goToScene(index) {
    // Ensure index is within valid bounds
    if (index >= 0 && index < scenes.length) {
        currentSceneIndex = index; // Update the state parameter
        scenes[currentSceneIndex](); // Trigger the rendering of the new scene
    }
}

// Event Listeners (Triggers)
prevBtn.on("click", () => goToScene(currentSceneIndex - 1));
nextBtn.on("click", () => goToScene(currentSceneIndex + 1));

// Initial Data Load and Visualization Render
d3.csv("data/urban_impact_data.csv").then(data => {
    // Parse numerical data from CSV (Critical step for data integrity)
    rawData = data.map(d => ({
        year: +d.year,
        urban_population_billion: +d.urban_population_billion,
        rural_population_billion: +d.rural_population_billion,
        global_energy_consumption_quads: +d.global_energy_consumption_quads,
        global_co2_emission_gt: +d.global_co2_emission_gt
    }));
    dataLoaded = true; // Set dataLoaded parameter to true
    goToScene(currentSceneIndex); // Render the initial scene now that data is available
}).catch(error => {
    console.error("Error loading data:", error);
    vizTitle.text("Error: Could not load data. Please check console.");
    // Disable navigation buttons if data fails to load
    prevBtn.attr("disabled", true);
    nextBtn.attr("disabled", true);
});