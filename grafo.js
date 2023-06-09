function runCode(i) {
    d3.json(`Datos/specific_new/${i}.json`)
        .then((data) => {
            const unfiltered_data = data;
            data = dataInterval(unfiltered_data);
        })
        .catch((error) => console.log(error));
}

// Crear selector
const PRIMERANOTICIA = 2; // Parametro para elegir la primera noticia que se muestra
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
    let nodes = {}
    let new_comments = [];
    for (let comment of comments) {
        let p = comment_processed(comment)
        if (comment.level == 0) {
            nodes[p.id] = p
            new_comments.push(p);
        } else {
            parent = nodes[comment.parentId]
            parent.comments.push(p)
            nodes[p.id] = p
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
    SVG.select("g")
        .attr("transform", e.transform);
}
const resetZOOM = d3.zoom()
    .on("zoom", resetZoom);
function resetZoom(e) {
    SVG.select("g")
        .attr("transform", "translate(0,0) scale(1)");
}

// Segunda vis
// set the dimensions and margins of the graph
const marginHist = { top: 10, right: 50, bottom: 30, left: 50 }
const widthHist = 460 - marginHist.left - marginHist.right;
const heightHist = 400 - marginHist.top - marginHist.bottom;

// append the svg object to the body of the page
const SVG2 = d3.select("#vis-2")
    .append("svg")
    .attr("width", widthHist + marginHist.left + marginHist.right)
    .attr("height", heightHist + marginHist.top + marginHist.bottom)
    .append("g")
    .attr("transform", `translate(${marginHist.left},${marginHist.top})`);
SVG2.append("g").attr("id", "axis-x");
SVG2.append("g").attr("id", "axis-y");

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


    document.getElementById("date_interval").value = "";

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
        console.log(min, max)
        // 1547213340000, GMT: Friday, January 11, 2019 1:29:00 PM, Your time zone: Friday, January 11, 2019 10:29:00 AM GMT-03:00 DST
        // 1547213340000, publicación noticia
        // 1547399040000, GMT: Sunday, January 13, 2019 5:04:00 PM, Your time zone: Sunday, January 13, 2019 2:04:00 PM GMT-03:00 DST
        // 1547388223000, ultimo comentario
        // GMT: Sunday, January 13, 2019 2:03:43 PM, Your time zone: Sunday, January 13, 2019 11:03:43 AM GMT-03:00 DST



        let timePerNode = targetLength / (max - min);

        // Tiempo fijo y acotado a un rango de máxima.
        timePerNode = Math.min(targetLength / (comments.length), maxtimePerAnimation);
        timePerNode = Math.max(timePerNode, mintimePerAnimation);

        let aux = [];
        let i = 0;
        data.comments = aux;
        data.comments = create_tree_comments(data.comments);
        createGrafo(unfiltered_data, data, time_sleep);
        createHistogram(unfiltered_data)
        for (let comment of comments) {
            // TODO: interrumpir
            // if (XXXX){
            //     break
            // }
            document.getElementById('status').innerText = `Generando grafo... ${i}/${comments.length} (No cambiar de noticia)`;
            i+=1
            if (aux.length == 0) {
                // time_sleep = timePerNode * (comment.time - min);
                time_sleep = timePerNode;
                aux.push(comment);
                console.log(aux)
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
        SVG.call(ZOOM);
    }
}

// ---------------------------------------------- Crear Histograma -----------------------------------
function createHistogram(unfiltered_data) {

    let data = data_processed(unfiltered_data);
    let timePublish = transform_min_date(data.date, data.time);
    let last_comment_time = get_last_comment_time(data.comments);
    let minDate = Date.parse(timePublish + ":00.000+00:00");
    let maxDate = Date.parse(last_comment_time);


    histograma(data.comments, minDate, maxDate)

    function histograma(data, minDate, maxDate) {
        SVG2.select("#brush").remove()

        const x = d3.scaleLinear()
            .domain([minDate, maxDate])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
            .range([0, widthHist]);

        SVG2.select("#axis-x")
            .attr("transform", `translate(0, ${heightHist})`)
            .call(d3.axisBottom(x).tickValues([minDate, maxDate]).tickFormat(d => new Date(d).toUTCString()));

        // set the parameters for the histogram
        const histogram = d3.histogram()
            .value(function (d) { return d.time; })   // I need to give the vector of value
            .domain(x.domain())  // then the domain of the graphic
            .thresholds(x.ticks(20)); // then the numbers of bins

        // And apply this function to data to get the bins
        const bins = histogram(data);
        const maxLength = d3.max(bins, function (d) { return d.length; })

        // Y axis: scale and draw:
        const y = d3.scaleLinear()
            .range([heightHist, 0])
            .domain([0, maxLength]);   // d3.hist has to be called before the Y axis obviously


        // TODO: Ajstar eje Y para solo enteros y una cantidad "razonable" en función de heightHist
        // heightHist/5px ==> Máximo de textos que pueden haber
        // [...Array(maxLength).keys()];
        SVG2.select("#axis-y").call(d3.axisLeft(y));

        // append the bar rectangles to the svg element
        SVG2.selectAll("rect")
            .data(bins)
            .join("rect")
            .attr("x", 1)
            .attr("transform", function (d) { return `translate(${x(d.x0)} , ${y(d.length)})` })
            .attr("width", function (d) { return x(d.x1) - x(d.x0) })
            .attr("height", function (d) { return heightHist - y(d.length); })
            .style("fill", "rgb(49, 54, 149)")

        // ----------------------------------------------- Brush -----------------------------------------------

        let brush = d3.brushX()
            .extent([[0, 0], [widthHist, heightHist]])
            .on("end", handleBrush);

        SVG2.append("g").attr("id", "brush").call(brush);

        let brushExtent;

        function handleBrush(e) {
            brushExtent = e.selection;
            if (brushExtent != null) {
                let min = Math.round(x.invert(brushExtent[0]));
                let max = Math.round(x.invert(brushExtent[1]));

                let filterDate = new Date(min).toUTCString();
                filterDate = dateToFilterFormat(filterDate);
                let interval = Math.round((max - min) / 60000);

                let timeFilter = document.getElementById('date_min');
                let timeInterval = document.getElementById('date_interval');

                timeFilter.value = filterDate;
                timeInterval.value = interval;

                d3.select("#selectButton").on("click")();
            }
            else {
                let timeFilter = document.getElementById('date_min');
                let timeInterval = document.getElementById('date_interval');

                timeFilter.value = minDate;
                timeInterval.value = "";

                d3.select("#selectButton").on("click")();
            }
        }

    };

}

// ---------------------------------------------- Crear Grafo -----------------------------------
function createGrafo(unfiltered_data, data, time_sleep) {
    // Constantes
    const tree_height = unfiltered_data.comments.length;
    const full_depth = max_level(unfiltered_data.comments);
    const maxCircleRadius = 60;
    const maxLikes = d3.max(unfiltered_data.comments, d => d.likes+d.dislikes);
    const radiusScale = d3.scaleLinear().domain([0, maxLikes]).range([15, maxCircleRadius]);

    // Tiempo que toma actualizar el grafo
    const updateDurationTime = time_sleep / 3
    // Tiempo que toma agregar nuevos elementos
    const enterDurationTime = time_sleep - updateDurationTime;

    const HEIGTH = 700;
    const WIDTH = 2000;

    const margin = { top: 100, right: 100, bottom: 100, left: 100 };
    // Ajustar el ancho para que mínimo sea de 300 pixeles
    const width = Math.max(maxCircleRadius * tree_height * 2.1, WIDTH);
    const height = Math.max(full_depth * 700, HEIGTH);
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
        .attr("viewBox", `-100 -100 ${width + 200} ${height + 200}`)
        .attr("border", "1px solid black")

    const g = SVG.select("g")
        .attr("transform", `translate(${margin.top}, ${margin.left})`);

    let linkGenFinal = d3.linkVertical()
        .source(d => [d.parent.x, d.parent.y + radiusScale(d.data.likes + d.data.dislikes)])
        .target(d => [d.x, d.y - radiusScale(d.data.likes + d.data.dislikes)]);

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
                .attr("r", d => d.parent ? radiusScale(d.data.likes + d.data.dislikes) : maxCircleRadius);
                // .attr("r", d => radiusScale(d.data.likes + d.data.dislikes));

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
        console.log(1)
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
    SVG.select("g")
        .attr("transform", "translate(0,0) scale(1)");
    SVG.call(resetZOOM)
        .call(ZOOM.transform, d3.zoomIdentity);

    d3.select("#resetZoomButton").on("click", function (d) {
        SVG.call(resetZOOM)
            .transition()
            .duration(500)
            .call(ZOOM.transform, d3.zoomIdentity);
        SVG.call(ZOOM);
    })




}
