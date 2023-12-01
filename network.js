document.addEventListener("DOMContentLoaded", function () {
    let data;
    let svg;


    // Function to update the simulation based on form values
    function submitForm() {
        svg.selectAll("*").remove();
        d3.select("#linkStrength").on("input", function () {
            const value = parseFloat(this.value);
            if (value >= 0 && value <= 1) {
                strengthValue = isNaN(value) ? 1 : value;
            } else {
                strengthValue = 1;
            }
        });

        d3.select("#collideForce").on("input", function () {
            const value = parseFloat(this.value);
            collideValue = isNaN(value) ? 25 : value;
        });

        d3.select("#chargeForce").on("input", function () {
            const value = parseFloat(this.value);
            chargeValue = isNaN(value) ? -3 : value;
        });

        selectedValue = d3.select('input[name="nodeSize"]:checked').node().value;

        // Replace 'upgrade()' with the appropriate function handling form changes
        // For example, you can call 'simulate()' again with updated parameters
        simulate(data, svg);
    }

    // Placeholder function for handling form changes
    function upgrade() {
        console.log("Upgrade function called");
    }

    function simulate(data, svg) {
        const width = parseInt(svg.attr("viewBox").split(' ')[2]);
        const height = parseInt(svg.attr("viewBox").split(' ')[3]);

        // Calculate degree of the nodes:
        let node_degree = {};
        d3.map(data.links, (d) => {
            if (d.source in node_degree) {
                node_degree[d.source]++;
            } else {
                node_degree[d.source] = 0;
            }
            if (d.target in node_degree) {
                node_degree[d.target]++;
            } else {
                node_degree[d.target] = 0;
            }
        });

        const scale_radius = d3.scaleLinear()
            .domain(d3.extent(Object.values(node_degree)))
            .range([5, 20]);

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const link_elements = svg.append("g")
            .attr('transform', `translate(${width / 2},${height / 2})`)
            .selectAll(".line")
            .data(data.links)
            .enter()
            .append("line")
            .style("stroke-width", 2); // Set a default stroke-width for links

        const node_elements = svg.append("g")
            .attr('transform', `translate(${width / 2},${height / 2})`)
            .selectAll(".circle")
            .data(data.nodes)
            .enter()
            .append('g')
            .attr("class", function (d) {
                return "gr_" + (d.country ? d.country.replace(/\s/g, "_") : "undefined");
            })
            .on("mouseenter", function (d, data) {
                node_elements.classed("inactive", true);
                d3.selectAll(".gr_" + data.country.replace(/\s/g, "_")).classed("inactive", false);
            })
            .on("mouseleave", (d, data) => {
                d3.selectAll(".inactive").classed("inactive", false);
            })
            .on("click", function (d) {
                showAuthorDetails(d.authors);
            });

        node_elements.append("circle")
            .attr("r", (d) => scale_radius(node_degree[d.id]))
            .attr("fill", d => color(d.country.replace(/\s/g, "_")));

        node_elements.append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .text(d => d.authors.split(';')[0]); // Display the first author's name as the label

        let ForceSimulation = d3.forceSimulation(data.nodes)
            .force("collide",
                d3.forceCollide().radius((d) => scale_radius(node_degree[d.id]) * 4))
            .force("x", d3.forceX())
            .force("y", d3.forceY())
            .force("charge", d3.forceManyBody())
            .force("link", d3.forceLink(data.links)
                .id(d => d.id)
                .distance(50) // Set an appropriate distance for links
                .strength(1) // Set a default strength for links
            )
            .on("tick", ticked);

        function ticked() {
            node_elements
                .attr('transform', (d) => `translate(${d.x},${d.y})`);
            link_elements
                .attr("x1", d => d.source.x)
                .attr("x2", d => d.target.x)
                .attr("y1", d => d.source.y)
                .attr("y2", d => d.target.y);
        }

        svg.call(d3.zoom()
            .extent([
                [0, 0],
                [width, height]
            ])
            .scaleExtent([1, 8])
            .on("zoom", zoomed));

        function zoomed({
            transform
        }) {
            node_elements.attr("transform", transform);
            link_elements.attr("transform", transform);
        }
    }

    // Function to display author details on mouse click
    function showAuthorDetails(author) {
        d3.select("#authorDetails").text(author);
    }

    // Add an event listener for the form button click
    document.getElementById("applyChangesBtn").addEventListener("click", submitForm);

    // Add event listeners for other form controls
    d3.select("#linkStrength").on("input", function () {
        const value = parseFloat(this.value);
        // ... (update your strengthValue variable or call relevant function)
        upgrade();
    });

    d3.select("#collideForce").on("input", function () {
        const value = parseFloat(this.value);
        // ... (update your collideValue variable or call relevant function)
        upgrade();
    });

    d3.select("#chargeForce").on("input", function () {
        const value = parseFloat(this.value);
        // ... (update your chargeValue variable or call relevant function)
        upgrade();
    });

    // Add event listeners for radio buttons
    const radioButtons = document.querySelectorAll('input[name="nodeSize"]');
    radioButtons.forEach(function (radio) {
        radio.addEventListener("change", function () {
            // Update node size based on the selected radio button
            selectedValue = this.value;
            upgrade();
        });
    });

    d3.json("../data/coauthors.json").then(function (jsonData) {
        d3.select("#visualization").html("");
        data = jsonData;
        svg = d3.select('#visualization').append("svg").attr("viewBox", "0 0 1000 800");
        simulate(data, svg);
    });
});
