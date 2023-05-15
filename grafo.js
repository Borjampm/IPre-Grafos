function runCode(i) {
    d3.json(`Datos/specific_new/${i}.json`)
        .then((data) => {
            const unfiltered_data = data;
            data = dataInterval(unfiltered_data);
        })
        .catch((error) => console.log(error));
}

// Crear selector
const PRIMERANOTICIA = 10; // Parametro para elegir la primera noticia que se muestra
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
    new_comments = [];
    for (comment of comments) {
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
    max = 0;
    for (comment of comments) {
        if (max < comment.level) {
            max = comment.level;
        }
    }
    return max
}


// -------------------------------- Funciones Auxiliares ------------------------
function transform_min_date(date, time){
    var dateArray = date.split(' ');
    var month = monthname_to_number(dateArray[2]);
    var aux = dateArray[4] + "-"
        + month + "-"
        + dateArray[0] + "T"
        + time;
    return aux
}
function transform_max_date(date, time){
    var dateArray = date.split(' ');
    var month = monthname_to_number(dateArray[2]);
    var day = 2 + parseInt(dateArray[0]);
    var aux = dateArray[4] + "-"
            + month + "-"
            + day + "T"
            + time;
    return aux
}

function monthname_to_number(month){
    var monthsNumber = {
        'Enero': '01',
        'Febrero': '02',
        'Marzo': '03',
        'Abril': '04',
        'Mayo': '05',
        'Junio': '06',
        'Julio': '07',
        'Agosto': '08',
        'Septiembre': '09',
        'Octubre': '10',
        'Noviembre': '11',
        'Diciembre': '12',
        'Jan': '01',
        'Feb': '02',
        'Mar': '03',
        'Apr': '04',
        'May': '05',
        'Jun': '06',
        'Jul': '07',
        'Agu': '08',
        'Sep': '09',
        'Oct': '10',
        'Nov': '11',
        'Dec': '12'
    };
    return monthsNumber[month]
}

function get_last_comment_time(comments) {
    max = 0;
    for (comment of comments) {
        if (max < comment.time) {
            max = comment.time;
        }
    }
    var max_time = new Date(max);
    max_time = max_time.toString().split(' ')
    var month = monthname_to_number(max_time[1]);
    var time = max_time[4].split(':');
    var hour = time[0];
    var min = parseInt(time[1]) + 1;
    min = min.toString();
    if (min.length == 1) {
        min = "0" + min;
    } else if (min.length == 0) {
        min = "00";
    }
    var aux = max_time[3] + "-"
        + month + "-"
        + max_time[2] + "T"
        + hour + ":"
        + min;
    return aux
}

// Parametros
const HEIGTH = 200;
const WIDTH = 40;
const SVG = d3.select("#vis-1").append("svg");
SVG.append("g")
let Tooltip = d3.select("#vis-1")
.append("div")
.style("opacity", 0)
.attr("class", "tooltip")

runCode(PRIMERANOTICIA);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function dataInterval(unfiltered_data) {
    const steps = 10;
    const time_sleep = 1000;
// ---------------------------------------------- Filtrar datos en intervalos -----------------------------------
    var data = data_processed(unfiltered_data);
    if (data.comments.length == 0) {
        document.getElementById('status').innerText = 'No hay comentarios para esta noticia';
        data.comments = create_tree_comments(data.comments);
        createGrafo(unfiltered_data, data, time_sleep);
    } else {
        var timePublish = transform_min_date(data.date, data.time);
        var last_comment_time = get_last_comment_time(data.comments);
        console.log(timePublish, last_comment_time)
        document.getElementById('status').innerText = 'Generando grafo... (No cambiar de noticia)';

        var min = Date.parse(timePublish+":00.000+00:00");
        var max = Date.parse(last_comment_time);
        var interval = (max - min) / steps;
        for (var i = 0; i < steps+1; i++) {
            var data = data_processed(unfiltered_data);
            var actual_max = min + interval * i;
            var aux = [];
            for (comment of data.comments) {
                if (comment.time <= actual_max) {
                    aux.push(comment);
                }
            }
            data.comments = aux;
            data.comments = create_tree_comments(data.comments);
            console.log(data.comments.length, unfiltered_data.comments.length)
            createGrafo(unfiltered_data, data, time_sleep);
            await sleep(time_sleep);
        }
        document.getElementById('status').innerText = 'Grafo generado';
    }
}

