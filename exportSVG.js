function download(url, name) {
    let downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function createButton(divQuery, name) {
    const SVG = document.getElementById("vis");
    const svgData = new XMLSerializer().serializeToString(SVG)

    d3.select(divQuery)
        .append("button")
        .text("Download SVG")
        .on("click", () => {
            let source = svgData;
            //add name spaces.
            if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
                source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
                source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
            }
            source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
            let url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
            download(url, name + ".svg");
        })

    d3.select(divQuery)
        .append("button")
        .text("Download PNG")
        .on("click", async () => {
            //get svg element.
            let svg = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
            let DOMURL = self.URL || self.webkitURL || self;
            let url = DOMURL.createObjectURL(svg);
            const image = new Image()
            image.addEventListener('load', () => {
                const width = SVG.getAttribute('width')*3
                const height = SVG.getAttribute('height')*3
                const canvas = document.createElement('canvas')
                canvas.setAttribute('width', width)
                canvas.setAttribute('height', height)
                const context = canvas.getContext('2d')
                context.drawImage(image, 0, 0, width, height)
                const dataUrl = canvas.toDataURL('image/png')
                download(dataUrl, name + ".png");
            })
            image.src = url
        })
}



