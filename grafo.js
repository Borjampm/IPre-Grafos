function runCode(i) {
    d3.json(`Datos/specific_new/${i}.json`)
        .then((data) => {
            const unfiltered_data = data;
            data = dataInterval(unfiltered_data);
        })
        .catch((error) => console.log(error));
}

// Crear selector
const PRIMERANOTICIA = 1; // Parametro para elegir la primera noticia que se muestra
const SELECTOR = d3.select("#selector").append("select").attr("id", "selectorObject");

SELECTOR.selectAll("option")
    .data(d3.range(1001))
    .join("option")
    .attr("value", d => d)
    .text(d => d);

SELECTOR.on('change', () => {
    let index = document.getElementById("selectorObject").selectedOptions[0].value;
    runCode(index);
});

document.getElementById("selectorObject").selectedIndex = PRIMERANOTICIA;

// -------------------------------- Limpiar Datos ----------------------

function data_processed(d) {
    let data = {
        title: d.title,
        creator: d.agency,
        subhead: d.subhead,
        date: d.date,
        time: d.time,
        body: d.text,
        url: d.url,
        comments: d.comments,
        level: -1
    }
    return data
}

function create_tree_comments(comments) {
    let new_comments = [];
    for (let comment of comments) {
        if (comment.level == 0) {
            new_comments.push(comment_processed(comment));
        } else {
            for (father of new_comments) {
                if (father.id == comment.parentId) {
                    father.comments.push(comment_processed(comment));
                    break;
                }
            }
        }
    }
    return new_comments
}

function comment_processed(c) {
    let comment = {
        id: c.id,
        creator: c.creator,
        level: c.level,
        likes: c.likes,
        dislikes: c.dislikes,
        time: c.time,
        text: c.text,
        comments: []
    }
    return comment
}

function max_level(comments) {
    let max = 0;
    for (let comment of comments) {
        if (max < comment.level) {
            max = comment.level;
        }
    }
    return max
}

// Parametros
const SVG = d3.select("#vis-1").append("svg");
SVG.append("g")

let Tooltip = d3.select("#vis-1")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")

const ZOOM = d3.zoom()
    .on("zoom", handleZoom);
function handleZoom(e) {
    d3.select("svg g")
        .attr("transform", e.transform);
}
const resetZOOM = d3.zoom()
    .on("zoom", resetZoom);
function resetZoom(e) {
    d3.select("svg g")
        .attr("transform", "translate(0,0) scale(1)");
}

runCode(PRIMERANOTICIA);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------- Filtrar datos en intervalos -----------------------------------
async function dataInterval(unfiltered_data) {
    const SEGUNDOS = 5;
    const targetLength = SEGUNDOS * 1000;   // Tiempo que se quiere que dure la animacion
    const maxtimePerAnimation = 800;       // Tiempo máximo a utilizar
    const mintimePerAnimation = 10;       // Tiempo mínimo a utilizar

    let data = data_processed(unfiltered_data);
    let time_sleep = 0;
    if (data.comments.length == 0) {
        document.getElementById('status').innerText = 'No hay comentarios en esta noticia';
        data.comments = create_tree_comments(data.comments);
        createGrafo(unfiltered_data, data, time_sleep);
    } else {
        let timePublish = transform_min_date(data.date, data.time);
        let last_comment_time = get_last_comment_time(data.comments);
        document.getElementById('status').innerText = 'Generando grafo... (No cambiar de noticia)';

        let comments = data.comments;
        comments.sort((a, b) => a.time - b.time);

        let min = Date.parse(timePublish + ":00.000+00:00");
        let max = Date.parse(last_comment_time);
        let timePerNode = targetLength / (max - min);

        // Tiempo fijo y acotado a un rango de máxima.
        timePerNode = Math.min(targetLength / (comments.length), maxtimePerAnimation);
        timePerNode = Math.max(timePerNode, mintimePerAnimation);

        let aux = [];
        data.comments = aux;
        data.comments = create_tree_comments(data.comments);
        createGrafo(unfiltered_data, data, time_sleep);
        createHistogram(unfiltered_data)
        for (let comment of comments) {
            if (aux.length == 0) {
                // time_sleep = timePerNode * (comment.time - min);
                time_sleep = timePerNode;
                aux.push(comment);
                data.comments = aux;
                data.comments = create_tree_comments(data.comments);
                await sleep(time_sleep);
                createGrafo(unfiltered_data, data, time_sleep);
            } else {
                // time_sleep = timePerNode * (comment.time - aux[aux.length - 1].time);
                time_sleep = timePerNode;
                aux.push(comment);
                data.comments = aux;
                data.comments = create_tree_comments(data.comments);
                await sleep(time_sleep);
                createGrafo(unfiltered_data, data, time_sleep);
            }
        }
        document.getElementById('status').innerText = 'Grafo generado';
        d3.select("svg")
            .call(ZOOM);
    }
}