// ---------------------------------------------- Crear Grafo -----------------------------------
function createGrafo(unfiltered_data, data, time_sleep) {

    // Constantes
    const tree_depth = max_level(unfiltered_data.comments);
    const tree_height = unfiltered_data.comments.length;

    const margin = { top: 20, right: 30, bottom: 30, left: 90 };
    const width = WIDTH * tree_height - margin.left - margin.right;
    const height = (HEIGTH * Math.sqrt(tree_depth + 1)) - margin.top - margin.bottom;

    const COLOR = d3.scaleOrdinal(d3[`schemeTableau10`])
        .domain([...Array(tree_depth).keys()]);

    const colorScale = d3.scaleDiverging(d => d3.interpolateRdBu(d))
        .domain([0, 0.5, 1]);
    // ------------------------------------------- Crear Grafo -------------------------------------------
    let nodes = d3.hierarchy(data, d => d.comments);

    const treemap = d3.tree().size([width, height]);
    nodes = treemap(nodes);
    SVG
        .attr("width", width + margin.left + margin.right)
        .attr("height", 100+height + margin.top + margin.bottom)

    const g = SVG.select("g")
        .attr("transform", `translate(${margin.top}, ${margin.left})`);

    let linkGen = d3.linkVertical()
        .source(d => [d.x, d.y])
        .target(d => [d.parent.x, d.parent.y]);
    let linkGen2 = d3.linkVertical()
        .source(d => [d.parent.x, d.parent.y])
        .target(d => [d.parent.x, d.parent.y]);

    const link = g.selectAll(".link")
        .data(nodes.descendants().slice(1), d => d.data.id)
        .join(enter => {
            const dato_nuevo = enter.append("path")
                .attr("class", "link")
                .style("stroke", d => colorScale(d.data.likes/(d.data.likes + d.data.dislikes)))
                .attr("d", linkGen2);
            return dato_nuevo
        }, update => {
            return update
        }, exit => {
            exit.remove()
        })

    // const node = g.selectAll(".node")
    //     .data(nodes.descendants())
    //     .join("g")
    //     .attr("class", d => "node" + (d.comments ? " node--internal" : " node--leaf"))
    //     .attr("transform", d => `translate(${d.x}, ${d.y})`);

    const node = g.selectAll(".node")
        .data(nodes.descendants().slice(1), d => d.data.id)
        .join(enter => {
            const node_nuevo = enter.append("g")
                .attr("class", d => "node" + (d.comments ? " node--internal" : " node--leaf"))
                .attr("transform", d => d.parent == null ? `translate(${d.x}, ${d.y})` : `translate(${d.parent.x}, ${d.parent.y})`);
            return node_nuevo
        }, update => {
            return update
        }, exit => {
            exit.remove()
    })



    link.transition().duration(time_sleep).attr("d", linkGen);
    node.transition().duration(time_sleep).attr("transform", d => `translate(${d.x}, ${d.y})`);


    node.raise();

    radius = d3.scaleSqrt()
        .domain([0, 10])
        .range([5, 20])

    node.append("circle")
        .attr("class", d => {
            return d.parent?'comentario':'titulo'})
        .attr("r", d => 15)
        .style("stroke", d => d.data.likes)
        .style("fill", d => colorScale(d.data.likes/(d.data.likes + d.data.dislikes)));


    // const node = g.selectAll(".node")
    //     .data(nodes.descendants().slice(1), d => d.data.id)
    //     .join(enter => {
    //         const node_nuevo = enter.append("circle")
    //             .attr("class", d => "node" + (d.comments ? " node--internal" : " node--leaf") + (d.parent?' comentario':' titulo'))
    //             .attr("transform", d => d.parent == null ? `translate(${d.x}, ${d.y})` : `translate(${d.parent.x}, ${d.parent.y})`)
    //             // .attr("class", d => {
    //             //     return d.parent?'comentario':'titulo'})
    //             .attr("r", 15)
    //             .style("stroke", d => d.data.likes)
    //             .style("fill", d => colorScale(d.data.likes/(d.data.likes + d.data.dislikes)));
    //         return node_nuevo
    //     }, update => {
    //         return update
    //     }, exit => {
    //         exit.remove()
    // })

    // link.transition().duration(time_sleep).attr("d", linkGen);
    // node.transition().duration(time_sleep).attr("transform", d => `translate(${d.x}, ${d.y})`);
    // node.raise();

    // node.append("circle")
    //     .attr("class", d => {
    //         return d.parent?'comentario':'titulo'})
    //     .attr("r", d => 15)
    //     .style("stroke", d => d.data.likes)
    //     .style("fill", d => colorScale(d.data.likes/(d.data.likes + d.data.dislikes)));

    // ---------------------------------------------- Filtro Fechas ----------------------------------------------
    function filtrar_fecha(timeMin, timeMax, time) {
        // console.log(timeMin, timeMax, time)
        if (time < timeMin) { return 0.4 }
        if (time > timeMax) { return 0.1 }
        return 1;
    }

    var timePublish = transform_min_date(data.date, data.time);
    var last_comment_time = get_last_comment_time(data.comments);

    document.getElementById('date_min').setAttribute('min', timePublish);
    document.getElementById('date_min').setAttribute('value', timePublish);
    document.getElementById('date_min').setAttribute('max', last_comment_time);

    d3.select("#selectButton").on("click", function (d) {
        let timeMin = document.getElementById('date_min').value + ":00.000+00:00";
        let timeInterval = document.getElementById('date_interval').value;

        timeMin = Date.parse(timeMin);
        timeInterval = timeInterval * 60 * 1000;
        timeMax = timeMin + timeInterval;
        console.log(timeMin, timeMax)

        node.selectAll("circle")
            .attr("opacity", d => {
                console.log("yo")
                return filtrar_fecha(timeMin, timeMax, d.data.time)
            })

        link.attr("opacity", d => {
            return filtrar_fecha(timeMin, timeMax, d.data.time)
        })
    })


    // ---------------------------------------------- Tooltip ----------------------------------------------
        node.selectAll(".titulo")
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
                    "<h2>" + d.data.date + ' | ' + 'Redactado por ' + d.data.creator + "</h2>" +
                    "<p>"  + d.data.body + "</p>"
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
                    "Subido el: " + d.data.time + "<br>" +
                    "Cantidad de Likes: " + d.data.likes + "<br>" +
                    "Cantidad de Dislikes: " + d.data.dislikes + "<br>"
                )
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + -10) + "px")
        })
}
