// -------------------------------- Funciones Auxiliares ------------------------
function transform_min_date(date, time) {
    let dateArray = date.split(' ');
    let month = monthname_to_number(dateArray[2]);
    let aux = dateArray[4] + "-"
        + month + "-"
        + dateArray[0] + "T"
        + time;
    return aux
}

function transform_max_date(date, time) {
    let dateArray = date.split(' ');
    let month = monthname_to_number(dateArray[2]);
    let day = 2 + parseInt(dateArray[0]);
    let aux = dateArray[4] + "-"
        + month + "-"
        + day + "T"
        + time;
    return aux
}

function monthname_to_number(month) {
    let monthsNumber = {
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
    let max_time = new Date(max);
    max_time = max_time.toUTCString().split(' ')
    let month = monthname_to_number(max_time[2]);
    let time = max_time[4].split(':');
    let hour = time[0];
    let min = parseInt(time[1]) + 1;
    min = min.toString();
    if (min.length == 1) {
        min = "0" + min;
    } else if (min.length == 0) {
        min = "00";
    }
    let aux = max_time[3] + "-"
        + month + "-"
        + max_time[1] + "T"
        + hour + ":"
        + min;
    return aux
}

function dateToFilterFormat(date) {
    let dateArray = date.split(' ');
    let month = monthname_to_number(dateArray[2]);
    let time = dateArray[4].split(':');
    let hour = time[0];
    let min = parseInt(time[1]) + 1;
    min = min.toString();
    if (min.length == 1) {
        min = "0" + min;
    } else if (min.length == 0) {
        min = "00";
    }
    let aux = dateArray[3] + "-"
        + month + "-"
        + dateArray[1] + "T"
        + hour + ":"
        + min;
    console.log(aux)
    return aux
}

