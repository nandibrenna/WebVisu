import ComSocket from '../../../communication/comsocket';
import { IPiechartObject } from '../../../Interfaces/jsinterfaces';
import { IPiechartShape } from '../../../Interfaces/javainterfaces';
import {
    numberToHexColor,
    // computeMinMaxCoord,
    pointArrayToPiechartString,
    computeEllipseRadius,
} from '../../Utils/utilfunctions';
import { sprintf } from 'sprintf-js';

export function createPiechartObject(
    piechartShape: IPiechartShape,
    shapeParameters: Map<string, string[][]>,
): IPiechartObject {
    const pointsCoord = [] as number[][];
    // The piechartShape specific values will be generated if necessary
    // piechartShape.points.forEach(function (item, index) {
    piechartShape.points.forEach(function (item) {
        pointsCoord.push([
            item[0] - piechartShape.rect[0],
            item[1] - piechartShape.rect[1],
        ]);
    });
    // Compute the fill color through has_fill_color
    const fill = piechartShape.hasInsideColor
        ? piechartShape.fillColor
        : 'none';
    // Tooltip
    const tooltip = piechartShape.tooltip;
    // AccessLevels
    const accessLevels = piechartShape.accessLevels;
    // Create an object with the initial parameters
    const initial: IPiechartObject = {
        // Variables will be initialised with the parameter values
        cornerCoord: {
            x1: piechartShape.rect[0],
            y1: piechartShape.rect[1],
            x2: piechartShape.rect[2],
            y2: piechartShape.rect[3],
        },
        centerCoord: {
            x: piechartShape.center[0],
            y: piechartShape.center[1],
        },
        pointsCoord: pointsCoord,
        isAlarm: false,
        fillColor: piechartShape.fillColor,
        fillColorAlarm: piechartShape.fillColorAlarm,
        frameColor: piechartShape.frameColor,
        frameColorAlarm: piechartShape.frameColorAlarm,
        hasFillColor: piechartShape.hasInsideColor,
        hasFrameColor: piechartShape.hasFrameColor,
        lineWidth: piechartShape.lineWidth,
        // Variables for piechart
        enableArc: piechartShape.enableArc,
        // Positional arguments
        motionAbsX: null,
        motionAbsY: null,
        motionAbsScale: 1000, // a scale of 1000 means a representation of 1:1
        motionAbsAngle: 0,
        // Computed
        transformedCornerCoord: {
            // Transformed corner coordinates
            x1: piechartShape.rect[0],
            y1: piechartShape.rect[1],
            x2: piechartShape.rect[2],
            y2: piechartShape.rect[3],
        },
        transformedCenterCoord: {
            // Transformed center coordinates
            x: piechartShape.center[0],
            y: piechartShape.center[1],
        },
        transformedSize: {
            // Transformed width and height
            width:
                piechartShape.rect[2] -
                piechartShape.rect[0] +
                2 * piechartShape.lineWidth,
            height:
                piechartShape.rect[3] -
                piechartShape.rect[1] +
                2 * piechartShape.lineWidth,
        },
        transformedStartCoord: {
            // Transformed center coordinates
            left: 0,
            top: 0,
            x: 0,
            y: 0,
        },
        transformedPointsCoord: pointsCoord,
        piechartPath: '',
        /// <div> variables
        pointerEvents: 'visible', // Activate / deactivate input
        visibility: 'visible', // Show / Hide the object
        /// <svg> variables
        fill: fill, // Inside color
        stroke: piechartShape.frameColor, // Frame color
        strokeWidth: piechartShape.hasFrameColor
            ? piechartShape.lineWidth
            : 0, // Frame width
        strokeDashArray: '0', // Frame style
        transform: 'scale(1) rotate(0)', // Transform the object (scale and rotation only)
        tooltip: tooltip, // Tooltip of the object.
        // Access variables
        writeAccess: true,
        readAccess: true,
    };

    // Processing the variables for visual elements
    // A <expr-..-> tag initiate a variable, const or a placeholder
    // We have to implement the const value, the variable or the placeholdervalue if available for the static value
    // Polyshapes and Simpleshapes have the same <expr-...> possibilities

    // 1) Set alarm variable
    if (shapeParameters.has('expr-toggle-color')) {
        const element = shapeParameters.get('expr-toggle-color');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        const wrapperFunc = () => {
            const value = Number(returnFunc());
            if (value !== null && typeof value !== 'undefined') {
                return value !== 0;
            } else {
                return false;
            }
        };
        Object.defineProperty(initial, 'isAlarm', {
            get: () => wrapperFunc(),
        });
    }

    // 2) Set fill color (normal)
    if (shapeParameters.has('expr-fill-color')) {
        const element = shapeParameters!.get('expr-fill-color');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        const wrapperFunc = () => {
            const value = returnFunc();
            const hexcolor = numberToHexColor(value);
            return hexcolor;
        };
        Object.defineProperty(initial, 'fillColor', {
            get: () => wrapperFunc(),
        });
    }

    // 3) Set fill color (alarm)
    if (shapeParameters.has('expr-fill-color-alarm')) {
        const element = shapeParameters!.get('expr-fill-color-alarm');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        const wrapperFunc = () => {
            const value = returnFunc();
            const hexcolor = numberToHexColor(value);
            return hexcolor;
        };
        Object.defineProperty(initial, 'fillColorAlarm', {
            get: () => wrapperFunc(),
        });
    }

    // 4) Set frame color (normal)
    if (shapeParameters.has('expr-frame-color')) {
        const element = shapeParameters!.get('expr-frame-color');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        const wrapperFunc = () => {
            const value = returnFunc();
            const hexcolor = numberToHexColor(value);
            return hexcolor;
        };
        Object.defineProperty(initial, 'frameColor', {
            get: () => wrapperFunc(),
        });
    }

    // 5) Set frame color (alarm)
    if (shapeParameters.has('expr-frame-color-alarm')) {
        const element = shapeParameters!.get(
            'expr-frame-color-alarm',
        );
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        const wrapperFunc = () => {
            const value = returnFunc();
            const hexcolor = numberToHexColor(value);
            return hexcolor;
        };
        Object.defineProperty(initial, 'frameColorAlarm', {
            get: () => wrapperFunc(),
        });
    }

    // 6) Set invisible state
    if (shapeParameters.has('expr-invisible')) {
        const element = shapeParameters!.get('expr-invisible');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        const wrapperFunc = () => {
            const value = Number(returnFunc());
            if (value !== null && typeof value !== 'undefined') {
                if (value === 0) {
                    return 'visible';
                } else {
                    return 'hidden';
                }
            } else {
                return 'visible';
            }
        };
        Object.defineProperty(initial, 'visibility', {
            get: () => wrapperFunc(),
        });
    }

    // 7) The fill flags state: 0 = show color, >0 = ignore setting
    if (shapeParameters.has('expr-fill-flags')) {
        const element = shapeParameters!.get('expr-fill-flags');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        const wrapperFunc = () => {
            const value = Number(returnFunc());
            if (value !== null && typeof value !== 'undefined') {
                if (value === 0) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        };
        Object.defineProperty(initial, 'hasFillColor', {
            get: () => wrapperFunc(),
        });
    }

    // 8) Display of frame: 0 full, 1 dashed ( _ _ _ ), 2 dotted ( .... ), 3 dash-point ( _._._ ), 4 dash-point-point (_.._.. ), 8 blind out line
    if (shapeParameters.has('expr-frame-flags')) {
        const element = shapeParameters!.get('expr-frame-flags');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        Object.defineProperty(initial, 'hasFrameColor', {
            get: function () {
                const value = Number(returnFunc());
                return (value & 8) === 0;
            },
        });
        Object.defineProperty(initial, 'strokeDashArray', {
            get: function () {
                const value = Number(returnFunc());
                if (value === 4) {
                    return '8,2,2,2,2,2';
                } else if (value === 3) {
                    return '8,4,2,4';
                } else if (value === 2) {
                    return '2, 2';
                } else if (value === 1) {
                    return '13, 5';
                } else {
                    return '0';
                }
            },
        });
    }

    // 9) line-width
    if (shapeParameters.has('expr-line-width')) {
        const element = shapeParameters!.get('expr-line-width');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        const wrapperFunc = () => {
            const value = returnFunc();
            const width = Number(value);
            if (width === 0) {
                return 1;
            } else {
                return width;
            }
        };
        Object.defineProperty(initial, 'lineWidth', {
            get: () => wrapperFunc(),
        });
    }

    // 10) Motion relative left edge
    if (shapeParameters.has('expr-left')) {
        const element = shapeParameters!.get('expr-left');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        Object.defineProperty(initial, 'motionRelLeft', {
            get: () => returnFunc(),
        });
    }

    // 11) Motion relative right edge
    if (shapeParameters.has('expr-right')) {
        const element = shapeParameters!.get('expr-right');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        Object.defineProperty(initial, 'motionRelRight', {
            get: () => returnFunc(),
        });
    }

    // 12) Motion relative top edge
    if (shapeParameters.has('expr-top')) {
        const element = shapeParameters!.get('expr-top');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        Object.defineProperty(initial, 'motionRelTop', {
            get: () => returnFunc(),
        });
    }

    // 13) Motion relative bottom edge
    if (shapeParameters.has('expr-bottom')) {
        const element = shapeParameters!.get('expr-bottom');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        Object.defineProperty(initial, 'motionRelBottom', {
            get: () => returnFunc(),
        });
    }

    // 14) Motion absolute x-Offset
    if (shapeParameters.has('expr-xpos')) {
        const element = shapeParameters!.get('expr-xpos');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        Object.defineProperty(initial, 'motionAbsX', {
            get: () => returnFunc(),
        });
    }

    // 15) Motion absolute y-Offset
    if (shapeParameters.has('expr-ypos')) {
        const element = shapeParameters!.get('expr-ypos');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        Object.defineProperty(initial, 'motionAbsY', {
            get: () => returnFunc(),
        });
    }

    // 16) Motion absolute scale
    if (shapeParameters.has('expr-scale')) {
        const element = shapeParameters!.get('expr-scale');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        Object.defineProperty(initial, 'motionAbsScale', {
            get: function () {
                const scale = returnFunc();
                return scale === 0 ? 1 : scale;
            },
        });
    }

    // 17) Motion absolute angle
    if (shapeParameters.has('expr-angle')) {
        const element = shapeParameters!.get('expr-angle');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        Object.defineProperty(initial, 'motionAbsAngle', {
            get: () => returnFunc(),
        });
    }

    // 18) Tooltip
    if (shapeParameters.has('expr-tooltip-display')) {
        const element = shapeParameters!.get('expr-tooltip-display');
        Object.defineProperty(initial, 'tooltip', {
            get: function () {
                let output = '';
                let parsedTooltip =
                    tooltip === null || typeof tooltip === 'undefined'
                        ? ''
                        : tooltip;
                const value = ComSocket.singleton().getFunction(
                    element,
                )();
                try {
                    if (
                        parsedTooltip.includes('|<|') ||
                        parsedTooltip.includes('|>|')
                    ) {
                        parsedTooltip = parsedTooltip.replace(
                            /\|<\|/g,
                            '<',
                        );
                        parsedTooltip = parsedTooltip.replace(
                            /\|>\|/g,
                            '>',
                        );
                        output = parsedTooltip;
                    } else {
                        output = sprintf(parsedTooltip, value);
                    }
                } catch {
                    if (
                        !(
                            !parsedTooltip ||
                            /^\s*$/.test(parsedTooltip)
                        )
                    ) {
                        output = parsedTooltip;
                    }
                }
                return output;
            },
        });
    }

    // 19) Deactivate Input
    if (shapeParameters.has('expr-input-disabled')) {
        const element = shapeParameters!.get('expr-input-disabled');
        const returnFunc = ComSocket.singleton().evalFunction(
            element,
        );
        const wrapperFunc = () => {
            const value = returnFunc();
            if (value === '1') {
                return 'none';
            } else {
                return 'visible';
            }
        };
        Object.defineProperty(initial, 'pointerEvents', {
            get: () => wrapperFunc(),
        });
    }

    // We have to compute the dependent values after all the required static values have been replaced by variables, placeholders or constant values
    // E.g. the fillcolor depends on hasFillColor and alarm. This variables are called "computed" values. MobX will track their dependents and rerender the object by change.
    // We have to note that the rotation of polylines is not the same like simpleshapes. Simpleshapes keep their originally alignment, polyhapes transform every coordinate.

    // The fill color
    Object.defineProperty(initial, 'fill', {
        get: function () {
            if (initial.enableArc) {
                return 'none';
            }
            if (initial.isAlarm) {
                return initial.fillColorAlarm;
            } else {
                if (initial.hasFillColor) {
                    return initial.fillColor;
                } else {
                    return 'none';
                }
            }
        },
    });

    Object.defineProperty(initial, 'strokeWidth', {
        get: function () {
            const lineWidth = initial.lineWidth;
            if (initial.isAlarm) {
                return lineWidth === 0 ? 1 : lineWidth;
            } else {
                return initial.hasFrameColor ? lineWidth : 0;
            }
        },
    });

    Object.defineProperty(initial, 'stroke', {
        get: function () {
            if (initial.isAlarm) {
                return initial.frameColorAlarm;
            } else {
                if (initial.hasFrameColor) {
                    return initial.frameColor;
                } else {
                    return 'none';
                }
            }
        },
    });

    // The transformed corner coordinates depends on the shapetype.
    Object.defineProperty(initial, 'transformedCornerCoord', {
        get: function () {
            // The corner coordinater are shifted with the Motion absolute X-Offset and Y-Offset
            const cornerCoord = initial.cornerCoord;
            let x1 = cornerCoord.x1;
            let y1 = cornerCoord.y1;
            let x2 = cornerCoord.x2;
            let y2 = cornerCoord.y2;
            const motionAbsX = initial.motionAbsX;
            if (
                motionAbsX !== null &&
                typeof motionAbsX !== undefined
            ) {
                x1 = x1 + motionAbsX;
                x2 = x2 + motionAbsX;
            }
            const motionAbsY = initial.motionAbsY;
            if (
                motionAbsY !== null &&
                typeof motionAbsY !== undefined
            ) {
                y1 = y1 + motionAbsY;
                y2 = y2 + motionAbsY;
            }

            // Init the interim return object
            const coord = { x1: x1, y1: y1, x2: x2, y2: y2 };
            return coord;
        },
    });

    // The transformed width.
    Object.defineProperty(initial, 'transformedSize', {
        get: function () {
            const transformedCornerCoord =
                initial.transformedCornerCoord;
            const width = Math.abs(
                transformedCornerCoord.x2 - transformedCornerCoord.x1,
            );
            const height = Math.abs(
                transformedCornerCoord.y2 - transformedCornerCoord.y1,
            );
            return { width: width, height: height };
        },
    });

    Object.defineProperty(initial, 'transform', {
        get: function () {
            // scale(<x> [<y>])
            // rotate(<a> [<x> <y>])
            let transform =
                'scale(' +
                initial.motionAbsScale / 1000 +
                ') rotate(';
            const motionAbsAngle = initial.motionAbsAngle;
            if (motionAbsAngle !== 0) {
                const transformedSize = initial.transformedSize;
                transform =
                    transform +
                    motionAbsAngle +
                    ',' +
                    transformedSize.width / 2 +
                    ',' +
                    transformedSize.height / 2 +
                    ')';
            } else {
                transform = transform + '0)';
            }
            return transform;
        },
    });

    Object.defineProperty(initial, 'transformedStartCoord', {
        get: function () {
            let left = 0;
            let top = 0;
            let x = 0;
            let y = 0;
            const motionAbsScale = initial.motionAbsScale;
            if (motionAbsScale !== 1000 && motionAbsScale !== 0) {
                const scale = motionAbsScale / 1000;
                const transformedSize = initial.transformedSize;
                left =
                    (transformedSize.width -
                        transformedSize.width * scale) /
                    2;
                top =
                    (transformedSize.height -
                        transformedSize.height * scale) /
                    2;
                x =
                    (transformedSize.width -
                        transformedSize.width * scale) /
                    (2 * scale);
                y =
                    (transformedSize.height -
                        transformedSize.height * scale) /
                    (2 * scale);
            }
            // Init the interim return object
            const coord = { left: left, top: top, x: x, y: y };
            return coord;
        },
    });

    Object.defineProperty(initial, 'transformedPointsCoord', {
        get: function () {
            const pointsCoord = initial.pointsCoord;
            // Calculate the radii of the ellipse (usefull to calculate the new coord with angles)
            const centerCoord = {
                x: pointsCoord[0][0],
                y: pointsCoord[0][1],
            };
            const radii = {
                x: Math.abs(pointsCoord[1][0] - centerCoord.x),
                y: Math.abs(pointsCoord[1][1] - centerCoord.y),
            };
            // calculate the transformed start and end points coordinates
            const newPointsCoord = [] as number[][];
            // The piechart points consists of only 4 items
            //   [0]-> center
            newPointsCoord.push([
                pointsCoord[0][0],
                pointsCoord[0][1],
            ]);
            //   [1]-> point bottom right
            newPointsCoord.push([
                pointsCoord[1][0],
                pointsCoord[1][1],
            ]);
            //   [2]-> point startAngle
            if (shapeParameters.has('expr-angle1')) {
                const element = shapeParameters!.get('expr-angle1');
                const returnFunc = ComSocket.singleton().evalFunction(
                    element,
                );
                const angle = (360 - returnFunc()) % 360;
                const angleRad = (angle * Math.PI) / 180.0;
                const cosAngleRad = Number.parseFloat(
                    Math.cos(angleRad).toFixed(10),
                );
                const sinAngleRad = Number.parseFloat(
                    Math.sin(angleRad).toFixed(10),
                );
                const ellipseRadius = Number.parseFloat(
                    computeEllipseRadius(
                        radii.x,
                        radii.y,
                        angleRad,
                    ).toFixed(10),
                );
                const angleCoord = [
                    centerCoord.x + ellipseRadius * cosAngleRad,
                    centerCoord.y + ellipseRadius * sinAngleRad,
                ];
                newPointsCoord.push([
                    Number.parseFloat(angleCoord[0].toFixed(1)),
                    Number.parseFloat(angleCoord[1].toFixed(1)),
                ]);
            } else {
                newPointsCoord.push([
                    pointsCoord[2][0],
                    pointsCoord[2][1],
                ]);
            }
            //   [3]-> point endAngle
            if (shapeParameters.has('expr-angle2')) {
                const element = shapeParameters!.get('expr-angle2');
                const returnFunc = ComSocket.singleton().evalFunction(
                    element,
                );
                const angle = (360 - returnFunc()) % 360;
                const angleRad = (angle * Math.PI) / 180.0;
                const cosAngleRad = Number.parseFloat(
                    Math.cos(angleRad).toFixed(10),
                );
                const sinAngleRad = Number.parseFloat(
                    Math.sin(angleRad).toFixed(10),
                );
                const ellipseRadius = Number.parseFloat(
                    computeEllipseRadius(
                        radii.x,
                        radii.y,
                        angleRad,
                    ).toFixed(10),
                );
                const angleCoord = [
                    centerCoord.x + ellipseRadius * cosAngleRad,
                    centerCoord.y + ellipseRadius * sinAngleRad,
                ];
                newPointsCoord.push([
                    Number.parseFloat(angleCoord[0].toFixed(1)),
                    Number.parseFloat(angleCoord[1].toFixed(1)),
                ]);
            } else {
                newPointsCoord.push([
                    pointsCoord[3][0],
                    pointsCoord[3][1],
                ]);
            }
            return newPointsCoord;
        },
    });

    // Piechart path calculation
    if (['piechart'].includes(piechartShape.shape)) {
        Object.defineProperty(initial, 'piechartPath', {
            get: function () {
                // calculate the transformed points coordinates (in order to keep the piechart alined with the center)
                const interim = pointArrayToPiechartString(
                    initial.transformedPointsCoord,
                    initial.enableArc,
                );

                return interim;
            },
        });
    }

    // Define the object access variables
    Object.defineProperty(initial, 'writeAccess', {
        get: function () {
            const current = ComSocket.singleton().oVisuVariables.get(
                '.currentuserlevel',
            )!.value;
            const currentNum = Number(current);
            if (!isNaN(currentNum)) {
                if (accessLevels[currentNum].includes('w')) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        },
    });

    Object.defineProperty(initial, 'readAccess', {
        get: function () {
            const current = ComSocket.singleton().oVisuVariables.get(
                '.currentuserlevel',
            )!.value;
            const currentNum = Number(current);
            if (!isNaN(currentNum)) {
                if (accessLevels[currentNum].includes('r')) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        },
    });

    return initial;
}
