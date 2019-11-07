const dataURL = '$dataURL';
const layerChannelCounts = {
    'mixed3a': 256,
    'mixed3b': 480,
    'mixed4a': 508,
    'mixed4b': 512,
    'mixed4c': 512,
    'mixed4d': 528,
    'mixed4e': 832,
    'mixed5a': 832,
    'mixed5b': 1024
}
let rightInner = d3.select('#right-inner')

let rightInnerOptions = d3.select('#right-inner-options')

// let rightInnerDagWrapper = d3.select('#right-inner-dag-wrapper')
let rightInnerDagWrapper = d3.select('#$graphdiv')

let layers = Object.keys(layerChannelCounts).reverse()
let isAlreadyClicked = {}

const dagMargin = ({ top: 40, right: 40, bottom: 40, left: 40 })
const dagWidth = 1000 - dagMargin.left - dagMargin.right
const dagHeight = 800 - dagMargin.top - dagMargin.bottom // 790 based on laptop screen height
let k = 1; // dag zoom scale
let numTopAttr = 3;
const filterTransitionSpeed = 1000
let filterFilterValue = 0;
const fv_type = '.jpg'
const exLayout = ({ offset: 20, top: 20, bottom: 5, right: 2, left: 5, TBPadding: 2, textPadding: 5 })
const exRectLayout = ({ offset: 13, right: 2, left: 5 })
const attrLayout = ({ topOffset: 60, top: 15, left: 3, right: 3, bottom: 3 })

let zoom = d3.zoom()
    .scaleExtent([.1, 3.5])
    .extent([[0, 0], [dagWidth, dagHeight]])
    .on("zoom", zoomed);

function zoomed() {
    d3.select('#dagG').attr("transform", d3.event.transform);
    // console.log(d3.event.transform)
}

let dagSVG = rightInnerDagWrapper
    .append('svg')
    .attr('viewBox', '0 0 ' + (dagWidth + dagMargin.left + dagMargin.right) + ' ' + (dagHeight + dagMargin.top + dagMargin.bottom))
    .attr('width', '100%')
    .style('border-bottom', '1px solid rgba(0, 0, 0, 0.1)')
    .attr('id', 'dag')

dagSVG.append('filter')
    .attr('id', 'grayscale')
    .append('feColorMatrix')
    .attr('type', 'matrix')
    .attr('values', '0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0')

dagSVG.append('filter')
    .attr('id', 'drop-shadow')
    .attr('y',"-50%")
    .attr('width', "200%")
    .attr('height', "200%")
    .append('feDropShadow')
    .attr('dx',"0")
    .attr('dy',"0")
    .attr('stdDeviation',"8")
    .attr('flood-color', "rgba(0, 0, 0, 0.6)")
    .attr('flood-opacity',"1")

let zoomRect = dagSVG.append("rect")
    .attr("width", dagWidth + dagMargin.left + dagMargin.right)
    .attr("height", dagHeight + dagMargin.top + dagMargin.bottom)
    .style("fill", "none")
    .style("pointer-events", "all")
    // .attr('transform', 'translate(' + dagMargin.left + ',' + dagMargin.top + ')')
    .call(zoom);

let dagDefs = dagSVG.append('defs')

const fvWidth = 100
const fvHeight = fvWidth

const deWidth = 49
const deHeight = deWidth

const attrFvWidth = 60
const attrFvHeight = attrFvWidth

let layerVerticalSpace = 300
let fvHorizontalSpace = 50

const layerIndex = {
    'mixed3a': 8,
    'mixed3b': 7,
    'mixed4a': 6,
    'mixed4b': 5,
    'mixed4c': 4,
    'mixed4d': 3,
    'mixed4e': 2,
    'mixed5a': 1,
    'mixed5b': 0
}

const indexLayer = {
    8: 'mixed3a',
    7: 'mixed3b',
    6: 'mixed4a',
    5: 'mixed4b',
    4: 'mixed4c',
    3: 'mixed4d',
    2: 'mixed4e',
    1: 'mixed5a',
    0: 'mixed5b'
}

let channelsHidden = new Set()

function newChannelClipPath(layer, channel) {
    dagDefs.append('clipPath')
        .attr('id', 'fv-clip-path-' + layer + '-' + channel.channel)
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', channel.width)
        .attr('height', channel.width)
        .attr('rx', 8)
        .attr('ry', 8)
}

// dagDefs.append('clipPath')
//     .attr('id', 'fv-clip-path')
//     .append('rect')
//     .attr('x', 0)
//     .attr('y', 0)
//     .attr('width', fvWidth)
//     .attr('height', fvHeight)
//     .attr('rx', 8)
//     .attr('ry', 8)