// ---------------------------------------------- Crear Histograma -----------------------------------
function createHistogram(unfiltered_data) {

    let data = data_processed(unfiltered_data);
    let timePublish = transform_min_date(data.date, data.time);
    let last_comment_time = get_last_comment_time(data.comments);
    let minDate = Date.parse(timePublish + ":00.000+00:00");
    let maxDate = Date.parse(last_comment_time);
    // set the dimensions and margins of the graph
    const margin = { top: 10, right: 50, bottom: 30, left: 50 },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    const SVG2 = d3.select("#vis-2")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    histograma(data.comments, minDate, maxDate)

    function histograma(data, minDate, maxDate) {

        const x = d3.scaleLinear()
            .domain([minDate, maxDate])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
            .range([0, width]);

        SVG2.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).tickValues([minDate, maxDate]).tickFormat(d3.timeFormat("%d-%m-%Y %H:%M:%S")));

        // set the parameters for the histogram
        const histogram = d3.histogram()
            .value(function (d) { console.log(d); return d.time; })   // I need to give the vector of value
            .domain(x.domain())  // then the domain of the graphic
            .thresholds(x.ticks(20)); // then the numbers of bins

        // And apply this function to data to get the bins
        const bins = histogram(data);

        // Y axis: scale and draw:
        const y = d3.scaleLinear()
            .range([height, 0]);
        y.domain([0, d3.max(bins, function (d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
        SVG2.append("g")
            .call(d3.axisLeft(y));

        // append the bar rectangles to the svg element
        SVG2.selectAll("rect")
            .data(bins)
            .join("rect")
            .attr("x", 1)
            .attr("transform", function (d) { return `translate(${x(d.x0)} , ${y(d.length)})` })
            .attr("width", function (d) { return x(d.x1) - x(d.x0) })
            .attr("height", function (d) { return height - y(d.length); })
            .style("fill", "#69b3a2")

    };

}

// ---------------------------------------------- Crear Grafo -----------------------------------
function createGrafo(unfiltered_data, data, time_sleep) {
    // Constantes
    const tree_height = unfiltered_data.comments.length;
    const full_depth = max_level(unfiltered_data.comments);
    const circleRadius = 15;

    // Tiempo que toma actualizar el grafo
    const updateDurationTime = time_sleep / 3
    // Tiempo que toma agregar nuevos elementos
    const enterDurationTime = time_sleep - updateDurationTime;

    const HEIGTH = 500;
    const WIDTH = 2000;

    const margin = { top: 20, right: 30, bottom: 30, left: 90 };
    // Ajustar el ancho para que mínimo sea de 300 pixeles
    const width = Math.max(circleRadius * tree_height * 2.1, WIDTH);
    const height = Math.max(full_depth * 500, HEIGTH);
    // const height = 1000;

    const colorScale = d3.scaleDiverging(d => d3.interpolateRdYlBu(d))
        .domain([0, 0.5, 1]);
    // ------------------------------------------- Crear Grafo -------------------------------------------
    let nodes = d3.hierarchy(data, d => d.comments);

    const treemap = d3.tree().size([width, height]);
    nodes = treemap(nodes);
    SVG
        .attr("width", "100%")
        .attr("height", "500")
        .attr("viewBox", `-50 -50 ${width + 200} ${height + 100}`)
        .attr("border", "1px solid black")

    const g = SVG.select("g")
        .attr("transform", `translate(${margin.top}, ${margin.left})`);

    let linkGenFinal = d3.linkVertical()
        .source(d => [d.parent.x, d.parent.y + circleRadius])
        .target(d => [d.x, d.y - circleRadius]);

    let linkGenInitial = d3.linkVertical()
        .source(d => [d.parent.x, d.parent.y])
        .target(d => [d.parent.x, d.parent.y]);

    const link = g.selectAll(".link")
        .data(nodes.descendants().slice(1), d => d.data.id)
        .join(enter => {
            const dato_nuevo = enter.append("path")
                .attr("class", "link")
                .style("stroke", d => colorScale((d.data.dislikes + d.data.likes) == 0 ? 0.5 : d.data.likes / (d.data.likes + d.data.dislikes)))
                .attr("d", linkGenInitial)

            // Antes de aparecer uno nuevo, espero que se actualice lo anterior
            dato_nuevo.transition()
                .delay(updateDurationTime)
                .duration(enterDurationTime)
                .attr("d", linkGenFinal);

            return dato_nuevo
        }, update => {
            update.transition()
                .duration(updateDurationTime)
                .attr("d", linkGenFinal);

            return update
        }, exit => {
            exit.remove()
        })

    const node = g.selectAll(".node")
        .data(nodes.descendants().slice(), d => d.data.id)
        .join(enter => {
            const node_nuevo = enter.append("g")
                .attr("id", d => d.data.id)
                .attr("class", d => "node" + (d.comments ? " node--internal" : " node--leaf"))
                .attr("transform", d => d.parent == null ? `translate(${d.x}, ${d.y})` : `translate(${d.parent.x}, ${d.parent.y})`)
                .attr("x_original", d => d.x)
                .attr("y_original", d => d.y);

            node_nuevo.append("circle")
                .attr("class", d => { return d.parent ? 'comentario' : 'titulo' })
                .attr("r", 0)
                .style("stroke", d => d.data.likes)
                .style("fill", d => colorScale((d.data.dislikes + d.data.likes) == 0 ? 0.5 : d.data.likes / (d.data.likes + d.data.dislikes)));

            // Antes de aparecer uno nuevo, espero que se actualice lo anterior
            node_nuevo.transition()
                .delay(updateDurationTime)
                .duration(enterDurationTime)
                .attr("transform", d => `translate(${d.x}, ${d.y})`);

            node_nuevo.select("circle")
                .transition()
                .delay(updateDurationTime)
                .duration(enterDurationTime)
                .attr("r", circleRadius);

            return node_nuevo
        }, update => {
            update.transition()
                .duration(updateDurationTime)
                .attr("transform", d => `translate(${d.x}, ${d.y})`);

            return update
        }, exit => {
            exit.remove()
        })

    node.raise();

    // ---------------------------------------------- Filtro Fechas ----------------------------------------------
    function filtrar_fecha(timeMin, timeMax, time) {
        if (time < timeMin) { return 0.3 }
        if (time > timeMax) { return 0.05 }
        return 1;
    }

    let timePublish = transform_min_date(data.date, data.time);
    let last_comment_time = get_last_comment_time(data.comments);

    document.getElementById('date_min').value = timePublish;

    document.getElementById('date_min').setAttribute('min', timePublish);
    document.getElementById('date_min').setAttribute('value', timePublish);
    document.getElementById('date_min').setAttribute('max', last_comment_time);

    d3.select("#selectButton").on("click", function (d) {
        let timeMin = document.getElementById('date_min').value + ":00.000+00:00";
        let timeInterval = document.getElementById('date_interval').value;

        timeMin = Date.parse(timeMin);
        timeInterval = timeInterval * 60 * 1000;
        timeMax = timeMin + timeInterval;

        node.selectAll("circle")
            .attr("opacity", d => {
                return filtrar_fecha(timeMin, timeMax, d.data.time)
            })

        link.attr("opacity", d => {
            return filtrar_fecha(timeMin, timeMax, d.data.time)
        })
    })


    // ---------------------------------------------- Tooltip ----------------------------------------------
    node.select(".titulo")
        .on("mouseleave", function (event, d) {
            Tooltip.style("opacity", 0)
                .style("display", "none")
            // d3.pointer(event)
            // .style("stroke", "black")
        })
        .on("mouseover", function (event, d) {
            Tooltip.style("opacity", 1)
                .style("display", "block")
            // d3.pointer(event)
            // .style("stroke", "black")
        })
        .on("mousemove", function (event, d) {
            Tooltip
                .html(
                    "<h1>" + d.data.title + "</h1>" +
                    "<h2>" + d.data.date + ' | ' + 'Redactado por ' + d.data.creator + "</h2>"
                    // + "<p>"  + d.data.body + "</p>"
                )
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + -10) + "px")
        })

    node.selectAll(".comentario")
        .on("mouseleave", function (event, d) {
            Tooltip.style("opacity", 0)
                .style("display", "none")
            // d3.pointer(event)
            // .style("stroke", "black")
        })
        .on("mouseover", function (event, d) {
            Tooltip.style("opacity", 1)
                .style("display", "block")
            // d3.pointer(event)
            // .style("stroke", "black")
        })
        .on("mousemove", function (event, d) {
            let time = new Date(d.data.time)
            time = time.toISOString().slice(0, 20)
            Tooltip
                .html(
                    "Autor: " + d.data.creator + "<br>" +
                    "Comentario: " + d.data.text + "<br>" +
                    "Subido el: " + time + "<br>" +
                    "Cantidad de Likes: " + d.data.likes + "<br>" +
                    "Cantidad de Dislikes: " + d.data.dislikes + "<br>"
                )
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + -10) + "px")
        })

    // ---------------------------------------------- Zoom ----------------------------------------------
    d3.select("svg g")
        .attr("transform", "translate(0,0) scale(1)");
    d3.select("svg")
        .call(resetZOOM)
        .call(ZOOM.transform, d3.zoomIdentity);

    d3.select("#resetZoomButton").on("click", function (d) {
        d3.select("svg")
            .call(resetZOOM)
            .transition()
            .duration(500)
            .call(ZOOM.transform, d3.zoomIdentity);
        d3.select("svg")
            .call(ZOOM);
    })




}
