async function createChart() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Load data from the JSON file
    const data = await d3.json("miserables.json");

    const links = data.links.map(d => ({ ...d }));
    const nodes = data.nodes.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links)
            .id(d => d.id)
            .distance(100)) // Increase the default link distance
        .force("charge", d3.forceManyBody().strength(-1000)) // Increase repulsion
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide(50)) // Keeps nodes apart
        .on("tick", ticked);

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;");

    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll()
        .data(links)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll()
        .data(nodes)
        .join("g")  // Create a group for each node
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("defs")
        .append("clipPath")
        .attr("id", d => "clip-" + d.id)
        .append("circle")
        .attr("cx", 0)  // Center the circle at (0,0) in the group
        .attr("cy", 0)
        .attr("r", 30);  // Circle radius (set the radius of the circle here)

    node.append("image")
        .attr("x", -30)  // Offset to position the image inside the circle
        .attr("y", -30)  // Offset to position the image inside the circle
        .attr("width", 60)  // Set the image to be the size of the circle
        .attr("height", 60)  // Set the image to be the size of the circle
        .attr("xlink:href", d => d.image)  // Set the image from the JSON
        .attr("clip-path", d => `url(#clip-${d.id})`);  // Apply the clipPath

    node.append("circle")
        .attr("r", 30)  // Radius of the circle
        .attr("fill", "transparent")  // Make the circle transparent (this is the clip boundary)
        .attr("stroke", "#fff")  // Optional stroke to make the circle visible
        .attr("stroke-width", 2);

    node.append("title")
        .text(d => d.id);

    // Create an info box (hidden initially)
    const infoBox = d3.select("body").append("div")
        .attr("class", "info-box")
        .style("position", "absolute")
        .style("display", "none")
        .style("background", "rgba(255, 255, 255, 0.8)")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0 4px 8px rgba(0,0,0,0.2)");

    // Show information when a node is clicked
    node.on("click", function(event, d) {
        const [x, y] = [d.x, d.y]; // Get the position of the node
        const offset = 20; // Optional offset to prevent overlap with the node
        infoBox
            .style("display", "block")
            .style("left", `${x + offset}px`)
            .style("top", `${y + offset}px`)
            .html(`
                <strong>ID:</strong> ${d.id}<br>
                <strong>Info:</strong> ${d.info || "No additional info available."}
            `);
    });

    // Hide the information box when clicking outside
    svg.on("click", function(event) {
        const clickedOutside = !event.target.closest("g"); // Check if click is outside a node
        if (clickedOutside) {
            infoBox.style("display", "none");
        }
    });

    function ticked() {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", d => `translate(${d.x}, ${d.y})`);
    }

    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    return svg.node();
}

// Call the function to create the chart
createChart().then(chart => {
    document.body.appendChild(chart);
});