// dagDefs.append('clipPath')
//     .attr('id', 'de-clip-path')
//     .append('rect')
//     .attr('x', 0)
//     .attr('y', 0)
//     .attr('width', deWidth)
//     .attr('height', deHeight)
//     .attr('rx', 4)
//     .attr('ry', 4)

// dagDefs.append('clipPath')
//     .attr('id', 'attr-fv-clip-path')
//     .append('rect')
//     .attr('x', 0)
//     .attr('y', 0)
//     .attr('width', attrFvWidth)
//     .attr('height', attrFvHeight)
//     .attr('rx', 4)
//     .attr('ry', 4)

// class name
let rightInnerOptionsClassName = rightInnerOptions
    .append('div')
    .classed('right-inner-option-wrapper', true)

rightInnerOptionsClassName
    .append('span')
    .classed("smalltext-header", true)
    .style('color', '#666666')
    .text('class')

let className = rightInnerOptionsClassName
    .append('div')
    .classed("header-value", true)
    .attr('id', 'selected-class-value')

// // class number of instances
let rightInnerOptionsClassInstances = rightInnerOptions
    .append('div')
    .classed('right-inner-option-wrapper', true)

rightInnerOptionsClassInstances
    .append('span')
    .classed("smalltext-header", true)
    .style('color', '#666666')
    .text('instances')

let classInstances = rightInnerOptionsClassInstances
    .append('div')
    .classed("header-value", true)

// // class accuracy
let rightInnerOptionsClassAcc = rightInnerOptions
    .append('div')
    .classed('right-inner-option-wrapper', true)

rightInnerOptionsClassAcc
    .append('span')
    .classed("smalltext-header", true)
    .style('color', '#666666')
    .text('accuracy')

let classAcc = rightInnerOptionsClassAcc
    .append('div')
    .classed("header-value", true)

// class accuracy histogram
// let rightInnerOptionsClassAccHist = rightInnerOptions
//     .append('div')
//     .classed('right-inner-option-wrapper', true)

// rightInnerOptionsClassAccHist
//     .append('span')
//     .classed("smalltext-header", true)
//     .style('color', '#666666')
//     .text('probabilities')

// const accuracyMargin = { top: 7, right: 0, bottom: 2, left: 0 }
// const accuracyWidth = 120 - accuracyMargin.left - accuracyMargin.right // 120 from flex-basis width of class-bar-text-accuracy
// const accuracyHeight = 20 - accuracyMargin.top - accuracyMargin.bottom // 120 from flex-basis width of class-bar-text-accuracy

// rightInnerOptionsClassAccHist
//     .append('svg')
//     .attr("width", accuracyWidth + accuracyMargin.left + accuracyMargin.right)
//     .attr("height", accuracyHeight + accuracyMargin.top + accuracyMargin.bottom)
//     .attr('id', 'accuracy-hist')

// home zoom button
// rightInnerOptions
//     .append('div')
//     .classed('right-inner-option-wrapper', true)
//     .append('button')
//     .attr('type', 'button')
//     .classed('square-button', true)
//     .attr('title', 'Reset zoom')
//     .append('i')
//     .classed('material-icons', true)
//     .classed('md-24', true)
//     .text('zoom_out_map')
//     .attr('id', 'dag-home')

// channel count slider
// let rightInnerOptionsFilter = rightInnerOptions
//     .append('div')
//     .classed('right-inner-option-wrapper', true)

// rightInnerOptionsFilter.append('span')
//     .classed("smalltext-header", true)
//     .style('color', '#666666')
//     .text('filter graph')

// rightInnerOptionsFilter
//     .append('div')
//     .classed('header-value', true)
//     .append('input')
//     .attr('type', 'range')
//     .attr('id', 'dag-channel-count-filter-slider')
//     .attr('min', 0)
//     .attr('max', 1300)
//     .attr('value', 0)
//     .classed('slider', true)
//     .attr('title', 'Filter graph by removing less important channels')

// let rightInnerOptionsFilterWidth = rightInnerOptions
//     .append('div')
//     .classed('right-inner-option-wrapper', true)

// rightInnerOptionsFilterWidth.append('span')
//     .classed("smalltext-header", true)
//     .style('color', '#666666')
//     .text('adjust width')

// rightInnerOptionsFilterWidth
//     .append('div')
//     .classed('header-value', true)
//     .append('input')
//     .attr('type', 'range')
//     .attr('id', 'dag-width-filter-slider')
//     .attr('min', 0)
//     .attr('max', 300)
//     .attr('value', fvHorizontalSpace)
//     .classed('slider', true)
//     .attr('title', 'Change width of attribution graph')

// let rightInnerOptionsFilterHeight = rightInnerOptions
//     .append('div')
//     .classed('right-inner-option-wrapper', true)

// rightInnerOptionsFilterHeight.append('span')
//     .classed("smalltext-header", true)
//     .style('color', '#666666')
//     .text('adjust height')

// rightInnerOptionsFilterHeight
//     .append('div')
//     .classed('header-value', true)
//     .append('input')
//     .attr('type', 'range')
//     .attr('id', 'dag-height-filter-slider')
//     .attr('min', 175)
//     .attr('max', 400)
//     .attr('value', layerVerticalSpace)
//     .classed('slider', true)
//     .attr('title', 'Change height of attribution graph')

function dagVIS(selectedClass) {
    console.log('selected class', selectedClass['target_class'])
    // console.log('outside data')

    // d3.json(dataURL + 'data/ag/ag-270.json').then(function (dag) {
    d3.json(dataURL + 'data/ag/ag-' + selectedClass['target_class'] + '.json').then(function (dag) {
        // console.log('inside data')
        // console.log(dag);

        let tempMins = []
        let tempMaxs = []
        let tempCountMaxs = []
        layers.forEach(layer => {
            let tempExtent = d3.extent(dag[layer], d => {
                return d.pagerank
            })
            tempMins.push(tempExtent[0])
            tempMaxs.push(tempExtent[1])
            tempCountMaxs.push(d3.max(dag[layer], d => { return d.count }))
        })

        const fvScaleMax = d3.max(tempMaxs)
        const fvScaleMin = d3.min(tempMins)
        const cvScaleCountMax = d3.max(tempCountMaxs)

        let countMax = d3.max(dag)

        let fvScale = d3.scaleLinear()
            .domain([0, cvScaleCountMax]) // max = 1300 for all class comparison
            .range([fvWidth / 3, fvWidth])

        let dagG = dagSVG
            .append("g")
            .attr("transform", "translate(" + dagMargin.left + "," + dagMargin.top + ")")
            .attr('id', 'dagG')

        d3.select('#dag-channel-count-filter-slider')
            .attr('max', cvScaleCountMax)

        function drawOrigin() {
            dagG.append('circle')
                .attr('r', 10)
                .attr('cx', 0)
                .attr('cy', 0)
        }
        // for debugging, draw point at origin of svg
        // drawOrigin()

        function centerDag() {
            zoomRect.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(dagWidth / 2, 50).scale(0.2));
        }
        centerDag()
        d3.select('#dag-home').on('click', () => {
            centerDag()
        })

        function computeChannelCoordinates(layer) {
            let i = 0
            dag[layer].forEach(ch => {
                ch.width = fvScale(ch.count)
                ch.x = (((fvWidth + fvHorizontalSpace) * i) - ((dag[layer].length * fvWidth + (dag[layer].length - 1) * fvHorizontalSpace) / 2)) + (fvWidth - ch.width) / 2
                ch.y = layerIndex[layer] * layerVerticalSpace + (fvWidth - ch.width) / 2
                i = i + 1
            });

        }

        function computeChannelCoordinatesFilter(layer, filterValue, filterOperation) {
            // filterOperation
            // filter: filter graph and remove channels/edges
            // width: update width
            // height: update height
            

            if (filterOperation == 'filter') {
                let i = 0
                let dagFiltered = dag[layer].filter(function (ch) {
                    return ch.count > filterValue
                })
                let currLayerLength = dagFiltered.length

                dag[layer].forEach(ch => {
                    if (ch.count > filterValue) {
                        ch.x = (((fvWidth + fvHorizontalSpace) * i) - ((currLayerLength * fvWidth + (currLayerLength - 1) * fvHorizontalSpace) / 2)) + (fvWidth - ch.width) / 2
                        // ch.x = (((fvWidth + fvHorizontalSpace) * i) - ((currLayerLength * fvWidth + (currLayerLength - 1) * fvHorizontalSpace) / 2))
                        ch.y = layerIndex[layer] * layerVerticalSpace + (fvWidth - ch.width) / 2
                        i = i + 1
                    } else {
                        ch.x = 0 - fvWidth / 2
                    }
                });   
            }

            if (filterOperation == 'width') {
                computeChannelCoordinates(layer)
            }

            if (filterOperation == 'height') {
                computeChannelCoordinates(layer)
            }

        }

        function initializeChannelEdgeCount(layer) {

            dag[layer].forEach(ch => {
                ch.numOfEdgesIn = 0
                ch.numOfEdgesOut = 3
            });

        }

        function drawExamplesForLayer(layer) {
            // Padding and offset
            let rightPadding = exLayout.right
            let leftPadding = exLayout.left
            let topPadding = exLayout.top
            let bottomPadding = exLayout.bottom

            for (let ch = 0; ch < dag[layer].length; ch++) {
                // Draw background rectangle
                let channel = dag[layer][ch]
                let rectId = layer + '-' + channel.channel + '-ex-rect'
                let x = getExRectX(channel)
                let y = getExRectY(channel)
                let width = deWidth * 5 + rightPadding * 4 + leftPadding + leftPadding
                let height = deHeight * 2 + topPadding + bottomPadding
                drawBackgroundRect(rectId, x, y, width, height, false)

                // Draw dataset examples
                for (let i = 0; i < 10; i++) {
                    drawDatasetExamples(layer, channel, i)
                }

                // Write guide text
                let textX = getTextX(channel)
                let textY = getTextY(channel)
                dagG.append('text')
                    .text('Examples from data')
                    .attr('x', textX)
                    .attr('y', textY)
                    .style('visibility', 'hidden')
                    .attr('id', layer + '-' + channel.channel + '-ex-text')
                    .classed('example-text', true)
            }
        }

        function getExRectX(channel) {
            let StartPadding = exRectLayout.left
            let rightOffset = exLayout.offset - StartPadding
            return channel.x + channel.width + rightOffset
        }

        function getExRectY(channel) {
            let topPadding = exLayout.top
            return channel.y + (channel.width / 2) - (fvHeight / 2) - topPadding
        }

        function getTextX(channel) {
            let rightOffset = exLayout.offset
            let textX = channel.x + channel.width + rightOffset
            return textX
        }

        function getTextY(channel) {
            let topBottomPadding = exLayout.TBPadding
            let textY = channel.y + (channel.width / 2) - deHeight - topBottomPadding - exLayout.textPadding

            return textY
        }

        function drawDatasetExamples(layer, channel, index) {
            dagG.append('image')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', deWidth)
                .attr('height', deHeight)
                .attr('xlink:href', dataURL + 'data/feature-vis/dataset-p/' + layer + '-' + channel.channel + '-' + 'dataset-p-' + index + fv_type)
                .classed('fv-de', true)
                .attr('transform', rightTranslation(channel.x, channel.y, channel.width, index))
                .attr('id', layer + '-' + channel.channel + '-dataset-p-' + index)
                .style('visibility', 'hidden')
                .classed(layer + '-' + channel.channel + '-dataset-p', true)
        }

        function rightTranslation(x, y, sz, index) {
            let rightOffset = exLayout.offset
            let rightPadding = exLayout.right
            let topBottomPadding = exLayout.TBPadding
            if (index < 5) {
                let dataExX = (x + sz + rightOffset) + index * (deWidth + rightPadding)
                let dataExY = y + (sz / 2) - deHeight - topBottomPadding
                return "translate(" + dataExX + ", " + dataExY + ")"
            } else if (index >= 5) {
                let dataExX = (x + sz + rightOffset) + (index - 5) * (deWidth + rightPadding)
                let dataExY = y + (sz / 2)
                return "translate(" + dataExX + ", " + dataExY + ")"
            }
        }

        function makeChannelClipPaths() {
            layers.forEach(layer => {
                dag[layer].forEach(channel => {
                    newChannelClipPath(layer, channel)
                })
            })
        }

        function drawBackgroundRect(attrRectId, x, y, width, height, initVisible = true) {
            dagG.append('rect')
                .attr('x', x)
                .attr('y', y)
                .attr('left', x)
                .attr('top', y)
                .attr('width', width)
                .attr('height', height)
                .attr('fill', 'white')
                .style('visibility', initVisible ? 'visible' : 'hidden')
                .attr('id', attrRectId)
                .attr('filter', 'url(#drop-shadow)')            
        }

        function drawChannels(layer) {
            dagG.selectAll('.fv-ch-' + layer)
                .data(dag[layer])
                .enter()
                .append('image')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', d => fvScale(d.count))
                .attr('height', d => fvScale(d.count))
                .attr('xlink:href', d => {
                    let filename = dataURL + 'data/feature-vis/channel/' + layer + '-' + d.channel + '-channel' + fv_type
                    return filename
                })
                .attr('clip-path', d => 'url(#fv-clip-path-' + layer + '-' + d.channel + ')')
                .attr("transform", (d, i) => "translate(" +
                    d.x + ',' +
                    d.y + " )"
                )
                .attr('id', d => layer + '-' + d.channel + '-channel')
                .classed('fv-ch', true)
                .classed('fv-ch-' + layer, true)
                .on('mouseover', function (curr_channel) {
                    d3.selectAll('.fv-ch').attr('filter', 'url(#grayscale)')
                    d3.select(this).attr('filter', null)

                    // let curr_channel = d3.select(this).data()[0]
                    let hoveredChannel = layer + '-' + curr_channel.channel

                    // Make dataset images visible
                    for (let index = 0; index < 10; index++) {
                        let exImg = document.getElementById(hoveredChannel + '-dataset-p-' + index)
                        exImg.style.setProperty('visibility', 'visible')
                    }

                    d3.selectAll('.dag-edge-' + hoveredChannel + '-in')
                        .classed('dag-edge-animate-in', true)

                    d3.selectAll('.dag-edge-' + hoveredChannel + '-out')
                        .classed('dag-edge-animate-out', true)

                    d3.selectAll('.fv-ch-' + indexLayer[layerIndex[layer] - 1])
                        .filter(d => {
                            let tempPrevChannels = d['prev_channels'].map(pv => pv['prev_channel'])
                            if (tempPrevChannels.includes(curr_channel.channel)) {
                                return d
                            }
                        })
                        .attr('filter', null)

                    curr_channel['prev_channels'].forEach(pc => {
                        d3.selectAll('#' + indexLayer[layerIndex[layer] + 1] + '-' + pc['prev_channel'] + '-channel')
                            .attr('filter', null)
                    });

                    d3.selectAll('#' + hoveredChannel + '-ex-rect')
                        .style('visibility', 'visible')
                    
                        d3.selectAll('#' + hoveredChannel + '-ex-text')
                        .style('visibility', 'visible')

                    d3.selectAll('#' + hoveredChannel + '-attr-rect')
                        .style('visibility', 'visible')

                    d3.selectAll('.' + hoveredChannel + '-attr')
                        .style('visibility', 'visible')

                    d3.selectAll('.' + 'dag-edge-' + hoveredChannel)
                        .style('visibility', 'visible')

                    d3.selectAll('.' + 'attr-ch-label-' + hoveredChannel)
                        .style('visibility', 'visible')

                })
                .on('mousemove', function (d) {
                    // diversity hovering
                    let [mouseX, mouseY] = d3.mouse(this)
                    let channelSelection = d3.select(this)
                    let diversity = d3.min([d3.max([parseInt(4 * mouseX / d.width),0]),3])

                    channelSelection.attr('xlink:href', dataURL + 'data/feature-vis/diversity-' + diversity + '/' + d.layer + '-' + d.channel + '-diversity-' + diversity + fv_type)

                })
                .on('mouseout', function (d) {

                    let channelSelection = d3.select(this)
                    let hoveredChannel = layer + '-' + d.channel

                    d3.selectAll('.fv-ch').attr('filter', null)

                    d3.selectAll('.' + layer + '-' + d.channel + '-dataset-p')
                        .style('visibility', 'hidden')

                    d3.selectAll('.dag-edge-' + layer + '-' + d.channel + '-in')
                        .classed('dag-edge-animate-in', false)

                    d3.selectAll('.dag-edge-' + layer + '-' + d.channel + '-out')
                        .classed('dag-edge-animate-out', false)

                    channelSelection.attr('xlink:href', d => dataURL + 'data/feature-vis/channel/' + layer + '-' + d.channel + '-channel' + fv_type)

                    d3.selectAll('#' + hoveredChannel + '-ex-rect')
                        .style('visibility', 'hidden')
                    
                    d3.selectAll('#' + hoveredChannel + '-ex-text')
                        .style('visibility', 'hidden')

                    d3.selectAll('#' + hoveredChannel + '-attr-rect')
                        .style('visibility', isAlreadyClicked[hoveredChannel] ? 'visible' : 'hidden')

                    d3.selectAll('.' + hoveredChannel + '-attr')
                        .style('visibility', isAlreadyClicked[hoveredChannel] ? 'visible' : 'hidden')

                    d3.selectAll('.' + 'dag-edge-attr-' + hoveredChannel)
                        .style('visibility', isAlreadyClicked[hoveredChannel] ? 'visible' : 'hidden')

                    d3.selectAll('.' + 'attr-ch-label-' + hoveredChannel)
                        .style('visibility', isAlreadyClicked[hoveredChannel] ? 'visible' : 'hidden')

                })
                .on('click', function (d) {
                    let clickedChannel = layer + '-' + d.channel
                    if (!(clickedChannel in isAlreadyClicked)) {
                        isAlreadyClicked[clickedChannel] = false
                    }

                    // Get attributed channels
                    let attrChannels = d['attr_channels']

                    // Toggle background white rect
                    let attrRectId = layer + '-' + d.channel + '-attr-rect'
                    let attrRect = document.getElementById(attrRectId)
                    attrRect.style.setProperty('visibility', isAlreadyClicked[clickedChannel] ? 'hidden' : 'visible')

                    // Toggle attributed channels
                    attrChannels.forEach(attrChannel => {
                        let attrImgId = layer + '-' + d.channel + '-attr-' + attrChannel.prev_channel
                        let attrImg = document.getElementById(attrImgId)
                        attrImg.style.setProperty('visibility', isAlreadyClicked[clickedChannel] ? 'hidden' : 'visible')
                    })

                    // Toggle attributed edges
                    attrChannels.forEach(attrChannel => {
                        let attrEdgeID = layer + '-' + d.channel + '-attr-edge-' + attrChannel.prev_channel
                        let attrEdge = document.getElementById(attrEdgeID)
                        attrEdge.style.setProperty('visibility', isAlreadyClicked[clickedChannel] ? 'hidden' : 'visible')
                    })

                    // Toggle attributed channel labels
                    attrChannels.forEach(attrChannel => {
                        let attrLabelID = 'attr-ch-label-' + layer + '-' + d.channel + '-' + attrChannel.prev_channel
                        let attrLabel = document.getElementById(attrLabelID)
                        attrLabel.style.setProperty('visibility', isAlreadyClicked[clickedChannel] ? 'hidden' : 'visible')
                    })

                    isAlreadyClicked[clickedChannel] = !isAlreadyClicked[clickedChannel]
                })

            // Write channel label
            dagG.selectAll('.fv-ch-label-' + layer)
                .data(dag[layer])
                .enter()
                .append('text')
                .attr('x', d => d.x)
                .attr('y', d => d.y - 3)
                .text(d => d.channel)
                .classed('fv-ch-label', true)
                .classed('fv-ch-label-' + layer, true)
                .attr('id', d => 'fv-ch-label-' + layer + '-' + d.channel)

        }

        function drawLayerLabels() {
            dagG.selectAll('.dag-layer-label')
                .data(layers)
                .enter()
                .append('text')
                .text(d => d)
                .attr('transform', d => 'translate(' + (0 - (fvWidth / 4 + ((dag[d].length * fvWidth + (dag[d].length - 1) * fvHorizontalSpace) / 2))) + ',' + (layerIndex[d] * layerVerticalSpace + fvHeight / 2) + ')')
                .attr('text-anchor', 'end')
                .classed('dag-layer-label', true)
                .attr('id', d => 'dag-layer-label-' + d)
        }
        let edgeScale = d3.scaleLinear()
            .domain([0, 1300]) // check this, do d3.max instead? OR 1300
            .range([0, 6])

        function drawEdgesPerLayer(layer, channel) {

            // update dag data with edge count
            let layerToUpdate = indexLayer[layerIndex[layer] + 1]
            channel['prev_channels'].forEach(prevChannel => {
                let channelToUpdate = dag[layerToUpdate].find(function (element) {
                    return element.channel === prevChannel['prev_channel'];
                });

                channelToUpdate.numOfEdgesIn += 1
            })

            dagG.selectAll('.dag-edge-temp-' + layer) // need the throwaway class since we do this for every channel and use multiple classes
                .data(channel['prev_channels'])
                .enter()
                .append('path')
                .attr('d', d => {
                    let layerToConnectTo = indexLayer[layerIndex[layer] + 1]
                    let channelToConnectTo = dag[layerToConnectTo].find(function (element) {
                        return element.channel === d['prev_channel'];
                    });

                    return "M" + (channel.x + channel.width / 2) + "," + (channel.y + fvHeight - (fvHeight - channel.width))
                        + "C" + (channel.x + channel.width / 2) + " " + (channel.y + fvHeight - (fvHeight - channel.width)
                            + layerVerticalSpace / 2) + "," + (channelToConnectTo.x + channelToConnectTo.width / 2) + " "
                        + (channelToConnectTo.y - layerVerticalSpace / 2 - (fvHeight - channelToConnectTo.width)) + ","
                        + (channelToConnectTo.x + channelToConnectTo.width / 2) + " " + channelToConnectTo.y
                })
                .style('stroke-width', d => edgeScale(d.inf))
                .attr('class', d => {

                    let classString = 'dag-edge' +
                        ' ' + 'dag-edge-' + layer +
                        ' ' + 'dag-edge-' + layer + '-' + channel.channel +
                        ' ' + 'dag-edge-' + indexLayer[layerIndex[layer] + 1] + '-' + d['prev_channel'] +
                        ' ' + 'dag-edge-' + layer + '-' + channel.channel + '-out'

                    if (d.layer != 'mixed5b') {
                        classString += ' ' + 'dag-edge-' + indexLayer[layerIndex[layer] + 1] + '-' + d['prev_channel'] + '-in'

                    }

                    return classString
                })
                .attr('id', d => {
                    let layerToConnectTo = indexLayer[layerIndex[layer] + 1]
                    let channelToConnectTo = dag[layerToConnectTo].find(function (element) {
                        return element.channel === d['prev_channel'];
                    });
                    return 'dag-edge-' + layer + '-' + channel.channel + '-' + layerToConnectTo + '-' + channelToConnectTo.channel
                })
                .on('mouseover', function () {
                    let edgeID = d3.select(this).attr('id').split('-')
                    let topLayer = edgeID[2]
                    let topChannel = edgeID[3]
                    let bottomLayer = edgeID[4]
                    let bottomChannel = edgeID[5]

                    d3.selectAll('.fv-ch').attr('filter', 'url(#grayscale)')
                    d3.select('#' + topLayer + '-' + topChannel + '-channel').attr('filter', null)
                    d3.select('#' + bottomLayer + '-' + bottomChannel + '-channel').attr('filter', null)

                    d3.selectAll('.' + topLayer + '-' + topChannel + '-dataset-p')
                        .style('visibility', 'visible')

                    d3.selectAll('.' + bottomLayer + '-' + bottomChannel + '-dataset-p')
                        .style('visibility', 'visible')

                    d3.select('#' + topLayer + '-' + topChannel + '-ex-rect')
                        .style('visibility', 'visible')
                    
                    d3.select('#' + bottomLayer + '-' + bottomChannel + '-ex-rect')
                        .style('visibility', 'visible')

                    d3.select('#' + topLayer + '-' + topChannel + '-ex-text')
                        .style('visibility', 'visible')
                    
                    d3.select('#' + bottomLayer + '-' + bottomChannel + '-ex-text')
                        .style('visibility', 'visible')

                })
                .on('mouseout', function () {
                    let edgeID = d3.select(this).attr('id').split('-')
                    let topLayer = edgeID[2]
                    let topChannel = edgeID[3]
                    let bottomLayer = edgeID[4]
                    let bottomChannel = edgeID[5]

                    d3.selectAll('.fv-ch').attr('filter', null)

                    d3.selectAll('.fv-de')
                        .style('visibility', 'hidden')
                    
                    d3.select('#' + topLayer + '-' + topChannel + '-ex-rect')
                        .style('visibility', 'hidden')
                    
                    d3.select('#' + bottomLayer + '-' + bottomChannel + '-ex-rect')
                        .style('visibility', 'hidden')

                    d3.select('#' + topLayer + '-' + topChannel + '-ex-text')
                        .style('visibility', 'hidden')
                    
                    d3.select('#' + bottomLayer + '-' + bottomChannel + '-ex-text')
                        .style('visibility', 'hidden')
                })
        }

        function drawEdges() {
            layers.forEach(l => {
                if (l !== layers[layers.length - 1]) { // don't draw edges from the last layer downward
                    dag[l].forEach(ch => {
                        drawEdgesPerLayer(l, ch)
                    });
                }
            });
        }

        function updateChannels() {
            d3.selectAll('.fv-ch')
                .transition()
                .duration(filterTransitionSpeed)
                .attr("transform", (d, i) => "translate(" +
                    d.x + ',' +
                    d.y + " )"
                )
        }

        function updateChannelLabels() {
            layers.forEach(layer => {
                dagG.selectAll('.fv-ch-label-' + layer)
                    .transition()
                    .duration(filterTransitionSpeed)
                    .attr('x', d => d.x)
                    .attr('y', d => d.y - 3)
            })
        }

        function updateLayerLabels(filterValue) {
            layers.forEach(layer => {
                let dagFiltered = dag[layer].filter(function (ch) {
                    return ch.count > filterValue
                })

                let currLayerLength = dagFiltered.length

                d3.select('#dag-layer-label-' + layer)
                    .transition()
                    .duration(filterTransitionSpeed)
                    .attr('transform', d => {
                        let layerLabelX = 0 - (fvWidth / 4 + ((currLayerLength * fvWidth + (currLayerLength - 1) * fvHorizontalSpace) / 2))
                        let layerLabelY = layerIndex[d] * layerVerticalSpace + fvHeight / 2
                        return 'translate(' + layerLabelX + ',' + layerLabelY + ')'
                    })

            })
        }

        function updateDatasetExamples() {
            layers.forEach(layer => {
                for (let channel = 0; channel < dag[layer].length; channel++) {

                    let currChannel = dag[layer][channel]

                    for (let index = 0; index < 10; index++) {
                        // Update dataset examples
                        d3.select('#' + layer + '-' + currChannel.channel + '-' + 'dataset-p-' + index)
                            .attr('transform', rightTranslation(currChannel.x, currChannel.y, currChannel.width, index));

                        // Update background rectangle
                        let rectId = layer + '-' + currChannel.channel + '-ex-rect'
                        let x = getExRectX(currChannel)
                        let y = getExRectY(currChannel)
                        d3.select('#' + rectId)
                            .attr('x', x)
                            .attr('y', y)

                        // Update guide text
                        let textId = layer + '-' + currChannel.channel + '-ex-text'
                        let textX = getTextX(currChannel)
                        let textY = getTextY(currChannel)
                        d3.select('#' + textId)
                            .attr('x', textX)
                            .attr('y', textY)
                    }
                }
            })
        }

        function updateEdges() {
            layers.forEach(l => {
                if (l !== layers[layers.length - 1]) { // don't draw edges from the last layer downward

                    dag[l].forEach(channel => {

                        d3.selectAll('.dag-edge-' + l + '-' + channel.channel + '-out')
                            .transition()
                            .duration(filterTransitionSpeed)
                            .attr('d', d => {

                                let layerToConnectTo = indexLayer[layerIndex[l] + 1]
                                let channelToConnectTo = dag[layerToConnectTo].find(function (element) {
                                    return element.channel === d['prev_channel'];
                                });

                                return "M" + (channel.x + channel.width / 2) + "," + (channel.y + fvHeight - (fvHeight - channel.width))
                                    + "C" + (channel.x + channel.width / 2) + " " + (channel.y + fvHeight - (fvHeight - channel.width)
                                        + layerVerticalSpace / 2) + "," + (channelToConnectTo.x + channelToConnectTo.width / 2) + " "
                                    + (channelToConnectTo.y - layerVerticalSpace / 2 - (fvHeight - channelToConnectTo.width)) + ","
                                    + (channelToConnectTo.x + channelToConnectTo.width / 2) + " " + channelToConnectTo.y

                            })
                    });
                }
            });
        }

        function drawDAG() {

            className
                .text(selectedClass.name)
            classInstances
                .text(selectedClass.numOfInstances)
            classAcc
                .text((100 * selectedClass.topOneAcc).toFixed(1) + '%')

            let maxNumEdgesIn = []
            layers.forEach(l => {
                computeChannelCoordinates(l)
                initializeChannelEdgeCount(l)
            });

            makeChannelClipPaths()
            drawEdges()

            layers.forEach(l => {

                let temp = d3.max(dag[l], d => {
                    return d.numOfEdgesIn
                })
                maxNumEdgesIn.push(temp)

                drawChannels(l)
                drawExamplesForLayer(l)
            });

            drawLayerLabels()

            d3.select('#dag-channel-count-filter-slider')
                .on('input', function () {

                    let filterValue = this.value
                    filterFilterValue =filterValue

                    d3.selectAll('.fv-ch')
                        .attr('display', d => {

                            if (d.count > filterValue) {
                                channelsHidden.delete(d.layer + '-' + d.channel)

                                d3.select('#fv-ch-label-' + d.layer + '-' + d.channel)
                                    .attr('display', 'block')

                                return 'block'
                            } else {
                                channelsHidden.add(d.layer + '-' + d.channel)

                                d3.select('#fv-ch-label-' + d.layer + '-' + d.channel)
                                    .attr('display', 'none')

                                return 'none'
                            }
                        }
                        )

                    // move fv and edges on filter change
                    layers.forEach(l => {
                        computeChannelCoordinatesFilter(l, filterValue, 'filter')
                    });

                    // Update visibility of edges
                    d3.selectAll('.dag-edge').attr('display', 'block')
                    channelsHidden.forEach(ch => {
                        d3.selectAll('.dag-edge-' + ch)
                            .attr('display', 'none')
                    })

                    updateChannels()
                    updateChannelLabels()
                    updateLayerLabels(filterValue)
                    updateEdges()
                    updateDatasetExamples()

                })
                .property('value', 0)

            d3.select('#dag-width-filter-slider')
                .on('input', function () {
                    let filterValue = parseInt(this.value)

                    fvHorizontalSpace = filterValue

                    // move fv and edges on filter change
                    layers.forEach(l => {
                        computeChannelCoordinatesFilter(l, filterValue, 'width')
                    });

                    updateChannels()
                    updateChannelLabels()
                    updateLayerLabels(filterFilterValue)
                    updateEdges()
                    updateDatasetExamples()

                })

            d3.select('#dag-height-filter-slider')
                .on('input', function () {

                    let filterValue = this.value
                    layerVerticalSpace = parseInt(filterValue)

                    // move fv and edges on filter change
                    layers.forEach(l => {
                        computeChannelCoordinatesFilter(l, filterValue, 'height')
                    });

                    updateChannels()
                    updateChannelLabels()
                    updateLayerLabels(filterFilterValue)
                    updateEdges()
                    updateDatasetExamples()

                })

        }

        drawDAG()

    })

}

// export function removeDagVIS() {
//     // console.log('removed')
//     d3.select("#dagG").remove()
//     d3.selectAll("#dag defs > clipPath").remove()
//     d3.select("#accuracy-hist > *").remove()
// }

dagVIS($selectedClass);